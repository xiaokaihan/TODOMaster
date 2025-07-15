import { authenticatedRequest, unauthenticatedRequest, API_PREFIX, testData } from '../setup/testServer'
import { 
  createTestUser, 
  createTestAdmin, 
  createTestObjective,
  createTestKeyResult,
  clearTestData, 
  closeTestDb, 
  TestUser 
} from '../setup/testDb'

describe('关键结果 API 测试', () => {
  let testUser: TestUser
  let testAdmin: TestUser
  let testObjective: any
  let testKeyResult: any

  // 在每个测试前设置测试数据
  beforeEach(async () => {
    await clearTestData()
    testUser = await createTestUser()
    testAdmin = await createTestAdmin()
    testObjective = await createTestObjective(testUser.id)
    testKeyResult = await createTestKeyResult(testObjective.id)
  })

  // 在所有测试后清理
  afterAll(async () => {
    await closeTestDb()
  })

  describe('GET /api/v1/key-results', () => {
    it('应该能获取用户的关键结果列表', async () => {
      const response = await authenticatedRequest(testUser)
        .get(`${API_PREFIX}/key-results`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(Array.isArray(response.body.data.keyResults)).toBe(true)
      expect(response.body.data.pagination).toBeDefined()
      expect(response.body.data.keyResults.length).toBeGreaterThanOrEqual(1)
    })

    it('未认证用户应该被拒绝访问', async () => {
      const response = await unauthenticatedRequest()
        .get(`${API_PREFIX}/key-results`)

      expect(response.status).toBe(401)
    })

    it('应该支持分页查询', async () => {
      const response = await authenticatedRequest(testUser)
        .get(`${API_PREFIX}/key-results?page=1&limit=1`)

      expect(response.status).toBe(200)
      expect(response.body.data.keyResults).toHaveLength(1)
      expect(response.body.data.pagination.limit).toBe(1)
    })

    it('应该支持按目标筛选', async () => {
      const response = await authenticatedRequest(testUser)
        .get(`${API_PREFIX}/key-results?objectiveId=${testObjective.id}`)

      expect(response.status).toBe(200)
      expect(response.body.data.keyResults.every((kr: any) => kr.objectiveId === testObjective.id)).toBe(true)
    })

    it('应该支持按状态筛选', async () => {
      const response = await authenticatedRequest(testUser)
        .get(`${API_PREFIX}/key-results?status=active`)

      expect(response.status).toBe(200)
      expect(response.body.data.keyResults.every((kr: any) => kr.status === 'active')).toBe(true)
    })

    it('应该支持搜索', async () => {
      const response = await authenticatedRequest(testUser)
        .get(`${API_PREFIX}/key-results?search=测试`)

      expect(response.status).toBe(200)
      expect(response.body.data.keyResults.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('GET /api/v1/key-results/:id', () => {
    it('应该能获取单个关键结果详情', async () => {
      const response = await authenticatedRequest(testUser)
        .get(`${API_PREFIX}/key-results/${testKeyResult.id}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.keyResult.id).toBe(testKeyResult.id)
      expect(response.body.data.keyResult.title).toBe(testKeyResult.title)
      expect(response.body.data.keyResult.description).toBe(testKeyResult.description)
      expect(response.body.data.keyResult.objectiveId).toBe(testObjective.id)
    })

    it('不能访问其他用户的关键结果', async () => {
      const otherObjective = await createTestObjective(testAdmin.id, '其他用户的目标')
      const otherKeyResult = await createTestKeyResult(otherObjective.id, '其他用户的关键结果')
      
      const response = await authenticatedRequest(testUser)
        .get(`${API_PREFIX}/key-results/${otherKeyResult.id}`)

      expect(response.status).toBe(404)
    })

    it('查询不存在的关键结果应该返回404', async () => {
      const response = await authenticatedRequest(testUser)
        .get(`${API_PREFIX}/key-results/99999999-9999-9999-9999-999999999999`)

      expect(response.status).toBe(404)
    })
  })

  describe('POST /api/v1/key-results', () => {
    it('应该能创建新的关键结果', async () => {
      const newKeyResult = {
        title: '新的关键结果',
        description: '这是一个新关键结果的描述',
        type: 'number',
        targetValue: 200,
        currentValue: 0,
        unit: '次',
        objectiveId: testObjective.id
      }

      const response = await authenticatedRequest(testUser)
        .post(`${API_PREFIX}/key-results`)
        .send(newKeyResult)

      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
      expect(response.body.data.keyResult.title).toBe(newKeyResult.title)
      expect(response.body.data.keyResult.description).toBe(newKeyResult.description)
      expect(response.body.data.keyResult.type).toBe(newKeyResult.type)
      expect(response.body.data.keyResult.targetValue).toBe(newKeyResult.targetValue)
      expect(response.body.data.keyResult.currentValue).toBe(newKeyResult.currentValue)
      expect(response.body.data.keyResult.unit).toBe(newKeyResult.unit)
      expect(response.body.data.keyResult.objectiveId).toBe(newKeyResult.objectiveId)
    })

    it('应该能创建百分比类型的关键结果', async () => {
      const newKeyResult = {
        title: '完成率指标',
        description: '项目完成百分比',
        type: 'percentage',
        targetValue: 100,
        currentValue: 0,
        unit: '%',
        objectiveId: testObjective.id
      }

      const response = await authenticatedRequest(testUser)
        .post(`${API_PREFIX}/key-results`)
        .send(newKeyResult)

      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
      expect(response.body.data.keyResult.type).toBe('percentage')
    })

    it('缺少必填字段应该返回验证错误', async () => {
      const response = await authenticatedRequest(testUser)
        .post(`${API_PREFIX}/key-results`)
        .send({})

      expect(response.status).toBe(400)
    })

    it('无效的类型应该返回验证错误', async () => {
      const newKeyResult = {
        title: '测试关键结果',
        description: '测试描述',
        type: 'invalid_type',
        targetValue: 100,
        objectiveId: testObjective.id
      }

      const response = await authenticatedRequest(testUser)
        .post(`${API_PREFIX}/key-results`)
        .send(newKeyResult)

      expect(response.status).toBe(400)
    })

    it('不能为其他用户的目标创建关键结果', async () => {
      const otherObjective = await createTestObjective(testAdmin.id, '其他用户的目标')
      
      const newKeyResult = {
        title: '非法关键结果',
        description: '尝试为其他用户目标创建关键结果',
        type: 'number',
        targetValue: 100,
        objectiveId: otherObjective.id
      }

      const response = await authenticatedRequest(testUser)
        .post(`${API_PREFIX}/key-results`)
        .send(newKeyResult)

      expect(response.status).toBe(400)
    })
  })

  describe('PUT /api/v1/key-results/:id', () => {
    it('应该能更新自己的关键结果', async () => {
      const updateData = {
        title: '更新后的关键结果',
        description: '更新后的描述',
        targetValue: 150,
        currentValue: 50,
        unit: '件'
      }

      const response = await authenticatedRequest(testUser)
        .put(`${API_PREFIX}/key-results/${testKeyResult.id}`)
        .send(updateData)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.keyResult.title).toBe(updateData.title)
      expect(response.body.data.keyResult.description).toBe(updateData.description)
      expect(response.body.data.keyResult.targetValue).toBe(updateData.targetValue)
      expect(response.body.data.keyResult.currentValue).toBe(updateData.currentValue)
      expect(response.body.data.keyResult.unit).toBe(updateData.unit)
    })

    it('不能更新其他用户的关键结果', async () => {
      const otherObjective = await createTestObjective(testAdmin.id, '其他用户的目标')
      const otherKeyResult = await createTestKeyResult(otherObjective.id, '其他用户的关键结果')
      
      const updateData = {
        title: '尝试更新其他用户的关键结果'
      }

      const response = await authenticatedRequest(testUser)
        .put(`${API_PREFIX}/key-results/${otherKeyResult.id}`)
        .send(updateData)

      expect(response.status).toBe(404)
    })

    it('更新不存在的关键结果应该返回404', async () => {
      const updateData = {
        title: '测试标题'
      }

      const response = await authenticatedRequest(testUser)
        .put(`${API_PREFIX}/key-results/99999999-9999-9999-9999-999999999999`)
        .send(updateData)

      expect(response.status).toBe(404)
    })
  })

  describe('DELETE /api/v1/key-results/:id', () => {
    it('应该能删除自己的关键结果', async () => {
      const response = await authenticatedRequest(testUser)
        .delete(`${API_PREFIX}/key-results/${testKeyResult.id}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.message).toContain('删除成功')
    })

    it('不能删除其他用户的关键结果', async () => {
      const otherObjective = await createTestObjective(testAdmin.id, '其他用户的目标')
      const otherKeyResult = await createTestKeyResult(otherObjective.id, '其他用户的关键结果')
      
      const response = await authenticatedRequest(testUser)
        .delete(`${API_PREFIX}/key-results/${otherKeyResult.id}`)

      expect(response.status).toBe(404)
    })

    it('删除不存在的关键结果应该返回404', async () => {
      const response = await authenticatedRequest(testUser)
        .delete(`${API_PREFIX}/key-results/99999999-9999-9999-9999-999999999999`)

      expect(response.status).toBe(404)
    })
  })

  describe('POST /api/v1/key-results/:id/update-progress', () => {
    it('应该能更新关键结果的进度', async () => {
      const progressData = {
        currentValue: 75,
        notes: '进展良好'
      }

      const response = await authenticatedRequest(testUser)
        .post(`${API_PREFIX}/key-results/${testKeyResult.id}/update-progress`)
        .send(progressData)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.keyResult.currentValue).toBe(progressData.currentValue)
      expect(response.body.data.keyResult.progress).toBe(75) // 75/100 = 75%
    })

    it('进度超过目标值应该自动限制为100%', async () => {
      const progressData = {
        currentValue: 150 // 超过目标值100
      }

      const response = await authenticatedRequest(testUser)
        .post(`${API_PREFIX}/key-results/${testKeyResult.id}/update-progress`)
        .send(progressData)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.keyResult.progress).toBe(100)
    })

    it('不能更新其他用户关键结果的进度', async () => {
      const otherObjective = await createTestObjective(testAdmin.id, '其他用户的目标')
      const otherKeyResult = await createTestKeyResult(otherObjective.id, '其他用户的关键结果')
      
      const progressData = {
        currentValue: 50
      }

      const response = await authenticatedRequest(testUser)
        .post(`${API_PREFIX}/key-results/${otherKeyResult.id}/update-progress`)
        .send(progressData)

      expect(response.status).toBe(404)
    })
  })

  describe('POST /api/v1/key-results/:id/complete', () => {
    it('应该能完成关键结果', async () => {
      const response = await authenticatedRequest(testUser)
        .post(`${API_PREFIX}/key-results/${testKeyResult.id}/complete`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.keyResult.status).toBe('completed')
      expect(response.body.data.keyResult.progress).toBe(100)
      expect(response.body.data.keyResult.currentValue).toBe(testKeyResult.target_value)
    })

    it('不能完成其他用户的关键结果', async () => {
      const otherObjective = await createTestObjective(testAdmin.id, '其他用户的目标')
      const otherKeyResult = await createTestKeyResult(otherObjective.id, '其他用户的关键结果')
      
      const response = await authenticatedRequest(testUser)
        .post(`${API_PREFIX}/key-results/${otherKeyResult.id}/complete`)

      expect(response.status).toBe(404)
    })
  })

  describe('POST /api/v1/key-results/:id/reopen', () => {
    it('应该能重新打开已完成的关键结果', async () => {
      // 先完成关键结果
      await authenticatedRequest(testUser)
        .post(`${API_PREFIX}/key-results/${testKeyResult.id}/complete`)

      // 然后重新打开
      const response = await authenticatedRequest(testUser)
        .post(`${API_PREFIX}/key-results/${testKeyResult.id}/reopen`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.keyResult.status).toBe('active')
    })

    it('不能重新打开其他用户的关键结果', async () => {
      const otherObjective = await createTestObjective(testAdmin.id, '其他用户的目标')
      const otherKeyResult = await createTestKeyResult(otherObjective.id, '其他用户的关键结果')
      
      const response = await authenticatedRequest(testUser)
        .post(`${API_PREFIX}/key-results/${otherKeyResult.id}/reopen`)

      expect(response.status).toBe(404)
    })
  })
}) 