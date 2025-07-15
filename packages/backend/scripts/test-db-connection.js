#!/usr/bin/env node

// 数据库连接测试脚本
const { Pool } = require('pg');

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

async function testConnection() {
  console.log('🚀 开始测试数据库连接...');
  console.log('📋 数据库配置:', {
    host: dbConfig.host,
    port: dbConfig.port,
    database: dbConfig.database,
    user: dbConfig.user,
    ssl: dbConfig.ssl,
  });

  try {
    // 测试基本连接
    const client = await pool.connect();
    console.log('✅ 数据库连接成功！');

    // 测试基本查询
    const result = await client.query('SELECT NOW() as current_time, version() as version');
    console.log('⏰ 数据库时间:', result.rows[0].current_time);
    console.log('📋 PostgreSQL 版本:', result.rows[0].version.split(' ').slice(0, 2).join(' '));

    // 检查数据库是否为空
    const tableCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'objectives', 'key_results', 'tasks', 'task_dependencies')
      ORDER BY table_name
    `);

    if (tableCheck.rows.length > 0) {
      console.log('🎯 找到核心数据表:', tableCheck.rows.map(row => row.table_name).join(', '));
      
      // 检查数据量
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
      console.log('⚠️  数据库是空的，需要运行迁移脚本来创建表结构');
      console.log('💡 运行以下命令来初始化数据库:');
      console.log('   psql -h localhost -U admin -d todomaster -f packages/backend/database/migrations/001_initial_schema.sql');
    }

    // 检查是否有迁移记录表
    const migrationCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'schema_migrations'
      )
    `);

    if (migrationCheck.rows[0].exists) {
      const migrations = await client.query('SELECT version, description, applied_at FROM schema_migrations ORDER BY version');
      console.log('📜 已应用的迁移:');
      migrations.rows.forEach(row => {
        console.log(`   - ${row.version}: ${row.description} (${row.applied_at.toISOString().split('T')[0]})`);
      });
    }

    client.release();
    console.log('🎉 数据库连接测试完成！');

  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    console.log('\n🔧 故障排除建议:');
    console.log('1. 确认 PostgreSQL 服务已启动');
    console.log('2. 确认数据库 "todomaster" 已创建');
    console.log('3. 确认用户 "admin" 有访问权限');
    console.log('4. 检查网络连接和防火墙设置');
    console.log('\n📝 快速修复命令:');
    console.log('psql -h localhost -U admin -c "CREATE DATABASE todomaster;"');
  } finally {
    await pool.end();
  }
}

// 运行测试
testConnection(); 