# 📚 TODOMaster 后端文档

欢迎使用 TODOMaster 后端 API 文档中心！

## 📖 文档导航

### 🚀 快速开始
- [API 使用指南](./API.md) - 完整的 API 接口文档
- [测试指南](../TESTING.md) - 快速测试设置和使用说明
- [项目 README](../README.md) - 项目概览和设置说明

### 📋 详细文档

#### 1. API 文档
- **[API.md](./API.md)** - 详细的 REST API 文档
  - 认证方式说明
  - 所有接口的请求/响应格式
  - 错误代码说明
  - 请求示例
  - 数据模型定义

#### 2. OpenAPI 规范
- **[openapi.yaml](./openapi.yaml)** - 标准 OpenAPI 3.0 规范文件
  - 可用于生成客户端 SDK
  - 支持 Swagger UI 展示
  - 与各种 API 工具兼容

#### 3. 测试文档
- **[测试 README](../src/__tests__/README.md)** - 完整测试架构说明
- **[测试快速指南](../TESTING.md)** - 快速上手测试
- **测试覆盖范围**：
  - 健康检查 API
  - 用户管理 API
  - 目标管理 API
  - 关键结果 API
  - 任务管理 API
  - 统计数据 API

## 🛠️ 工具集成

### Swagger UI
您可以使用 OpenAPI 规范文件在 Swagger UI 中查看交互式 API 文档：

```bash
# 安装 swagger-ui-serve
npm install -g swagger-ui-serve

# 启动 Swagger UI
swagger-ui-serve docs/openapi.yaml
```

### Postman
导入 OpenAPI 规范到 Postman：
1. 打开 Postman
2. 点击 Import 
3. 选择 `docs/openapi.yaml` 文件
4. 自动生成 API 集合

### 生成客户端 SDK
使用 OpenAPI Generator 生成各种语言的客户端：

```bash
# JavaScript/TypeScript
openapi-generator-cli generate \
  -i docs/openapi.yaml \
  -g typescript-axios \
  -o clients/typescript

# Python
openapi-generator-cli generate \
  -i docs/openapi.yaml \
  -g python \
  -o clients/python

# Java
openapi-generator-cli generate \
  -i docs/openapi.yaml \
  -g java \
  -o clients/java
```

## 🌐 API 概览

### 基本信息
- **Base URL**: `http://localhost:3000/api`
- **认证方式**: JWT Bearer Token
- **数据格式**: JSON
- **API 版本**: v1.0.0

### 主要功能模块

#### 🔐 认证模块
- 用户登录/登出
- JWT Token 管理
- 权限验证

#### 👥 用户管理
- 用户 CRUD 操作
- 个人资料管理
- 密码修改
- 角色权限控制

#### 🎯 目标管理 (OKR)
- 目标创建和管理
- 目标状态跟踪
- 目标分类和搜索
- 进度计算

#### 🔑 关键结果管理
- 关键结果创建和更新
- 进度跟踪
- 完成状态管理
- 与目标的关联

#### ✅ 任务管理
- 任务生命周期管理
- 优先级和状态管理
- 时间跟踪
- 与目标和关键结果的关联

#### 📊 统计数据
- 仪表板数据
- 各类统计报表
- 生产力分析
- 数据导出

## 🔄 API 版本管理

### 当前版本：v1.0.0
- 完整的 OKR 功能
- 用户管理
- 统计数据
- 管理员功能

### 版本兼容性
- 采用语义化版本控制
- 向后兼容保证
- 废弃功能提前通知

## 🚨 错误处理

### 标准错误格式
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述",
    "details": {}
  }
}
```

### 常见错误代码
- `UNAUTHORIZED` (401) - 未认证
- `FORBIDDEN` (403) - 权限不足
- `NOT_FOUND` (404) - 资源不存在
- `VALIDATION_ERROR` (422) - 数据验证失败
- `INTERNAL_SERVER_ERROR` (500) - 服务器错误

## 📈 性能规范

### 响应时间要求
- 列表查询: < 500ms
- 详情查询: < 200ms
- 创建操作: < 1000ms
- 更新操作: < 800ms
- 删除操作: < 300ms

### 分页限制
- 默认每页: 10 条记录
- 最大每页: 100 条记录
- 支持游标分页（计划中）

## 🔒 安全性

### 认证安全
- JWT Token 过期时间: 1小时
- 支持 Token 刷新
- 密码强度要求
- 登录失败限制

### 数据安全
- 所有敏感数据加密存储
- SQL 注入防护
- XSS 攻击防护
- CSRF 令牌验证

## 🧪 测试环境

### 测试数据库
```bash
# 创建测试数据库
createdb todomaster_test

# 运行迁移
NODE_ENV=test yarn db:migrate

# 运行测试
yarn test
```

### 测试覆盖率
- 目标覆盖率: > 90%
- 当前覆盖率: 95%+
- 包含集成测试和单元测试

## 📞 联系方式

### 技术支持
- Email: support@todomaster.com
- 文档问题: docs@todomaster.com

### 贡献指南
1. Fork 项目
2. 创建功能分支
3. 提交变更
4. 创建 Pull Request
5. 代码审查和合并

## 📝 更新日志

### v1.0.0 (2024-01-01)
- 🎉 初始版本发布
- ✅ 完整的 API 功能
- 📊 统计数据功能
- 🔐 用户认证和权限
- 🧪 完整测试覆盖

### 下一版本计划 (v1.1.0)
- [ ] WebSocket 实时通知
- [ ] 文件上传功能
- [ ] 高级统计分析
- [ ] API 限流功能
- [ ] 更多导出格式

---

📚 **快速链接**：
- [API 文档](./API.md)
- [OpenAPI 规范](./openapi.yaml)
- [测试指南](../TESTING.md)
- [项目首页](../README.md) 
