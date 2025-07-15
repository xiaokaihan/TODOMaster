#!/bin/bash

# Docker 清理脚本
set -e

echo "🧹 开始清理 Docker 资源..."

# 进入项目根目录
cd "$(dirname "$0")/../.."

# 停止所有相关服务
echo "🛑 停止所有 TODOMaster 服务..."
docker-compose -f docker/docker-compose.yml down 2>/dev/null || true
docker-compose -f docker/docker-compose.dev.yml down 2>/dev/null || true
docker-compose -f docker/docker-compose.prod.yml down 2>/dev/null || true

# 清理选项
CLEAN_IMAGES=${1:-false}
CLEAN_VOLUMES=${2:-false}
CLEAN_NETWORKS=${3:-false}

if [[ $CLEAN_IMAGES == "true" ]]; then
    echo "🗑️ 清理 TODOMaster 镜像..."
    docker images | grep todomaster | awk '{print $3}' | xargs -r docker rmi -f
fi

if [[ $CLEAN_VOLUMES == "true" ]]; then
    echo "🗑️ 清理数据卷..."
    docker volume ls | grep todomaster | awk '{print $2}' | xargs -r docker volume rm
fi

if [[ $CLEAN_NETWORKS == "true" ]]; then
    echo "🗑️ 清理网络..."
    docker network ls | grep todomaster | awk '{print $2}' | xargs -r docker network rm
fi

# 清理悬空资源
echo "🧽 清理悬空资源..."
docker system prune -f

echo "✅ 清理完成！"

# 使用说明
echo ""
echo "📖 使用说明："
echo "  清理所有: ./clean.sh true true true"
echo "  仅清理镜像: ./clean.sh true"
echo "  清理镜像和卷: ./clean.sh true true" 