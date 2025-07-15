#!/bin/bash

# Docker 服务停止脚本
set -e

# 检查环境参数
ENV=${1:-dev}
echo "🛑 停止 TODOMaster 服务 (环境: $ENV)..."

# 进入项目根目录
cd "$(dirname "$0")/../.."

# 根据环境选择 docker-compose 文件
case $ENV in
    "prod")
        COMPOSE_FILE="docker/docker-compose.prod.yml"
        ;;
    "dev")
        COMPOSE_FILE="docker/docker-compose.dev.yml"
        ;;
    *)
        COMPOSE_FILE="docker/docker-compose.yml"
        ;;
esac

echo "📋 使用配置文件: $COMPOSE_FILE"

# 停止服务
echo "⏹️ 停止所有服务..."
docker-compose -f $COMPOSE_FILE down

# 显示状态
echo "📊 当前服务状态："
docker-compose -f $COMPOSE_FILE ps

echo "✅ 服务已停止！" 