import { authenticatedRequest, unauthenticatedRequest, API_PREFIX, testData } from '../setup/testServer'
import { 
  createTestUser, 
  createTestAdmin, 
  createTestObjective,
  createTestKeyResult,
  createTestTask,
  clearTestData, 
  closeTestDb, 
  TestUser 
} from '../setup/testDb'

describe('任务 API 测试', () => {
  let testUser: TestUser
  let testAdmin: TestUser
  let testObjective: any
  let testKeyResult: any
  let testTask: any

  // 在每个测试前设置测试数据
  beforeEach(async () => {
    await clearTestData()
    testUser = await createTestUser()
    testAdmin = await createTestAdmin()
    testObjective = await createTestObjective(testUser.id)
    testKeyResult = await createTestKeyResult(testObjective.id)
    testTask = await createTestTask(testUser.id, testObjective.id, testKeyResult.id)
  })

  // 在所有测试后清理
  afterAll(async () => {
    await closeTestDb()
  })

  describe('GET /api/v1/tasks', () => {
    it('应该能获取用户的任务列表', async () => {
      const response = await authenticatedRequest(testUser)
        .get(`${API_PREFIX}/tasks`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(Array.isArray(response.body.data.tasks)).toBe(true)
      expect(response.body.data.pagination).toBeDefined()
      expect(response.body.data.tasks.length).toBeGreaterThanOrEqual(1)
    })

    it('未认证用户应该被拒绝访问', async () => {
      const response = await unauthenticatedRequest()
        .get(`${API_PREFIX}/tasks`)

      expect(response.status).toBe(401)
    })

    it('应该支持分页查询', async () => {
      const response = await authenticatedRequest(testUser)
        .get(`${API_PREFIX}/tasks?page=1&limit=1`)

      expect(response.status).toBe(200)
      expect(response.body.data.tasks).toHaveLength(1)
      expect(response.body.data.pagination.limit).toBe(1)
    })

    it('应该支持按状态筛选', async () => {
      const response = await authenticatedRequest(testUser)
        .get(`${API_PREFIX}/tasks?status=pending`)

      expect(response.status).toBe(200)
      expect(response.body.data.tasks.every((task: any) => task.status === 'pending')).toBe(true)
    })

    it('应该支持按优先级筛选', async () => {
      const response = await authenticatedRequest(testUser)
        .get(`${API_PREFIX}/tasks?priority=medium`)

      expect(response.status).toBe(200)
      expect(response.body.data.tasks.every((task: any) => task.priority === 'medium')).toBe(true)
    })

    it('应该支持按目标筛选', async () => {
      const response = await authenticatedRequest(testUser)
        .get(`${API_PREFIX}/tasks?objectiveId=${testObjective.id}`)

      expect(response.status).toBe(200)
      expect(response.body.data.tasks.every((task: any) => task.objectiveId === testObjective.id)).toBe(true)
    })

    it('应该支持搜索', async () => {
      const response = await authenticatedRequest(testUser)
        .get(`${API_PREFIX}/tasks?search=测试`)

      expect(response.status).toBe(200)
      expect(response.body.data.tasks.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('GET /api/v1/tasks/:id', () => {
    it('应该能获取单个任务详情', async () => {
      const response = await authenticatedRequest(testUser)
        .get(`${API_PREFIX}/tasks/${testTask.id}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.task.id).toBe(testTask.id)
      expect(response.body.data.task.title).toBe(testTask.title)
      expect(response.body.data.task.description).toBe(testTask.description)
      expect(response.body.data.task.objectiveId).toBe(testObjective.id)
      expect(response.body.data.task.keyResultId).toBe(testKeyResult.id)
    })

    it('不能访问其他用户的任务', async () => {
      const otherObjective = await createTestObjective(testAdmin.id, '其他用户的目标')
      const otherTask = await createTestTask(testAdmin.id, otherObjective.id, undefined, '其他用户的任务')
      
      const response = await authenticatedRequest(testUser)
        .get(`${API_PREFIX}/tasks/${otherTask.id}`)

      expect(response.status).toBe(404)
    })

    it('查询不存在的任务应该返回404', async () => {
      const response = await authenticatedRequest(testUser)
        .get(`${API_PREFIX}/tasks/99999999-9999-9999-9999-999999999999`)

      expect(response.status).toBe(404)
    })
  })

  describe('POST /api/v1/tasks', () => {
    it('应该能创建新任务', async () => {
      const newTask = {
        title: '新的任务',
        description: '这是一个新任务的描述',
        priority: 'high',
        objectiveId: testObjective.id,
        keyResultId: testKeyResult.id,
        estimatedHours: 5,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7天后
      }

      const response = await authenticatedRequest(testUser)
        .post(`${API_PREFIX}/tasks`)
        .send(newTask)

      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
      expect(response.body.data.task.title).toBe(newTask.title)
      expect(response.body.data.task.description).toBe(newTask.description)
      expect(response.body.data.task.priority).toBe(newTask.priority)
      expect(response.body.data.task.status).toBe('pending')
      expect(response.body.data.task.objectiveId).toBe(newTask.objectiveId)
      expect(response.body.data.task.keyResultId).toBe(newTask.keyResultId)
    })

    it('应该能创建不关联关键结果的任务', async () => {
      const newTask = {
        title: '独立任务',
        description: '不关联关键结果的任务',
        priority: 'low',
        objectiveId: testObjective.id
      }

      const response = await authenticatedRequest(testUser)
        .post(`${API_PREFIX}/tasks`)
        .send(newTask)

      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
      expect(response.body.data.task.title).toBe(newTask.title)
      expect(response.body.data.task.keyResultId).toBeNull()
    })

    it('缺少必填字段应该返回验证错误', async () => {
      const response = await authenticatedRequest(testUser)
        .post(`${API_PREFIX}/tasks`)
        .send({})

      expect(response.status).toBe(400)
    })

    it('无效的优先级应该返回验证错误', async () => {
      const newTask = {
        title: '测试任务',
        description: '测试描述',
        priority: 'invalid_priority',
        objectiveId: testObjective.id
      }

      const response = await authenticatedRequest(testUser)
        .post(`${API_PREFIX}/tasks`)
        .send(newTask)

      expect(response.status).toBe(400)
    })

    it('不能为其他用户的目标创建任务', async () => {
      const otherObjective = await createTestObjective(testAdmin.id, '其他用户的目标')
      
      const newTask = {
        title: '非法任务',
        description: '尝试为其他用户目标创建任务',
        priority: 'medium',
        objectiveId: otherObjective.id
      }

      const response = await authenticatedRequest(testUser)
        .post(`${API_PREFIX}/tasks`)
        .send(newTask)

      expect(response.status).toBe(400)
    })
  })

  describe('PUT /api/v1/tasks/:id', () => {
    it('应该能更新自己的任务', async () => {
      const updateData = {
        title: '更新后的任务',
        description: '更新后的描述',
        priority: 'high',
        status: 'in_progress',
        actualHours: 3
      }

      const response = await authenticatedRequest(testUser)
        .put(`${API_PREFIX}/tasks/${testTask.id}`)
        .send(updateData)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.task.title).toBe(updateData.title)
      expect(response.body.data.task.description).toBe(updateData.description)
      expect(response.body.data.task.priority).toBe(updateData.priority)
      expect(response.body.data.task.status).toBe(updateData.status)
    })

    it('不能更新其他用户的任务', async () => {
      const otherObjective = await createTestObjective(testAdmin.id, '其他用户的目标')
      const otherTask = await createTestTask(testAdmin.id, otherObjective.id, undefined, '其他用户的任务')
      
      const updateData = {
        title: '尝试更新其他用户的任务'
      }

      const response = await authenticatedRequest(testUser)
        .put(`${API_PREFIX}/tasks/${otherTask.id}`)
        .send(updateData)

      expect(response.status).toBe(404)
    })

    it('更新不存在的任务应该返回404', async () => {
      const updateData = {
        title: '测试标题'
      }

      const response = await authenticatedRequest(testUser)
        .put(`${API_PREFIX}/tasks/99999999-9999-9999-9999-999999999999`)
        .send(updateData)

      expect(response.status).toBe(404)
    })
  })

  describe('DELETE /api/v1/tasks/:id', () => {
    it('应该能删除自己的任务', async () => {
      const response = await authenticatedRequest(testUser)
        .delete(`${API_PREFIX}/tasks/${testTask.id}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.message).toContain('删除成功')
    })

    it('不能删除其他用户的任务', async () => {
      const otherObjective = await createTestObjective(testAdmin.id, '其他用户的目标')
      const otherTask = await createTestTask(testAdmin.id, otherObjective.id, undefined, '其他用户的任务')
      
      const response = await authenticatedRequest(testUser)
        .delete(`${API_PREFIX}/tasks/${otherTask.id}`)

      expect(response.status).toBe(404)
    })

    it('删除不存在的任务应该返回404', async () => {
      const response = await authenticatedRequest(testUser)
        .delete(`${API_PREFIX}/tasks/99999999-9999-9999-9999-999999999999`)

      expect(response.status).toBe(404)
    })
  })

  describe('POST /api/v1/tasks/:id/complete', () => {
    it('应该能完成任务', async () => {
      const response = await authenticatedRequest(testUser)
        .post(`${API_PREFIX}/tasks/${testTask.id}/complete`)
        .send({ actualHours: 4 })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.task.status).toBe('completed')
      expect(response.body.data.task.completedAt).toBeDefined()
      expect(response.body.data.task.actualHours).toBe(4)
    })

    it('不能完成其他用户的任务', async () => {
      const otherObjective = await createTestObjective(testAdmin.id, '其他用户的目标')
      const otherTask = await createTestTask(testAdmin.id, otherObjective.id, undefined, '其他用户的任务')
      
      const response = await authenticatedRequest(testUser)
        .post(`${API_PREFIX}/tasks/${otherTask.id}/complete`)

      expect(response.status).toBe(404)
    })
  })

  describe('POST /api/v1/tasks/:id/reopen', () => {
    it('应该能重新打开已完成的任务', async () => {
      // 先完成任务
      await authenticatedRequest(testUser)
        .post(`${API_PREFIX}/tasks/${testTask.id}/complete`)
        .send({ actualHours: 3 })

      // 然后重新打开
      const response = await authenticatedRequest(testUser)
        .post(`${API_PREFIX}/tasks/${testTask.id}/reopen`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.task.status).toBe('pending')
      expect(response.body.data.task.completedAt).toBeNull()
    })

    it('不能重新打开其他用户的任务', async () => {
      const otherObjective = await createTestObjective(testAdmin.id, '其他用户的目标')
      const otherTask = await createTestTask(testAdmin.id, otherObjective.id, undefined, '其他用户的任务')
      
      const response = await authenticatedRequest(testUser)
        .post(`${API_PREFIX}/tasks/${otherTask.id}/reopen`)

      expect(response.status).toBe(404)
    })
  })

  describe('POST /api/v1/tasks/:id/update-progress', () => {
    it('应该能更新任务进度', async () => {
      const progressData = {
        actualHours: 2.5,
        notes: '任务进展顺利'
      }

      const response = await authenticatedRequest(testUser)
        .post(`${API_PREFIX}/tasks/${testTask.id}/update-progress`)
        .send(progressData)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.task.actualHours).toBe(progressData.actualHours)
    })

    it('不能更新其他用户任务的进度', async () => {
      const otherObjective = await createTestObjective(testAdmin.id, '其他用户的目标')
      const otherTask = await createTestTask(testAdmin.id, otherObjective.id, undefined, '其他用户的任务')
      
      const progressData = {
        actualHours: 1
      }

      const response = await authenticatedRequest(testUser)
        .post(`${API_PREFIX}/tasks/${otherTask.id}/update-progress`)
        .send(progressData)

      expect(response.status).toBe(404)
    })
  })
}) 