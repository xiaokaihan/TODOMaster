import { readFileSync } from 'fs'
import { join } from 'path'
import { pool } from '../config/database'

// 迁移接口
interface Migration {
  version: string
  description: string
  sql: string
}

// 获取所有迁移文件
const getMigrations = (): Migration[] => {
  return [
    {
      version: '1.0.0',
      description: '初始数据库结构创建',
      sql: readFileSync(join(__dirname, 'migrations.sql'), 'utf8')
    }
  ]
}

// 检查迁移记录表是否存在
const ensureMigrationTable = async (): Promise<void> => {
  const client = await pool.connect()
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(20) PRIMARY KEY,
        description TEXT,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('✅ 迁移记录表已准备就绪')
  } catch (error) {
    console.error('❌ 创建迁移记录表失败:', error)
    throw error
  } finally {
    client.release()
  }
}

// 获取已应用的迁移版本
const getAppliedMigrations = async (): Promise<string[]> => {
  const client = await pool.connect()
  try {
    const result = await client.query(
      'SELECT version FROM schema_migrations ORDER BY version'
    )
    return result.rows.map(row => row.version)
  } catch (error) {
    console.error('❌ 获取已应用迁移失败:', error)
    return []
  } finally {
    client.release()
  }
}

// 应用单个迁移
const applyMigration = async (migration: Migration): Promise<void> => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    
    console.log(`🔄 正在应用迁移 ${migration.version}: ${migration.description}`)
    
    // 执行迁移SQL
    await client.query(migration.sql)
    
    // 记录迁移
    await client.query(
      'INSERT INTO schema_migrations (version, description) VALUES ($1, $2) ON CONFLICT (version) DO NOTHING',
      [migration.version, migration.description]
    )
    
    await client.query('COMMIT')
    console.log(`✅ 迁移 ${migration.version} 应用成功`)
  } catch (error) {
    await client.query('ROLLBACK')
    console.error(`❌ 迁移 ${migration.version} 应用失败:`, error)
    throw error
  } finally {
    client.release()
  }
}

// 运行迁移
export const runMigrations = async (): Promise<void> => {
  try {
    console.log('🚀 开始执行数据库迁移...')
    
    // 确保迁移记录表存在
    await ensureMigrationTable()
    
    // 获取所有迁移和已应用的迁移
    const allMigrations = getMigrations()
    const appliedMigrations = await getAppliedMigrations()
    
    console.log(`📋 总迁移数: ${allMigrations.length}`)
    console.log(`✅ 已应用迁移数: ${appliedMigrations.length}`)
    
    // 过滤出需要应用的迁移
    const pendingMigrations = allMigrations.filter(
      migration => !appliedMigrations.includes(migration.version)
    )
    
    if (pendingMigrations.length === 0) {
      console.log('🎉 所有迁移都已应用，数据库是最新状态')
      return
    }
    
    console.log(`⏳ 需要应用 ${pendingMigrations.length} 个迁移`)
    
    // 按版本号排序并应用迁移
    pendingMigrations.sort((a, b) => a.version.localeCompare(b.version))
    
    for (const migration of pendingMigrations) {
      await applyMigration(migration)
    }
    
    console.log('🎉 所有迁移应用完成！')
    
  } catch (error) {
    console.error('💥 迁移过程发生错误:', error)
    throw error
  }
}

// 回滚迁移（高级功能）
export const rollbackMigration = async (version: string): Promise<void> => {
  console.warn('⚠️  回滚功能暂未实现，请手动处理数据库回滚')
  // TODO: 实现回滚逻辑
}

// 获取迁移状态
export const getMigrationStatus = async (): Promise<{
  applied: string[]
  pending: string[]
  total: number
}> => {
  try {
    await ensureMigrationTable()
    
    const allMigrations = getMigrations()
    const appliedMigrations = await getAppliedMigrations()
    
    const allVersions = allMigrations.map(m => m.version)
    const pendingMigrations = allVersions.filter(
      version => !appliedMigrations.includes(version)
    )
    
    return {
      applied: appliedMigrations,
      pending: pendingMigrations,
      total: allMigrations.length
    }
  } catch (error) {
    console.error('❌ 获取迁移状态失败:', error)
    throw error
  }
}

// 清理数据库（开发用）
export const dropAllTables = async (): Promise<void> => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('❌ 不能在生产环境中删除所有表')
  }
  
  const client = await pool.connect()
  try {
    console.log('⚠️  正在删除所有表和类型...')
    
    await client.query('BEGIN')
    
    // 删除所有表
    const dropTablesSQL = `
      DROP TABLE IF EXISTS task_tag_associations CASCADE;
      DROP TABLE IF EXISTS task_tags CASCADE;
      DROP TABLE IF EXISTS task_dependencies CASCADE;
      DROP TABLE IF EXISTS activity_logs CASCADE;
      DROP TABLE IF EXISTS tasks CASCADE;
      DROP TABLE IF EXISTS key_results CASCADE;
      DROP TABLE IF EXISTS objectives CASCADE;
      DROP TABLE IF EXISTS systems CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
      DROP TABLE IF EXISTS schema_migrations CASCADE;
    `
    
    await client.query(dropTablesSQL)
    
    // 删除所有枚举类型
    const dropTypesSQL = `
      DROP TYPE IF EXISTS key_result_status CASCADE;
      DROP TYPE IF EXISTS key_result_type CASCADE;
      DROP TYPE IF EXISTS task_priority CASCADE;
      DROP TYPE IF EXISTS task_status CASCADE;
      DROP TYPE IF EXISTS objective_status CASCADE;
      DROP TYPE IF EXISTS objective_category CASCADE;
      DROP TYPE IF EXISTS system_status CASCADE;
      DROP TYPE IF EXISTS user_role CASCADE;
    `
    
    await client.query(dropTypesSQL)
    
    // 删除函数
    const dropFunctionsSQL = `
      DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
      DROP FUNCTION IF EXISTS calculate_objective_progress() CASCADE;
      DROP FUNCTION IF EXISTS calculate_key_result_progress() CASCADE;
    `
    
    await client.query(dropFunctionsSQL)
    
    // 删除视图
    await client.query('DROP VIEW IF EXISTS user_stats CASCADE;')
    
    await client.query('COMMIT')
    console.log('✅ 所有表和类型已删除')
    
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('❌ 删除表失败:', error)
    throw error
  } finally {
    client.release()
  }
}

// 重建数据库
export const rebuildDatabase = async (): Promise<void> => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('❌ 不能在生产环境中重建数据库')
  }
  
  try {
    console.log('🔄 开始重建数据库...')
    await dropAllTables()
    await runMigrations()
    console.log('🎉 数据库重建完成！')
  } catch (error) {
    console.error('💥 数据库重建失败:', error)
    throw error
  }
} 