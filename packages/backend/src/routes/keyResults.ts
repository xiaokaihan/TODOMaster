import { Router, Request, Response } from 'express'
import { pool } from '../config/database'
import { asyncHandler, createValidationError, createNotFoundError } from '../middleware/errorHandler'
import { authenticate } from '../middleware/auth'
import { businessLogger } from '../middleware/logger'

const router = Router()

// 获取关键结果列表
router.get('/', authenticate, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw createValidationError('用户信息不存在')
  }

  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 20
  const search = req.query.search as string || ''
  const objectiveId = req.query.objectiveId as string
  const status = req.query.status as string || ''
  const sortBy = req.query.sortBy as string || 'created_at'
  const sortOrder = req.query.sortOrder as string || 'desc'

  const offset = (page - 1) * limit

  // 构建查询条件
  let whereConditions = ['o.user_id = $1']
  let queryParams: any[] = [req.user.id]
  let paramIndex = 2

  if (search) {
    whereConditions.push(`(kr.title ILIKE $${paramIndex} OR kr.description ILIKE $${paramIndex})`)
    queryParams.push(`%${search}%`)
    paramIndex++
  }

  if (objectiveId) {
    whereConditions.push(`kr.objective_id = $${paramIndex}`)
    queryParams.push(objectiveId)
    paramIndex++
  }

  if (status) {
    whereConditions.push(`kr.status = $${paramIndex}`)
    queryParams.push(status)
    paramIndex++
  }

  const whereClause = `WHERE ${whereConditions.join(' AND ')}`

  // 构建排序子句
  const validSortFields = ['created_at', 'updated_at', 'due_date', 'progress', 'title', 'status']
  const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at'
  const sortDirection = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC'

  let orderByClause = ''
  if (sortField === 'progress') {
    orderByClause = `ORDER BY (CASE WHEN kr.target_value > 0 THEN LEAST(100, (kr.current_value / kr.target_value) * 100) ELSE 0 END) ${sortDirection}`
  } else if (sortField === 'due_date') {
    orderByClause = `ORDER BY kr.due_date ${sortDirection} NULLS LAST`
  } else {
    orderByClause = `ORDER BY kr.${sortField} ${sortDirection}`
  }

  // 获取总数
  const countQuery = `
    SELECT COUNT(*) 
    FROM key_results kr
    JOIN objectives o ON kr.objective_id = o.id
    ${whereClause}
  `
  const countResult = await pool.query(countQuery, queryParams)
  const total = parseInt(countResult.rows[0].count)

  // 获取关键结果列表
  const keyResultsQuery = `
    SELECT
      kr.id, kr.title, kr.description, kr.type, kr.target_value, kr.current_value,
      kr.unit, kr.status, kr.due_date, kr.completed_at, kr.created_at, kr.updated_at,
      kr.objective_id, o.title as objective_title,
      CASE
        WHEN kr.target_value > 0 THEN
          LEAST(100, (kr.current_value / kr.target_value) * 100)
        ELSE 0
      END as progress
    FROM key_results kr
    JOIN objectives o ON kr.objective_id = o.id
    ${whereClause}
    ${orderByClause}
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `
  
  const keyResultsResult = await pool.query(keyResultsQuery, [...queryParams, limit, offset])

  res.json({
    success: true,
    data: {
      keyResults: keyResultsResult.rows.map(kr => ({
        id: kr.id,
        title: kr.title,
        description: kr.description,
        type: kr.type,
        targetValue: parseFloat(kr.target_value),
        currentValue: parseFloat(kr.current_value),
        unit: kr.unit,
        progress: parseFloat(kr.progress),
        status: kr.status,
        dueDate: kr.due_date,
        completedAt: kr.completed_at,
        objectiveId: kr.objective_id,
        objectiveTitle: kr.objective_title,
        createdAt: kr.created_at,
        updatedAt: kr.updated_at
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

// 获取单个关键结果详情
router.get('/:id', authenticate, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw createValidationError('用户信息不存在')
  }

  const { id } = req.params

  // 获取关键结果详情（包含相关任务）
  const keyResultQuery = `
    SELECT
      kr.id, kr.title, kr.description, kr.type, kr.target_value, kr.current_value,
      kr.unit, kr.status, kr.due_date, kr.completed_at, kr.created_at, kr.updated_at,
      kr.objective_id, o.title as objective_title,
      CASE
        WHEN kr.target_value > 0 THEN
          LEAST(100, (kr.current_value / kr.target_value) * 100)
        ELSE 0
      END as progress,
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
            'createdAt', t.created_at,
            'updatedAt', t.updated_at
          )
        ) FILTER (WHERE t.id IS NOT NULL), '[]'
      ) as tasks
    FROM key_results kr
    JOIN objectives o ON kr.objective_id = o.id
    LEFT JOIN tasks t ON kr.id = t.key_result_id
    WHERE kr.id = $1 AND o.user_id = $2
    GROUP BY kr.id, kr.title, kr.description, kr.type, kr.target_value, kr.current_value,
             kr.unit, kr.progress, kr.status, kr.created_at, kr.updated_at,
             kr.objective_id, o.title
  `

  const result = await pool.query(keyResultQuery, [id, req.user.id])

  if (result.rows.length === 0) {
    throw createNotFoundError('关键结果')
  }

  const keyResult = result.rows[0]

  res.json({
    success: true,
    data: {
      keyResult: {
        id: keyResult.id,
        title: keyResult.title,
        description: keyResult.description,
        type: keyResult.type,
        targetValue: parseFloat(keyResult.target_value),
        currentValue: parseFloat(keyResult.current_value),
        unit: keyResult.unit,
        progress: parseFloat(keyResult.progress),
        status: keyResult.status,
        dueDate: keyResult.due_date,
        completedAt: keyResult.completed_at,
        objectiveId: keyResult.objective_id,
        objectiveTitle: keyResult.objective_title,
        tasks: keyResult.tasks,
        createdAt: keyResult.created_at,
        updatedAt: keyResult.updated_at
      }
    }
  })
}))

// 创建新关键结果
router.post('/', authenticate, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw createValidationError('用户信息不存在')
  }

  const { title, description, objectiveId, type, targetValue, unit, dueDate } = req.body

  // 验证必填字段
  if (!title || !objectiveId || !type || targetValue === undefined) {
    throw createValidationError('标题、目标ID、类型和目标值为必填项')
  }

  // 验证关键结果类型
  const validTypes = ['NUMERIC', 'PERCENTAGE', 'BOOLEAN']
  if (!validTypes.includes(type)) {
    throw createValidationError('无效的关键结果类型')
  }

  // 验证目标值
  if (typeof targetValue !== 'number' || targetValue < 0) {
    throw createValidationError('目标值必须为非负数')
  }

  // 验证目标是否属于当前用户
  const objectiveResult = await pool.query(
    'SELECT id FROM objectives WHERE id = $1 AND user_id = $2',
    [objectiveId, req.user.id]
  )

  if (objectiveResult.rows.length === 0) {
    throw createNotFoundError('目标')
  }

  const client = await pool.connect()
  
  try {
    await client.query('BEGIN')

    // 创建关键结果
    const keyResultResult = await client.query(`
      INSERT INTO key_results (objective_id, title, description, type, target_value, unit, due_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, title, description, type, target_value, current_value, unit, due_date, status, created_at
    `, [objectiveId, title, description, type, targetValue, unit || null, dueDate || null])

    const keyResult = keyResultResult.rows[0]

    await client.query('COMMIT')

    // 记录操作日志
    businessLogger.create('关键结果', keyResult.id, req.user.id)

    res.status(201).json({
      success: true,
      message: '关键结果创建成功',
      data: {
        keyResult: {
          id: keyResult.id,
          title: keyResult.title,
          description: keyResult.description,
          type: keyResult.type,
          targetValue: parseFloat(keyResult.target_value),
          currentValue: parseFloat(keyResult.current_value),
          unit: keyResult.unit,
          dueDate: keyResult.due_date,
          status: keyResult.status,
          objectiveId: objectiveId,
          createdAt: keyResult.created_at
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

// 更新关键结果
router.put('/:id', authenticate, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw createValidationError('用户信息不存在')
  }

  const { id } = req.params
  const { title, description, type, targetValue, currentValue, unit, dueDate, status } = req.body

  // 验证关键结果是否存在且属于当前用户
  const existingKeyResult = await pool.query(`
    SELECT kr.* FROM key_results kr
    JOIN objectives o ON kr.objective_id = o.id
    WHERE kr.id = $1 AND o.user_id = $2
  `, [id, req.user.id])

  if (existingKeyResult.rows.length === 0) {
    throw createNotFoundError('关键结果')
  }

  // 验证关键结果类型
  if (type) {
    const validTypes = ['NUMERIC', 'PERCENTAGE', 'BOOLEAN']
    if (!validTypes.includes(type)) {
      throw createValidationError('无效的关键结果类型')
    }
  }

  // 验证状态
  if (status) {
    const validStatuses = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED']
    if (!validStatuses.includes(status)) {
      throw createValidationError('无效的关键结果状态')
    }
  }

  // 验证数值
  if (targetValue !== undefined && (typeof targetValue !== 'number' || targetValue < 0)) {
    throw createValidationError('目标值必须为非负数')
  }

  if (currentValue !== undefined && (typeof currentValue !== 'number' || currentValue < 0)) {
    throw createValidationError('当前值必须为非负数')
  }

  const client = await pool.connect()
  
  try {
    await client.query('BEGIN')

    // 更新关键结果
    const updateResult = await client.query(`
      UPDATE key_results
      SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        type = COALESCE($3, type),
        target_value = COALESCE($4, target_value),
        current_value = COALESCE($5, current_value),
        unit = COALESCE($6, unit),
        due_date = COALESCE($7, due_date),
        status = COALESCE($8, status),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $9
      RETURNING id, title, description, type, target_value, current_value, unit, due_date, status, updated_at
    `, [title, description, type, targetValue, currentValue, unit, dueDate, status, id])

    const updatedKeyResult = updateResult.rows[0]

    await client.query('COMMIT')

    // 记录操作日志
    businessLogger.update('关键结果', id, req.user.id)

    res.json({
      success: true,
      message: '关键结果更新成功',
      data: {
        keyResult: {
          id: updatedKeyResult.id,
          title: updatedKeyResult.title,
          description: updatedKeyResult.description,
          type: updatedKeyResult.type,
          targetValue: parseFloat(updatedKeyResult.target_value),
          currentValue: parseFloat(updatedKeyResult.current_value),
          unit: updatedKeyResult.unit,
          dueDate: updatedKeyResult.due_date,
          status: updatedKeyResult.status,
          updatedAt: updatedKeyResult.updated_at
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

// 删除关键结果
router.delete('/:id', authenticate, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw createValidationError('用户信息不存在')
  }

  const { id } = req.params

  // 验证关键结果是否存在且属于当前用户
  const existingKeyResult = await pool.query(`
    SELECT kr.* FROM key_results kr
    JOIN objectives o ON kr.objective_id = o.id
    WHERE kr.id = $1 AND o.user_id = $2
  `, [id, req.user.id])

  if (existingKeyResult.rows.length === 0) {
    throw createNotFoundError('关键结果')
  }

  const client = await pool.connect()
  
  try {
    await client.query('BEGIN')

    // 删除关键结果（关联的任务会将 key_result_id 设为 NULL）
    await client.query('DELETE FROM key_results WHERE id = $1', [id])

    await client.query('COMMIT')

    // 记录操作日志
    businessLogger.delete('关键结果', id, req.user.id)

    res.json({
      success: true,
      message: '关键结果删除成功'
    })

  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}))

// 更新关键结果进度
router.patch('/:id/progress', authenticate, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw createValidationError('用户信息不存在')
  }

  const { id } = req.params
  const { currentValue } = req.body

  if (currentValue === undefined || typeof currentValue !== 'number' || currentValue < 0) {
    throw createValidationError('当前值必须为非负数')
  }

  // 验证关键结果是否存在且属于当前用户
  const existingKeyResult = await pool.query(`
    SELECT kr.* FROM key_results kr
    JOIN objectives o ON kr.objective_id = o.id
    WHERE kr.id = $1 AND o.user_id = $2
  `, [id, req.user.id])

  if (existingKeyResult.rows.length === 0) {
    throw createNotFoundError('关键结果')
  }

  const client = await pool.connect()
  
  try {
    await client.query('BEGIN')

    // 更新当前值，进度会通过数据库触发器自动计算
    const updateResult = await client.query(`
      UPDATE key_results 
      SET 
        current_value = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, current_value, target_value, progress, status
    `, [currentValue, id])

    const updatedKeyResult = updateResult.rows[0]

    await client.query('COMMIT')

    // 记录操作日志
    businessLogger.update('关键结果进度', id, req.user.id)

    res.json({
      success: true,
      message: '进度更新成功',
      data: {
        keyResult: {
          id: updatedKeyResult.id,
          currentValue: parseFloat(updatedKeyResult.current_value),
          targetValue: parseFloat(updatedKeyResult.target_value),
          progress: parseFloat(updatedKeyResult.progress),
          status: updatedKeyResult.status
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

export default router 