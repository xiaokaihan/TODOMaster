# TODOMaster Backend

TODOMaster 后端 API 服务器，基于 Node.js + Express + TypeScript + PostgreSQL 构建。

## 📚 文档

- **[完整 API 文档](./docs/API.md)** - 详细的接口说明和示例
- **[OpenAPI 规范](./docs/openapi.yaml)** - 标准 OpenAPI 3.0 规范
- **[文档中心](./docs/README.md)** - 文档导航和工具集成
- **[测试指南](./TESTING.md)** - API 测试说明

## 🚀 快速开始

### 1. 安装依赖

确保你在项目根目录运行过 `yarn install`，这会安装所有必要的依赖。

### 2. 环境变量配置

在 `packages/backend` 目录下创建 `.env` 文件：

```bash
# 应用配置
NODE_ENV=development
PORT=3000
API_PREFIX=/api/v1

# 数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_NAME=todomaster
DB_USERNAME=admin
DB_PASSWORD=123456
DB_SSL=false
DB_MAX_CONNECTIONS=20
DB_IDLE_TIMEOUT=30000
DB_CONNECTION_TIMEOUT=5000

# JWT 配置
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_REFRESH_EXPIRES_IN=30d

# BCrypt 配置
BCRYPT_SALT_ROUNDS=12

# CORS 配置
CORS_ORIGIN=http://localhost:5173

# 速率限制配置
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# 日志配置
LOG_LEVEL=info
```

### 3. 数据库设置

确保你的 PostgreSQL 数据库正在运行，然后：

```bash
# 测试数据库连接
yarn db:test

# 运行数据库迁移
yarn db:migrate

# 检查迁移状态
yarn db:status
```

### 4. 启动服务器

```bash
# 开发模式
yarn dev

# 生产模式
yarn build
yarn start
```

## 📋 可用脚本

### 开发脚本
- `yarn dev` - 启动开发服务器（使用 ts-node）
- `yarn build` - 构建生产版本
- `yarn start` - 启动生产服务器
- `yarn lint` - 运行 ESLint 检查
- `yarn test` - 运行测试
- `yarn test:watch` - 以监听模式运行测试

### 数据库脚本
- `yarn db:test` - 测试数据库连接
- `yarn db:migrate` - 运行数据库迁移
- `yarn db:status` - 检查迁移状态
- `yarn db:stats` - 显示数据库统计信息
- `yarn db:reset` - 重置数据库（仅开发环境）
- `yarn db:rebuild` - 重建数据库（仅开发环境）
- `yarn db:help` - 显示数据库管理工具帮助

## 🗄️ 数据库架构

### 核心表结构

1. **users** - 用户表
   - 支持邮箱登录
   - 密码加密存储
   - 角色管理（user/admin）

2. **objectives** - 目标表
   - 支持分类（工作、个人、健康等）
   - 进度追踪
   - 开始/结束日期

3. **key_results** - 关键结果表
   - 支持数值、百分比、布尔类型
   - 自动进度计算
   - 与目标关联

4. **tasks** - 任务表
   - 优先级管理
   - 截止日期
   - 与目标和关键结果关联
   - 时间预估和实际用时

5. **task_dependencies** - 任务依赖关系
6. **task_tags** - 任务标签系统
7. **activity_logs** - 活动日志

### 数据库特性

- **自动进度计算**：关键结果和目标进度自动计算
- **触发器支持**：自动更新时间戳和进度
- **数据完整性**：外键约束和检查约束
- **索引优化**：查询性能优化
- **软删除**：用户禁用而非删除

## 🔌 API 端点

### 认证相关
- `POST /api/v1/auth/register` - 用户注册
- `POST /api/v1/auth/login` - 用户登录
- `POST /api/v1/auth/refresh` - 刷新令牌
- `GET /api/v1/auth/me` - 获取当前用户信息
- `PUT /api/v1/auth/me` - 更新用户信息
- `PUT /api/v1/auth/password` - 修改密码
- `POST /api/v1/auth/logout` - 登出

### 目标管理
- `GET /api/v1/objectives` - 获取目标列表
- `POST /api/v1/objectives` - 创建目标
- `GET /api/v1/objectives/:id` - 获取单个目标
- `PUT /api/v1/objectives/:id` - 更新目标
- `DELETE /api/v1/objectives/:id` - 删除目标

### 关键结果
- `GET /api/v1/key-results` - 获取关键结果列表
- `POST /api/v1/key-results` - 创建关键结果
- `PUT /api/v1/key-results/:id` - 更新关键结果
- `DELETE /api/v1/key-results/:id` - 删除关键结果

### 任务管理
- `GET /api/v1/tasks` - 获取任务列表
- `POST /api/v1/tasks` - 创建任务
- `PUT /api/v1/tasks/:id` - 更新任务
- `DELETE /api/v1/tasks/:id` - 删除任务

### 统计信息
- `GET /api/v1/stats/overview` - 获取总体统计
- `GET /api/v1/stats/progress-trend` - 获取进度趋势

### 用户管理（仅管理员）
- `GET /api/v1/users` - 获取用户列表
- `GET /api/v1/users/:id` - 获取单个用户
- `PUT /api/v1/users/:id` - 更新用户
- `DELETE /api/v1/users/:id` - 删除用户
- `GET /api/v1/users/stats/overview` - 获取用户统计

## 🔒 认证和权限

- **JWT 令牌认证**：访问令牌 + 刷新令牌机制
- **角色权限**：支持用户和管理员角色
- **资源权限**：用户只能访问自己的数据
- **速率限制**：防止 API 滥用

## 🛠️ 开发工具

### 数据库管理
使用内置的数据库 CLI 工具：

```bash
# 查看所有可用命令
yarn db:help

# 测试连接
yarn db:test

# 查看迁移状态
yarn db:status

# 查看数据库统计
yarn db:stats
```

### 日志系统
- 结构化日志输出
- 不同日志级别（error, warn, info, debug）
- 请求/响应日志
- 数据库操作日志
- 认证操作日志

### 错误处理
- 全局错误处理中间件
- 自定义错误类
- 详细错误信息（开发环境）
- 用户友好错误消息

## 🚀 部署

### 生产环境配置

1. 设置生产环境变量
2. 使用强密码和密钥
3. 启用 SSL
4. 配置反向代理
5. 设置监控和日志

### Docker 支持

项目根目录包含 Docker 配置文件，支持容器化部署。

## 🤝 贡献

请查看项目根目录的 CONTRIBUTING.md 文件了解贡献指南。

## 📄 许可证

MIT License - 详见 LICENSE 文件。 