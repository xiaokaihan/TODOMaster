import { authenticatedRequest, unauthenticatedRequest, API_PREFIX } from '../setup/testServer'
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

describe('统计 API 测试', () => {
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

  describe('GET /api/v1/stats/dashboard', () => {
    it('应该能获取用户的仪表板统计数据', async () => {
      const response = await authenticatedRequest(testUser)
        .get(`${API_PREFIX}/stats/dashboard`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty('summary')
      expect(response.body.data.summary).toHaveProperty('totalObjectives')
      expect(response.body.data.summary).toHaveProperty('totalKeyResults')
      expect(response.body.data.summary).toHaveProperty('totalTasks')
      expect(response.body.data.summary).toHaveProperty('completedTasks')
      expect(response.body.data.summary).toHaveProperty('overallProgress')
    })

    it('未认证用户应该被拒绝访问', async () => {
      const response = await unauthenticatedRequest()
        .get(`${API_PREFIX}/stats/dashboard`)

      expect(response.status).toBe(401)
    })

    it('统计数据应该准确反映用户数据', async () => {
      const response = await authenticatedRequest(testUser)
        .get(`${API_PREFIX}/stats/dashboard`)

      expect(response.status).toBe(200)
      expect(response.body.data.summary.totalObjectives).toBeGreaterThanOrEqual(1)
      expect(response.body.data.summary.totalKeyResults).toBeGreaterThanOrEqual(1)
      expect(response.body.data.summary.totalTasks).toBeGreaterThanOrEqual(1)
    })
  })

  describe('GET /api/v1/stats/objectives', () => {
    it('应该能获取目标统计数据', async () => {
      const response = await authenticatedRequest(testUser)
        .get(`${API_PREFIX}/stats/objectives`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty('summary')
      expect(response.body.data).toHaveProperty('statusDistribution')
      expect(response.body.data).toHaveProperty('categoryDistribution')
      expect(response.body.data).toHaveProperty('progressDistribution')
    })

    it('应该支持按时间范围筛选', async () => {
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() // 30天前
      const endDate = new Date().toISOString()

      const response = await authenticatedRequest(testUser)
        .get(`${API_PREFIX}/stats/objectives?startDate=${startDate}&endDate=${endDate}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
    })

    it('未认证用户应该被拒绝访问', async () => {
      const response = await unauthenticatedRequest()
        .get(`${API_PREFIX}/stats/objectives`)

      expect(response.status).toBe(401)
    })
  })

  describe('GET /api/v1/stats/tasks', () => {
    it('应该能获取任务统计数据', async () => {
      const response = await authenticatedRequest(testUser)
        .get(`${API_PREFIX}/stats/tasks`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty('summary')
      expect(response.body.data).toHaveProperty('statusDistribution')
      expect(response.body.data).toHaveProperty('priorityDistribution')
      expect(response.body.data).toHaveProperty('completionTrend')
    })

    it('应该支持按优先级筛选', async () => {
      const response = await authenticatedRequest(testUser)
        .get(`${API_PREFIX}/stats/tasks?priority=high`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
    })

    it('应该支持按状态筛选', async () => {
      const response = await authenticatedRequest(testUser)
        .get(`${API_PREFIX}/stats/tasks?status=pending`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
    })

    it('未认证用户应该被拒绝访问', async () => {
      const response = await unauthenticatedRequest()
        .get(`${API_PREFIX}/stats/tasks`)

      expect(response.status).toBe(401)
    })
  })

  describe('GET /api/v1/stats/productivity', () => {
    it('应该能获取生产力统计数据', async () => {
      const response = await authenticatedRequest(testUser)
        .get(`${API_PREFIX}/stats/productivity`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty('timeStats')
      expect(response.body.data).toHaveProperty('completionRate')
      expect(response.body.data).toHaveProperty('efficiencyMetrics')
      expect(response.body.data).toHaveProperty('trends')
    })

    it('应该支持按时间周期筛选', async () => {
      const response = await authenticatedRequest(testUser)
        .get(`${API_PREFIX}/stats/productivity?period=week`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
    })

    it('未认证用户应该被拒绝访问', async () => {
      const response = await unauthenticatedRequest()
        .get(`${API_PREFIX}/stats/productivity`)

      expect(response.status).toBe(401)
    })
  })

  describe('GET /api/v1/stats/time-tracking', () => {
    it('应该能获取时间跟踪统计数据', async () => {
      const response = await authenticatedRequest(testUser)
        .get(`${API_PREFIX}/stats/time-tracking`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty('totalHours')
      expect(response.body.data).toHaveProperty('estimatedVsActual')
      expect(response.body.data).toHaveProperty('dailyBreakdown')
      expect(response.body.data).toHaveProperty('taskBreakdown')
    })

    it('应该支持按日期范围筛选', async () => {
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 7天前
      const endDate = new Date().toISOString()

      const response = await authenticatedRequest(testUser)
        .get(`${API_PREFIX}/stats/time-tracking?startDate=${startDate}&endDate=${endDate}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
    })

    it('未认证用户应该被拒绝访问', async () => {
      const response = await unauthenticatedRequest()
        .get(`${API_PREFIX}/stats/time-tracking`)

      expect(response.status).toBe(401)
    })
  })

  describe('GET /api/v1/stats/progress-trends', () => {
    it('应该能获取进度趋势数据', async () => {
      const response = await authenticatedRequest(testUser)
        .get(`${API_PREFIX}/stats/progress-trends`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty('objectiveProgress')
      expect(response.body.data).toHaveProperty('keyResultProgress')
      expect(response.body.data).toHaveProperty('taskCompletion')
      expect(response.body.data).toHaveProperty('timeline')
    })

    it('应该支持指定时间粒度', async () => {
      const response = await authenticatedRequest(testUser)
        .get(`${API_PREFIX}/stats/progress-trends?granularity=daily`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
    })

    it('未认证用户应该被拒绝访问', async () => {
      const response = await unauthenticatedRequest()
        .get(`${API_PREFIX}/stats/progress-trends`)

      expect(response.status).toBe(401)
    })
  })

  describe('管理员统计接口', () => {
    describe('GET /api/v1/stats/admin/overview', () => {
      it('管理员应该能获取系统概览统计', async () => {
        const response = await authenticatedRequest(testAdmin)
          .get(`${API_PREFIX}/stats/admin/overview`)

        expect(response.status).toBe(200)
        expect(response.body.success).toBe(true)
        expect(response.body.data).toHaveProperty('userStats')
        expect(response.body.data).toHaveProperty('contentStats')
        expect(response.body.data).toHaveProperty('activityStats')
        expect(response.body.data).toHaveProperty('systemHealth')
      })

      it('普通用户应该被拒绝访问', async () => {
        const response = await authenticatedRequest(testUser)
          .get(`${API_PREFIX}/stats/admin/overview`)

        expect(response.status).toBe(403)
      })

      it('未认证用户应该被拒绝访问', async () => {
        const response = await unauthenticatedRequest()
          .get(`${API_PREFIX}/stats/admin/overview`)

        expect(response.status).toBe(401)
      })
    })

    describe('GET /api/v1/stats/admin/users', () => {
      it('管理员应该能获取用户统计数据', async () => {
        const response = await authenticatedRequest(testAdmin)
          .get(`${API_PREFIX}/stats/admin/users`)

        expect(response.status).toBe(200)
        expect(response.body.success).toBe(true)
        expect(response.body.data).toHaveProperty('totalUsers')
        expect(response.body.data).toHaveProperty('activeUsers')
        expect(response.body.data).toHaveProperty('userGrowth')
        expect(response.body.data).toHaveProperty('engagementMetrics')
      })

      it('普通用户应该被拒绝访问', async () => {
        const response = await authenticatedRequest(testUser)
          .get(`${API_PREFIX}/stats/admin/users`)

        expect(response.status).toBe(403)
      })
    })

    describe('GET /api/v1/stats/admin/performance', () => {
      it('管理员应该能获取性能统计数据', async () => {
        const response = await authenticatedRequest(testAdmin)
          .get(`${API_PREFIX}/stats/admin/performance`)

        expect(response.status).toBe(200)
        expect(response.body.success).toBe(true)
        expect(response.body.data).toHaveProperty('responseTime')
        expect(response.body.data).toHaveProperty('throughput')
        expect(response.body.data).toHaveProperty('errorRate')
        expect(response.body.data).toHaveProperty('resourceUsage')
      })

      it('普通用户应该被拒绝访问', async () => {
        const response = await authenticatedRequest(testUser)
          .get(`${API_PREFIX}/stats/admin/performance`)

        expect(response.status).toBe(403)
      })
    })
  })

  describe('导出功能', () => {
    describe('GET /api/v1/stats/export', () => {
      it('应该能导出用户的统计数据', async () => {
        const response = await authenticatedRequest(testUser)
          .get(`${API_PREFIX}/stats/export?format=json`)

        expect(response.status).toBe(200)
        expect(response.body.success).toBe(true)
        expect(response.body.data).toHaveProperty('exportData')
        expect(response.body.data).toHaveProperty('exportDate')
      })

      it('应该支持CSV格式导出', async () => {
        const response = await authenticatedRequest(testUser)
          .get(`${API_PREFIX}/stats/export?format=csv`)

        expect(response.status).toBe(200)
      })

      it('未认证用户应该被拒绝访问', async () => {
        const response = await unauthenticatedRequest()
          .get(`${API_PREFIX}/stats/export`)

        expect(response.status).toBe(401)
      })
    })
  })
}) 