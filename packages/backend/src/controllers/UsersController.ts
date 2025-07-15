import { Request, Response } from 'express'
import { BaseController } from './BaseController'
import { ValidationService } from '../services/ValidationService'
import { pool } from '../config/database'
import { createValidationError } from '../middleware/errorHandler'
import { UserStats, UserDetail, UserPreferences } from '../models/entities/User'

export class UsersController extends BaseController {
  // 获取当前用户信息
  static async getCurrentUser(req: Request, res: Response) {
    const userId = this.validateUser(req)

    const userQuery = `
      SELECT 
        id, email, name, role, avatar_url, timezone, is_active,
        created_at, updated_at
      FROM users 
      WHERE id = $1
    `

    const userResult = await pool.query(userQuery, [userId])

    if (userResult.rows.length === 0) {
      throw createValidationError('用户不存在')
    }

    const user = userResult.rows[0]

    const responseData = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatarUrl: user.avatar_url,
        timezone: user.timezone,
        isActive: user.is_active,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      }
    }

    res.json(this.buildSuccessResponse(responseData))
  }

  // 获取用户详情（包含统计信息）
  static async getUserProfile(req: Request, res: Response) {
    const userId = this.validateUser(req)

    // 获取用户基本信息
    const userQuery = `
      SELECT 
        id, email, name, role, avatar_url, timezone, is_active,
        created_at, updated_at
      FROM users 
      WHERE id = $1
    `

    const userResult = await pool.query(userQuery, [userId])

    if (userResult.rows.length === 0) {
      throw createValidationError('用户不存在')
    }

    const user = userResult.rows[0]

    // 获取用户统计信息
    const statsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM objectives WHERE user_id = $1) as total_objectives,
        (SELECT COUNT(*) FROM objectives WHERE user_id = $1 AND status = 'COMPLETED') as completed_objectives,
        (SELECT COUNT(*) FROM tasks t JOIN objectives o ON t.objective_id = o.id WHERE o.user_id = $1) as total_tasks,
        (SELECT COUNT(*) FROM tasks t JOIN objectives o ON t.objective_id = o.id WHERE o.user_id = $1 AND t.status = 'COMPLETED') as completed_tasks
    `

    const statsResult = await pool.query(statsQuery, [userId])
    const stats = statsResult.rows[0]

    const responseData: UserDetail = {
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
        totalObjectives: parseInt(stats.total_objectives),
        completedObjectives: parseInt(stats.completed_objectives),
        totalTasks: parseInt(stats.total_tasks),
        completedTasks: parseInt(stats.completed_tasks)
      }
    }

    res.json(this.buildSuccessResponse({ user: responseData }))
  }

  // 更新用户资料
  static async updateUserProfile(req: Request, res: Response) {
    const userId = this.validateUser(req)
    const { name, avatarUrl, timezone } = req.body

    // 验证输入数据
    if (name && !ValidationService.validateStringLength(name, 1, 100)) {
      throw createValidationError('姓名长度必须在1-100个字符之间')
    }

    if (avatarUrl && !ValidationService.validateStringLength(avatarUrl, 0, 500)) {
      throw createValidationError('头像URL长度不能超过500个字符')
    }

    if (timezone && !ValidationService.validateTimezone(timezone)) {
      throw createValidationError('无效的时区')
    }

    const result = await this.executeTransaction(async (client) => {
      const updateResult = await client.query(`
        UPDATE users 
        SET 
          name = COALESCE($1, name),
          avatar_url = COALESCE($2, avatar_url),
          timezone = COALESCE($3, timezone),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
        RETURNING id, name, avatar_url, timezone, updated_at
      `, [name, avatarUrl, timezone, userId])

      return updateResult.rows[0]
    })

    // 记录操作日志
    this.logOperation('update', '用户资料', userId, userId)

    const responseData = {
      user: {
        id: result.id,
        name: result.name,
        avatarUrl: result.avatar_url,
        timezone: result.timezone,
        updatedAt: result.updated_at
      }
    }

    res.json(this.buildSuccessResponse(responseData, '用户资料更新成功'))
  }

  // 修改密码
  static async changePassword(req: Request, res: Response) {
    const userId = this.validateUser(req)
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      throw createValidationError('当前密码和新密码都是必需的')
    }

    // 验证新密码
    const passwordValidation = ValidationService.validatePassword(newPassword)
    if (!passwordValidation.isValid) {
      throw createValidationError(passwordValidation.message!)
    }

    const result = await this.executeTransaction(async (client) => {
      // 验证当前密码
      const userResult = await client.query(
        'SELECT password_hash FROM users WHERE id = $1',
        [userId]
      )

      if (userResult.rows.length === 0) {
        throw createValidationError('用户不存在')
      }

      const bcrypt = require('bcrypt')
      const isValidPassword = await bcrypt.compare(currentPassword, userResult.rows[0].password_hash)
      
      if (!isValidPassword) {
        throw createValidationError('当前密码不正确')
      }

      // 生成新密码哈希
      const saltRounds = 12
      const newPasswordHash = await bcrypt.hash(newPassword, saltRounds)

      // 更新密码
      await client.query(`
        UPDATE users 
        SET 
          password_hash = $1,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [newPasswordHash, userId])

      return true
    })

    // 记录操作日志
    this.logOperation('update', '用户密码', userId, userId)

    res.json(this.buildSuccessResponse(null, '密码修改成功'))
  }

  // 获取用户偏好设置
  static async getUserPreferences(req: Request, res: Response) {
    const userId = this.validateUser(req)

    const preferencesQuery = `
      SELECT key, value, created_at, updated_at
      FROM user_preferences 
      WHERE user_id = $1
      ORDER BY key
    `

    const preferencesResult = await pool.query(preferencesQuery, [userId])

    const preferences: Record<string, any> = {}
    preferencesResult.rows.forEach(pref => {
      try {
        preferences[pref.key] = JSON.parse(pref.value)
      } catch {
        preferences[pref.key] = pref.value
      }
    })

    res.json(this.buildSuccessResponse({ preferences }))
  }

  // 更新用户偏好设置
  static async updateUserPreferences(req: Request, res: Response) {
    const userId = this.validateUser(req)
    const { preferences } = req.body

    if (!preferences || typeof preferences !== 'object') {
      throw createValidationError('偏好设置必须是对象格式')
    }

    await this.executeTransaction(async (client) => {
      // 删除现有的偏好设置
      await client.query('DELETE FROM user_preferences WHERE user_id = $1', [userId])

      // 插入新的偏好设置
      for (const [key, value] of Object.entries(preferences)) {
        if (!ValidationService.validateStringLength(key, 1, 100)) {
          throw createValidationError(`偏好设置键名 "${key}" 长度必须在1-100个字符之间`)
        }

        const serializedValue = typeof value === 'string' ? value : JSON.stringify(value)
        
        await client.query(`
          INSERT INTO user_preferences (user_id, key, value)
          VALUES ($1, $2, $3)
        `, [userId, key, serializedValue])
      }
    })

    // 记录操作日志
    this.logOperation('update', '用户偏好设置', userId, userId)

    res.json(this.buildSuccessResponse(null, '偏好设置更新成功'))
  }

  // 停用用户账号
  static async deactivateAccount(req: Request, res: Response) {
    const userId = this.validateUser(req)
    const { password } = req.body

    if (!password) {
      throw createValidationError('需要提供密码以确认操作')
    }

    await this.executeTransaction(async (client) => {
      // 验证密码
      const userResult = await client.query(
        'SELECT password_hash FROM users WHERE id = $1',
        [userId]
      )

      if (userResult.rows.length === 0) {
        throw createValidationError('用户不存在')
      }

      const bcrypt = require('bcrypt')
      const isValidPassword = await bcrypt.compare(password, userResult.rows[0].password_hash)
      
      if (!isValidPassword) {
        throw createValidationError('密码不正确')
      }

      // 停用账号
      await client.query(`
        UPDATE users 
        SET 
          is_active = false,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [userId])
    })

    // 记录操作日志
    this.logOperation('update', '账号停用', userId, userId)

    res.json(this.buildSuccessResponse(null, '账号已成功停用'))
  }
} 