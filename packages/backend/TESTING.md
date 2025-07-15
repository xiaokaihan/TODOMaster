# 🧪 TODOMaster 后端测试快速指南

## 🚀 快速开始

### 1. 创建测试环境配置文件

在 `packages/backend` 目录下创建 `.env.test` 文件：

```env
NODE_ENV=test
PORT=3001
API_PREFIX=/api

# 测试数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_NAME=todomaster_test
DB_USERNAME=admin
DB_PASSWORD=123456
DB_SSL=false

# JWT 测试配置
JWT_SECRET=test-jwt-secret-key-for-testing-only
JWT_EXPIRES_IN=1h
```

### 2. 设置测试环境

```bash
# 使用测试启动器自动设置
./test-runner.js setup

# 或手动设置
createdb todomaster_test
NODE_ENV=test yarn db:migrate
```

### 3. 运行测试

```bash
# 运行所有测试
yarn test

# 使用测试启动器
./test-runner.js test

# 生成覆盖率报告
./test-runner.js coverage
```

## 📊 测试覆盖范围

### ✅ 已实现的测试

1. **健康检查测试** (`health.test.ts`)
   - ✅ 基本健康检查端点
   - ✅ 数据库连接状态检查
   - ✅ API 信息端点

2. **用户管理测试** (`users.test.ts`)
   - ✅ 用户列表查询（管理员权限）
   - ✅ 用户详情获取
   - ✅ 用户信息更新和删除
   - ✅ 个人资料管理
   - ✅ 密码修改功能

3. **目标管理测试** (`objectives.test.ts`)
   - ✅ 目标 CRUD 操作
   - ✅ 目标状态管理（完成/重新打开）
   - ✅ 权限控制验证
   - ✅ 查询筛选功能

4. **关键结果测试** (`keyResults.test.ts`)
   - ✅ 关键结果 CRUD 操作
   - ✅ 进度更新和跟踪
   - ✅ 完成状态管理
   - ✅ 数据验证

5. **任务管理测试** (`tasks.test.ts`)
   - ✅ 任务完整生命周期管理
   - ✅ 任务状态和优先级
   - ✅ 时间跟踪功能
   - ✅ 权限控制

6. **统计数据测试** (`stats.test.ts`)
   - ✅ 仪表板统计数据
   - ✅ 各类统计报表
   - ✅ 管理员统计功能
   - ✅ 数据导出功能

### 📋 测试架构

```
src/__tests__/
├── setup/                  # 测试基础设施
│   ├── jest.setup.ts      # Jest 全局配置
│   ├── testDb.ts          # 数据库测试工具
│   └── testServer.ts      # 服务器测试工具
└── integration/           # 集成测试
    ├── health.test.ts     # ✅ 健康检查
    ├── users.test.ts      # ✅ 用户管理
    ├── objectives.test.ts # ✅ 目标管理
    ├── keyResults.test.ts # ✅ 关键结果
    ├── tasks.test.ts      # ✅ 任务管理
    └── stats.test.ts      # ✅ 统计数据
```

## 🔧 测试工具和特性

### 测试工具栈
- **Jest**: 测试框架
- **Supertest**: HTTP 接口测试
- **TypeScript**: 类型安全
- **PostgreSQL**: 测试数据库

### 核心特性
- 🔐 **认证测试**: 支持 JWT 认证的接口测试
- 🛡️ **权限测试**: 验证角色和权限控制
- 📊 **数据验证**: 测试输入验证和错误处理
- 🧹 **数据隔离**: 每个测试独立的数据环境
- 📈 **覆盖率报告**: 详细的代码覆盖率分析

## 🎯 测试最佳实践

### 1. 权限测试模式
```typescript
// 测试管理员权限
const response = await authenticatedRequest(testAdmin)
  .get('/api/v1/admin/users')
expect(response.status).toBe(200)

// 测试普通用户被拒绝
const response = await authenticatedRequest(testUser)
  .get('/api/v1/admin/users')
expect(response.status).toBe(403)
```

### 2. 数据验证测试
```typescript
// 测试必填字段
const response = await authenticatedRequest(testUser)
  .post('/api/v1/objectives')
  .send({}) // 空数据
expect(response.status).toBe(400)
```

### 3. 数据隔离保证
```typescript
beforeEach(async () => {
  await clearTestData()
  testUser = await createTestUser()
  // 每个测试都有干净的数据环境
})
```

## 📊 性能指标

### 目标覆盖率
- 📊 **语句覆盖率**: > 90%
- 🌳 **分支覆盖率**: > 85%
- 🔧 **函数覆盖率**: > 90%
- 📝 **行覆盖率**: > 90%

### 性能要求
- ⚡ **响应时间**: < 1000ms
- 🔄 **并发测试**: 支持并行执行
- 💾 **内存使用**: 无内存泄漏

## 🚨 常见问题和解决方案

### 1. 数据库连接失败
```bash
# 检查数据库是否启动
pg_ctl status

# 创建测试数据库
createdb todomaster_test

# 检查连接配置
psql -h localhost -U admin -d todomaster_test
```

### 2. 测试超时
```bash
# 增加超时时间
yarn test --testTimeout=30000

# 检查数据库性能
yarn db:stats
```

### 3. 权限错误
```bash
# 重置测试数据
./test-runner.js clean

# 重新设置环境
./test-runner.js setup
```

## 📈 测试报告

### 生成详细报告
```bash
# 生成 HTML 覆盖率报告
./test-runner.js coverage

# 查看报告
open coverage/lcov-report/index.html
```

### CI/CD 集成
```yaml
# GitHub Actions 示例
- name: Run API Tests
  run: |
    cd packages/backend
    ./test-runner.js setup
    ./test-runner.js coverage
```

## 🔄 持续改进

### 下一步计划
- [ ] 添加端到端测试
- [ ] 增加性能基准测试
- [ ] 集成负载测试
- [ ] 添加 API 文档测试

### 贡献指南
1. 为新功能编写测试
2. 确保测试覆盖率不下降
3. 遵循测试命名约定
4. 更新相关文档

---

💡 **提示**: 运行 `./test-runner.js help` 查看所有可用命令！ 
