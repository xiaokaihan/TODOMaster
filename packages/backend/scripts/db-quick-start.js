#!/usr/bin/env node

// 数据库快速启动和管理脚本
const { execSync, spawn } = require('child_process');

console.log('🚀 TODOMaster 数据库快速启动脚本');
console.log('======================================');

const command = process.argv[2];

switch (command) {
  case 'start':
    startDatabase();
    break;
  case 'stop':
    stopDatabase();
    break;
  case 'restart':
    restartDatabase();
    break;
  case 'status':
    checkStatus();
    break;
  case 'test':
    testConnection();
    break;
  case 'migrate':
    runMigrations();
    break;
  case 'seed':
    loadSeedData();
    break;
  case 'reset':
    resetDatabase();
    break;
  case 'logs':
    showLogs();
    break;
  default:
    showHelp();
    break;
}

function startDatabase() {
  console.log('🔄 启动 PostgreSQL 数据库...');
  
  try {
    // 检查容器是否已存在
    try {
      const result = execSync('docker ps -a --filter "name=todomaster-postgres" --format "{{.Names}}"', { encoding: 'utf8' });
      if (result.trim() === 'todomaster-postgres') {
        console.log('📦 容器已存在，正在启动...');
        execSync('docker start todomaster-postgres', { stdio: 'inherit' });
      } else {
        console.log('📦 创建新的 PostgreSQL 容器...');
        execSync(`docker run --name todomaster-postgres \\
          -e POSTGRES_USER=admin \\
          -e POSTGRES_PASSWORD=123456 \\
          -e POSTGRES_DB=todomaster \\
          -p 5432:5432 \\
          -d postgres:15`, { stdio: 'inherit' });
      }
    } catch (error) {
      console.log('📦 创建新的 PostgreSQL 容器...');
      execSync(`docker run --name todomaster-postgres \\
        -e POSTGRES_USER=admin \\
        -e POSTGRES_PASSWORD=123456 \\
        -e POSTGRES_DB=todomaster \\
        -p 5432:5432 \\
        -d postgres:15`, { stdio: 'inherit' });
    }
    
    console.log('✅ 数据库启动成功！');
    console.log('💡 等待 5 秒让数据库完全启动，然后运行连接测试...');
    
    setTimeout(() => {
      testConnection();
    }, 5000);
    
  } catch (error) {
    console.error('❌ 启动失败:', error.message);
    console.log('\n🔧 可能的解决方案:');
    console.log('1. 确保 Docker 已安装并运行');
    console.log('2. 检查端口 5432 是否被占用');
    console.log('3. 尝试手动启动: docker run --name todomaster-postgres -e POSTGRES_USER=admin -e POSTGRES_PASSWORD=123456 -e POSTGRES_DB=todomaster -p 5432:5432 -d postgres:15');
  }
}

function stopDatabase() {
  console.log('🛑 停止 PostgreSQL 数据库...');
  
  try {
    execSync('docker stop todomaster-postgres', { stdio: 'inherit' });
    console.log('✅ 数据库已停止');
  } catch (error) {
    console.error('❌ 停止失败:', error.message);
  }
}

function restartDatabase() {
  console.log('🔄 重启 PostgreSQL 数据库...');
  
  try {
    execSync('docker restart todomaster-postgres', { stdio: 'inherit' });
    console.log('✅ 数据库已重启');
    
    setTimeout(() => {
      testConnection();
    }, 3000);
    
  } catch (error) {
    console.error('❌ 重启失败:', error.message);
  }
}

function checkStatus() {
  console.log('📊 检查数据库状态...');
  
  try {
    const result = execSync('docker ps --filter "name=todomaster-postgres" --format "table {{.Names}}\\t{{.Status}}\\t{{.Ports}}"', { encoding: 'utf8' });
    console.log(result);
    
    if (result.includes('todomaster-postgres')) {
      testConnection();
    } else {
      console.log('❌ 数据库容器未运行');
      console.log('💡 运行 "node scripts/db-quick-start.js start" 来启动数据库');
    }
  } catch (error) {
    console.error('❌ 状态检查失败:', error.message);
  }
}

function testConnection() {
  console.log('🔍 测试数据库连接...');
  
  try {
    execSync('node scripts/test-db-connection.js', { stdio: 'inherit' });
  } catch (error) {
    console.error('❌ 连接测试失败');
  }
}

function runMigrations() {
  console.log('🗂️ 运行数据库迁移...');
  
  try {
    execSync('PGPASSWORD=123456 psql -h localhost -U admin -d todomaster -f database/migrations/001_initial_schema.sql', { stdio: 'inherit' });
    console.log('✅ 迁移完成');
  } catch (error) {
    console.error('❌ 迁移失败:', error.message);
    console.log('💡 确保数据库正在运行，然后重试');
  }
}

function loadSeedData() {
  console.log('🌱 加载示例数据...');
  
  try {
    execSync('PGPASSWORD=123456 psql -h localhost -U admin -d todomaster -f database/seed_data.sql', { stdio: 'inherit' });
    console.log('✅ 示例数据加载完成');
  } catch (error) {
    console.error('❌ 数据加载失败:', error.message);
  }
}

function resetDatabase() {
  console.log('🗑️ 重置数据库...');
  console.log('⚠️  这将删除所有数据！');
  
  // 简单确认（在实际使用时可能需要更好的确认机制）
  try {
    // 停止并删除容器
    execSync('docker stop todomaster-postgres', { stdio: 'pipe' });
    execSync('docker rm todomaster-postgres', { stdio: 'pipe' });
    
    console.log('🔄 重新创建数据库...');
    startDatabase();
    
  } catch (error) {
    console.log('📝 容器不存在或已停止，创建新容器...');
    startDatabase();
  }
}

function showLogs() {
  console.log('📋 显示数据库日志...');
  
  try {
    execSync('docker logs -f todomaster-postgres', { stdio: 'inherit' });
  } catch (error) {
    console.error('❌ 无法显示日志:', error.message);
  }
}

function showHelp() {
  console.log(`
🎯 TODOMaster 数据库管理工具

用法:
  node scripts/db-quick-start.js <command>

命令:
  start     启动 PostgreSQL 数据库容器
  stop      停止数据库容器
  restart   重启数据库容器
  status    检查数据库状态
  test      测试数据库连接
  migrate   运行数据库迁移
  seed      加载示例数据
  reset     重置数据库（删除所有数据）
  logs      显示数据库日志

示例:
  node scripts/db-quick-start.js start
  node scripts/db-quick-start.js test
  node scripts/db-quick-start.js migrate

数据库信息:
  Host: localhost:5432
  Database: todomaster
  User: admin
  Password: 123456

注意: 需要安装 Docker 来运行数据库容器
  `);
} 