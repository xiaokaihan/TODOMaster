#!/usr/bin/env node

import { Command } from 'commander'
import dotenv from 'dotenv'
import { 
  runMigrations, 
  getMigrationStatus, 
  dropAllTables, 
  rebuildDatabase 
} from '../database/migrator'
import { testConnection, getDatabaseStats, closeDatabase } from '../config/database'

// 加载环境变量
dotenv.config()

// 颜色输出函数
const colors = {
  red: (text: string) => `\x1b[31m${text}\x1b[0m`,
  green: (text: string) => `\x1b[32m${text}\x1b[0m`,
  yellow: (text: string) => `\x1b[33m${text}\x1b[0m`,
  blue: (text: string) => `\x1b[34m${text}\x1b[0m`,
  magenta: (text: string) => `\x1b[35m${text}\x1b[0m`,
  cyan: (text: string) => `\x1b[36m${text}\x1b[0m`,
}

// 错误处理
const handleError = (error: any) => {
  console.error(colors.red('❌ 操作失败:'), error.message)
  if (process.env.NODE_ENV === 'development') {
    console.error(colors.red('详细错误:'), error)
  }
  process.exit(1)
}

// 成功处理
const handleSuccess = (message: string) => {
  console.log(colors.green('✅'), message)
}

// 测试数据库连接
async function testDatabaseConnection() {
  try {
    console.log(colors.blue('🔍 测试数据库连接...'))
    const isConnected = await testConnection()
    
    if (isConnected) {
      handleSuccess('数据库连接成功')
    } else {
      throw new Error('数据库连接失败')
    }
  } catch (error) {
    handleError(error)
  } finally {
    await closeDatabase()
  }
}

// 运行数据库迁移
async function migrate() {
  try {
    console.log(colors.blue('🚀 开始数据库迁移...'))
    await runMigrations()
    handleSuccess('数据库迁移完成')
  } catch (error) {
    handleError(error)
  } finally {
    await closeDatabase()
  }
}

// 获取迁移状态
async function status() {
  try {
    console.log(colors.blue('📋 检查迁移状态...'))
    const migrationStatus = await getMigrationStatus()
    
    console.log('\n' + colors.cyan('=== 迁移状态 ==='))
    console.log(`总迁移数: ${colors.magenta(migrationStatus.total.toString())}`)
    console.log(`已应用: ${colors.green(migrationStatus.applied.length.toString())}`)
    console.log(`待应用: ${colors.yellow(migrationStatus.pending.length.toString())}`)
    
    if (migrationStatus.applied.length > 0) {
      console.log('\n' + colors.green('已应用的迁移:'))
      migrationStatus.applied.forEach(version => {
        console.log(`  ✅ ${version}`)
      })
    }
    
    if (migrationStatus.pending.length > 0) {
      console.log('\n' + colors.yellow('待应用的迁移:'))
      migrationStatus.pending.forEach(version => {
        console.log(`  ⏳ ${version}`)
      })
    }
    
    if (migrationStatus.pending.length === 0) {
      handleSuccess('数据库是最新状态')
    }
  } catch (error) {
    handleError(error)
  } finally {
    await closeDatabase()
  }
}

// 获取数据库统计信息
async function stats() {
  try {
    console.log(colors.blue('📊 获取数据库统计信息...'))
    const stats = await getDatabaseStats()
    
    if (!stats) {
      throw new Error('无法获取数据库统计信息')
    }
    
    console.log('\n' + colors.cyan('=== 数据库统计 ==='))
    console.log(`数据库大小: ${colors.magenta(stats.database.size)}`)
    
    console.log('\n' + colors.cyan('连接池状态:'))
    console.log(`  总连接数: ${colors.blue(stats.pool.totalConnections.toString())}`)
    console.log(`  空闲连接: ${colors.green(stats.pool.idleConnections.toString())}`)
    console.log(`  等待连接: ${colors.yellow(stats.pool.waitingCount.toString())}`)
    
    if (stats.tables.length > 0) {
      console.log('\n' + colors.cyan('表统计:'))
      stats.tables.forEach((table: any) => {
        console.log(`  📋 ${table.tablename}:`)
        console.log(`    - 插入: ${colors.green(table.inserts)}`)
        console.log(`    - 更新: ${colors.yellow(table.updates)}`)
        console.log(`    - 删除: ${colors.red(table.deletes)}`)
        console.log(`    - 活跃行: ${colors.blue(table.live_tuples)}`)
      })
    }
    
    handleSuccess('统计信息获取完成')
  } catch (error) {
    handleError(error)
  } finally {
    await closeDatabase()
  }
}

// 重置数据库
async function reset() {
  try {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('不能在生产环境中重置数据库')
    }
    
    console.log(colors.yellow('⚠️  警告: 这将删除所有数据！'))
    console.log(colors.blue('🔄 开始重置数据库...'))
    
    await dropAllTables()
    await runMigrations()
    
    handleSuccess('数据库重置完成')
  } catch (error) {
    handleError(error)
  } finally {
    await closeDatabase()
  }
}

// 重建数据库
async function rebuild() {
  try {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('不能在生产环境中重建数据库')
    }
    
    console.log(colors.yellow('⚠️  警告: 这将删除所有数据并重建数据库！'))
    console.log(colors.blue('🏗️  开始重建数据库...'))
    
    await rebuildDatabase()
    handleSuccess('数据库重建完成')
  } catch (error) {
    handleError(error)
  } finally {
    await closeDatabase()
  }
}

// 显示帮助信息
function showHelp() {
  console.log(colors.cyan('\n=== TODOMaster 数据库管理工具 ===\n'))
  console.log('可用命令:')
  console.log(`  ${colors.green('test')}      - 测试数据库连接`)
  console.log(`  ${colors.green('migrate')}   - 运行数据库迁移`)
  console.log(`  ${colors.green('status')}    - 检查迁移状态`)
  console.log(`  ${colors.green('stats')}     - 显示数据库统计信息`)
  console.log(`  ${colors.green('reset')}     - 重置数据库（仅开发环境）`)
  console.log(`  ${colors.green('rebuild')}   - 重建数据库（仅开发环境）`)
  console.log(`  ${colors.green('help')}      - 显示此帮助信息`)
  
  console.log('\n示例:')
  console.log('  npm run db:migrate')
  console.log('  npm run db:status')
  console.log('  npm run db:reset')
  console.log('\n')
}

// 配置命令行程序
const program = new Command()

program
  .name('db-cli')
  .description('TODOMaster 数据库管理工具')
  .version('1.0.0')

program
  .command('test')
  .description('测试数据库连接')
  .action(testDatabaseConnection)

program
  .command('migrate')
  .description('运行数据库迁移')
  .action(migrate)

program
  .command('status')
  .description('检查迁移状态')
  .action(status)

program
  .command('stats')
  .description('显示数据库统计信息')
  .action(stats)

program
  .command('reset')
  .description('重置数据库（仅开发环境）')
  .action(reset)

program
  .command('rebuild')
  .description('重建数据库（仅开发环境）')
  .action(rebuild)

program
  .command('help')
  .description('显示帮助信息')
  .action(showHelp)

// 解析命令行参数
program.parse(process.argv)

// 如果没有提供命令，显示帮助
if (!process.argv.slice(2).length) {
  showHelp()
} 