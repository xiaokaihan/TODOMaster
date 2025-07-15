import request from 'supertest'
import app from '../../app'
import { API_PREFIX } from '../setup/testServer'
import { testDbConnection, closeTestDb } from '../setup/testDb'

describe('健康检查 API 测试', () => {
  // 在所有测试后关闭数据库连接
  afterAll(async () => {
    await closeTestDb()
  })

  describe('GET /health', () => {
    it('应该返回基本健康检查信息', async () => {
      const response = await request(app).get('/health')

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('status')
      expect(response.body).toHaveProperty('timestamp')
      expect(response.body).toHaveProperty('database')
      expect(response.body).toHaveProperty('version')
      expect(response.body).toHaveProperty('environment')
    })

    it('应该包含正确的环境信息', async () => {
      const response = await request(app).get('/health')

      expect(response.status).toBe(200)
      expect(response.body.environment).toBe('test')
    })
  })

  describe(`GET ${API_PREFIX}/health`, () => {
    it('应该返回详细的健康检查信息', async () => {
      const response = await request(app).get(`${API_PREFIX}/health`)

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('status', 'ok')
      expect(response.body).toHaveProperty('timestamp')
      expect(response.body).toHaveProperty('uptime')
      expect(response.body).toHaveProperty('message')
      expect(response.body).toHaveProperty('version')
    })
  })

  describe(`GET ${API_PREFIX}/health/database`, () => {
    it('应该返回数据库连接状态', async () => {
      const response = await request(app).get(`${API_PREFIX}/health/database`)

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('status')
      expect(response.body).toHaveProperty('responseTime')
      expect(response.body).toHaveProperty('timestamp')
    })

    it('数据库连接应该是健康的', async () => {
      const isConnected = await testDbConnection()
      expect(isConnected).toBe(true)
    })
  })

  describe('GET /', () => {
    it('应该返回API根信息', async () => {
      const response = await request(app).get('/')

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('message', 'TODOMaster API Server')
      expect(response.body).toHaveProperty('status', 'running')
      expect(response.body).toHaveProperty('version')
      expect(response.body).toHaveProperty('api')
    })
  })

  describe(`GET ${API_PREFIX}`, () => {
    it('应该返回API信息和端点列表', async () => {
      const response = await request(app).get(API_PREFIX)

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('message', 'TODOMaster API')
      expect(response.body).toHaveProperty('version')
      expect(response.body).toHaveProperty('endpoints')
      expect(response.body.endpoints).toHaveProperty('users')
      expect(response.body.endpoints).toHaveProperty('objectives')
      expect(response.body.endpoints).toHaveProperty('tasks')
    })
  })
}) 