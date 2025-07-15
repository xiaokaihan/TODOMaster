#!/bin/bash

# TODOMaster 方案一部署脚本 (Vercel + Render + Supabase)
# 用法: ./scripts/deploy-vercel-render.sh [环境]
# 环境: dev, staging, prod (默认: prod)

set -e

# 设置颜色
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 配置
ENV=${1:-prod}
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND_DIR="$PROJECT_ROOT/packages/frontend"
BACKEND_DIR="$PROJECT_ROOT/packages/backend"
SHARED_DIR="$PROJECT_ROOT/packages/shared"

echo -e "${BLUE}🚀 开始部署 TODOMaster (方案一: Vercel + Render)${NC}"
echo -e "${YELLOW}📋 部署环境: $ENV${NC}"

# 检查必要工具
check_dependencies() {
    echo -e "${YELLOW}🔍 检查部署工具...${NC}"
    
    if ! command -v vercel &> /dev/null; then
        echo -e "${RED}❌ Vercel CLI 未安装，请运行: npm i -g vercel${NC}"
        exit 1
    fi
    
    if ! command -v git &> /dev/null; then
        echo -e "${RED}❌ Git 未安装${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ 部署工具检查完成${NC}"
}

# 检查环境变量
check_environment() {
    echo -e "${YELLOW}🔍 检查环境变量...${NC}"
    
    if [ -z "$VERCEL_TOKEN" ] && [ -z "$VERCEL_ORG_ID" ]; then
        echo -e "${YELLOW}⚠️  未设置 Vercel token，将使用交互式登录${NC}"
    fi
    
    if [ -z "$RENDER_API_KEY" ]; then
        echo -e "${YELLOW}⚠️  未设置 Render API key，需要手动部署后端${NC}"
    fi
    
    echo -e "${GREEN}✅ 环境变量检查完成${NC}"
}

# 构建共享包
build_shared() {
    echo -e "${YELLOW}📦 构建共享包...${NC}"
    cd "$SHARED_DIR"
    
    if [ ! -f "package.json" ]; then
        echo -e "${RED}❌ 共享包配置文件不存在${NC}"
        exit 1
    fi
    
    npm install
    npm run build
    
    echo -e "${GREEN}✅ 共享包构建完成${NC}"
}

# 部署后端到 Render (通过Git)
deploy_backend() {
    echo -e "${YELLOW}🔧 准备后端部署到 Render...${NC}"
    
    echo -e "${BLUE}📋 Render 部署说明:${NC}"
    echo -e "   1. 访问 https://render.com"
    echo -e "   2. 连接您的 GitHub 仓库: xiaokaihan/TODOMaster"
    echo -e "   3. 创建 Web Service"
    echo -e "   4. 使用根目录下的 render.yaml 配置"
    echo -e "   5. 或手动配置:"
    echo -e "      - Name: todomaster-backend"
    echo -e "      - Runtime: Node"
    echo -e "      - Build Command: cd packages/shared && npm install && npm run build && cd ../backend && npm install && npm run build"
    echo -e "      - Start Command: cd packages/backend && npm start"
    echo -e "      - Auto-Deploy: Yes"
    
    # 如果设置了RENDER_BACKEND_URL，使用它
    if [ -n "$RENDER_BACKEND_URL" ]; then
        BACKEND_URL="$RENDER_BACKEND_URL"
        echo -e "${GREEN}✅ 后端部署URL已配置: $BACKEND_URL${NC}"
        echo "BACKEND_URL=$BACKEND_URL" > "$PROJECT_ROOT/.deploy-env"
    else
        echo -e "${YELLOW}⚠️  请手动设置 RENDER_BACKEND_URL 环境变量${NC}"
        echo -e "${YELLOW}⚠️  或在 Render 控制台完成部署后更新脚本${NC}"
    fi
}

# 部署前端到 Vercel
deploy_frontend() {
    echo -e "${YELLOW}🎨 部署前端到 Vercel...${NC}"
    cd "$FRONTEND_DIR"
    
    # 检查后端URL
    if [ -f "$PROJECT_ROOT/.deploy-env" ]; then
        source "$PROJECT_ROOT/.deploy-env"
        if [ -n "$BACKEND_URL" ]; then
            echo -e "${YELLOW}⚙️  设置API URL: $BACKEND_URL/api/v1${NC}"
            echo "VITE_API_URL=$BACKEND_URL/api/v1" > .env.production.local
        fi
    fi
    
    # 构建前端
    echo -e "${YELLOW}🏗️  构建前端应用...${NC}"
    npm run build:vercel
    
    # 部署到Vercel
    echo -e "${YELLOW}🚀 开始部署前端...${NC}"
    if [ "$ENV" = "prod" ]; then
        vercel --prod --yes
    else
        vercel --yes
    fi
    
    # 获取部署URL
    FRONTEND_URL=$(vercel ls --scope="$VERCEL_ORG_ID" 2>/dev/null | grep "$PWD" | head -1 | awk '{print $2}' || echo "")
    if [ -n "$FRONTEND_URL" ]; then
        echo -e "${GREEN}✅ 前端部署完成: https://$FRONTEND_URL${NC}"
    fi
}

# 健康检查
health_check() {
    echo -e "${YELLOW}🔍 执行健康检查...${NC}"
    
    if [ -f "$PROJECT_ROOT/.deploy-env" ]; then
        source "$PROJECT_ROOT/.deploy-env"
        
        if [ -n "$BACKEND_URL" ]; then
            echo -e "${YELLOW}检查后端服务...${NC}"
            if curl -f "$BACKEND_URL/health" &> /dev/null; then
                echo -e "${GREEN}✅ 后端服务正常${NC}"
            else
                echo -e "${YELLOW}⚠️  后端服务可能还在启动中${NC}"
            fi
        fi
    fi
}

# 清理临时文件
cleanup() {
    echo -e "${YELLOW}🧹 清理临时文件...${NC}"
    rm -f "$PROJECT_ROOT/.deploy-env"
    rm -f "$FRONTEND_DIR/.env.production.local"
    echo -e "${GREEN}✅ 清理完成${NC}"
}

# 主部署流程
main() {
    echo -e "${BLUE}开始执行部署流程...${NC}"
    
    check_dependencies
    check_environment
    build_shared
    deploy_backend
    
    # 等待用户确认后端部署
    if [ -z "$RENDER_BACKEND_URL" ]; then
        echo -e "${YELLOW}⏳ 请完成 Render 后端部署，然后按任意键继续...${NC}"
        read -n 1 -s
    fi
    
    deploy_frontend
    health_check
    
    echo -e "${GREEN}🎉 部署完成！${NC}"
    echo -e "${BLUE}📋 部署总结:${NC}"
    echo -e "   - 环境: $ENV"
    echo -e "   - 后端: Render (需要手动配置)"
    echo -e "   - 前端: Vercel"
    echo -e "   - 数据库: 需要配置 Supabase 或 Render PostgreSQL"
    
    cleanup
}

# 捕获中断信号
trap cleanup EXIT

# 执行主流程
main 