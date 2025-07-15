#!/bin/bash

# 设置颜色
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 项目根目录
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# 停止后端服务
stop_backend() {
    echo -e "${YELLOW}🛑 停止后端服务...${NC}"
    
    # 通过PID文件停止
    if [ -f "$PROJECT_ROOT/logs/backend.pid" ]; then
        BACKEND_PID=$(cat "$PROJECT_ROOT/logs/backend.pid")
        if ps -p $BACKEND_PID > /dev/null; then
            kill $BACKEND_PID
            sleep 2
            # 如果进程还在运行，强制停止
            if ps -p $BACKEND_PID > /dev/null; then
                kill -9 $BACKEND_PID
            fi
            rm "$PROJECT_ROOT/logs/backend.pid"
            echo -e "${GREEN}✅ 后端服务已停止${NC}"
        else
            echo -e "${YELLOW}⚠️  后端服务PID文件存在但进程未运行${NC}"
            rm "$PROJECT_ROOT/logs/backend.pid"
        fi
    else
        # 通过进程名停止
        BACKEND_PIDS=$(pgrep -f "ts-node src/server.ts")
        if [ -n "$BACKEND_PIDS" ]; then
            echo $BACKEND_PIDS | xargs kill
            sleep 2
            # 检查是否还有残留进程
            REMAINING_PIDS=$(pgrep -f "ts-node src/server.ts")
            if [ -n "$REMAINING_PIDS" ]; then
                echo $REMAINING_PIDS | xargs kill -9
            fi
            echo -e "${GREEN}✅ 后端服务已停止${NC}"
        else
            echo -e "${YELLOW}⚠️  后端服务未运行${NC}"
        fi
    fi
}

# 停止前端服务
stop_frontend() {
    echo -e "${YELLOW}🛑 停止前端服务...${NC}"
    
    # 通过PID文件停止
    if [ -f "$PROJECT_ROOT/logs/frontend.pid" ]; then
        FRONTEND_PID=$(cat "$PROJECT_ROOT/logs/frontend.pid")
        if ps -p $FRONTEND_PID > /dev/null; then
            kill $FRONTEND_PID
            sleep 2
            # 如果进程还在运行，强制停止
            if ps -p $FRONTEND_PID > /dev/null; then
                kill -9 $FRONTEND_PID
            fi
            rm "$PROJECT_ROOT/logs/frontend.pid"
            echo -e "${GREEN}✅ 前端服务已停止${NC}"
        else
            echo -e "${YELLOW}⚠️  前端服务PID文件存在但进程未运行${NC}"
            rm "$PROJECT_ROOT/logs/frontend.pid"
        fi
    else
        # 通过进程名停止
        FRONTEND_PIDS=$(pgrep -f "vite")
        if [ -n "$FRONTEND_PIDS" ]; then
            echo $FRONTEND_PIDS | xargs kill
            sleep 2
            # 检查是否还有残留进程
            REMAINING_PIDS=$(pgrep -f "vite")
            if [ -n "$REMAINING_PIDS" ]; then
                echo $REMAINING_PIDS | xargs kill -9
            fi
            echo -e "${GREEN}✅ 前端服务已停止${NC}"
        else
            echo -e "${YELLOW}⚠️  前端服务未运行${NC}"
        fi
    fi
}

# 清理日志文件（可选）
cleanup_logs() {
    read -p "是否清理日志文件? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if [ -d "$PROJECT_ROOT/logs" ]; then
            rm -f "$PROJECT_ROOT/logs"/*.log
            echo -e "${GREEN}✅ 日志文件已清理${NC}"
        fi
    fi
}

# 停止所有服务
echo -e "${YELLOW}🛑 开始停止 TODOMaster 服务...${NC}"

stop_backend
stop_frontend

echo -e "${GREEN}🎉 TODOMaster 服务已停止${NC}"

# 询问是否清理日志
cleanup_logs 