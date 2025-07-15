#!/bin/bash

# 设置颜色
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 项目根目录
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# 重启服务
echo -e "${YELLOW}🔄 开始重启 TODOMaster 服务...${NC}"

# 停止服务
echo -e "${YELLOW}第1步: 停止现有服务${NC}"
"$PROJECT_ROOT/scripts/stop.sh"

# 等待服务完全停止
echo -e "${YELLOW}⏳ 等待服务完全停止...${NC}"
sleep 3

# 启动服务
echo -e "${YELLOW}第2步: 启动服务${NC}"
"$PROJECT_ROOT/scripts/start.sh"

# 检查重启状态
if [ $? -eq 0 ]; then
    echo -e "${GREEN}🎉 TODOMaster 服务重启成功！${NC}"
    
    # 显示服务状态
    echo -e "${YELLOW}📊 验证服务状态...${NC}"
    sleep 2
    "$PROJECT_ROOT/scripts/health-check.sh"
    
    exit 0
else
    echo -e "${RED}❌ TODOMaster 服务重启失败${NC}"
    echo -e "${YELLOW}💡 建议手动检查服务状态:${NC}"
    echo -e "   1. 检查日志: cat logs/backend.log 或 cat logs/frontend.log"
    echo -e "   2. 检查端口占用: lsof -i :3000 和 lsof -i :5173"
    echo -e "   3. 手动启动: ./scripts/start.sh"
    exit 1
fi 