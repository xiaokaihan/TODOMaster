import { Router, Request, Response } from 'express'
import bcrypt from 'bcrypt'
import { pool } from '../config/database'
import { asyncHandler, createValidationError, createAuthError, createNotFoundError } from '../middleware/errorHandler'
import { generateToken, generateRefreshToken, verifyRefreshToken, authenticate } from '../middleware/auth'
import { authLogger } from '../middleware/logger'

const router = Router()

// 用户注册
router.post('/register', asyncHandler(async (req: Request, res: Response) => {
  const { email, password, confirmPassword, firstName, lastName } = req.body

  // 验证必填字段
  if (!email || !password || !firstName || !lastName) {
    throw createValidationError('邮箱、密码、名字和姓氏为必填项')
  }

  // 验证密码确认
  if (password !== confirmPassword) {
    throw createValidationError('两次输入的密码不一致')
  }

  // 验证邮箱格式
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    throw createValidationError('邮箱格式不正确')
  }

  // 验证密码强度
  if (password.length < 8) {
    throw createValidationError('密码长度至少为8位')
  }

  // 验证密码强度（包含大小写字母和数字）
  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    throw createValidationError('密码必须包含大小写字母和数字')
  }

  // 合并姓名
  const name = `${firstName.trim()} ${lastName.trim()}`

  const client = await pool.connect()
  
  try {
    await client.query('BEGIN')

    // 检查邮箱是否已存在
    const existingUser = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    )

    if (existingUser.rows.length > 0) {
      throw createValidationError('该邮箱已被注册')
    }

    // 加密密码
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12')
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // 创建用户
    const userResult = await client.query(`
      INSERT INTO users (email, password_hash, name)
      VALUES ($1, $2, $3)
      RETURNING id, email, name, created_at
    `, [email.toLowerCase(), hashedPassword, name])

    const user = userResult.rows[0]

    await client.query('COMMIT')

    // 生成 JWT 令牌
    const accessToken = generateToken(user.id, user.email)
    const refreshToken = generateRefreshToken(user.id)

    // 记录注册日志
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown'
    authLogger.register(user.id, user.email, clientIp)

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        avatar: null,
        createdAt: user.created_at,
        updatedAt: user.created_at
      },
      token: accessToken,
      refreshToken: refreshToken,
      expiresIn: parseInt(process.env.JWT_EXPIRES_IN || '604800') // 7天，以秒为单位
    })

  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}))

// 用户登录
router.post('/login', asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body

  // 验证必填字段
  if (!email || !password) {
    throw createValidationError('邮箱和密码为必填项')
  }

  // 查找用户
  const userResult = await pool.query(`
    SELECT id, email, password_hash, name
    FROM users 
    WHERE email = $1
  `, [email.toLowerCase()])

  if (userResult.rows.length === 0) {
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown'
    authLogger.authFailed(email, '用户不存在', clientIp)
    throw createAuthError('邮箱或密码错误')
  }

  const user = userResult.rows[0]

  // 验证密码
  const isPasswordValid = await bcrypt.compare(password, user.password_hash)
  if (!isPasswordValid) {
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown'
    authLogger.authFailed(email, '密码错误', clientIp)
    throw createAuthError('邮箱或密码错误')
  }

  // 生成 JWT 令牌
  const accessToken = generateToken(user.id, user.email)
  const refreshToken = generateRefreshToken(user.id)

  // 记录登录日志
  const clientIp = req.ip || req.connection.remoteAddress || 'unknown'
  authLogger.login(user.id, user.email, clientIp)

  // 分割姓名为firstName和lastName
  const nameParts = user.name.trim().split(' ')
  const firstName = nameParts[0] || ''
  const lastName = nameParts.slice(1).join(' ') || ''

  res.json({
    user: {
      id: user.id,
      email: user.email,
      firstName: firstName,
      lastName: lastName,
      avatar: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    token: accessToken,
    refreshToken: refreshToken,
    expiresIn: parseInt(process.env.JWT_EXPIRES_IN || '604800') // 7天，以秒为单位
  })
}))

// 刷新令牌
router.post('/refresh', asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body

  if (!refreshToken) {
    throw createValidationError('刷新令牌为必填项')
  }

  // 验证刷新令牌
  const payload = verifyRefreshToken(refreshToken)

  // 查找用户
  const userResult = await pool.query(`
    SELECT id, email, name
    FROM users 
    WHERE id = $1
  `, [payload.userId])

  if (userResult.rows.length === 0) {
    throw createAuthError('用户不存在或已被禁用')
  }

  const user = userResult.rows[0]

  // 生成新的访问令牌
  const newAccessToken = generateToken(user.id, user.email)

  res.json({
    success: true,
    message: '令牌刷新成功',
    data: {
      accessToken: newAccessToken,
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    }
  })
}))

// 获取当前用户信息
router.get('/me', authenticate, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw createAuthError('用户信息不存在')
  }

  // 从数据库获取最新用户信息
  const userResult = await pool.query(`
    SELECT id, email, name, created_at, updated_at
    FROM users 
    WHERE id = $1
  `, [req.user.id])

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
        createdAt: user.created_at,
        updatedAt: user.updated_at
      }
    }
  })
}))

// 更新用户信息
router.put('/me', authenticate, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw createAuthError('用户信息不存在')
  }

  const { name } = req.body

  if (!name) {
    throw createValidationError('姓名为必填项')
  }

  // 更新用户信息
  const userResult = await pool.query(`
    UPDATE users 
    SET name = $1, updated_at = CURRENT_TIMESTAMP
    WHERE id = $2
    RETURNING id, email, name, updated_at
  `, [name, req.user.id])

  if (userResult.rows.length === 0) {
    throw createNotFoundError('用户')
  }

  const user = userResult.rows[0]

  res.json({
    success: true,
    message: '用户信息更新成功',
    data: {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        updatedAt: user.updated_at
      }
    }
  })
}))

// 修改密码
router.put('/password', authenticate, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw createAuthError('用户信息不存在')
  }

  const { currentPassword, newPassword } = req.body

  if (!currentPassword || !newPassword) {
    throw createValidationError('当前密码和新密码为必填项')
  }

  if (newPassword.length < 6) {
    throw createValidationError('新密码长度至少为6位')
  }

  // 获取当前密码哈希
  const userResult = await pool.query(`
    SELECT password_hash FROM users WHERE id = $1
  `, [req.user.id])

  if (userResult.rows.length === 0) {
    throw createNotFoundError('用户')
  }

  const user = userResult.rows[0]

  // 验证当前密码
  const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash)
  if (!isCurrentPasswordValid) {
    throw createAuthError('当前密码错误')
  }

  // 加密新密码
  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12')
  const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds)

  // 更新密码
  await pool.query(`
    UPDATE users 
    SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
    WHERE id = $2
  `, [hashedNewPassword, req.user.id])

  res.json({
    success: true,
    message: '密码修改成功'
  })
}))

// 用户登出
router.post('/logout', authenticate, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw createAuthError('用户信息不存在')
  }

  // 记录登出日志
  const clientIp = req.ip || req.connection.remoteAddress || 'unknown'
  authLogger.logout(req.user.id, clientIp)

  res.json({
    success: true,
    message: '登出成功'
  })
}))

export default router 