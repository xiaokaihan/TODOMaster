# TODOMaster 后端 API 测试

这个目录包含了 TODOMaster 后端 API 的完整测试套件。

## 📁 目录结构

```
src/__tests__/
├── setup/                    # 测试设置和辅助函数
│   ├── jest.setup.ts        # Jest 全局设置
│   ├── testDb.ts            # 测试数据库辅助函数
│   └── testServer.ts        # 测试服务器配置
├── integration/             # 集成测试
│   ├── health.test.ts       # 健康检查接口测试
│   ├── users.test.ts        # 用户接口测试
│   ├── objectives.test.ts   # 目标接口测试
│   ├── keyResults.test.ts   # 关键结果接口测试
│   ├── tasks.test.ts        # 任务接口测试
│   └── stats.test.ts        # 统计接口测试
└── README.md               # 本文档
```

## 🚀 运行测试

### 环境准备

1. **创建测试数据库**
   ```bash
   # 创建测试数据库
   createdb todomaster_test
   
   # 或使用 psql
   psql -c "CREATE DATABASE todomaster_test;"
   ```

2. **配置测试环境变量**
   
   在 `packages/backend` 目录下创建 `.env.test` 文件：
   ```env
   NODE_ENV=test
   PORT=3001
   API_PREFIX=/api/v1
   
   # 测试数据库配置
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=todomaster_test
   DB_USERNAME=admin
   DB_PASSWORD=123456
   DB_SSL=false
   
   # JWT 测试配置
   JWT_SECRET=test-jwt-secret-key
   JWT_EXPIRES_IN=1h
   
   # 其他配置...
   ```

3. **运行数据库迁移**
   ```bash
   # 进入 backend 目录
   cd packages/backend
   
   # 运行迁移（针对测试数据库）
   NODE_ENV=test yarn db:migrate
   ```

### 运行测试命令

```bash
# 运行所有测试
yarn test

# 运行特定测试文件
yarn test health.test.ts
yarn test users.test.ts

# 监听模式运行测试
yarn test:watch

# 运行测试并生成覆盖率报告
yarn test --coverage

# 运行特定测试套件
yarn test --testNamePattern="用户 API 测试"

# 详细输出模式
yarn test --verbose
```

## 🧪 测试类型

### 1. 健康检查测试 (health.test.ts)
- 基本健康检查端点
- 数据库连接状态
- API 信息端点

### 2. 用户管理测试 (users.test.ts)
- 用户列表查询（管理员权限）
- 用户详情获取
- 用户信息更新
- 用户删除
- 个人资料管理
- 密码修改

### 3. 目标管理测试 (objectives.test.ts)
- 目标列表查询和筛选
- 目标创建、更新、删除
- 目标完成和重新打开
- 权限控制（用户只能操作自己的数据）

### 4. 关键结果测试 (keyResults.test.ts)
- 关键结果的 CRUD 操作
- 进度更新和跟踪
- 完成状态管理
- 数据验证

### 5. 任务管理测试 (tasks.test.ts)
- 任务的完整生命周期管理
- 任务状态和优先级管理
- 时间跟踪功能
- 任务依赖关系

### 6. 统计数据测试 (stats.test.ts)
- 仪表板统计数据
- 各类统计报表
- 管理员统计功能
- 数据导出功能

## 🔧 测试工具和配置

### Jest 配置
- 使用 `ts-jest` 预设支持 TypeScript
- 配置测试超时时间为 10 秒
- 自动收集代码覆盖率
- 支持模块路径映射

### Supertest
- 用于 HTTP 接口测试
- 支持认证和未认证请求
- 自动处理 JSON 响应

### 测试数据库
- 每个测试前清理数据
- 使用独立的测试数据库
- 提供便捷的测试数据创建函数

## 📊 测试覆盖率

运行 `yarn test --coverage` 查看详细的覆盖率报告。

目标覆盖率：
- 语句覆盖率：> 90%
- 分支覆盖率：> 85%
- 函数覆盖率：> 90%
- 行覆盖率：> 90%

## 🐛 测试最佳实践

### 1. 测试数据隔离
```typescript
beforeEach(async () => {
  await clearTestData()
  testUser = await createTestUser()
  // 创建其他测试数据...
})
```

### 2. 认证测试
```typescript
const response = await authenticatedRequest(testUser)
  .get('/api/v1/users/profile')

expect(response.status).toBe(200)
```

### 3. 权限测试
```typescript
// 测试普通用户访问管理员接口
const response = await authenticatedRequest(testUser)
  .get('/api/v1/admin/users')

expect(response.status).toBe(403)
```

### 4. 数据验证测试
```typescript
// 测试必填字段验证
const response = await authenticatedRequest(testUser)
  .post('/api/v1/objectives')
  .send({}) // 空数据

expect(response.status).toBe(400)
```

## 🚨 常见问题

### 1. 数据库连接失败
- 检查测试数据库是否存在
- 确认数据库连接配置正确
- 验证数据库用户权限

### 2. 测试超时
- 增加 Jest 超时时间配置
- 检查数据库连接池配置
- 优化测试数据清理逻辑

### 3. 权限测试失败
- 确认 JWT 密钥配置正确
- 检查认证中间件实现
- 验证用户角色设置

### 4. 内存泄漏
- 确保每个测试后正确关闭数据库连接
- 使用 `--detectOpenHandles` 选项检测未关闭的句柄

## 📝 编写新测试

1. **创建测试文件**
   ```typescript
   // src/__tests__/integration/newFeature.test.ts
   import { authenticatedRequest, API_PREFIX } from '../setup/testServer'
   import { createTestUser, clearTestData, closeTestDb } from '../setup/testDb'
   
   describe('新功能 API 测试', () => {
     // 测试实现...
   })
   ```

2. **遵循命名约定**
   - 文件名：`feature.test.ts`
   - 测试组：`describe('功能名 API 测试', () => {})`
   - 测试用例：`it('应该...', async () => {})`

3. **包含完整的测试场景**
   - 正常操作流程
   - 错误处理
   - 权限验证
   - 数据验证
   - 边界条件

## 🔄 持续集成

在 CI/CD 流程中集成测试：

```yaml
# .github/workflows/test.yml
- name: Run Tests
  run: |
    cd packages/backend
    yarn test --coverage
    
- name: Upload Coverage
  uses: codecov/codecov-action@v1
  with:
    file: ./packages/backend/coverage/lcov.info
```

## 📈 性能测试

对于性能敏感的接口，可以添加性能测试：

```typescript
it('应该在合理时间内响应', async () => {
  const start = Date.now()
  
  const response = await authenticatedRequest(testUser)
    .get('/api/v1/stats/dashboard')
  
  const duration = Date.now() - start
  
  expect(response.status).toBe(200)
  expect(duration).toBeLessThan(1000) // 1秒内响应
})
```

## 🎯 测试策略

1. **单元测试**：测试单个函数和方法
2. **集成测试**：测试 API 端点和数据库交互
3. **端到端测试**：测试完整的用户场景
4. **性能测试**：确保接口响应时间合理
5. **安全测试**：验证认证和授权机制 