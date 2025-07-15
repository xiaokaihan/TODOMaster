#!/bin/bash

# Docker 镜像构建脚本
set -e

echo "🚀 开始构建 Docker 镜像..."

# 检查环境参数
ENV=${1:-dev}
echo "📋 构建环境: $ENV"

# 进入项目根目录
cd "$(dirname "$0")/../.."

# 构建后端镜像
echo "🔨 构建后端镜像..."
docker build -f docker/Dockerfile.backend -t todomaster-backend:latest -t todomaster-backend:$ENV ./packages/backend

# 构建前端镜像
echo "🔨 构建前端镜像..."
docker build -f docker/Dockerfile.frontend -t todomaster-frontend:latest -t todomaster-frontend:$ENV ./packages/frontend

echo "✅ 镜像构建完成！"

# 显示构建的镜像
echo "📦 构建的镜像列表："
docker images | grep todomaster 