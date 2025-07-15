#!/bin/bash

# Docker 服务启动脚本
set -e

# 检查环境参数
ENV=${1:-dev}
echo "🚀 启动 TODOMaster 服务 (环境: $ENV)..."

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

# 停止现有服务
echo "🛑 停止现有服务..."
docker-compose -f $COMPOSE_FILE down

# 启动服务
echo "🔄 启动服务..."
docker-compose -f $COMPOSE_FILE up -d

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 10

# 检查服务状态
echo "📊 服务状态检查："
docker-compose -f $COMPOSE_FILE ps

echo "✅ 服务启动完成！"
echo "🌐 前端地址: http://localhost:3000"
echo "🔗 后端地址: http://localhost:5000" 