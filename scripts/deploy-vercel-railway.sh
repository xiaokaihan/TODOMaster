#!/bin/bash

# TODOMaster 方案一部署脚本 (Vercel + Railway + Supabase)
# 用法: ./scripts/deploy-vercel-railway.sh [环境]
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

echo -e "${BLUE}🚀 开始部署 TODOMaster (方案一: Vercel + Railway)${NC}"
echo -e "${YELLOW}📋 部署环境: $ENV${NC}"

# 检查必要工具
check_dependencies() {
    echo -e "${YELLOW}🔍 检查部署工具...${NC}"
    
    if ! command -v vercel &> /dev/null; then
        echo -e "${RED}❌ Vercel CLI 未安装，请运行: npm i -g vercel${NC}"
        exit 1
    fi
    
    if ! command -v railway &> /dev/null; then
        echo -e "${RED}❌ Railway CLI 未安装，请运行: npm i -g @railway/cli${NC}"
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
    
    if [ -z "$RAILWAY_TOKEN" ]; then
        echo -e "${YELLOW}⚠️  未设置 Railway token，将使用交互式登录${NC}"
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

# 部署后端到 Railway
deploy_backend() {
    echo -e "${YELLOW}🔧 部署后端到 Railway...${NC}"
    cd "$BACKEND_DIR"
    
    # 检查是否已链接项目
    if [ ! -f ".railway/project" ]; then
        echo -e "${YELLOW}🔗 首次部署，正在链接 Railway 项目...${NC}"
        railway login
        railway init
    fi
    
    # 设置环境变量
    echo -e "${YELLOW}⚙️  设置环境变量...${NC}"
    railway variables set NODE_ENV=production
    railway variables set PORT=3000
    railway variables set API_PREFIX=/api/v1
    
    # 部署
    echo -e "${YELLOW}🚀 开始部署后端...${NC}"
    railway up --detach
    
    # 获取部署URL
    BACKEND_URL=$(railway status --json | jq -r '.deployments[0].url' 2>/dev/null || echo "")
    if [ -n "$BACKEND_URL" ]; then
        echo -e "${GREEN}✅ 后端部署完成: $BACKEND_URL${NC}"
        echo "BACKEND_URL=$BACKEND_URL" > "$PROJECT_ROOT/.deploy-env"
    else
        echo -e "${YELLOW}⚠️  无法获取后端URL，请手动检查Railway控制台${NC}"
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
                echo -e "${RED}❌ 后端服务异常${NC}"
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
    
    # 等待后端服务启动
    echo -e "${YELLOW}⏳ 等待后端服务启动 (30秒)...${NC}"
    sleep 30
    
    deploy_frontend
    health_check
    
    echo -e "${GREEN}🎉 部署完成！${NC}"
    echo -e "${BLUE}📋 部署总结:${NC}"
    echo -e "   - 环境: $ENV"
    echo -e "   - 后端: Railway"
    echo -e "   - 前端: Vercel"
    echo -e "   - 数据库: 需要手动配置 Supabase"
    
    cleanup
}

# 捕获中断信号
trap cleanup EXIT

# 执行主流程
main 