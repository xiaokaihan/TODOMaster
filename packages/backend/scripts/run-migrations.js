#!/usr/bin/env node

// 数据库迁移运行脚本
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// 使用用户提供的数据库配置
const dbConfig = {
  host: 'localhost',
  port: 5432,
  database: 'todomaster',
  user: 'admin',
  password: '123456',
  ssl: false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
};

const pool = new Pool(dbConfig);

async function runMigrations() {
  console.log('🚀 开始执行数据库迁移...');

  try {
    const client = await pool.connect();

    // 检查迁移表是否存在
    const migrationTableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'schema_migrations'
      )
    `);

    if (!migrationTableExists.rows[0].exists) {
      console.log('📋 创建迁移记录表...');
      await client.query(`
        CREATE TABLE schema_migrations (
          version VARCHAR(20) PRIMARY KEY,
          description TEXT,
          applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);
    }

    // 获取已应用的迁移
    const appliedMigrations = await client.query(`
      SELECT version FROM schema_migrations ORDER BY version
    `);
    const appliedVersions = new Set(appliedMigrations.rows.map(row => row.version));

    // 扫描迁移文件
    const migrationsDir = path.join(__dirname, '../database/migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    console.log(`📁 找到 ${migrationFiles.length} 个迁移文件`);

    for (const file of migrationFiles) {
      const version = file.split('_')[0]; // 提取版本号
      
      if (appliedVersions.has(version)) {
        console.log(`⏭️  跳过已应用的迁移: ${file}`);
        continue;
      }

      console.log(`🔄 应用迁移: ${file}`);
      
      const migrationPath = path.join(migrationsDir, file);
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
      
      try {
        // 注意：这里简化处理，实际生产环境需要更复杂的事务管理
        await client.query('BEGIN');
        
        // 分割SQL语句（简单处理）
        const statements = migrationSQL
          .split(';')
          .map(stmt => stmt.trim())
          .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
        
        for (const statement of statements) {
          if (statement.trim()) {
            await client.query(statement);
          }
        }
        
        await client.query('COMMIT');
        console.log(`✅ 迁移 ${file} 应用成功`);
        
      } catch (error) {
        await client.query('ROLLBACK');
        console.error(`❌ 迁移 ${file} 应用失败:`, error.message);
        break;
      }
    }

    // 显示当前迁移状态
    const finalMigrations = await client.query(`
      SELECT version, description, applied_at 
      FROM schema_migrations 
      ORDER BY version
    `);

    console.log('\n📜 当前已应用的迁移:');
    finalMigrations.rows.forEach(row => {
      console.log(`   ✓ ${row.version}: ${row.description}`);
    });

    client.release();
    console.log('\n🎉 迁移执行完成！');

  } catch (error) {
    console.error('❌ 迁移执行失败:', error.message);
  } finally {
    await pool.end();
  }
}

async function showStatus() {
  console.log('📊 数据库状态检查...');

  try {
    const client = await pool.connect();

    // 检查表是否存在
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    console.log('\n📋 数据库表:');
    tables.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });

    // 检查数据统计
    if (tables.rows.some(row => row.table_name === 'users')) {
      const stats = await Promise.all([
        client.query('SELECT COUNT(*) as count FROM users'),
        client.query('SELECT COUNT(*) as count FROM objectives'),
        client.query('SELECT COUNT(*) as count FROM key_results'),
        client.query('SELECT COUNT(*) as count FROM tasks'),
      ]);

      console.log('\n📊 数据统计:');
      console.log(`   - 用户: ${stats[0].rows[0].count}`);
      console.log(`   - 目标: ${stats[1].rows[0].count}`);
      console.log(`   - 关键结果: ${stats[2].rows[0].count}`);
      console.log(`   - 任务: ${stats[3].rows[0].count}`);
    }

    client.release();

  } catch (error) {
    console.error('❌ 状态检查失败:', error.message);
  } finally {
    await pool.end();
  }
}

// 解析命令行参数
const command = process.argv[2];

switch (command) {
  case 'migrate':
    runMigrations();
    break;
  case 'status':
    showStatus();
    break;
  default:
    console.log(`
使用方法:
  node scripts/run-migrations.js migrate  - 运行数据库迁移
  node scripts/run-migrations.js status   - 查看数据库状态

示例:
  node scripts/run-migrations.js migrate
  node scripts/run-migrations.js status
    `);
    break;
} 