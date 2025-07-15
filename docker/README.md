# Docker 配置文档

本目录包含 TODOMaster 项目的所有 Docker 相关配置文件和脚本。

## 📁 目录结构

```
docker/
├── README.md                    # 本文档
├── .dockerignore               # Docker 构建忽略文件
├── Dockerfile.backend          # 后端服务 Dockerfile
├── Dockerfile.frontend         # 前端服务 Dockerfile
├── docker-compose.yml          # 基础 Docker Compose 配置
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
└── volumes/                    # 数据卷目录
    ├── mysql/                  # MySQL 数据持久化
    └── redis/                  # Redis 数据持久化
```

## 🚀 快速开始

### 1. 构建镜像
```bash
# 构建开发环境镜像
./docker/scripts/build.sh dev

# 构建生产环境镜像
./docker/scripts/build.sh prod
```

### 2. 启动服务
```bash
# 启动开发环境
./docker/scripts/start.sh dev

# 启动生产环境
./docker/scripts/start.sh prod
```

### 3. 停止服务
```bash
# 停止开发环境
./docker/scripts/stop.sh dev

# 停止生产环境
./docker/scripts/stop.sh prod
```

### 4. 清理资源
```bash
# 基础清理（仅清理容器）
./docker/scripts/clean.sh

# 完全清理（包括镜像、卷、网络）
./docker/scripts/clean.sh true true true
```

## 🔧 环境配置

### 开发环境 (dev.env)
- 启用调试模式
- 使用本地数据库
- 详细日志输出
- 热重载支持

### 生产环境 (prod.env)
- 优化性能配置
- 安全加固设置
- 生产级日志
- 环境变量占位符

### 测试环境 (test.env)
- 测试数据库配置
- 覆盖率统计
- 快速反馈设置

## 📋 Docker Compose 配置

### 基础配置 (docker-compose.yml)
包含所有必要的服务定义：
- frontend: React 前端应用
- backend: Node.js 后端 API
- mysql: MySQL 数据库
- redis: Redis 缓存

### 开发配置 (docker-compose.dev.yml)
开发环境特定设置：
- 卷挂载用于热重载
- 开发端口映射
- 调试工具集成

### 生产配置 (docker-compose.prod.yml)
生产环境优化：
- 资源限制
- 健康检查
- 重启策略
- 安全配置

## 🗂️ 数据持久化

### MySQL 数据卷
- 路径: `./volumes/mysql`
- 用途: 数据库数据持久化
- 挂载点: `/var/lib/mysql`

### Redis 数据卷
- 路径: `./volumes/redis`
- 用途: 缓存数据持久化
- 挂载点: `/data`

## 🔍 故障排查

### 查看服务状态
```bash
docker-compose -f docker/docker-compose.dev.yml ps
```

### 查看服务日志
```bash
# 查看所有服务日志
docker-compose -f docker/docker-compose.dev.yml logs

# 查看特定服务日志
docker-compose -f docker/docker-compose.dev.yml logs backend
```

### 进入容器调试
```bash
# 进入后端容器
docker-compose -f docker/docker-compose.dev.yml exec backend bash

# 进入数据库容器
docker-compose -f docker/docker-compose.dev.yml exec mysql mysql -u root -p
```

## ⚠️ 注意事项

1. **首次启动**: 数据库初始化可能需要额外时间
2. **端口冲突**: 确保宿主机端口 3000、5000、3306、6379 未被占用
3. **权限问题**: 确保 scripts 目录下的脚本有执行权限
4. **数据备份**: 生产环境请定期备份 volumes 目录
5. **环境变量**: 生产环境请替换 prod.env 中的占位符

## 🔗 相关链接

- [Docker 官方文档](https://docs.docker.com/)
- [Docker Compose 文档](https://docs.docker.com/compose/)
- [项目主 README](../README.md) 