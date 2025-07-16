import express, { Request, Response } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import { testConnection } from './config/database'
import { errorHandler, notFoundHandler } from './middleware/errorHandler'
import { logger } from './middleware/logger'
import authRoutes from './routes/auth'
import userRoutes from './routes/users'
import objectiveRoutes from './routes/objectives'
import keyResultRoutes from './routes/keyResults'
import taskRoutes from './routes/tasks'
import statsRoutes from './routes/stats'
import healthRoutes from './routes/health'

// 创建 Express 应用
const app = express()

// 安全中间件
app.use(helmet())

// CORS 配置
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

// 压缩中间件
app.use(compression() as any)

// 请求体解析
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// 日志中间件
app.use(logger)

// 速率限制
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 分钟
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // 限制每个 IP 每 15 分钟最多 100 个请求
  message: {
    error: '请求太频繁，请稍后再试',
    retryAfter: '15分钟'
  },
  standardHeaders: true, // 返回速率限制信息在 `RateLimit-*` 头中
  legacyHeaders: false, // 禁用 `X-RateLimit-*` 头
})

app.use(limiter)

// 健康检查端点
app.get('/health', async (req: Request, res: Response) => {
  try {
    const dbConnected = await testConnection()
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: dbConnected ? 'connected' : 'disconnected',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    })
  } catch (error) {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// API 路由
const apiPrefix = '/api'

app.use(`${apiPrefix}/auth`, authRoutes)
app.use(`${apiPrefix}/users`, userRoutes)
app.use(`${apiPrefix}/objectives`, objectiveRoutes)
app.use(`${apiPrefix}/key-results`, keyResultRoutes)
app.use(`${apiPrefix}/tasks`, taskRoutes)
app.use(`${apiPrefix}/stats`, statsRoutes)
app.use(`${apiPrefix}/health`, healthRoutes)

// API 根路径信息
app.get(apiPrefix, (req: Request, res: Response) => {
  res.json({
    message: 'TODOMaster API',
    version: '1.0.0',
    documentation: `${req.protocol}://${req.get('host')}${apiPrefix}/docs`,
    endpoints: {
      auth: `${apiPrefix}/auth`,
      users: `${apiPrefix}/users`,
      objectives: `${apiPrefix}/objectives`,
      keyResults: `${apiPrefix}/key-results`,
      tasks: `${apiPrefix}/tasks`,
      stats: `${apiPrefix}/stats`
    }
  })
})

// 根路径
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'TODOMaster API Server',
    status: 'running',
    version: '1.0.0',
    api: `${req.protocol}://${req.get('host')}${apiPrefix}`
  })
})

// 错误处理中间件（必须放在最后）
app.use(notFoundHandler)
app.use(errorHandler)

export default app 