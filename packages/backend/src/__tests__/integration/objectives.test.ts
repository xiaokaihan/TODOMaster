import { authenticatedRequest, unauthenticatedRequest, API_PREFIX, testData } from '../setup/testServer'
import { 
  createTestUser, 
  createTestAdmin, 
  createTestObjective,
  clearTestData, 
  closeTestDb, 
  TestUser 
} from '../setup/testDb'

describe('目标 API 测试', () => {
  let testUser: TestUser
  let testAdmin: TestUser
  let testObjective: any

  // 在每个测试前设置测试数据
  beforeEach(async () => {
    await clearTestData()
    testUser = await createTestUser()
    testAdmin = await createTestAdmin()
    testObjective = await createTestObjective(testUser.id)
  })

  // 在所有测试后清理
  afterAll(async () => {
    await closeTestDb()
  })

  describe('GET /api/v1/objectives', () => {
    it('应该能获取用户的目标列表', async () => {
      const response = await authenticatedRequest(testUser)
        .get(`${API_PREFIX}/objectives`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(Array.isArray(response.body.data.objectives)).toBe(true)
      expect(response.body.data.pagination).toBeDefined()
      expect(response.body.data.objectives.length).toBeGreaterThanOrEqual(1)
    })

    it('未认证用户应该被拒绝访问', async () => {
      const response = await unauthenticatedRequest()
        .get(`${API_PREFIX}/objectives`)

      expect(response.status).toBe(401)
    })

    it('应该支持分页查询', async () => {
      const response = await authenticatedRequest(testUser)
        .get(`${API_PREFIX}/objectives?page=1&limit=1`)

      expect(response.status).toBe(200)
      expect(response.body.data.objectives).toHaveLength(1)
      expect(response.body.data.pagination.limit).toBe(1)
    })

    it('应该支持按状态筛选', async () => {
      const response = await authenticatedRequest(testUser)
        .get(`${API_PREFIX}/objectives?status=active`)

      expect(response.status).toBe(200)
      expect(response.body.data.objectives.every((obj: any) => obj.status === 'active')).toBe(true)
    })

    it('应该支持按类别筛选', async () => {
      const response = await authenticatedRequest(testUser)
        .get(`${API_PREFIX}/objectives?category=work`)

      expect(response.status).toBe(200)
      expect(response.body.data.objectives.every((obj: any) => obj.category === 'work')).toBe(true)
    })

    it('应该支持搜索', async () => {
      const response = await authenticatedRequest(testUser)
        .get(`${API_PREFIX}/objectives?search=测试`)

      expect(response.status).toBe(200)
      expect(response.body.data.objectives.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('GET /api/v1/objectives/:id', () => {
    it('应该能获取单个目标详情', async () => {
      const response = await authenticatedRequest(testUser)
        .get(`${API_PREFIX}/objectives/${testObjective.id}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.objective.id).toBe(testObjective.id)
      expect(response.body.data.objective.title).toBe(testObjective.title)
      expect(response.body.data.objective.description).toBe(testObjective.description)
    })

    it('不能访问其他用户的目标', async () => {
      const otherObjective = await createTestObjective(testAdmin.id, '其他用户的目标')
      
      const response = await authenticatedRequest(testUser)
        .get(`${API_PREFIX}/objectives/${otherObjective.id}`)

      expect(response.status).toBe(404)
    })

    it('查询不存在的目标应该返回404', async () => {
      const response = await authenticatedRequest(testUser)
        .get(`${API_PREFIX}/objectives/99999999-9999-9999-9999-999999999999`)

      expect(response.status).toBe(404)
    })
  })

  describe('POST /api/v1/objectives', () => {
    it('应该能创建新目标', async () => {
      const newObjective = {
        title: '新的目标',
        description: '这是一个新目标的描述',
        category: 'personal',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      }

      const response = await authenticatedRequest(testUser)
        .post(`${API_PREFIX}/objectives`)
        .send(newObjective)

      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
      expect(response.body.data.objective.title).toBe(newObjective.title)
      expect(response.body.data.objective.description).toBe(newObjective.description)
      expect(response.body.data.objective.category).toBe(newObjective.category)
      expect(response.body.data.objective.status).toBe('active')
    })

    it('缺少必填字段应该返回验证错误', async () => {
      const response = await authenticatedRequest(testUser)
        .post(`${API_PREFIX}/objectives`)
        .send({})

      expect(response.status).toBe(400)
    })

    it('无效的类别应该返回验证错误', async () => {
      const newObjective = {
        title: '测试目标',
        description: '测试描述',
        category: 'invalid_category',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      }

      const response = await authenticatedRequest(testUser)
        .post(`${API_PREFIX}/objectives`)
        .send(newObjective)

      expect(response.status).toBe(400)
    })

    it('结束日期早于开始日期应该返回验证错误', async () => {
      const newObjective = {
        title: '测试目标',
        description: '测试描述',
        category: 'work',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // 昨天
      }

      const response = await authenticatedRequest(testUser)
        .post(`${API_PREFIX}/objectives`)
        .send(newObjective)

      expect(response.status).toBe(400)
    })
  })

  describe('PUT /api/v1/objectives/:id', () => {
    it('应该能更新自己的目标', async () => {
      const updateData = {
        title: '更新后的目标',
        description: '更新后的描述',
        category: 'personal',
        status: 'completed'
      }

      const response = await authenticatedRequest(testUser)
        .put(`${API_PREFIX}/objectives/${testObjective.id}`)
        .send(updateData)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.objective.title).toBe(updateData.title)
      expect(response.body.data.objective.description).toBe(updateData.description)
      expect(response.body.data.objective.status).toBe(updateData.status)
    })

    it('不能更新其他用户的目标', async () => {
      const otherObjective = await createTestObjective(testAdmin.id, '其他用户的目标')
      
      const updateData = {
        title: '尝试更新其他用户的目标'
      }

      const response = await authenticatedRequest(testUser)
        .put(`${API_PREFIX}/objectives/${otherObjective.id}`)
        .send(updateData)

      expect(response.status).toBe(404)
    })

    it('更新不存在的目标应该返回404', async () => {
      const updateData = {
        title: '测试标题'
      }

      const response = await authenticatedRequest(testUser)
        .put(`${API_PREFIX}/objectives/99999999-9999-9999-9999-999999999999`)
        .send(updateData)

      expect(response.status).toBe(404)
    })
  })

  describe('DELETE /api/v1/objectives/:id', () => {
    it('应该能删除自己的目标', async () => {
      const response = await authenticatedRequest(testUser)
        .delete(`${API_PREFIX}/objectives/${testObjective.id}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.message).toContain('删除成功')
    })

    it('不能删除其他用户的目标', async () => {
      const otherObjective = await createTestObjective(testAdmin.id, '其他用户的目标')
      
      const response = await authenticatedRequest(testUser)
        .delete(`${API_PREFIX}/objectives/${otherObjective.id}`)

      expect(response.status).toBe(404)
    })

    it('删除不存在的目标应该返回404', async () => {
      const response = await authenticatedRequest(testUser)
        .delete(`${API_PREFIX}/objectives/99999999-9999-9999-9999-999999999999`)

      expect(response.status).toBe(404)
    })
  })

  describe('POST /api/v1/objectives/:id/complete', () => {
    it('应该能完成目标', async () => {
      const response = await authenticatedRequest(testUser)
        .post(`${API_PREFIX}/objectives/${testObjective.id}/complete`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.objective.status).toBe('completed')
      expect(response.body.data.objective.progress).toBe(100)
    })

    it('不能完成其他用户的目标', async () => {
      const otherObjective = await createTestObjective(testAdmin.id, '其他用户的目标')
      
      const response = await authenticatedRequest(testUser)
        .post(`${API_PREFIX}/objectives/${otherObjective.id}/complete`)

      expect(response.status).toBe(404)
    })
  })

  describe('POST /api/v1/objectives/:id/reopen', () => {
    it('应该能重新打开已完成的目标', async () => {
      // 先完成目标
      await authenticatedRequest(testUser)
        .post(`${API_PREFIX}/objectives/${testObjective.id}/complete`)

      // 然后重新打开
      const response = await authenticatedRequest(testUser)
        .post(`${API_PREFIX}/objectives/${testObjective.id}/reopen`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.objective.status).toBe('active')
    })

    it('不能重新打开其他用户的目标', async () => {
      const otherObjective = await createTestObjective(testAdmin.id, '其他用户的目标')
      
      const response = await authenticatedRequest(testUser)
        .post(`${API_PREFIX}/objectives/${otherObjective.id}/reopen`)

      expect(response.status).toBe(404)
    })
  })
}) 