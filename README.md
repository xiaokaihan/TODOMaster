# TODOMaster

个人任务管理系统 - 帮助用户清晰设定目标、智能规划任务并高效执行

## 🎯 产品特色

- **目标驱动**: 先创建目标，再创建任务，确保每个任务都有明确的目的
- **智能规划**: 基于优先级和时间的智能任务调度
- **进度跟踪**: 实时跟踪目标和任务的完成进度
- **数据分析**: 提供详细的生产力分析和统计报告

## 🏗️ 技术架构

### 技术栈
- **前端**: React.js + TypeScript + Vite + Tailwind CSS
- **后端**: Node.js + Express + TypeScript
- **数据库**: PostgreSQL + Prisma ORM
- **状态管理**: Zustand
- **表单处理**: React Hook Form + Zod
- **HTTP 客户端**: Axios + React Query

### 项目结构
```
TODOMaster/
├── packages/
│   ├── frontend/          # React 前端应用
│   ├── backend/           # Node.js 后端 API
│   └── shared/            # 前后端共享代码
├── docs/                  # 项目文档
├── scripts/               # 构建和部署脚本
└── docker/                # Docker 配置和管理
    ├── config/            # 环境配置文件
    ├── scripts/           # Docker 管理脚本
    └── volumes/           # 数据持久化目录
```

## 🚀 快速开始

### 环境要求
- Node.js >= 18.0.0
- Yarn >= 1.22.0
- PostgreSQL >= 13
- Docker >= 20.10.0 (可选，用于容器化部署)
- Docker Compose >= 2.0.0 (可选)

### 安装依赖
```bash
# 安装所有依赖
yarn install
```

### 环境配置
```bash
# 复制环境变量模板
cp .env.example .env

# 编辑环境变量
vim .env
```

### 数据库设置
```bash
# 运行数据库迁移
yarn db:migrate

# 填充种子数据
yarn db:seed
```

### 启动开发服务器

#### 方法1: 🐳 Docker 容器化启动（推荐）

项目提供完整的 Docker 容器化解决方案，支持开发、测试和生产三种环境：

**快速开始**
```bash
# 构建并启动开发环境
./docker/scripts/build.sh dev
./docker/scripts/start.sh dev

# 查看服务状态
docker-compose -f docker/docker-compose.dev.yml ps

# 停止服务
./docker/scripts/stop.sh dev
```

**环境选择**
```bash
# 开发环境（默认）
./docker/scripts/start.sh dev

# 生产环境
./docker/scripts/start.sh prod

# 测试环境
./docker/scripts/start.sh test
```

**完整的 Docker 管理**
```bash
# 构建镜像
./docker/scripts/build.sh [dev|prod|test]

# 启动服务
./docker/scripts/start.sh [dev|prod|test]

# 停止服务
./docker/scripts/stop.sh [dev|prod|test]

# 清理资源
./docker/scripts/clean.sh [images] [volumes] [networks]
# 参数说明：清理镜像 清理卷 清理网络
```

**Docker 服务地址**
- 前端：http://localhost:3000
- 后端：http://localhost:5000
- MySQL：localhost:3306
- Redis：localhost:6379

详细的 Docker 使用说明请参考：[docker/README.md](docker/README.md)

#### 方法2: 使用服务管理脚本

项目提供了便捷的服务管理脚本，位于 `scripts` 目录：

```bash
# 启动所有服务
./scripts/start.sh

# 停止所有服务
./scripts/stop.sh

# 重启所有服务
./scripts/restart.sh

# 检查服务健康状态
./scripts/health-check.sh
```

这些脚本提供了以下功能：
- 🚀 自动启动/停止前后端服务
- 🔍 服务健康状态检查
- 📊 进程管理和监控
- 📝 日志记录
- 🔄 优雅的服务重启

#### 方法3: 手动启动

**后端启动**
```bash
# 进入后端目录
cd packages/backend

# 使用 npm 启动
npm run dev

# 或使用 yarn 启动
yarn dev
```

后端服务将在 http://localhost:3000 启动，提供以下端点：
- API 根地址：http://localhost:3000
- API 文档：http://localhost:3000/api/v1
- 健康检查：http://localhost:3000/health

**前端启动**
```bash
# 进入前端目录
cd packages/frontend

# 使用 npm 启动
npm run dev

# 或使用 yarn 启动
yarn dev
```

前端服务将在 http://localhost:5173 启动。

### 访问应用

服务启动后可以通过以下地址访问：
- 🌐 前端界面：http://localhost:5173 (本地) / http://localhost:3000 (Docker)
- 🔌 后端 API：http://localhost:3000 (本地) / http://localhost:5000 (Docker)
- 📖 API 文档：http://localhost:3000/api/v1
- ❤️ 健康检查：http://localhost:3000/health
- 🗄️ 数据库管理：`yarn workspace @todomaster/backend db:studio`

## 📦 可用脚本

### Docker 管理脚本（推荐）
**Docker 核心脚本**
- `./docker/scripts/build.sh [env]` - 构建 Docker 镜像
- `./docker/scripts/start.sh [env]` - 启动 Docker 服务
- `./docker/scripts/stop.sh [env]` - 停止 Docker 服务
- `./docker/scripts/clean.sh [images] [volumes] [networks]` - 清理 Docker 资源

### 服务管理脚本
**本地开发脚本**
- `./scripts/start.sh` - 启动所有服务
- `./scripts/stop.sh` - 停止所有服务
- `./scripts/restart.sh` - 重启所有服务
- `./scripts/health-check.sh` - 健康检查

**Docker 管理脚本（旧版本）**
- `./scripts/docker-start.sh` - Docker 启动脚本
- `./scripts/docker-stop.sh` - Docker 停止脚本
- `./scripts/docker-health-check.sh` - Docker 健康检查

### 根目录脚本
- `yarn dev` - 启动开发环境
- `yarn build` - 构建所有包
- `yarn test` - 运行所有测试
- `yarn lint` - 代码检查
- `yarn clean` - 清理构建文件

### 数据库脚本
- `yarn db:migrate` - 运行数据库迁移
- `yarn db:seed` - 填充种子数据
- `yarn db:studio` - 打开数据库管理界面

## 🎨 核心功能

### 目标管理
- 创建、编辑、删除目标
- 目标分类和优先级设置
- 目标状态跟踪（草稿、进行中、暂停、完成、取消）
- 目标进度计算（基于关联任务）

### 任务管理
- 任务必须关联到具体目标
- 任务优先级和状态管理
- 任务依赖关系设置
- 时间估算和实际用时跟踪

### 数据分析
- 个人生产力统计
- 目标完成率分析
- 任务效率报告
- 时间线视图

## 🔧 开发指南

### 代码规范
- 使用 TypeScript 进行类型安全开发
- 遵循 ESLint 和 Prettier 配置
- 组件和函数使用描述性命名
- 添加适当的注释和文档

### 提交规范
```bash
# 功能开发
git commit -m "feat: 添加目标创建功能"

# 问题修复
git commit -m "fix: 修复任务状态更新问题"

# 文档更新
git commit -m "docs: 更新 API 文档"
```

### 测试
```bash
# 运行所有测试
yarn test

# 运行特定包的测试
yarn workspace @todomaster/frontend test
yarn workspace @todomaster/backend test
```

## 📚 API 文档

API 文档位于 `docs/api/` 目录，包含：
- 认证接口
- 目标管理接口
- 任务管理接口
- 用户统计接口

## 🚢 部署

### 🐳 Docker 容器化部署（推荐）

项目提供完整的 Docker 容器化解决方案，所有配置统一管理在 `docker/` 目录：

#### 目录结构
```
docker/
├── README.md                    # Docker 详细文档
├── .dockerignore               # 构建忽略文件
├── Dockerfile.backend          # 后端镜像文件
├── Dockerfile.frontend         # 前端镜像文件
├── docker-compose.yml          # 基础配置
├── docker-compose.dev.yml      # 开发环境配置
├── docker-compose.prod.yml     # 生产环境配置
├── config/                     # 环境配置文件
│   ├── dev.env                 # 开发环境变量
│   ├── prod.env                # 生产环境变量
│   └── test.env                # 测试环境变量
├── scripts/                    # Docker 管理脚本
│   ├── build.sh                # 镜像构建脚本
│   ├── start.sh                # 服务启动脚本
│   ├── stop.sh                 # 服务停止脚本
│   └── clean.sh                # 资源清理脚本
└── volumes/                    # 数据持久化目录
    ├── mysql/                  # MySQL 数据卷
    └── redis/                  # Redis 数据卷
```

#### 环境要求
- Docker >= 20.10.0
- Docker Compose >= 2.0.0

#### 快速开始

**开发环境**
```bash
# 1. 克隆项目
git clone <repository-url>
cd TODOMaster

# 2. 构建并启动开发环境
./docker/scripts/build.sh dev
./docker/scripts/start.sh dev

# 3. 验证服务状态
docker-compose -f docker/docker-compose.dev.yml ps
```

**生产环境**
```bash
# 1. 配置生产环境变量
vim docker/config/prod.env

# 2. 构建并启动生产环境
./docker/scripts/build.sh prod
./docker/scripts/start.sh prod

# 3. 验证服务状态
docker-compose -f docker/docker-compose.prod.yml ps
```

#### 高级用法

```bash
# 查看服务日志
docker-compose -f docker/docker-compose.dev.yml logs -f

# 进入容器调试
docker-compose -f docker/docker-compose.dev.yml exec backend bash
docker-compose -f docker/docker-compose.dev.yml exec frontend sh

# 数据库管理
docker-compose -f docker/docker-compose.dev.yml exec mysql mysql -u root -p

# 重建特定服务
docker-compose -f docker/docker-compose.dev.yml up -d --build backend

# 完全清理（包括数据）
./docker/scripts/clean.sh true true true
```

#### Docker 特性

**🎯 多环境支持**
- 开发环境：热重载，详细日志，调试工具
- 测试环境：快速反馈，覆盖率统计
- 生产环境：性能优化，安全加固，监控

**🛡️ 安全配置**
- 非 root 用户运行
- 最小权限原则
- 健康检查监控
- 资源限制配置

**📊 监控功能**
- 自动健康检查
- 资源使用监控
- 错误日志检测
- 端口连通性测试

**🔄 开发体验**
- 代码热重载
- 卷挂载同步
- 自动重启策略
- 依赖缓存优化

**详细使用说明请参考**: [docker/README.md](docker/README.md)

### 传统部署方式

#### 生产环境构建
```bash
# 1. 安装依赖
yarn install --frozen-lockfile

# 2. 构建项目
yarn build

# 3. 启动生产服务器
yarn start
```

#### PM2 部署
```bash
# 安装 PM2
npm install -g pm2

# 启动后端服务
cd packages/backend
pm2 start npm --name "todomaster-backend" -- start

# 启动前端服务（如需要）
cd packages/frontend
pm2 serve dist 5173 --name "todomaster-frontend"

# 查看服务状态
pm2 status
```

### 云平台部署

#### Docker Hub 部署
```bash
# 使用项目提供的构建脚本
./docker/scripts/build.sh prod

# 标记并推送镜像
docker tag todomaster-backend:latest your-registry/todomaster-backend:latest
docker tag todomaster-frontend:latest your-registry/todomaster-frontend:latest

docker push your-registry/todomaster-backend:latest
docker push your-registry/todomaster-frontend:latest
```

#### Kubernetes 部署
```bash
# 应用 Kubernetes 配置
kubectl apply -f k8s/

# 查看部署状态
kubectl get pods
kubectl get services
```

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'feat: 添加新功能'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 📞 联系我们

- 项目主页: [GitHub Repository](https://github.com/your-username/todomaster)
- 问题反馈: [Issues](https://github.com/your-username/todomaster/issues)
- 邮箱: your-email@example.com

---

**TODOMaster** - 让每一次行动都聚焦于重要事务 🎯 