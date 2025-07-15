import dotenv from 'dotenv'

// 加载测试环境变量
dotenv.config({ path: '.env.test' })

// 设置测试超时时间
jest.setTimeout(10000)

// 全局测试设置
beforeAll(async () => {
  // 设置测试环境变量
  process.env.NODE_ENV = 'test'
})

// 全局测试清理
afterAll(async () => {
  // 清理操作
}) 