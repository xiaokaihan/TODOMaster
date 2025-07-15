import { Request, Response, NextFunction } from 'express'

// 自定义错误类
export class AppError extends Error {
  public statusCode: number
  public isOperational: boolean

  constructor(message: string, statusCode: number = 500) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = true

    Error.captureStackTrace(this, this.constructor)
  }
}

// 404 错误处理中间件
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = new AppError(`路径 ${req.originalUrl} 不存在`, 404)
  next(error)
}

// 全局错误处理中间件
export const errorHandler = (
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = 500
  let message = '服务器内部错误'
  let details: any = undefined

  // 如果是自定义错误
  if (error instanceof AppError) {
    statusCode = error.statusCode
    message = error.message
  }
  // 数据库错误处理
  else if (error.message.includes('duplicate key')) {
    statusCode = 409
    message = '数据已存在'
  }
  else if (error.message.includes('foreign key')) {
    statusCode = 400
    message = '关联数据不存在'
  }
  else if (error.message.includes('not null')) {
    statusCode = 400
    message = '必填字段不能为空'
  }
  // JWT 错误处理
  else if (error.name === 'JsonWebTokenError') {
    statusCode = 401
    message = '无效的访问令牌'
  }
  else if (error.name === 'TokenExpiredError') {
    statusCode = 401
    message = '访问令牌已过期'
  }
  // 验证错误处理
  else if (error.name === 'ValidationError') {
    statusCode = 400
    message = '数据验证失败'
    details = error.message
  }
  // 开发环境显示详细错误信息
  else if (process.env.NODE_ENV === 'development') {
    message = error.message
    details = error.stack
  }

  // 记录错误日志
  console.error(`❌ 错误 [${statusCode}]:`, {
    message: error.message,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  })

  // 返回错误响应
  const errorResponse: any = {
    success: false,
    error: {
      message,
      statusCode,
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
      method: req.method
    }
  }

  // 开发环境添加详细信息
  if (process.env.NODE_ENV === 'development' && details) {
    errorResponse.error.details = details
  }

  res.status(statusCode).json(errorResponse)
}

// 异步错误处理包装器
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

// 验证错误创建器
export const createValidationError = (message: string) => {
  return new AppError(message, 400)
}

// 认证错误创建器
export const createAuthError = (message: string = '未授权访问') => {
  return new AppError(message, 401)
}

// 权限错误创建器
export const createForbiddenError = (message: string = '权限不足') => {
  return new AppError(message, 403)
}

// 资源不存在错误创建器
export const createNotFoundError = (resource: string = '资源') => {
  return new AppError(`${resource}不存在`, 404)
} 