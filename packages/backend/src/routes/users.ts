import { Router, Request, Response } from 'express'
import bcrypt from 'bcrypt'
import { pool } from '../config/database'
import { asyncHandler, createValidationError, createNotFoundError, createAuthError } from '../middleware/errorHandler'
import { authenticate, requireAdmin, requireRole } from '../middleware/auth'
import { businessLogger } from '../middleware/logger'

const router = Router()

// 获取用户列表（仅管理员）
router.get('/', authenticate, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 20
  const search = req.query.search as string || ''
  const role = req.query.role as string || ''
  const isActive = req.query.isActive as string

  const offset = (page - 1) * limit

  // 构建查询条件
  let whereConditions = []
  let queryParams: any[] = []
  let paramIndex = 1

  if (search) {
    whereConditions.push(`(name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`)
    queryParams.push(`%${search}%`)
    paramIndex++
  }

  if (role) {
    whereConditions.push(`role = $${paramIndex}`)
    queryParams.push(role)
    paramIndex++
  }

  if (isActive !== undefined) {
    whereConditions.push(`is_active = $${paramIndex}`)
    queryParams.push(isActive === 'true')
    paramIndex++
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

  // 获取总数
  const countQuery = `SELECT COUNT(*) FROM users ${whereClause}`
  const countResult = await pool.query(countQuery, queryParams)
  const total = parseInt(countResult.rows[0].count)

  // 获取用户列表
  const usersQuery = `
    SELECT id, email, name, role, is_active, created_at, updated_at
    FROM users 
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `
  
  const usersResult = await pool.query(usersQuery, [...queryParams, limit, offset])

  res.json({
    success: true,
    data: {
      users: usersResult.rows.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.is_active,
        createdAt: user.created_at,
        updatedAt: user.updated_at
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

// 获取单个用户信息（仅管理员）
router.get('/:id', authenticate, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params

  const userResult = await pool.query(`
    SELECT id, email, name, role, is_active, created_at, updated_at
    FROM users 
    WHERE id = $1
  `, [id])

  if (userResult.rows.length === 0) {
    throw createNotFoundError('用户')
  }

  const user = userResult.rows[0]

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.is_active,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      }
    }
  })
}))

// 更新用户信息（仅管理员）
router.put('/:id', authenticate, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const { name, role, isActive } = req.body

  // 验证必填字段
  if (!name) {
    throw createValidationError('姓名为必填项')
  }

  // 验证角色
  const validRoles = ['user', 'admin']
  if (role && !validRoles.includes(role)) {
    throw createValidationError('无效的用户角色')
  }

  // 检查用户是否存在
  const existingUser = await pool.query('SELECT id FROM users WHERE id = $1', [id])
  if (existingUser.rows.length === 0) {
    throw createNotFoundError('用户')
  }

  // 构建更新字段
  let updateFields = ['name = $2', 'updated_at = CURRENT_TIMESTAMP']
  let queryParams = [id, name]
  let paramIndex = 3

  if (role !== undefined) {
    updateFields.push(`role = $${paramIndex}`)
    queryParams.push(role)
    paramIndex++
  }

  if (isActive !== undefined) {
    updateFields.push(`is_active = $${paramIndex}`)
    queryParams.push(isActive)
    paramIndex++
  }

  // 更新用户
  const updateQuery = `
    UPDATE users 
    SET ${updateFields.join(', ')}
    WHERE id = $1
    RETURNING id, email, name, role, is_active, updated_at
  `

  const userResult = await pool.query(updateQuery, queryParams)
  const user = userResult.rows[0]

  // 记录操作日志
  if (req.user) {
    businessLogger.update('用户', id, req.user.id, { name, role, isActive })
  }

  res.json({
    success: true,
    message: '用户信息更新成功',
    data: {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.is_active,
        updatedAt: user.updated_at
      }
    }
  })
}))

// 删除用户（仅管理员）
router.delete('/:id', authenticate, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params

  // 检查用户是否存在
  const existingUser = await pool.query('SELECT id, email FROM users WHERE id = $1', [id])
  if (existingUser.rows.length === 0) {
    throw createNotFoundError('用户')
  }

  // 防止删除自己
  if (req.user && req.user.id === id) {
    throw createValidationError('不能删除自己的账户')
  }

  const client = await pool.connect()
  
  try {
    await client.query('BEGIN')

    // 软删除：设置为非活跃状态
    await client.query(`
      UPDATE users 
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [id])

    await client.query('COMMIT')

    // 记录操作日志
    if (req.user) {
      businessLogger.delete('用户', id, req.user.id)
    }

    res.json({
      success: true,
      message: '用户删除成功'
    })

  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}))

// 获取用户统计信息（仅管理员）
router.get('/stats/overview', authenticate, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const statsQuery = `
    SELECT 
      COUNT(*) as total_users,
      COUNT(*) FILTER (WHERE is_active = true) as active_users,
      COUNT(*) FILTER (WHERE is_active = false) as inactive_users,
      COUNT(*) FILTER (WHERE role = 'admin') as admin_users,
      COUNT(*) FILTER (WHERE role = 'user') as regular_users,
      COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as new_users_last_30_days,
      COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as new_users_last_7_days
    FROM users
  `

  const statsResult = await pool.query(statsQuery)
  const stats = statsResult.rows[0]

  res.json({
    success: true,
    data: {
      stats: {
        totalUsers: parseInt(stats.total_users),
        activeUsers: parseInt(stats.active_users),
        inactiveUsers: parseInt(stats.inactive_users),
        adminUsers: parseInt(stats.admin_users),
        regularUsers: parseInt(stats.regular_users),
        newUsersLast30Days: parseInt(stats.new_users_last_30_days),
        newUsersLast7Days: parseInt(stats.new_users_last_7_days)
      }
    }
  })
}))

// 获取用户资料
router.get('/profile', authenticate, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw createValidationError('用户信息不存在')
  }

  const userQuery = `
    SELECT 
      id, email, name, role, avatar_url, timezone, is_active, created_at, updated_at,
      (SELECT COUNT(*) FROM objectives WHERE user_id = $1) as total_objectives,
      (SELECT COUNT(*) FROM objectives WHERE user_id = $1 AND status = 'COMPLETED') as completed_objectives,
      (SELECT COUNT(*) FROM tasks t JOIN objectives o ON t.objective_id = o.id WHERE o.user_id = $1) as total_tasks,
      (SELECT COUNT(*) FROM tasks t JOIN objectives o ON t.objective_id = o.id WHERE o.user_id = $1 AND t.status = 'COMPLETED') as completed_tasks
    FROM users 
    WHERE id = $1
  `

  const result = await pool.query(userQuery, [req.user.id])

  if (result.rows.length === 0) {
    throw createNotFoundError('用户')
  }

  const user = result.rows[0]

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatarUrl: user.avatar_url,
        timezone: user.timezone,
        isActive: user.is_active,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        stats: {
          totalObjectives: parseInt(user.total_objectives),
          completedObjectives: parseInt(user.completed_objectives),
          totalTasks: parseInt(user.total_tasks),
          completedTasks: parseInt(user.completed_tasks)
        }
      }
    }
  })
}))

// 更新用户资料
router.put('/profile', authenticate, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw createValidationError('用户信息不存在')
  }

  const { name, avatarUrl, timezone } = req.body

  // 验证输入
  if (name && name.trim().length === 0) {
    throw createValidationError('姓名不能为空')
  }

  if (timezone && !isValidTimezone(timezone)) {
    throw createValidationError('无效的时区')
  }

  const client = await pool.connect()
  
  try {
    await client.query('BEGIN')

    // 更新用户资料
    const updateResult = await client.query(`
      UPDATE users 
      SET 
        name = COALESCE($1, name),
        avatar_url = COALESCE($2, avatar_url),
        timezone = COALESCE($3, timezone),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING id, email, name, role, avatar_url, timezone, updated_at
    `, [name, avatarUrl, timezone, req.user.id])

    const updatedUser = updateResult.rows[0]

    await client.query('COMMIT')

    // 记录操作日志
    businessLogger.update('用户资料', req.user.id, req.user.id)

    res.json({
      success: true,
      message: '用户资料更新成功',
      data: {
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          role: updatedUser.role,
          avatarUrl: updatedUser.avatar_url,
          timezone: updatedUser.timezone,
          updatedAt: updatedUser.updated_at
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

// 修改密码
router.put('/password', authenticate, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw createValidationError('用户信息不存在')
  }

  const { currentPassword, newPassword } = req.body

  // 验证必填字段
  if (!currentPassword || !newPassword) {
    throw createValidationError('当前密码和新密码为必填项')
  }

  // 验证新密码强度
  if (newPassword.length < 6) {
    throw createValidationError('新密码长度至少为6位')
  }

  // 获取当前密码哈希
  const userResult = await pool.query(
    'SELECT password_hash FROM users WHERE id = $1',
    [req.user.id]
  )

  if (userResult.rows.length === 0) {
    throw createNotFoundError('用户')
  }

  // 验证当前密码
  const isCurrentPasswordValid = await bcrypt.compare(currentPassword, userResult.rows[0].password_hash)
  if (!isCurrentPasswordValid) {
    throw createAuthError('当前密码错误')
  }

  const client = await pool.connect()
  
  try {
    await client.query('BEGIN')

    // 加密新密码
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12')
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds)

    // 更新密码
    await client.query(`
      UPDATE users 
      SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [hashedNewPassword, req.user.id])

    await client.query('COMMIT')

    // 记录操作日志
    businessLogger.update('用户密码', req.user.id, req.user.id)

    res.json({
      success: true,
      message: '密码修改成功'
    })

  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}))

// 获取用户偏好设置
router.get('/preferences', authenticate, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw createValidationError('用户信息不存在')
  }

  // 这里可以扩展到专门的偏好设置表，目前从用户表获取
  const preferencesQuery = `
    SELECT 
      timezone,
      COALESCE(
        (SELECT value FROM user_preferences WHERE user_id = $1 AND key = 'notifications'), 
        'true'
      ) as notifications,
      COALESCE(
        (SELECT value FROM user_preferences WHERE user_id = $1 AND key = 'theme'), 
        'light'
      ) as theme,
      COALESCE(
        (SELECT value FROM user_preferences WHERE user_id = $1 AND key = 'language'), 
        'zh-CN'
      ) as language,
      COALESCE(
        (SELECT value FROM user_preferences WHERE user_id = $1 AND key = 'date_format'), 
        'YYYY-MM-DD'
      ) as date_format,
      COALESCE(
        (SELECT value FROM user_preferences WHERE user_id = $1 AND key = 'work_hours_start'), 
        '09:00'
      ) as work_hours_start,
      COALESCE(
        (SELECT value FROM user_preferences WHERE user_id = $1 AND key = 'work_hours_end'), 
        '18:00'
      ) as work_hours_end
    FROM users 
    WHERE id = $1
  `

  const result = await pool.query(preferencesQuery, [req.user.id])

  if (result.rows.length === 0) {
    throw createNotFoundError('用户')
  }

  const preferences = result.rows[0]

  res.json({
    success: true,
    data: {
      preferences: {
        timezone: preferences.timezone,
        notifications: preferences.notifications === 'true',
        theme: preferences.theme,
        language: preferences.language,
        dateFormat: preferences.date_format,
        workHours: {
          start: preferences.work_hours_start,
          end: preferences.work_hours_end
        }
      }
    }
  })
}))

// 更新用户偏好设置
router.put('/preferences', authenticate, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw createValidationError('用户信息不存在')
  }

  const { notifications, theme, language, dateFormat, workHours, timezone } = req.body

  const client = await pool.connect()
  
  try {
    await client.query('BEGIN')

    // 创建用户偏好设置表（如果不存在）
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_preferences (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        key VARCHAR(50) NOT NULL,
        value TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, key)
      )
    `)

    // 更新各项偏好设置
    const preferences = [
      { key: 'notifications', value: notifications?.toString() },
      { key: 'theme', value: theme },
      { key: 'language', value: language },
      { key: 'date_format', value: dateFormat },
      { key: 'work_hours_start', value: workHours?.start },
      { key: 'work_hours_end', value: workHours?.end }
    ]

    for (const pref of preferences) {
      if (pref.value !== undefined) {
        await client.query(`
          INSERT INTO user_preferences (user_id, key, value)
          VALUES ($1, $2, $3)
          ON CONFLICT (user_id, key) 
          DO UPDATE SET value = $3, updated_at = CURRENT_TIMESTAMP
        `, [req.user.id, pref.key, pref.value])
      }
    }

    // 如果有时区更新，更新用户表
    if (timezone) {
      await client.query(`
        UPDATE users 
        SET timezone = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [timezone, req.user.id])
    }

    await client.query('COMMIT')

    // 记录操作日志
    businessLogger.update('用户偏好设置', req.user.id, req.user.id)

    res.json({
      success: true,
      message: '偏好设置更新成功'
    })

  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}))

// 获取用户活动日志
router.get('/activity', authenticate, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw createValidationError('用户信息不存在')
  }

  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 20
  const entityType = req.query.entityType as string || ''

  const offset = (page - 1) * limit

  // 构建查询条件
  let whereConditions = ['user_id = $1']
  let queryParams: any[] = [req.user.id]
  let paramIndex = 2

  if (entityType) {
    whereConditions.push(`entity_type = $${paramIndex}`)
    queryParams.push(entityType)
    paramIndex++
  }

  const whereClause = `WHERE ${whereConditions.join(' AND ')}`

  // 获取总数
  const countQuery = `SELECT COUNT(*) FROM activity_logs ${whereClause}`
  const countResult = await pool.query(countQuery, queryParams)
  const total = parseInt(countResult.rows[0].count)

  // 获取活动日志
  const activityQuery = `
    SELECT 
      id, entity_type, entity_id, action, old_values, new_values, created_at
    FROM activity_logs 
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `
  
  const activityResult = await pool.query(activityQuery, [...queryParams, limit, offset])

  res.json({
    success: true,
    data: {
      activities: activityResult.rows.map(activity => ({
        id: activity.id,
        entityType: activity.entity_type,
        entityId: activity.entity_id,
        action: activity.action,
        oldValues: activity.old_values,
        newValues: activity.new_values,
        createdAt: activity.created_at
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

// 注销账户
router.delete('/account', authenticate, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw createValidationError('用户信息不存在')
  }

  const { password } = req.body

  if (!password) {
    throw createValidationError('密码为必填项')
  }

  // 验证密码
  const userResult = await pool.query(
    'SELECT password_hash FROM users WHERE id = $1',
    [req.user.id]
  )

  if (userResult.rows.length === 0) {
    throw createNotFoundError('用户')
  }

  const isPasswordValid = await bcrypt.compare(password, userResult.rows[0].password_hash)
  if (!isPasswordValid) {
    throw createAuthError('密码错误')
  }

  const client = await pool.connect()
  
  try {
    await client.query('BEGIN')

    // 软删除：设置用户为不活跃状态
    await client.query(`
      UPDATE users 
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [req.user.id])

    await client.query('COMMIT')

    // 记录操作日志
    businessLogger.delete('用户账户', req.user.id, req.user.id)

    res.json({
      success: true,
      message: '账户已注销'
    })

  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}))

// 管理员功能：获取所有用户列表
router.get('/admin/users', authenticate, requireRole('admin'), asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 20
  const search = req.query.search as string || ''
  const role = req.query.role as string || ''
  const isActive = req.query.isActive as string

  const offset = (page - 1) * limit

  // 构建查询条件
  let whereConditions: string[] = []
  let queryParams: any[] = []
  let paramIndex = 1

  if (search) {
    whereConditions.push(`(name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`)
    queryParams.push(`%${search}%`)
    paramIndex++
  }

  if (role) {
    whereConditions.push(`role = $${paramIndex}`)
    queryParams.push(role)
    paramIndex++
  }

  if (isActive !== undefined && isActive !== '') {
    whereConditions.push(`is_active = $${paramIndex}`)
    queryParams.push(isActive === 'true')
    paramIndex++
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

  // 获取总数
  const countQuery = `SELECT COUNT(*) FROM users ${whereClause}`
  const countResult = await pool.query(countQuery, queryParams)
  const total = parseInt(countResult.rows[0].count)

  // 获取用户列表
  const usersQuery = `
    SELECT 
      id, email, name, role, is_active, created_at, updated_at,
      (SELECT COUNT(*) FROM objectives WHERE user_id = users.id) as total_objectives,
      (SELECT COUNT(*) FROM tasks t JOIN objectives o ON t.objective_id = o.id WHERE o.user_id = users.id) as total_tasks
    FROM users 
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `
  
  const usersResult = await pool.query(usersQuery, [...queryParams, limit, offset])

  res.json({
    success: true,
    data: {
      users: usersResult.rows.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.is_active,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        stats: {
          totalObjectives: parseInt(user.total_objectives),
          totalTasks: parseInt(user.total_tasks)
        }
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

// 管理员功能：更新用户状态
router.put('/admin/users/:userId/status', authenticate, requireRole('admin'), asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params
  const { isActive } = req.body

  if (typeof isActive !== 'boolean') {
    throw createValidationError('isActive 必须为布尔值')
  }

  const client = await pool.connect()
  
  try {
    await client.query('BEGIN')

    // 更新用户状态
    const updateResult = await client.query(`
      UPDATE users 
      SET is_active = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, email, name, is_active
    `, [isActive, userId])

    if (updateResult.rows.length === 0) {
      throw createNotFoundError('用户')
    }

    const updatedUser = updateResult.rows[0]

    await client.query('COMMIT')

    // 记录操作日志
    businessLogger.update('用户状态', userId, req.user?.id || '')

    res.json({
      success: true,
      message: '用户状态更新成功',
      data: {
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          isActive: updatedUser.is_active
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

// 辅助函数：验证时区
function isValidTimezone(timezone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone })
    return true
  } catch (error) {
    return false
  }
}

export default router 