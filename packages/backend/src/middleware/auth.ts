import { Request, Response, NextFunction } from 'express'
import jwt, { SignOptions } from 'jsonwebtoken'
import { pool } from '../config/database'
import { createAuthError, createForbiddenError } from './errorHandler'
import { authLogger } from './logger'

// 扩展 Request 接口以包含用户信息
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        email: string
        name: string
        role: string
      }
    }
  }
}

// JWT 载荷接口
interface JWTPayload {
  userId: string
  email: string
  iat: number
  exp: number
}

// 生成 JWT Token
export const generateToken = (userId: string, email: string): string => {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET 环境变量未设置')
  }

  const expiresIn = process.env.JWT_EXPIRES_IN || '7d'
  
  return jwt.sign(
    { userId, email },
    secret,
    { expiresIn } as SignOptions
  )
}

// 生成刷新令牌
export const generateRefreshToken = (userId: string): string => {
  const secret = process.env.JWT_REFRESH_SECRET
  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET 环境变量未设置')
  }

  const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '30d'
  
  return jwt.sign(
    { userId },
    secret,
    { expiresIn } as SignOptions
  )
}

// 验证 JWT Token
export const verifyToken = (token: string): JWTPayload => {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET 环境变量未设置')
  }

  try {
    return jwt.verify(token, secret) as JWTPayload
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw createAuthError('访问令牌已过期')
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw createAuthError('无效的访问令牌')
    }
    throw createAuthError('令牌验证失败')
  }
}

// 验证刷新令牌
export const verifyRefreshToken = (token: string): { userId: string } => {
  const secret = process.env.JWT_REFRESH_SECRET
  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET 环境变量未设置')
  }

  try {
    return jwt.verify(token, secret) as { userId: string }
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw createAuthError('刷新令牌已过期')
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw createAuthError('无效的刷新令牌')
    }
    throw createAuthError('刷新令牌验证失败')
  }
}

// 从请求头中提取 Token
const extractToken = (req: Request): string | null => {
  const authHeader = req.headers.authorization
  
  if (!authHeader) {
    return null
  }

  // 支持 "Bearer token" 格式
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }

  // 直接返回 token
  return authHeader
}

// 认证中间件
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = extractToken(req)
    
    if (!token) {
      throw createAuthError('缺少访问令牌')
    }

    // 验证 token
    const payload = verifyToken(token)
    
    // 从数据库获取用户信息
    const userQuery = `
      SELECT id, email, name, created_at
      FROM users 
      WHERE id = $1
    `
    
    const result = await pool.query(userQuery, [payload.userId])
    
    if (result.rows.length === 0) {
      const clientIp = req.ip || req.connection.remoteAddress || 'unknown'
      authLogger.authFailed(payload.email, '用户不存在', clientIp)
      throw createAuthError('用户不存在')
    }

    const user = result.rows[0]
    
    // 将用户信息添加到请求对象
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: 'user' // 默认角色
    }

    next()
  } catch (error) {
    next(error)
  }
}

// 可选认证中间件（不强制要求登录）
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = extractToken(req)
    
    if (!token) {
      return next()
    }

    // 验证 token
    const payload = verifyToken(token)
    
    // 从数据库获取用户信息
    const userQuery = `
      SELECT id, email, name, created_at
      FROM users 
      WHERE id = $1
    `
    
    const result = await pool.query(userQuery, [payload.userId])
    
    if (result.rows.length > 0) {
      const user = result.rows[0]
      req.user = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: 'user' // 默认角色
      }
    }

    next()
  } catch (error) {
    // 可选认证失败时不抛出错误，继续执行
    next()
  }
}

// 角色权限检查中间件
export const requireRole = (roles: string | string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw createAuthError('需要登录')
    }

    const allowedRoles = Array.isArray(roles) ? roles : [roles]
    
    if (!allowedRoles.includes(req.user.role)) {
      const clientIp = req.ip || req.connection.remoteAddress || 'unknown'
      authLogger.authFailed(req.user.email, `权限不足，需要角色: ${allowedRoles.join(', ')}`, clientIp)
      throw createForbiddenError(`权限不足，需要角色: ${allowedRoles.join(', ')}`)
    }

    next()
  }
}

// 管理员权限检查
export const requireAdmin = requireRole('admin')

// 资源所有者检查中间件
export const requireOwnership = (resourceIdParam: string = 'id', userIdField: string = 'user_id') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw createAuthError('需要登录')
      }

      // 管理员可以访问所有资源
      if (req.user.role === 'admin') {
        return next()
      }

      const resourceId = req.params[resourceIdParam]
      if (!resourceId) {
        throw createForbiddenError('缺少资源ID')
      }

      // 这里需要根据具体的资源类型来查询
      // 暂时跳过，在具体的路由中实现
      next()
    } catch (error) {
      next(error)
    }
  }
}

// 速率限制增强（基于用户）
export const userRateLimit = (maxRequests: number = 100, windowMs: number = 15 * 60 * 1000) => {
  const userRequests = new Map<string, { count: number; resetTime: number }>()

  return (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id || req.ip || req.connection.remoteAddress || 'unknown'
    const now = Date.now()
    
    const userLimit = userRequests.get(userId)
    
    if (!userLimit || now > userLimit.resetTime) {
      userRequests.set(userId, {
        count: 1,
        resetTime: now + windowMs
      })
      return next()
    }

    if (userLimit.count >= maxRequests) {
      return res.status(429).json({
        success: false,
        error: {
          message: '请求太频繁，请稍后再试',
          retryAfter: Math.ceil((userLimit.resetTime - now) / 1000)
        }
      })
    }

    userLimit.count++
    next()
  }
} 