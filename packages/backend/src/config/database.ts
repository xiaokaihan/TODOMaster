import { Pool, PoolConfig, PoolClient } from 'pg'
import dotenv from 'dotenv'

// 加载环境变量
dotenv.config()

// 数据库配置接口
export interface DatabaseConfig {
  host: string
  port: number
  database: string
  username: string
  password: string
  ssl?: boolean
  maxConnections?: number
  idleTimeoutMillis?: number
  connectionTimeoutMillis?: number
}

// 默认配置 - 使用用户提供的数据库信息
const defaultConfig: DatabaseConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'todomaster',
  username: process.env.DB_USERNAME || 'admin',
  password: process.env.DB_PASSWORD || '123456',
  ssl: process.env.DB_SSL === 'true',
  maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '20'),
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '5000'),
}

// PostgreSQL 连接池配置
const poolConfig: PoolConfig = {
  host: defaultConfig.host,
  port: defaultConfig.port,
  database: defaultConfig.database,
  user: defaultConfig.username,
  password: defaultConfig.password,
  ssl: defaultConfig.ssl ? { rejectUnauthorized: false } : false,
  max: defaultConfig.maxConnections,
  idleTimeoutMillis: defaultConfig.idleTimeoutMillis,
  connectionTimeoutMillis: defaultConfig.connectionTimeoutMillis,
  // 连接池配置
  allowExitOnIdle: true,
  // 查询超时时间
  query_timeout: 30000,
  // 语句超时时间
  statement_timeout: 30000,
}

// 创建连接池
export const pool = new Pool(poolConfig)

// 连接池事件监听
pool.on('connect', (client: PoolClient) => {
  console.log('📦 新的数据库连接已建立')
})

pool.on('error', (err: Error, client: PoolClient) => {
  console.error('💥 数据库连接池发生错误:', err.message)
})

pool.on('acquire', (client: PoolClient) => {
  console.log('🔒 数据库连接已获取')
})

pool.on('remove', (client: PoolClient) => {
  console.log('🔓 数据库连接已移除')
})

// 数据库连接测试
export const testConnection = async (): Promise<boolean> => {
  try {
    const client = await pool.connect()
    console.log('🎯 数据库连接测试开始...')
    
    // 测试基本查询
    const result = await client.query('SELECT NOW() as current_time, version() as version')
    console.log('⏰ 数据库时间:', result.rows[0].current_time)
    console.log('📋 PostgreSQL 版本:', result.rows[0].version.split(' ')[0])
    
    // 测试表是否存在
    const tableCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'objectives', 'key_results', 'tasks')
      ORDER BY table_name
    `)
    
    if (tableCheck.rows.length > 0) {
      console.log('✅ 找到核心数据表:', tableCheck.rows.map((row: any) => row.table_name).join(', '))
      
      // 获取数据统计
      const stats = await Promise.all([
        client.query('SELECT COUNT(*) as count FROM users'),
        client.query('SELECT COUNT(*) as count FROM objectives'),
        client.query('SELECT COUNT(*) as count FROM key_results'),
        client.query('SELECT COUNT(*) as count FROM tasks'),
      ]);

      console.log('📊 数据统计:');
      console.log(`   - 用户数: ${stats[0].rows[0].count}`);
      console.log(`   - 目标数: ${stats[1].rows[0].count}`);
      console.log(`   - 关键结果数: ${stats[2].rows[0].count}`);
      console.log(`   - 任务数: ${stats[3].rows[0].count}`);
    } else {
      console.log('⚠️  未找到核心数据表，可能需要运行数据库迁移')
    }
    
    client.release()
    console.log('✅ 数据库连接测试成功')
    return true
  } catch (error) {
    console.error('❌ 数据库连接测试失败:', error)
    return false
  }
}

// 执行数据库迁移
export const runMigrations = async (): Promise<boolean> => {
  try {
    const client = await pool.connect()
    console.log('🔄 开始执行数据库迁移...')
    
    // 检查迁移表是否存在
    const migrationTableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'schema_migrations'
      )
    `)
    
    if (!migrationTableExists.rows[0].exists) {
      console.log('📋 创建迁移记录表...')
      await client.query(`
        CREATE TABLE schema_migrations (
          version VARCHAR(20) PRIMARY KEY,
          description TEXT,
          applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `)
    }
    
    // 检查已应用的迁移
    const appliedMigrations = await client.query(`
      SELECT version FROM schema_migrations ORDER BY version
    `)
    
    const appliedVersions = appliedMigrations.rows.map((row: any) => row.version)
    console.log('📜 已应用的迁移版本:', appliedVersions)
    
    client.release()
    console.log('✅ 迁移检查完成')
    return true
  } catch (error) {
    console.error('❌ 迁移执行失败:', error)
    return false
  }
}

// 优雅关闭数据库连接
export const closeDatabase = async (): Promise<void> => {
  try {
    await pool.end()
    console.log('🔒 数据库连接池已关闭')
  } catch (error) {
    console.error('❌ 关闭数据库连接时出错:', error)
  }
}

// 获取数据库统计信息
export const getDatabaseStats = async () => {
  try {
    const client = await pool.connect()
    
    // 获取连接池信息
    const poolStats = {
      totalConnections: pool.totalCount,
      idleConnections: pool.idleCount,
      waitingCount: pool.waitingCount,
    }
    
    // 获取数据库大小
    const dbSize = await client.query(`
      SELECT pg_size_pretty(pg_database_size(current_database())) as size
    `)
    
    // 获取表统计信息
    const tableStats = await client.query(`
      SELECT 
        schemaname,
        tablename,
        n_tup_ins as inserts,
        n_tup_upd as updates,
        n_tup_del as deletes,
        n_live_tup as live_tuples,
        n_dead_tup as dead_tuples
      FROM pg_stat_user_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `)
    
    client.release()
    
    return {
      pool: poolStats,
      database: {
        size: dbSize.rows[0]?.size || 'Unknown',
      },
      tables: tableStats.rows,
    }
  } catch (error) {
    console.error('❌ 获取数据库统计信息失败:', error)
    return null
  }
}

// 健康检查
export const healthCheck = async () => {
  try {
    const client = await pool.connect()
    const start = Date.now()
    
    await client.query('SELECT 1')
    
    const responseTime = Date.now() - start
    client.release()
    
    return {
      status: 'healthy',
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString(),
      config: {
        host: defaultConfig.host,
        port: defaultConfig.port,
        database: defaultConfig.database,
        user: defaultConfig.username,
      }
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }
  }
}

// 备份数据库配置信息（不包含敏感信息）
export const getConfig = () => {
  return {
    host: defaultConfig.host,
    port: defaultConfig.port,
    database: defaultConfig.database,
    username: defaultConfig.username,
    ssl: defaultConfig.ssl,
    maxConnections: defaultConfig.maxConnections,
    idleTimeoutMillis: defaultConfig.idleTimeoutMillis,
    connectionTimeoutMillis: defaultConfig.connectionTimeoutMillis,
  }
}

// 导出默认配置
export default {
  pool,
  testConnection,
  runMigrations,
  closeDatabase,
  getDatabaseStats,
  healthCheck,
  getConfig,
} 