import { Request, Response, NextFunction } from 'express'

// 日志级别
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug'
}

// 日志格式化
const formatLog = (level: LogLevel, message: string, meta?: any) => {
  const timestamp = new Date().toISOString()
  const logEntry = {
    timestamp,
    level,
    message,
    ...(meta && { meta })
  }
  
  return JSON.stringify(logEntry)
}

// 控制台颜色
const colors = {
  error: '\x1b[31m',   // 红色
  warn: '\x1b[33m',    // 黄色
  info: '\x1b[36m',    // 青色
  debug: '\x1b[37m',   // 白色
  reset: '\x1b[0m'     // 重置
}

// 日志记录器
export class Logger {
  private logLevel: LogLevel

  constructor(logLevel: LogLevel = LogLevel.INFO) {
    this.logLevel = logLevel
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.ERROR, LogLevel.WARN, LogLevel.INFO, LogLevel.DEBUG]
    return levels.indexOf(level) <= levels.indexOf(this.logLevel)
  }

  private log(level: LogLevel, message: string, meta?: any) {
    if (!this.shouldLog(level)) return

    const logEntry = formatLog(level, message, meta)
    const color = colors[level] || colors.reset
    
    console.log(`${color}${logEntry}${colors.reset}`)
  }

  error(message: string, meta?: any) {
    this.log(LogLevel.ERROR, message, meta)
  }

  warn(message: string, meta?: any) {
    this.log(LogLevel.WARN, message, meta)
  }

  info(message: string, meta?: any) {
    this.log(LogLevel.INFO, message, meta)
  }

  debug(message: string, meta?: any) {
    this.log(LogLevel.DEBUG, message, meta)
  }
}

// 全局日志实例
const logLevel = (process.env.LOG_LEVEL as LogLevel) || LogLevel.INFO
export const appLogger = new Logger(logLevel)

// HTTP 请求日志中间件
export const logger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now()
  const { method, originalUrl, ip } = req
  const userAgent = req.get('User-Agent') || 'Unknown'

  // 记录请求开始
  appLogger.info(`📥 ${method} ${originalUrl}`, {
    ip,
    userAgent,
    timestamp: new Date().toISOString()
  })

  // 监听响应结束
  res.on('finish', () => {
    const duration = Date.now() - start
    const { statusCode } = res
    
    // 根据状态码选择日志级别
    let logLevel: LogLevel = LogLevel.INFO
    if (statusCode >= 500) {
      logLevel = LogLevel.ERROR
    } else if (statusCode >= 400) {
      logLevel = LogLevel.WARN
    }

    // 状态码图标
    let statusIcon = '✅'
    if (statusCode >= 500) {
      statusIcon = '💥'
    } else if (statusCode >= 400) {
      statusIcon = '⚠️'
    }

    appLogger[logLevel](`📤 ${statusIcon} ${method} ${originalUrl} ${statusCode}`, {
      duration: `${duration}ms`,
      ip,
      userAgent,
      timestamp: new Date().toISOString()
    })
  })

  next()
}

// 数据库查询日志
export const dbLogger = {
  query: (sql: string, params?: any[], duration?: number) => {
    appLogger.debug('🗃️ 数据库查询', {
      sql: sql.replace(/\s+/g, ' ').trim(),
      params,
      duration: duration ? `${duration}ms` : undefined
    })
  },

  error: (error: Error, sql?: string) => {
    appLogger.error('💥 数据库错误', {
      message: error.message,
      sql: sql?.replace(/\s+/g, ' ').trim(),
      stack: error.stack
    })
  }
}

// 认证日志
export const authLogger = {
  login: (userId: string, email: string, ip: string) => {
    appLogger.info('🔐 用户登录', {
      userId,
      email,
      ip,
      timestamp: new Date().toISOString()
    })
  },

  logout: (userId: string, ip: string) => {
    appLogger.info('🚪 用户登出', {
      userId,
      ip,
      timestamp: new Date().toISOString()
    })
  },

  register: (userId: string, email: string, ip: string) => {
    appLogger.info('📝 用户注册', {
      userId,
      email,
      ip,
      timestamp: new Date().toISOString()
    })
  },

  authFailed: (email: string, reason: string, ip: string) => {
    appLogger.warn('🚫 认证失败', {
      email,
      reason,
      ip,
      timestamp: new Date().toISOString()
    })
  }
}

// 业务操作日志
export const businessLogger = {
  create: (resource: string, id: string, userId: string) => {
    appLogger.info(`➕ 创建${resource}`, {
      resourceId: id,
      userId,
      timestamp: new Date().toISOString()
    })
  },

  update: (resource: string, id: string, userId: string, changes?: any) => {
    appLogger.info(`✏️ 更新${resource}`, {
      resourceId: id,
      userId,
      changes,
      timestamp: new Date().toISOString()
    })
  },

  delete: (resource: string, id: string, userId: string) => {
    appLogger.info(`🗑️ 删除${resource}`, {
      resourceId: id,
      userId,
      timestamp: new Date().toISOString()
    })
  }
} 