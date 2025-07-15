import dotenv from 'dotenv'
import app from './app'
import { testConnection, closeDatabase } from './config/database'

// 加载环境变量
dotenv.config()

const PORT = process.env.PORT || 3000
const NODE_ENV = process.env.NODE_ENV || 'development'

// 启动服务器
async function startServer() {
  try {
    console.log('🚀 启动 TODOMaster API 服务器...')
    console.log(`📝 环境: ${NODE_ENV}`)
    console.log(`🔌 端口: ${PORT}`)

    // 测试数据库连接
    console.log('🔍 测试数据库连接...')
    const dbConnected = await testConnection()
    
    if (!dbConnected) {
      console.error('❌ 数据库连接失败，服务器启动中止')
      process.exit(1)
    }

    // 启动 HTTP 服务器
    const server = app.listen(PORT, () => {
      console.log('✅ 服务器启动成功！')
      console.log(`🌐 API 地址: http://localhost:${PORT}`)
      console.log(`📖 API 文档: http://localhost:${PORT}/api/v1`)
      console.log(`❤️  健康检查: http://localhost:${PORT}/health`)
      console.log('')
      console.log('🎯 TODOMaster API 已准备就绪！')
    })

    // 优雅关闭处理
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n📡 收到 ${signal} 信号，开始优雅关闭...`)
      
      // 停止接受新连接
      server.close(async () => {
        console.log('🔒 HTTP 服务器已关闭')
        
        // 关闭数据库连接
        await closeDatabase()
        
        console.log('✅ 服务器已优雅关闭')
        process.exit(0)
      })

      // 如果 10 秒内没有正常关闭，强制退出
      setTimeout(() => {
        console.error('❌ 强制退出服务器')
        process.exit(1)
      }, 10000)
    }

    // 监听关闭信号
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
    process.on('SIGINT', () => gracefulShutdown('SIGINT'))
    
    // 处理未捕获的异常
    process.on('uncaughtException', (error) => {
      console.error('💥 未捕获的异常:', error)
      process.exit(1)
    })

    process.on('unhandledRejection', (reason, promise) => {
      console.error('💥 未处理的 Promise 拒绝:', reason)
      console.error('Promise:', promise)
      process.exit(1)
    })

  } catch (error) {
    console.error('❌ 服务器启动失败:', error)
    process.exit(1)
  }
}

// 启动服务器
startServer() 