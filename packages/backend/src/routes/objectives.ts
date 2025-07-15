import { Router, Request, Response } from 'express'
import { pool } from '../config/database'
import { asyncHandler, createValidationError, createNotFoundError } from '../middleware/errorHandler'
import { authenticate } from '../middleware/auth'
import { businessLogger } from '../middleware/logger'

const router = Router()

// 获取目标列表
router.get('/', authenticate, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw createValidationError('用户信息不存在')
  }

  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 20
  const search = req.query.search as string || ''
  const category = req.query.category as string || ''
  const status = req.query.status as string || ''

  const offset = (page - 1) * limit

  // 构建查询条件
  let whereConditions = ['user_id = $1']
  let queryParams: any[] = [req.user.id]
  let paramIndex = 2

  if (search) {
    whereConditions.push(`(title ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`)
    queryParams.push(`%${search}%`)
    paramIndex++
  }

  if (category) {
    whereConditions.push(`category = $${paramIndex}`)
    queryParams.push(category)
    paramIndex++
  }

  if (status) {
    whereConditions.push(`status = $${paramIndex}`)
    queryParams.push(status)
    paramIndex++
  }

  const whereClause = `WHERE ${whereConditions.join(' AND ')}`

  // 获取总数
  const countQuery = `SELECT COUNT(*) FROM objectives ${whereClause}`
  const countResult = await pool.query(countQuery, queryParams)
  const total = parseInt(countResult.rows[0].count)

  // 获取目标列表
  const objectivesQuery = `
    SELECT 
      id, title, description, category, status, progress, 
      start_date, target_date, created_at, updated_at
    FROM objectives 
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `
  
  const objectivesResult = await pool.query(objectivesQuery, [...queryParams, limit, offset])

  res.json({
    success: true,
    data: {
      objectives: objectivesResult.rows.map(obj => ({
        id: obj.id,
        title: obj.title,
        description: obj.description,
        category: obj.category,
        status: obj.status,
        progress: parseFloat(obj.progress),
        startDate: obj.start_date,
        endDate: obj.target_date,
        createdAt: obj.created_at,
        updatedAt: obj.updated_at
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

// 获取单个目标详情
router.get('/:id', authenticate, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw createValidationError('用户信息不存在')
  }

  const { id } = req.params

  // 获取目标详情（包含关键结果和任务）
  const objectiveQuery = `
    SELECT 
      o.id, o.title, o.description, o.category, o.status, o.progress, 
      o.start_date, o.target_date, o.created_at, o.updated_at,
      COALESCE(
        json_agg(
          DISTINCT jsonb_build_object(
            'id', kr.id,
            'title', kr.title,
            'description', kr.description,
            'type', kr.type,
            'targetValue', kr.target_value,
            'currentValue', kr.current_value,
            'unit', kr.unit,
            'progress', CASE
              WHEN kr.target_value > 0 THEN
                LEAST(100, (kr.current_value / kr.target_value) * 100)
              ELSE 0
            END,
            'status', kr.status,
            'dueDate', kr.due_date,
            'completedAt', kr.completed_at,
            'createdAt', kr.created_at,
            'updatedAt', kr.updated_at
          )
        ) FILTER (WHERE kr.id IS NOT NULL), '[]'
      ) as key_results,
      COALESCE(
        json_agg(
          DISTINCT jsonb_build_object(
            'id', t.id,
            'title', t.title,
            'description', t.description,
            'status', t.status,
            'priority', t.priority,
            'dueDate', t.due_date,
            'completedAt', t.completed_at,
            'keyResultId', t.key_result_id,
            'createdAt', t.created_at,
            'updatedAt', t.updated_at
          )
        ) FILTER (WHERE t.id IS NOT NULL), '[]'
      ) as tasks
    FROM objectives o
    LEFT JOIN key_results kr ON o.id = kr.objective_id
    LEFT JOIN tasks t ON kr.id = t.key_result_id
    WHERE o.id = $1 AND o.user_id = $2
    GROUP BY o.id, o.title, o.description, o.category, o.status, o.progress,
             o.start_date, o.target_date, o.created_at, o.updated_at
  `

  const result = await pool.query(objectiveQuery, [id, req.user.id])

  if (result.rows.length === 0) {
    throw createNotFoundError('目标')
  }

  const objective = result.rows[0]

  res.json({
    success: true,
    data: {
      objective: {
        id: objective.id,
        title: objective.title,
        description: objective.description,
        category: objective.category,
        status: objective.status,
        progress: parseFloat(objective.progress),
        startDate: objective.start_date,
        endDate: objective.target_date,
        keyResults: objective.key_results,
        tasks: objective.tasks,
        createdAt: objective.created_at,
        updatedAt: objective.updated_at
      }
    }
  })
}))

// 创建新目标
router.post('/', authenticate, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw createValidationError('用户信息不存在')
  }

  const { title, description, category, startDate, endDate } = req.body

  // 验证必填字段
  if (!title || !category) {
    throw createValidationError('标题和分类为必填项')
  }
  
  // 验证标题长度
  if (title.trim().length < 3) {
    throw createValidationError('标题长度必须至少为3个字符')
  }

  // 验证分类
  const validCategories = ['PERSONAL', 'PROFESSIONAL', 'HEALTH', 'LEARNING', 'FINANCIAL', 'RELATIONSHIP', 'CREATIVE', 'OTHER']
  if (!validCategories.includes(category)) {
    throw createValidationError('无效的目标分类')
  }

  // 验证日期
  if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
    throw createValidationError('开始日期必须早于结束日期')
  }

  const client = await pool.connect()
  
  try {
    await client.query('BEGIN')

    // 创建目标
    const objectiveResult = await client.query(`
      INSERT INTO objectives (user_id, title, description, category, start_date, target_date)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, title, description, category, status, progress, start_date, target_date, created_at
    `, [req.user.id, title.trim(), description, category, startDate || null, endDate || null])

    const objective = objectiveResult.rows[0]

    await client.query('COMMIT')

    // 记录操作日志
    businessLogger.create('目标', objective.id, req.user.id)

    res.status(201).json({
      success: true,
      message: '目标创建成功',
      data: {
        objective: {
          id: objective.id,
          title: objective.title,
          description: objective.description,
          category: objective.category,
          status: objective.status,
          progress: parseFloat(objective.progress),
          startDate: objective.start_date,
          endDate: objective.target_date,
          createdAt: objective.created_at
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

// 更新目标
router.put('/:id', authenticate, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw createValidationError('用户信息不存在')
  }

  const { id } = req.params
  const { title, description, category, status, startDate, endDate } = req.body

  // 验证目标是否存在且属于当前用户
  const existingObjective = await pool.query(
    'SELECT * FROM objectives WHERE id = $1 AND user_id = $2',
    [id, req.user.id]
  )

  if (existingObjective.rows.length === 0) {
    throw createNotFoundError('目标')
  }

  // 验证分类
  if (category) {
    const validCategories = ['PERSONAL', 'WORK', 'HEALTH', 'LEARNING', 'FINANCE', 'OTHER']
    if (!validCategories.includes(category)) {
      throw createValidationError('无效的目标分类')
    }
  }

  console.log('status:', status)
  // 验证状态
  if (status) {
    const validStatuses = ['DRAFT', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED']
    if (!validStatuses.includes(status)) {
      throw createValidationError('无效的目标状态')
    }
  }

  // 验证日期
  if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
    throw createValidationError('开始日期必须早于结束日期')
  }

  const client = await pool.connect()
  
  try {
    await client.query('BEGIN')

    // 更新目标
    const updateResult = await client.query(`
      UPDATE objectives 
      SET 
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        category = COALESCE($3, category),
        status = COALESCE($4, status),
        start_date = COALESCE($5, start_date),
        target_date = COALESCE($6, target_date),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $7 AND user_id = $8
      RETURNING id, title, description, category, status, progress, start_date, target_date, updated_at
    `, [title, description, category, status, startDate, endDate, id, req.user.id])

    const updatedObjective = updateResult.rows[0]

    await client.query('COMMIT')

    // 记录操作日志
    businessLogger.update('目标', id, req.user.id)

    res.json({
      success: true,
      message: '目标更新成功',
      data: {
        objective: {
          id: updatedObjective.id,
          title: updatedObjective.title,
          description: updatedObjective.description,
          category: updatedObjective.category,
          status: updatedObjective.status,
          progress: parseFloat(updatedObjective.progress),
          startDate: updatedObjective.start_date,
          endDate: updatedObjective.target_date,
          updatedAt: updatedObjective.updated_at
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

// 删除目标
router.delete('/:id', authenticate, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw createValidationError('用户信息不存在')
  }

  const { id } = req.params

  // 验证目标是否存在且属于当前用户
  const existingObjective = await pool.query(
    'SELECT * FROM objectives WHERE id = $1 AND user_id = $2',
    [id, req.user.id]
  )

  if (existingObjective.rows.length === 0) {
    throw createNotFoundError('目标')
  }

  const client = await pool.connect()
  
  try {
    await client.query('BEGIN')

    // 删除目标（级联删除关键结果和任务）
    await client.query('DELETE FROM objectives WHERE id = $1 AND user_id = $2', [id, req.user.id])

    await client.query('COMMIT')

    // 记录操作日志
    businessLogger.delete('目标', id, req.user.id)

    res.json({
      success: true,
      message: '目标删除成功'
    })

  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}))

export default router 
