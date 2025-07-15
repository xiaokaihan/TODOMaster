import { authenticatedRequest, unauthenticatedRequest, API_PREFIX, testData } from '../setup/testServer'
import { 
  createTestUser, 
  createTestAdmin, 
  clearTestData, 
  closeTestDb, 
  TestUser 
} from '../setup/testDb'

describe('用户 API 测试', () => {
  let testUser: TestUser
  let testAdmin: TestUser

  // 在每个测试前设置测试数据
  beforeEach(async () => {
    await clearTestData()
    testUser = await createTestUser()
    testAdmin = await createTestAdmin()
  })

  // 在所有测试后清理
  afterAll(async () => {
    await closeTestDb()
  })

  describe('GET /api/v1/users', () => {
    it('管理员应该能获取用户列表', async () => {
      const response = await authenticatedRequest(testAdmin)
        .get(`${API_PREFIX}/users`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(Array.isArray(response.body.data.users)).toBe(true)
      expect(response.body.data.pagination).toBeDefined()
      expect(response.body.data.pagination.page).toBe(1)
      expect(response.body.data.pagination.total).toBeGreaterThanOrEqual(2)
    })

    it('普通用户应该被拒绝访问用户列表', async () => {
      const response = await authenticatedRequest(testUser)
        .get(`${API_PREFIX}/users`)

      expect(response.status).toBe(403)
    })

    it('未认证用户应该被拒绝访问', async () => {
      const response = await unauthenticatedRequest()
        .get(`${API_PREFIX}/users`)

      expect(response.status).toBe(401)
    })

    it('应该支持分页查询', async () => {
      const response = await authenticatedRequest(testAdmin)
        .get(`${API_PREFIX}/users?page=1&limit=1`)

      expect(response.status).toBe(200)
      expect(response.body.data.users).toHaveLength(1)
      expect(response.body.data.pagination.limit).toBe(1)
    })

    it('应该支持按名称搜索', async () => {
      const response = await authenticatedRequest(testAdmin)
        .get(`${API_PREFIX}/users?search=${testUser.name}`)

      expect(response.status).toBe(200)
      expect(response.body.data.users.length).toBeGreaterThanOrEqual(1)
      expect(response.body.data.users[0].name).toContain('Test')
    })

    it('应该支持按角色筛选', async () => {
      const response = await authenticatedRequest(testAdmin)
        .get(`${API_PREFIX}/users?role=admin`)

      expect(response.status).toBe(200)
      expect(response.body.data.users.length).toBeGreaterThanOrEqual(1)
      expect(response.body.data.users.every((user: any) => user.role === 'admin')).toBe(true)
    })
  })

  describe('GET /api/v1/users/:id', () => {
    it('管理员应该能获取单个用户信息', async () => {
      const response = await authenticatedRequest(testAdmin)
        .get(`${API_PREFIX}/users/${testUser.id}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.user.id).toBe(testUser.id)
      expect(response.body.data.user.email).toBe(testUser.email)
      expect(response.body.data.user.name).toBe(testUser.name)
    })

    it('普通用户应该被拒绝访问', async () => {
      const response = await authenticatedRequest(testUser)
        .get(`${API_PREFIX}/users/${testAdmin.id}`)

      expect(response.status).toBe(403)
    })

    it('查询不存在的用户应该返回404', async () => {
      const response = await authenticatedRequest(testAdmin)
        .get(`${API_PREFIX}/users/99999999-9999-9999-9999-999999999999`)

      expect(response.status).toBe(404)
    })
  })

  describe('PUT /api/v1/users/:id', () => {
    it('管理员应该能更新用户信息', async () => {
      const updateData = {
        name: '更新后的名称',
        role: 'admin',
        isActive: false
      }

      const response = await authenticatedRequest(testAdmin)
        .put(`${API_PREFIX}/users/${testUser.id}`)
        .send(updateData)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.user.name).toBe(updateData.name)
      expect(response.body.data.user.role).toBe(updateData.role)
      expect(response.body.data.user.isActive).toBe(updateData.isActive)
    })

    it('普通用户应该被拒绝更新用户信息', async () => {
      const updateData = {
        name: '更新后的名称'
      }

      const response = await authenticatedRequest(testUser)
        .put(`${API_PREFIX}/users/${testAdmin.id}`)
        .send(updateData)

      expect(response.status).toBe(403)
    })

    it('缺少必填字段应该返回验证错误', async () => {
      const response = await authenticatedRequest(testAdmin)
        .put(`${API_PREFIX}/users/${testUser.id}`)
        .send({})

      expect(response.status).toBe(400)
    })

    it('无效的角色应该返回验证错误', async () => {
      const updateData = {
        name: '测试名称',
        role: 'invalid_role'
      }

      const response = await authenticatedRequest(testAdmin)
        .put(`${API_PREFIX}/users/${testUser.id}`)
        .send(updateData)

      expect(response.status).toBe(400)
    })

    it('更新不存在的用户应该返回404', async () => {
      const updateData = {
        name: '测试名称'
      }

      const response = await authenticatedRequest(testAdmin)
        .put(`${API_PREFIX}/users/99999999-9999-9999-9999-999999999999`)
        .send(updateData)

      expect(response.status).toBe(404)
    })
  })

  describe('DELETE /api/v1/users/:id', () => {
    it('管理员应该能删除用户', async () => {
      const response = await authenticatedRequest(testAdmin)
        .delete(`${API_PREFIX}/users/${testUser.id}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.message).toContain('删除成功')
    })

    it('普通用户应该被拒绝删除用户', async () => {
      const response = await authenticatedRequest(testUser)
        .delete(`${API_PREFIX}/users/${testAdmin.id}`)

      expect(response.status).toBe(403)
    })

    it('不能删除自己的账户', async () => {
      const response = await authenticatedRequest(testAdmin)
        .delete(`${API_PREFIX}/users/${testAdmin.id}`)

      expect(response.status).toBe(400)
    })

    it('删除不存在的用户应该返回404', async () => {
      const response = await authenticatedRequest(testAdmin)
        .delete(`${API_PREFIX}/users/99999999-9999-9999-9999-999999999999`)

      expect(response.status).toBe(404)
    })
  })

  describe('GET /api/v1/users/profile', () => {
    it('应该能获取当前用户的个人资料', async () => {
      const response = await authenticatedRequest(testUser)
        .get(`${API_PREFIX}/users/profile`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.user.id).toBe(testUser.id)
      expect(response.body.data.user.email).toBe(testUser.email)
    })

    it('未认证用户应该被拒绝访问', async () => {
      const response = await unauthenticatedRequest()
        .get(`${API_PREFIX}/users/profile`)

      expect(response.status).toBe(401)
    })
  })

  describe('PUT /api/v1/users/profile', () => {
    it('应该能更新个人资料', async () => {
      const updateData = {
        name: '更新的个人资料',
        timezone: 'Asia/Shanghai'
      }

      const response = await authenticatedRequest(testUser)
        .put(`${API_PREFIX}/users/profile`)
        .send(updateData)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.user.name).toBe(updateData.name)
    })

    it('缺少必填字段应该返回验证错误', async () => {
      const response = await authenticatedRequest(testUser)
        .put(`${API_PREFIX}/users/profile`)
        .send({})

      expect(response.status).toBe(400)
    })
  })

  describe('POST /api/v1/users/change-password', () => {
    it('应该能修改密码', async () => {
      const passwordData = {
        currentPassword: testUser.password,
        newPassword: 'newPassword123',
        confirmPassword: 'newPassword123'
      }

      const response = await authenticatedRequest(testUser)
        .post(`${API_PREFIX}/users/change-password`)
        .send(passwordData)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.message).toContain('密码修改成功')
    })

    it('当前密码错误应该返回验证错误', async () => {
      const passwordData = {
        currentPassword: 'wrongPassword',
        newPassword: 'newPassword123',
        confirmPassword: 'newPassword123'
      }

      const response = await authenticatedRequest(testUser)
        .post(`${API_PREFIX}/users/change-password`)
        .send(passwordData)

      expect(response.status).toBe(400)
    })

    it('新密码不匹配应该返回验证错误', async () => {
      const passwordData = {
        currentPassword: testUser.password,
        newPassword: 'newPassword123',
        confirmPassword: 'differentPassword'
      }

      const response = await authenticatedRequest(testUser)
        .post(`${API_PREFIX}/users/change-password`)
        .send(passwordData)

      expect(response.status).toBe(400)
    })

    it('弱密码应该返回验证错误', async () => {
      const passwordData = {
        currentPassword: testUser.password,
        newPassword: '123',
        confirmPassword: '123'
      }

      const response = await authenticatedRequest(testUser)
        .post(`${API_PREFIX}/users/change-password`)
        .send(passwordData)

      expect(response.status).toBe(400)
    })
  })
}) 