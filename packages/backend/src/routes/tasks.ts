import { Router, Request, Response } from 'express'
import { pool } from '../config/database'
import { asyncHandler, createValidationError, createNotFoundError } from '../middleware/errorHandler'
import { authenticate } from '../middleware/auth'
import { businessLogger } from '../middleware/logger'

const router = Router()

// 获取任务列表
router.get('/', authenticate, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw createValidationError('用户信息不存在')
  }

  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 20
  const search = req.query.search as string || ''
  const status = req.query.status as string || ''
  const priority = req.query.priority as string || ''
  const keyResultId = req.query.keyResultId as string
  const objectiveId = req.query.objectiveId as string

  const offset = (page - 1) * limit

  // 构建查询条件
  let whereConditions = ['o.user_id = $1']
  let queryParams: any[] = [req.user.id]
  let paramIndex = 2

  if (search) {
    whereConditions.push(`(t.title ILIKE $${paramIndex} OR t.description ILIKE $${paramIndex})`)
    queryParams.push(`%${search}%`)
    paramIndex++
  }

  if (status) {
    whereConditions.push(`t.status = $${paramIndex}`)
    queryParams.push(status)
    paramIndex++
  }

  if (priority) {
    whereConditions.push(`t.priority = $${paramIndex}`)
    queryParams.push(priority)
    paramIndex++
  }

  if (keyResultId) {
    whereConditions.push(`t.key_result_id = $${paramIndex}`)
    queryParams.push(keyResultId)
    paramIndex++
  }

  if (objectiveId) {
    whereConditions.push(`t.objective_id = $${paramIndex}`)
    queryParams.push(objectiveId)
    paramIndex++
  }

  const whereClause = `WHERE ${whereConditions.join(' AND ')}`

  // 获取总数
  const countQuery = `
    SELECT COUNT(*) 
    FROM tasks t
    JOIN objectives o ON t.objective_id = o.id
    ${whereClause}
  `
  const countResult = await pool.query(countQuery, queryParams)
  const total = parseInt(countResult.rows[0].count)

  // 获取任务列表
  const tasksQuery = `
    SELECT 
      t.id, t.title, t.description, t.status, t.priority, 
      t.estimated_hours, t.actual_hours, t.due_date, t.completed_at, 
      t.created_at, t.updated_at,
      t.key_result_id, kr.title as key_result_title,
      t.objective_id, o.title as objective_title
    FROM tasks t
    LEFT JOIN key_results kr ON t.key_result_id = kr.id
    JOIN objectives o ON t.objective_id = o.id
    ${whereClause}
    ORDER BY t.created_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `
  
  const tasksResult = await pool.query(tasksQuery, [...queryParams, limit, offset])

  res.json({
    success: true,
    data: {
      tasks: tasksResult.rows.map(task => ({
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
        keyResultId: task.key_result_id,
        keyResultTitle: task.key_result_title,
        objectiveId: task.objective_id,
        objectiveTitle: task.objective_title
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  })
}))

// 获取单个任务详情
router.get('/:id', authenticate, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw createValidationError('用户信息不存在')
  }

  const { id } = req.params

  // 获取任务详情（包含依赖关系）
  const taskQuery = `
    SELECT 
      t.id, t.title, t.description, t.status, t.priority, 
      t.estimated_hours, t.actual_hours, t.due_date, t.completed_at, 
      t.created_at, t.updated_at,
      t.key_result_id, kr.title as key_result_title,
      t.objective_id, o.title as objective_title,
      COALESCE(
        json_agg(
          DISTINCT jsonb_build_object(
            'id', dt.depends_on_task_id,
            'title', dep_task.title,
            'status', dep_task.status
          )
        ) FILTER (WHERE dt.depends_on_task_id IS NOT NULL), '[]'
      ) as dependencies,
      COALESCE(
        json_agg(
          DISTINCT jsonb_build_object(
            'id', dt2.task_id,
            'title', blocked_task.title,
            'status', blocked_task.status
          )
        ) FILTER (WHERE dt2.task_id IS NOT NULL), '[]'
      ) as blocks
    FROM tasks t
    LEFT JOIN key_results kr ON t.key_result_id = kr.id
    JOIN objectives o ON t.objective_id = o.id
    LEFT JOIN task_dependencies dt ON t.id = dt.task_id
    LEFT JOIN tasks dep_task ON dt.depends_on_task_id = dep_task.id
    LEFT JOIN task_dependencies dt2 ON t.id = dt2.depends_on_task_id
    LEFT JOIN tasks blocked_task ON dt2.task_id = blocked_task.id
    WHERE t.id = $1 AND o.user_id = $2
    GROUP BY t.id, t.title, t.description, t.status, t.priority, 
             t.estimated_hours, t.actual_hours, t.due_date, t.completed_at, 
             t.created_at, t.updated_at, t.key_result_id, kr.title,
             t.objective_id, o.title
  `

  const result = await pool.query(taskQuery, [id, req.user.id])

  if (result.rows.length === 0) {
    throw createNotFoundError('任务')
  }

  const task = result.rows[0]

  res.json({
    success: true,
    data: {
      task: {
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        estimatedHours: task.estimated_hours ? parseFloat(task.estimated_hours) : null,
        actualHours: task.actual_hours ? parseFloat(task.actual_hours) : null,
        dueDate: task.due_date,
        completedAt: task.completed_at,
        keyResultId: task.key_result_id,
        keyResultTitle: task.key_result_title,
        objectiveId: task.objective_id,
        objectiveTitle: task.objective_title,
        dependencies: task.dependencies,
        blocks: task.blocks,
        createdAt: task.created_at,
        updatedAt: task.updated_at
      }
    }
  })
}))

// 创建任务
router.post('/', authenticate, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw createValidationError('用户信息不存在')
  }

  const { title, description, objectiveId, keyResultId, priority, estimatedHours, dueDate, dependencies } = req.body

  // 验证必填字段
  if (!title || !objectiveId) {
    throw createValidationError('标题和目标ID为必填项')
  }

  // 验证优先级
  const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']
  if (priority && !validPriorities.includes(priority)) {
    throw createValidationError('无效的任务优先级')
  }

  // 验证目标是否属于当前用户
  const objectiveResult = await pool.query(
    'SELECT id FROM objectives WHERE id = $1 AND user_id = $2',
    [objectiveId, req.user.id]
  )

  if (objectiveResult.rows.length === 0) {
    throw createNotFoundError('目标')
  }

  // 如果指定了关键结果，验证其是否属于该目标
  if (keyResultId) {
    const keyResultResult = await pool.query(
      'SELECT id FROM key_results WHERE id = $1 AND objective_id = $2',
      [keyResultId, objectiveId]
    )

    if (keyResultResult.rows.length === 0) {
      throw createNotFoundError('关键结果')
    }
  }

  const client = await pool.connect()
  
  try {
    await client.query('BEGIN')

    // 创建任务
    const taskResult = await client.query(`
      INSERT INTO tasks (title, description, objective_id, key_result_id, priority, estimated_hours, due_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, title, description, status, priority, estimated_hours, due_date, created_at
    `, [title, description, objectiveId, keyResultId || null, priority || 'MEDIUM', estimatedHours || null, dueDate || null])

    const task = taskResult.rows[0]

    // 如果有依赖任务，创建依赖关系
    if (dependencies && Array.isArray(dependencies) && dependencies.length > 0) {
      for (const dependencyId of dependencies) {
        // 验证依赖任务存在且属于同一用户
        const dependencyCheck = await client.query(`
          SELECT t.id FROM tasks t
          JOIN objectives o ON t.objective_id = o.id
          WHERE t.id = $1 AND o.user_id = $2
        `, [dependencyId, req.user.id])

        if (dependencyCheck.rows.length > 0) {
          await client.query(`
            INSERT INTO task_dependencies (task_id, depends_on_task_id)
            VALUES ($1, $2)
          `, [task.id, dependencyId])
        }
      }
    }

    await client.query('COMMIT')

    // 记录操作日志
    businessLogger.create('任务', task.id, req.user.id)

    res.status(201).json({
      success: true,
      message: '任务创建成功',
      data: {
        task: {
          id: task.id,
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          estimatedHours: task.estimated_hours ? parseFloat(task.estimated_hours) : null,
          dueDate: task.due_date,
          objectiveId: objectiveId,
          keyResultId: keyResultId,
          createdAt: task.created_at
        }
      }
    })

  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}))

// 更新任务
router.put('/:id', authenticate, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw createValidationError('用户信息不存在')
  }

  const { id } = req.params
  const { title, description, status, priority, estimatedHours, actualHours, dueDate, keyResultId } = req.body

  // 验证任务是否存在且属于当前用户
  const existingTask = await pool.query(`
    SELECT t.* FROM tasks t
    JOIN objectives o ON t.objective_id = o.id
    WHERE t.id = $1 AND o.user_id = $2
  `, [id, req.user.id])

  if (existingTask.rows.length === 0) {
    throw createNotFoundError('任务')
  }

  // 验证优先级
  if (priority) {
    const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']
    if (!validPriorities.includes(priority)) {
      throw createValidationError('无效的任务优先级')
    }
  }

  // 验证状态
  if (status) {
    const validStatuses = ['TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']
    if (!validStatuses.includes(status)) {
      throw createValidationError('无效的任务状态')
    }
  }

  // 如果指定了关键结果，验证其是否属于该任务的目标
  if (keyResultId) {
    const keyResultResult = await pool.query(
      'SELECT id FROM key_results WHERE id = $1 AND objective_id = $2',
      [keyResultId, existingTask.rows[0].objective_id]
    )

    if (keyResultResult.rows.length === 0) {
      throw createNotFoundError('关键结果')
    }
  }

  const client = await pool.connect()
  
  try {
    await client.query('BEGIN')

    // 更新任务
    const updateResult = await client.query(`
      UPDATE tasks 
      SET 
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        status = COALESCE($3, status),
        priority = COALESCE($4, priority),
        estimated_hours = COALESCE($5, estimated_hours),
        actual_hours = COALESCE($6, actual_hours),
        due_date = COALESCE($7, due_date),
        key_result_id = COALESCE($8, key_result_id),
        completed_at = CASE 
          WHEN $3 = 'COMPLETED' AND status != 'COMPLETED' THEN CURRENT_TIMESTAMP
          WHEN $3 != 'COMPLETED' AND status = 'COMPLETED' THEN NULL
          ELSE completed_at
        END,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $9
      RETURNING id, title, description, status, priority, estimated_hours, actual_hours, 
                due_date, completed_at, updated_at
    `, [title, description, status, priority, estimatedHours, actualHours, dueDate, keyResultId, id])

    const updatedTask = updateResult.rows[0]

    await client.query('COMMIT')

    // 记录操作日志
    businessLogger.update('任务', id, req.user.id)

    res.json({
      success: true,
      message: '任务更新成功',
      data: {
        task: {
          id: updatedTask.id,
          title: updatedTask.title,
          description: updatedTask.description,
          status: updatedTask.status,
          priority: updatedTask.priority,
          estimatedHours: updatedTask.estimated_hours ? parseFloat(updatedTask.estimated_hours) : null,
          actualHours: updatedTask.actual_hours ? parseFloat(updatedTask.actual_hours) : null,
          dueDate: updatedTask.due_date,
          completedAt: updatedTask.completed_at,
          updatedAt: updatedTask.updated_at
        }
      }
    })

  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}))

// 删除任务
router.delete('/:id', authenticate, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw createValidationError('用户信息不存在')
  }

  const { id } = req.params

  // 验证任务是否存在且属于当前用户
  const existingTask = await pool.query(`
    SELECT t.* FROM tasks t
    JOIN objectives o ON t.objective_id = o.id
    WHERE t.id = $1 AND o.user_id = $2
  `, [id, req.user.id])

  if (existingTask.rows.length === 0) {
    throw createNotFoundError('任务')
  }

  const client = await pool.connect()
  
  try {
    await client.query('BEGIN')

    // 删除任务（级联删除依赖关系）
    await client.query('DELETE FROM tasks WHERE id = $1', [id])

    await client.query('COMMIT')

    // 记录操作日志
    businessLogger.delete('任务', id, req.user.id)

    res.json({
      success: true,
      message: '任务删除成功'
    })

  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}))

// 更新任务状态
router.patch('/:id/status', authenticate, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw createValidationError('用户信息不存在')
  }

  const { id } = req.params
  const { status } = req.body

  // 验证状态
  const validStatuses = ['TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']
  if (!validStatuses.includes(status)) {
    throw createValidationError('无效的任务状态')
  }

  // 验证任务是否存在且属于当前用户
  const existingTask = await pool.query(`
    SELECT t.* FROM tasks t
    JOIN objectives o ON t.objective_id = o.id
    WHERE t.id = $1 AND o.user_id = $2
  `, [id, req.user.id])

  if (existingTask.rows.length === 0) {
    throw createNotFoundError('任务')
  }

  const client = await pool.connect()
  
  try {
    await client.query('BEGIN')

    // 更新任务状态
    const updateResult = await client.query(`
      UPDATE tasks 
      SET 
        status = $1,
        completed_at = CASE 
          WHEN $1 = 'COMPLETED' AND status != 'COMPLETED' THEN CURRENT_TIMESTAMP
          WHEN $1 != 'COMPLETED' AND status = 'COMPLETED' THEN NULL
          ELSE completed_at
        END,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, status, completed_at
    `, [status, id])

    const updatedTask = updateResult.rows[0]

    await client.query('COMMIT')

    // 记录操作日志
    businessLogger.update('任务状态', id, req.user.id)

    res.json({
      success: true,
      message: '任务状态更新成功',
      data: {
        task: {
          id: updatedTask.id,
          status: updatedTask.status,
          completedAt: updatedTask.completed_at
        }
      }
    })

  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}))

// 添加任务依赖
router.post('/:id/dependencies', authenticate, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw createValidationError('用户信息不存在')
  }

  const { id } = req.params
  const { dependsOnTaskId } = req.body

  if (!dependsOnTaskId) {
    throw createValidationError('依赖任务ID为必填项')
  }

  // 验证任务是否存在且属于当前用户
  const taskCheck = await pool.query(`
    SELECT t.id FROM tasks t
    JOIN objectives o ON t.objective_id = o.id
    WHERE t.id = $1 AND o.user_id = $2
  `, [id, req.user.id])

  if (taskCheck.rows.length === 0) {
    throw createNotFoundError('任务')
  }

  // 验证依赖任务是否存在且属于当前用户
  const dependencyCheck = await pool.query(`
    SELECT t.id FROM tasks t
    JOIN objectives o ON t.objective_id = o.id
    WHERE t.id = $1 AND o.user_id = $2
  `, [dependsOnTaskId, req.user.id])

  if (dependencyCheck.rows.length === 0) {
    throw createNotFoundError('依赖任务')
  }

  const client = await pool.connect()
  
  try {
    await client.query('BEGIN')

    // 添加依赖关系
    await client.query(`
      INSERT INTO task_dependencies (task_id, depends_on_task_id)
      VALUES ($1, $2)
      ON CONFLICT (task_id, depends_on_task_id) DO NOTHING
    `, [id, dependsOnTaskId])

    await client.query('COMMIT')

    res.json({
      success: true,
      message: '任务依赖添加成功'
    })

  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}))

// 删除任务依赖
router.delete('/:id/dependencies/:dependencyId', authenticate, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw createValidationError('用户信息不存在')
  }

  const { id, dependencyId } = req.params

  // 验证任务是否存在且属于当前用户
  const taskCheck = await pool.query(`
    SELECT t.id FROM tasks t
    JOIN objectives o ON t.objective_id = o.id
    WHERE t.id = $1 AND o.user_id = $2
  `, [id, req.user.id])

  if (taskCheck.rows.length === 0) {
    throw createNotFoundError('任务')
  }

  const client = await pool.connect()
  
  try {
    await client.query('BEGIN')

    // 删除依赖关系
    await client.query(`
      DELETE FROM task_dependencies 
      WHERE task_id = $1 AND depends_on_task_id = $2
    `, [id, dependencyId])

    await client.query('COMMIT')

    res.json({
      success: true,
      message: '任务依赖删除成功'
    })

  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}))

export default router 