#!/usr/bin/env node

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

console.log('🚀 TODOMaster 后端 API 测试启动器')
console.log('=' .repeat(50))

// 检查测试环境配置
const envTestPath = path.join(__dirname, '.env.test')
if (!fs.existsSync(envTestPath)) {
  console.log('⚠️  警告：未找到 .env.test 文件')
  console.log('请创建 .env.test 文件，内容如下：')
  console.log('')
  console.log('NODE_ENV=test')
  console.log('PORT=3001')
  console.log('API_PREFIX=/api/v1')
  console.log('')
  console.log('# 测试数据库配置')
  console.log('DB_HOST=localhost')
  console.log('DB_PORT=5432')
  console.log('DB_NAME=todomaster_test')
  console.log('DB_USERNAME=admin')
  console.log('DB_PASSWORD=123456')
  console.log('DB_SSL=false')
  console.log('')
  console.log('# JWT 测试配置')
  console.log('JWT_SECRET=test-jwt-secret-key-for-testing-only')
  console.log('JWT_EXPIRES_IN=1h')
  console.log('')
  process.exit(1)
}

// 检查必要的依赖
try {
  console.log('📦 检查依赖...')
  execSync('which psql', { stdio: 'ignore' })
  console.log('✅ PostgreSQL 客户端已安装')
} catch (error) {
  console.log('❌ 未找到 PostgreSQL 客户端，请先安装 PostgreSQL')
  process.exit(1)
}

// 获取命令行参数
const args = process.argv.slice(2)
const command = args[0] || 'test'

switch (command) {
  case 'setup':
    setupTestEnvironment()
    break
  case 'test':
    runTests(args.slice(1))
    break
  case 'coverage':
    runCoverage()
    break
  case 'clean':
    cleanTestData()
    break
  case 'help':
    showHelp()
    break
  default:
    console.log(`❌ 未知命令: ${command}`)
    showHelp()
    process.exit(1)
}

function setupTestEnvironment() {
  console.log('🔧 设置测试环境...')
  
  try {
    // 创建测试数据库
    console.log('📊 创建测试数据库...')
    try {
      execSync('createdb todomaster_test', { stdio: 'ignore' })
      console.log('✅ 测试数据库创建成功')
    } catch (error) {
      console.log('⚠️  测试数据库可能已存在，跳过创建')
    }
    
    // 运行数据库迁移
    console.log('🏗️  运行数据库迁移...')
    execSync('NODE_ENV=test yarn db:migrate', { stdio: 'inherit' })
    console.log('✅ 数据库迁移完成')
    
    console.log('🎉 测试环境设置完成！')
    console.log('现在可以运行测试了：yarn test')
    
  } catch (error) {
    console.error('❌ 测试环境设置失败:', error.message)
    process.exit(1)
  }
}

function runTests(extraArgs = []) {
  console.log('🧪 运行测试...')
  
  try {
    const jestArgs = ['jest', ...extraArgs].join(' ')
    execSync(jestArgs, { stdio: 'inherit' })
    console.log('✅ 测试完成')
  } catch (error) {
    console.error('❌ 测试失败')
    process.exit(1)
  }
}

function runCoverage() {
  console.log('📊 运行测试并生成覆盖率报告...')
  
  try {
    execSync('jest --coverage', { stdio: 'inherit' })
    console.log('✅ 覆盖率报告生成完成')
    console.log('📁 覆盖率报告位置: ./coverage/lcov-report/index.html')
  } catch (error) {
    console.error('❌ 覆盖率测试失败')
    process.exit(1)
  }
}

function cleanTestData() {
  console.log('🧹 清理测试数据...')
  
  try {
    execSync('NODE_ENV=test yarn db:reset', { stdio: 'inherit' })
    console.log('✅ 测试数据清理完成')
  } catch (error) {
    console.error('❌ 清理失败:', error.message)
    process.exit(1)
  }
}

function showHelp() {
  console.log('')
  console.log('📖 使用说明:')
  console.log('')
  console.log('  node test-runner.js setup     # 设置测试环境')
  console.log('  node test-runner.js test      # 运行所有测试')
  console.log('  node test-runner.js coverage  # 运行测试并生成覆盖率')
  console.log('  node test-runner.js clean     # 清理测试数据')
  console.log('  node test-runner.js help      # 显示帮助信息')
  console.log('')
  console.log('📋 测试相关命令:')
  console.log('')
  console.log('  yarn test                     # 运行所有测试')
  console.log('  yarn test health.test.ts      # 运行特定测试文件')
  console.log('  yarn test:watch               # 监听模式运行测试')
  console.log('  yarn test --coverage          # 生成覆盖率报告')
  console.log('  yarn test --verbose           # 详细输出')
  console.log('')
} 