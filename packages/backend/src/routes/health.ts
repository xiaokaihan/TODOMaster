import { Router, Request, Response } from 'express'
import { pool } from '../config/database'
import { asyncHandler } from '../middleware/errorHandler'
import { appLogger } from '../middleware/logger'

const router = Router()

// 基础健康检查
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const healthCheck = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    message: 'TODOMaster API is running',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  }

  res.status(200).json(healthCheck)
}))

// 详细系统状态检查
router.get('/status', asyncHandler(async (req: Request, res: Response) => {
  const startTime = Date.now()
  
  // 检查数据库连接
  let dbStatus = 'ok'
  let dbResponseTime = 0
  try {
    const dbStart = Date.now()
    await pool.query('SELECT 1')
    dbResponseTime = Date.now() - dbStart
  } catch (error) {
    dbStatus = 'error'
    appLogger.error('数据库健康检查失败', { error: error instanceof Error ? error.message : error })
  }

  // 检查内存使用情况
  const memoryUsage = process.memoryUsage()
  const memoryUsageMB = {
    rss: Math.round(memoryUsage.rss / 1024 / 1024),
    heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
    heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
    external: Math.round(memoryUsage.external / 1024 / 1024)
  }

  // CPU 使用情况
  const cpuUsage = process.cpuUsage()

  // 系统信息
  const systemInfo = {
    platform: process.platform,
    arch: process.arch,
    nodeVersion: process.version,
    pid: process.pid,
    uptime: process.uptime()
  }

  const totalResponseTime = Date.now() - startTime

  const status = {
    status: dbStatus === 'ok' ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    responseTime: `${totalResponseTime}ms`,
    services: {
      database: {
        status: dbStatus,
        responseTime: `${dbResponseTime}ms`
      }
    },
    system: {
      ...systemInfo,
      memory: memoryUsageMB,
      cpu: {
        user: Math.round(cpuUsage.user / 1000),
        system: Math.round(cpuUsage.system / 1000)
      }
    },
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  }

  // 根据系统状态返回相应的 HTTP 状态码
  const httpStatus = status.status === 'healthy' ? 200 : 503
  res.status(httpStatus).json(status)
}))

// 数据库健康检查
router.get('/db', asyncHandler(async (req: Request, res: Response) => {
  const startTime = Date.now()
  
  try {
    // 测试基本查询
    await pool.query('SELECT 1 as test')
    
    // 检查连接池状态
    const poolStats = {
      totalCount: pool.totalCount,
      idleCount: pool.idleCount,
      waitingCount: pool.waitingCount
    }
    
    const responseTime = Date.now() - startTime
    
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      database: {
        connected: true,
        pool: poolStats
      }
    })
  } catch (error) {
    const responseTime = Date.now() - startTime
    
    appLogger.error('数据库连接检查失败', { error: error instanceof Error ? error.message : error })
    
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      database: {
        connected: false,
        error: error instanceof Error ? error.message : '未知错误'
      }
    })
  }
}))

// 系统指标
router.get('/metrics', asyncHandler(async (req: Request, res: Response) => {
  const memoryUsage = process.memoryUsage()
  const cpuUsage = process.cpuUsage()

  // 获取应用统计数据
  let appMetrics = {}
  try {
    const statsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM users WHERE is_active = true) as active_users,
        (SELECT COUNT(*) FROM objectives) as total_objectives,
        (SELECT COUNT(*) FROM key_results) as total_key_results,
        (SELECT COUNT(*) FROM tasks) as total_tasks,
        (SELECT COUNT(*) FROM activity_logs WHERE created_at > NOW() - INTERVAL '24 hours') as activities_last_24h
    `
    
    const result = await pool.query(statsQuery)
    const stats = result.rows[0]
    
    appMetrics = {
      activeUsers: parseInt(stats.active_users),
      totalObjectives: parseInt(stats.total_objectives),
      totalKeyResults: parseInt(stats.total_key_results),
      totalTasks: parseInt(stats.total_tasks),
      activitiesLast24h: parseInt(stats.activities_last_24h)
    }
  } catch (error) {
    appLogger.error('获取应用指标失败', { error: error instanceof Error ? error.message : error })
  }

  const metrics = {
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      rss: memoryUsage.rss,
      heapTotal: memoryUsage.heapTotal,
      heapUsed: memoryUsage.heapUsed,
      external: memoryUsage.external,
      heapUsedPercentage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100)
    },
    cpu: {
      user: cpuUsage.user,
      system: cpuUsage.system
    },
    process: {
      pid: process.pid,
      version: process.version,
      platform: process.platform,
      arch: process.arch
    },
    application: appMetrics
  }

  res.status(200).json(metrics)
}))

// 就绪检查（Kubernetes readiness probe）
router.get('/ready', asyncHandler(async (req: Request, res: Response) => {
  try {
    // 检查数据库连接
    await pool.query('SELECT 1')
    
    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      reason: 'Database connection failed'
    })
  }
}))

// 存活检查（Kubernetes liveness probe）
router.get('/live', asyncHandler(async (req: Request, res: Response) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
}))

export default router 