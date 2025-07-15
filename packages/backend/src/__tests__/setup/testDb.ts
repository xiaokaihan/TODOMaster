import { Pool } from 'pg'
import bcrypt from 'bcryptjs'

// 测试数据库连接池
const testPool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'todomaster_test',
  user: process.env.DB_USERNAME || 'admin',
  password: process.env.DB_PASSWORD || '123456',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  max: 5,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 5000,
})

// 测试用户数据
export interface TestUser {
  id: string
  email: string
  name: string
  role: string
  password: string
}

// 创建测试用户
export const createTestUser = async (
  email: string = 'test@example.com',
  name: string = 'Test User',
  role: string = 'user',
  password: string = 'password123'
): Promise<TestUser> => {
  const hashedPassword = await bcrypt.hash(password, 4)
  
  const result = await testPool.query(
    `INSERT INTO users (email, name, role, password_hash, is_active)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, email, name, role`,
    [email, name, role, hashedPassword, true]
  )
  
  return {
    ...result.rows[0],
    password
  }
}

// 创建管理员测试用户
export const createTestAdmin = async (): Promise<TestUser> => {
  return createTestUser('admin@example.com', 'Test Admin', 'admin', 'admin123')
}

// 创建测试目标
export const createTestObjective = async (userId: string, title: string = '测试目标') => {
  const result = await testPool.query(
    `INSERT INTO objectives (title, description, category, status, start_date, end_date, user_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      title,
      '这是一个测试目标',
      'work',
      'active',
      new Date(),
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30天后
      userId
    ]
  )
  
  return result.rows[0]
}

// 创建测试关键结果
export const createTestKeyResult = async (objectiveId: string, title: string = '测试关键结果') => {
  const result = await testPool.query(
    `INSERT INTO key_results (title, description, type, target_value, current_value, unit, objective_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      title,
      '这是一个测试关键结果',
      'number',
      100,
      0,
      '个',
      objectiveId
    ]
  )
  
  return result.rows[0]
}

// 创建测试任务
export const createTestTask = async (
  userId: string,
  objectiveId: string,
  keyResultId?: string,
  title: string = '测试任务'
) => {
  const result = await testPool.query(
    `INSERT INTO tasks (title, description, status, priority, user_id, objective_id, key_result_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      title,
      '这是一个测试任务',
      'pending',
      'medium',
      userId,
      objectiveId,
      keyResultId || null
    ]
  )
  
  return result.rows[0]
}

// 清理所有测试数据
export const clearTestData = async () => {
  const tables = [
    'task_dependencies',
    'tasks',
    'key_results',
    'objectives',
    'user_sessions',
    'users'
  ]
  
  for (const table of tables) {
    await testPool.query(`TRUNCATE ${table} CASCADE`)
  }
}

// 清理特定表的数据
export const clearTable = async (tableName: string) => {
  await testPool.query(`TRUNCATE ${tableName} CASCADE`)
}

// 获取测试数据库连接
export const getTestPool = () => testPool

// 关闭测试数据库连接
export const closeTestDb = async () => {
  await testPool.end()
}

// 检查测试数据库连接
export const testDbConnection = async (): Promise<boolean> => {
  try {
    const client = await testPool.connect()
    await client.query('SELECT 1')
    client.release()
    return true
  } catch (error) {
    console.error('测试数据库连接失败:', error)
    return false
  }
} 