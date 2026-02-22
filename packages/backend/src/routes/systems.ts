import { Router, Request, Response } from 'express'
import { pool } from '../config/database'
import { asyncHandler, createValidationError, createNotFoundError } from '../middleware/errorHandler'
import { authenticate } from '../middleware/auth'
import { businessLogger } from '../middleware/logger'

const router = Router()

// 获取当前用户所有系统（含统计）
router.get('/', authenticate, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw createValidationError('用户信息不存在')
  }

  const status = req.query.status as string || ''

  let whereConditions = ['s.user_id = $1']
  let queryParams: any[] = [req.user.id]
  let paramIndex = 2

  if (status) {
    whereConditions.push(`s.status = $${paramIndex}`)
    queryParams.push(status)
    paramIndex++
  }

  const whereClause = `WHERE ${whereConditions.join(' AND ')}`

  const query = `
    SELECT 
      s.id, s.name, s.description, s.icon, s.color, s.status, s.sort_order,
      s.created_at, s.updated_at,
      COALESCE(obj_stats.total_objectives, 0) as total_objectives,
      COALESCE(obj_stats.active_objectives, 0) as active_objectives,
      COALESCE(obj_stats.completed_objectives, 0) as completed_objectives,
      COALESCE(obj_stats.avg_progress, 0) as avg_progress
    FROM systems s
    LEFT JOIN (
      SELECT 
        system_id,
        COUNT(*) as total_objectives,
        COUNT(*) FILTER (WHERE status = 'ACTIVE') as active_objectives,
        COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed_objectives,
        ROUND(AVG(progress)) as avg_progress
      FROM objectives
      GROUP BY system_id
    ) obj_stats ON s.id = obj_stats.system_id
    ${whereClause}
    ORDER BY s.sort_order ASC, s.created_at ASC
  `

  const result = await pool.query(query, queryParams)

  res.json({
    success: true,
    data: {
      systems: result.rows.map(s => ({
        id: s.id,
        name: s.name,
        description: s.description,
        icon: s.icon,
        color: s.color,
        status: s.status,
        sortOrder: s.sort_order,
        createdAt: s.created_at,
        updatedAt: s.updated_at,
        objectiveCount: parseInt(s.total_objectives),
        activeObjectiveCount: parseInt(s.active_objectives),
        completedObjectiveCount: parseInt(s.completed_objectives),
        overallProgress: parseInt(s.avg_progress)
      }))
    }
  })
}))

// 获取单个系统详情（含下属目标列表）
router.get('/:id', authenticate, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw createValidationError('用户信息不存在')
  }

  const { id } = req.params

  // 获取系统信息
  const systemQuery = `
    SELECT 
      s.id, s.name, s.description, s.icon, s.color, s.status, s.sort_order,
      s.created_at, s.updated_at,
      COALESCE(obj_stats.total_objectives, 0) as total_objectives,
      COALESCE(obj_stats.active_objectives, 0) as active_objectives,
      COALESCE(obj_stats.completed_objectives, 0) as completed_objectives,
      COALESCE(obj_stats.avg_progress, 0) as avg_progress
    FROM systems s
    LEFT JOIN (
      SELECT 
        system_id,
        COUNT(*) as total_objectives,
        COUNT(*) FILTER (WHERE status = 'ACTIVE') as active_objectives,
        COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed_objectives,
        ROUND(AVG(progress)) as avg_progress
      FROM objectives
      GROUP BY system_id
    ) obj_stats ON s.id = obj_stats.system_id
    WHERE s.id = $1 AND s.user_id = $2
  `

  const systemResult = await pool.query(systemQuery, [id, req.user.id])

  if (systemResult.rows.length === 0) {
    throw createNotFoundError('系统')
  }

  const system = systemResult.rows[0]

  // 获取该系统下的目标列表
  const objectivesQuery = `
    SELECT 
      o.id, o.title, o.description, o.status, o.priority, o.progress,
      o.start_date, o.target_date, o.created_at, o.updated_at,
      COALESCE(kr_count.total, 0) as key_result_count,
      COALESCE(task_stats.total_tasks, 0) as task_count,
      COALESCE(task_stats.completed_tasks, 0) as completed_task_count
    FROM objectives o
    LEFT JOIN (
      SELECT objective_id, COUNT(*) as total FROM key_results GROUP BY objective_id
    ) kr_count ON o.id = kr_count.objective_id
    LEFT JOIN (
      SELECT objective_id, 
        COUNT(*) as total_tasks,
        COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed_tasks
      FROM tasks
      GROUP BY objective_id
    ) task_stats ON o.id = task_stats.objective_id
    WHERE o.system_id = $1 AND o.user_id = $2
    ORDER BY o.created_at DESC
  `

  const objectivesResult = await pool.query(objectivesQuery, [id, req.user.id])

  // 获取该系统下所有目标的任务列表
  const tasksQuery = `
    SELECT 
      t.id, t.title, t.description, t.status, t.priority,
      t.estimated_hours, t.actual_hours, t.due_date, t.completed_at,
      t.created_at, t.updated_at,
      t.objective_id, t.key_result_id
    FROM tasks t
    JOIN objectives o ON t.objective_id = o.id
    WHERE o.system_id = $1 AND o.user_id = $2
    ORDER BY 
      CASE t.status 
        WHEN 'IN_PROGRESS' THEN 1 
        WHEN 'TODO' THEN 2 
        WHEN 'WAITING' THEN 3
        WHEN 'COMPLETED' THEN 4 
        WHEN 'CANCELLED' THEN 5 
      END,
      CASE t.priority 
        WHEN 'CRITICAL' THEN 1 
        WHEN 'HIGH' THEN 2 
        WHEN 'MEDIUM' THEN 3 
        WHEN 'LOW' THEN 4 
      END,
      t.created_at DESC
  `

  const tasksResult = await pool.query(tasksQuery, [id, req.user.id])

  // 按目标分组任务
  const tasksByObjective: Record<string, any[]> = {}
  for (const task of tasksResult.rows) {
    if (!tasksByObjective[task.objective_id]) {
      tasksByObjective[task.objective_id] = []
    }
    tasksByObjective[task.objective_id].push({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      estimatedHours: task.estimated_hours ? parseFloat(task.estimated_hours) : null,
      actualHours: task.actual_hours ? parseFloat(task.actual_hours) : null,
      dueDate: task.due_date,
      completedAt: task.completed_at,
      createdAt: task.created_at,
      updatedAt: task.updated_at,
      objectiveId: task.objective_id,
      keyResultId: task.key_result_id
    })
  }

  // 计算系统级别任务统计
  const allTasks = tasksResult.rows
  const totalTasks = allTasks.length
  const completedTasks = allTasks.filter(t => t.status === 'COMPLETED').length
  const inProgressTasks = allTasks.filter(t => t.status === 'IN_PROGRESS').length

  res.json({
    success: true,
    data: {
      system: {
        id: system.id,
        name: system.name,
        description: system.description,
        icon: system.icon,
        color: system.color,
        status: system.status,
        sortOrder: system.sort_order,
        createdAt: system.created_at,
        updatedAt: system.updated_at,
        objectiveCount: parseInt(system.total_objectives),
        activeObjectiveCount: parseInt(system.active_objectives),
        completedObjectiveCount: parseInt(system.completed_objectives),
        overallProgress: parseInt(system.avg_progress),
        totalTasks,
        completedTasks,
        inProgressTasks
      },
      objectives: objectivesResult.rows.map(obj => ({
        id: obj.id,
        title: obj.title,
        description: obj.description,
        status: obj.status,
        priority: obj.priority,
        progress: parseFloat(obj.progress),
        startDate: obj.start_date,
        targetDate: obj.target_date,
        createdAt: obj.created_at,
        updatedAt: obj.updated_at,
        keyResultCount: parseInt(obj.key_result_count),
        taskCount: parseInt(obj.task_count),
        completedTaskCount: parseInt(obj.completed_task_count),
        tasks: tasksByObjective[obj.id] || []
      }))
    }
  })
}))

// 创建新系统
router.post('/', authenticate, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw createValidationError('用户信息不存在')
  }

  const { name, description, icon, color } = req.body

  // 验证必填字段
  if (!name || name.trim().length < 2) {
    throw createValidationError('系统名称不能少于2个字符')
  }

  if (name.trim().length > 100) {
    throw createValidationError('系统名称不能超过100个字符')
  }

  // 获取当前最大 sort_order
  const maxSortResult = await pool.query(
    'SELECT COALESCE(MAX(sort_order), -1) + 1 as next_sort FROM systems WHERE user_id = $1',
    [req.user.id]
  )
  const nextSort = maxSortResult.rows[0].next_sort

  const result = await pool.query(`
    INSERT INTO systems (name, description, icon, color, sort_order, user_id)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id, name, description, icon, color, status, sort_order, created_at, updated_at
  `, [name.trim(), description || null, icon || null, color || null, nextSort, req.user.id])

  const system = result.rows[0]

  businessLogger.create('系统', system.id, req.user.id)

  res.status(201).json({
    success: true,
    message: '系统创建成功',
    data: {
      system: {
        id: system.id,
        name: system.name,
        description: system.description,
        icon: system.icon,
        color: system.color,
        status: system.status,
        sortOrder: system.sort_order,
        createdAt: system.created_at,
        updatedAt: system.updated_at,
        objectiveCount: 0,
        activeObjectiveCount: 0,
        completedObjectiveCount: 0,
        overallProgress: 0
      }
    }
  })
}))

// 更新系统
router.put('/:id', authenticate, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw createValidationError('用户信息不存在')
  }

  const { id } = req.params
  const { name, description, icon, color, status } = req.body

  // 验证系统是否存在且属于当前用户
  const existing = await pool.query(
    'SELECT * FROM systems WHERE id = $1 AND user_id = $2',
    [id, req.user.id]
  )

  if (existing.rows.length === 0) {
    throw createNotFoundError('系统')
  }

  // 验证名称
  if (name !== undefined && name.trim().length < 2) {
    throw createValidationError('系统名称不能少于2个字符')
  }

  // 验证状态
  if (status) {
    const validStatuses = ['ACTIVE', 'PAUSED', 'ARCHIVED']
    if (!validStatuses.includes(status)) {
      throw createValidationError('无效的系统状态')
    }
  }

  const result = await pool.query(`
    UPDATE systems
    SET
      name = COALESCE($1, name),
      description = COALESCE($2, description),
      icon = COALESCE($3, icon),
      color = COALESCE($4, color),
      status = COALESCE($5, status),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $6 AND user_id = $7
    RETURNING id, name, description, icon, color, status, sort_order, created_at, updated_at
  `, [name?.trim(), description, icon, color, status, id, req.user.id])

  const system = result.rows[0]

  businessLogger.update('系统', id, req.user.id)

  res.json({
    success: true,
    message: '系统更新成功',
    data: {
      system: {
        id: system.id,
        name: system.name,
        description: system.description,
        icon: system.icon,
        color: system.color,
        status: system.status,
        sortOrder: system.sort_order,
        createdAt: system.created_at,
        updatedAt: system.updated_at
      }
    }
  })
}))

// 调整系统排序
router.put('/reorder', authenticate, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw createValidationError('用户信息不存在')
  }

  const { orderedIds } = req.body

  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    throw createValidationError('请提供有效的排序列表')
  }

  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    for (let i = 0; i < orderedIds.length; i++) {
      await client.query(
        'UPDATE systems SET sort_order = $1 WHERE id = $2 AND user_id = $3',
        [i, orderedIds[i], req.user.id]
      )
    }

    await client.query('COMMIT')

    res.json({
      success: true,
      message: '系统排序更新成功'
    })
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}))

// 删除系统
router.delete('/:id', authenticate, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw createValidationError('用户信息不存在')
  }

  const { id } = req.params

  // 验证系统是否存在且属于当前用户
  const existing = await pool.query(
    'SELECT * FROM systems WHERE id = $1 AND user_id = $2',
    [id, req.user.id]
  )

  if (existing.rows.length === 0) {
    throw createNotFoundError('系统')
  }

  // 级联删除（由外键约束自动处理）
  await pool.query('DELETE FROM systems WHERE id = $1 AND user_id = $2', [id, req.user.id])

  businessLogger.delete('系统', id, req.user.id)

  res.json({
    success: true,
    message: '系统删除成功'
  })
}))

export default router
