#!/bin/bash

# 设置颜色
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 项目根目录
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/packages/backend"
FRONTEND_DIR="$PROJECT_ROOT/packages/frontend"

# 启动后端服务
start_backend() {
    echo -e "${YELLOW}🚀 启动后端服务...${NC}"
    cd "$BACKEND_DIR"
    
    # 检查是否已经运行
    if pgrep -f "ts-node src/server.ts" > /dev/null; then
        echo -e "${RED}❌ 后端服务已经在运行${NC}"
        return 1
    fi
    
    # 启动后端服务
    npm run dev > "$PROJECT_ROOT/logs/backend.log" 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > "$PROJECT_ROOT/logs/backend.pid"
    
    # 等待后端启动
    echo -e "${YELLOW}⏳ 等待后端服务启动...${NC}"
    for i in {1..30}; do
        if curl -s http://localhost:3000/health > /dev/null; then
            echo -e "${GREEN}✅ 后端服务启动成功！${NC}"
            return 0
        fi
        sleep 1
    done
    
    echo -e "${RED}❌ 后端服务启动失败${NC}"
    return 1
}

# 启动前端服务
start_frontend() {
    echo -e "${YELLOW}🚀 启动前端服务...${NC}"
    cd "$FRONTEND_DIR"
    
    # 检查是否已经运行
    if pgrep -f "vite" > /dev/null; then
        echo -e "${RED}❌ 前端服务已经在运行${NC}"
        return 1
    fi
    
    # 启动前端服务
    npm run dev > "$PROJECT_ROOT/logs/frontend.log" 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > "$PROJECT_ROOT/logs/frontend.pid"
    
    # 等待前端启动
    echo -e "${YELLOW}⏳ 等待前端服务启动...${NC}"
    for i in {1..30}; do
        if curl -s http://localhost:5173 > /dev/null; then
            echo -e "${GREEN}✅ 前端服务启动成功！${NC}"
            return 0
        fi
        sleep 1
    done
    
    echo -e "${RED}❌ 前端服务启动失败${NC}"
    return 1
}

# 创建日志目录
mkdir -p "$PROJECT_ROOT/logs"

# 启动服务
echo -e "${YELLOW}🎯 开始启动 TODOMaster 服务...${NC}"

# 启动后端
start_backend
BACKEND_STATUS=$?

# 启动前端
start_frontend
FRONTEND_STATUS=$?

# 检查启动状态
if [ $BACKEND_STATUS -eq 0 ] && [ $FRONTEND_STATUS -eq 0 ]; then
    echo -e "${GREEN}🎉 TODOMaster 服务启动成功！${NC}"
    echo -e "${GREEN}🌐 前端地址: http://localhost:5173${NC}"
    echo -e "${GREEN}🔌 后端地址: http://localhost:3000${NC}"
    echo -e "${GREEN}📖 API文档: http://localhost:3000/api/v1${NC}"
    echo -e "${GREEN}❤️  健康检查: http://localhost:3000/health${NC}"
    echo -e "${YELLOW}📝 日志文件:${NC}"
    echo -e "   - 后端日志: $PROJECT_ROOT/logs/backend.log"
    echo -e "   - 前端日志: $PROJECT_ROOT/logs/frontend.log"
    exit 0
else
    echo -e "${RED}❌ TODOMaster 服务启动失败${NC}"
    exit 1
fi 