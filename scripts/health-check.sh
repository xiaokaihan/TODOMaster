#!/bin/bash

# 设置颜色
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目根目录
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# 检查后端健康状态
check_backend() {
    echo -e "${YELLOW}🔍 检查后端服务健康状态...${NC}"
    
    # 检查端口是否在监听
    if ! lsof -i :3000 > /dev/null 2>&1; then
        echo -e "${RED}❌ 后端服务端口3000未监听${NC}"
        return 1
    fi
    
    # 尝试访问健康检查端点
    RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" http://localhost:3000/health)
    HTTP_STATUS=$(echo $RESPONSE | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    RESPONSE_BODY=$(echo $RESPONSE | sed -e 's/HTTPSTATUS\:.*//g')
    
    if [ "$HTTP_STATUS" -eq 200 ]; then
        # 解析 JSON 响应
        STATUS=$(echo $RESPONSE_BODY | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
        DB_STATUS=$(echo $RESPONSE_BODY | grep -o '"database":"[^"]*"' | cut -d'"' -f4)
        VERSION=$(echo $RESPONSE_BODY | grep -o '"version":"[^"]*"' | cut -d'"' -f4)
        ENVIRONMENT=$(echo $RESPONSE_BODY | grep -o '"environment":"[^"]*"' | cut -d'"' -f4)
        
        if [ "$STATUS" = "ok" ] && [ "$DB_STATUS" = "connected" ]; then
            echo -e "${GREEN}✅ 后端服务健康状态: 正常${NC}"
            echo -e "${GREEN}📊 数据库连接: 正常${NC}"
            echo -e "${BLUE}🏷️  版本: $VERSION${NC}"
            echo -e "${BLUE}🌍 环境: $ENVIRONMENT${NC}"
            return 0
        else
            echo -e "${RED}❌ 后端服务健康状态: 异常${NC}"
            echo -e "${RED}📊 数据库连接: $DB_STATUS${NC}"
            return 1
        fi
    else
        echo -e "${RED}❌ 后端服务未响应 (HTTP $HTTP_STATUS)${NC}"
        return 1
    fi
}

# 检查前端健康状态
check_frontend() {
    echo -e "${YELLOW}🔍 检查前端服务健康状态...${NC}"
    
    # 检查端口是否在监听
    if ! lsof -i :5173 > /dev/null 2>&1; then
        echo -e "${RED}❌ 前端服务端口5173未监听${NC}"
        return 1
    fi
    
    # 尝试访问前端服务
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5173)
    
    if [ "$HTTP_STATUS" -eq 200 ]; then
        echo -e "${GREEN}✅ 前端服务健康状态: 正常${NC}"
        echo -e "${GREEN}🌐 服务地址: http://localhost:5173${NC}"
        return 0
    else
        echo -e "${RED}❌ 前端服务未响应 (HTTP $HTTP_STATUS)${NC}"
        return 1
    fi
}

# 检查服务进程
check_processes() {
    echo -e "${YELLOW}🔍 检查服务进程...${NC}"
    
    # 检查后端进程
    BACKEND_PIDS=$(pgrep -f "ts-node src/server.ts")
    if [ -n "$BACKEND_PIDS" ]; then
        echo -e "${GREEN}✅ 后端进程: 运行中 (PID: $BACKEND_PIDS)${NC}"
    else
        echo -e "${RED}❌ 后端进程: 未运行${NC}"
    fi
    
    # 检查前端进程
    FRONTEND_PIDS=$(pgrep -f "vite")
    if [ -n "$FRONTEND_PIDS" ]; then
        echo -e "${GREEN}✅ 前端进程: 运行中 (PID: $FRONTEND_PIDS)${NC}"
    else
        echo -e "${RED}❌ 前端进程: 未运行${NC}"
    fi
}

# 检查系统资源
check_system_resources() {
    echo -e "${YELLOW}🔍 检查系统资源...${NC}"
    
    # 检查内存使用情况
    MEMORY_USAGE=$(ps -o pid,pcpu,pmem,comm -p $(pgrep -f "node\|ts-node\|vite") 2>/dev/null | tail -n +2)
    if [ -n "$MEMORY_USAGE" ]; then
        echo -e "${BLUE}💾 服务进程资源使用:${NC}"
        echo "   PID    CPU%  MEM%  COMMAND"
        echo "$MEMORY_USAGE" | while read line; do
            echo "   $line"
        done
    fi
    
    # 检查磁盘空间
    DISK_USAGE=$(df -h . | tail -1 | awk '{print $5}' | sed 's/%//')
    if [ "$DISK_USAGE" -gt 90 ]; then
        echo -e "${RED}⚠️  磁盘空间不足: ${DISK_USAGE}%${NC}"
    else
        echo -e "${GREEN}💾 磁盘空间: ${DISK_USAGE}% 使用${NC}"
    fi
}

# 检查日志文件
check_logs() {
    echo -e "${YELLOW}🔍 检查日志文件...${NC}"
    
    if [ -f "$PROJECT_ROOT/logs/backend.log" ]; then
        BACKEND_LOG_SIZE=$(du -h "$PROJECT_ROOT/logs/backend.log" | cut -f1)
        echo -e "${BLUE}📝 后端日志: $BACKEND_LOG_SIZE${NC}"
        
        # 检查最近的错误
        RECENT_ERRORS=$(tail -50 "$PROJECT_ROOT/logs/backend.log" | grep -i "error\|fail\|exception" | wc -l)
        if [ "$RECENT_ERRORS" -gt 0 ]; then
            echo -e "${YELLOW}⚠️  后端日志中发现 $RECENT_ERRORS 个错误/异常${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  后端日志文件不存在${NC}"
    fi
    
    if [ -f "$PROJECT_ROOT/logs/frontend.log" ]; then
        FRONTEND_LOG_SIZE=$(du -h "$PROJECT_ROOT/logs/frontend.log" | cut -f1)
        echo -e "${BLUE}📝 前端日志: $FRONTEND_LOG_SIZE${NC}"
        
        # 检查最近的错误
        RECENT_ERRORS=$(tail -50 "$PROJECT_ROOT/logs/frontend.log" | grep -i "error\|fail\|exception" | wc -l)
        if [ "$RECENT_ERRORS" -gt 0 ]; then
            echo -e "${YELLOW}⚠️  前端日志中发现 $RECENT_ERRORS 个错误/异常${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  前端日志文件不存在${NC}"
    fi
}

# 执行健康检查
echo -e "${YELLOW}🔍 开始 TODOMaster 服务健康检查...${NC}"
echo "========================================="

check_backend
BACKEND_STATUS=$?

echo ""

check_frontend
FRONTEND_STATUS=$?

echo ""

check_processes

echo ""

check_system_resources

echo ""

check_logs

echo ""
echo "========================================="

# 输出总结
echo -e "${YELLOW}📊 健康检查总结:${NC}"
if [ $BACKEND_STATUS -eq 0 ] && [ $FRONTEND_STATUS -eq 0 ]; then
    echo -e "${GREEN}✅ TODOMaster 服务运行正常${NC}"
    echo -e "${GREEN}🌐 前端访问: http://localhost:5173${NC}"
    echo -e "${GREEN}🔌 后端API: http://localhost:3000${NC}"
    echo -e "${GREEN}📖 API文档: http://localhost:3000/api/v1${NC}"
    echo -e "${GREEN}❤️  健康检查: http://localhost:3000/health${NC}"
    exit 0
else
    echo -e "${RED}❌ TODOMaster 服务存在异常${NC}"
    echo -e "${YELLOW}💡 建议检查:${NC}"
    echo -e "   1. 查看日志: cat logs/backend.log 或 cat logs/frontend.log"
    echo -e "   2. 重启服务: ./scripts/restart.sh"
    echo -e "   3. 检查依赖: cd packages/backend && npm install"
    exit 1
fi 