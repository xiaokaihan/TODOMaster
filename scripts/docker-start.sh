#!/bin/bash

# 设置颜色
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目根目录
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# 默认配置
MODE="dev"
DETACH=true
BUILD=false
LOGS=false

# 帮助信息
show_help() {
    echo -e "${YELLOW}TODOMaster Docker 启动脚本${NC}"
    echo ""
    echo "使用方法:"
    echo "  $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -m, --mode MODE      运行模式: dev (默认) 或 prod"
    echo "  -f, --foreground     前台运行 (不使用 -d 参数)"
    echo "  -b, --build          强制重新构建镜像"
    echo "  -l, --logs           启动后显示日志"
    echo "  -h, --help           显示帮助信息"
    echo ""
    echo "示例:"
    echo "  $0                   # 开发模式启动"
    echo "  $0 -m prod           # 生产模式启动"
    echo "  $0 -b -l             # 重新构建并显示日志"
    echo "  $0 -f                # 前台运行"
}

# 解析命令行参数
while [[ $# -gt 0 ]]; do
    case $1 in
        -m|--mode)
            MODE="$2"
            shift 2
            ;;
        -f|--foreground)
            DETACH=false
            shift
            ;;
        -b|--build)
            BUILD=true
            shift
            ;;
        -l|--logs)
            LOGS=true
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            echo -e "${RED}未知选项: $1${NC}"
            show_help
            exit 1
            ;;
    esac
done

# 验证模式
if [[ "$MODE" != "dev" && "$MODE" != "prod" ]]; then
    echo -e "${RED}❌ 无效的模式: $MODE${NC}"
    echo -e "${YELLOW}💡 支持的模式: dev, prod${NC}"
    exit 1
fi

# 设置docker-compose文件
if [[ "$MODE" == "prod" ]]; then
    COMPOSE_FILE="docker-compose.prod.yml"
    ENV_FILE=".env.production"
else
    COMPOSE_FILE="docker-compose.yml"
    ENV_FILE=".env"
fi

# 检查Docker是否运行
if ! docker info >/dev/null 2>&1; then
    echo -e "${RED}❌ Docker 未运行，请先启动 Docker${NC}"
    exit 1
fi

# 检查docker-compose文件是否存在
if [[ ! -f "$PROJECT_ROOT/$COMPOSE_FILE" ]]; then
    echo -e "${RED}❌ Docker Compose 文件不存在: $COMPOSE_FILE${NC}"
    exit 1
fi

cd "$PROJECT_ROOT"

echo -e "${YELLOW}🐳 开始启动 TODOMaster Docker 服务...${NC}"
echo -e "${BLUE}📋 配置信息:${NC}"
echo -e "   - 运行模式: $MODE"
echo -e "   - Compose文件: $COMPOSE_FILE"
echo -e "   - 后台运行: $DETACH"
echo -e "   - 重新构建: $BUILD"
echo -e "   - 显示日志: $LOGS"
echo ""

# 构建命令
DOCKER_CMD="docker-compose -f $COMPOSE_FILE"

# 检查是否需要停止现有服务
RUNNING_CONTAINERS=$(docker-compose -f $COMPOSE_FILE ps -q 2>/dev/null)
if [[ -n "$RUNNING_CONTAINERS" ]]; then
    echo -e "${YELLOW}⚠️  检测到正在运行的容器，是否停止现有服务？ (y/N)${NC}"
    read -r -n 1 REPLY
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}🛑 停止现有服务...${NC}"
        $DOCKER_CMD down
    fi
fi

# 构建选项
if [[ "$BUILD" == true ]]; then
    echo -e "${YELLOW}🔨 构建镜像...${NC}"
    $DOCKER_CMD build --no-cache
fi

# 启动服务
echo -e "${YELLOW}🚀 启动服务...${NC}"
if [[ "$DETACH" == true ]]; then
    $DOCKER_CMD up -d
else
    $DOCKER_CMD up
fi

# 检查启动状态
if [[ $? -eq 0 ]]; then
    echo -e "${GREEN}🎉 TODOMaster Docker 服务启动成功！${NC}"
    
    # 等待服务完全启动
    echo -e "${YELLOW}⏳ 等待服务完全启动...${NC}"
    sleep 10
    
    # 显示服务状态
    echo -e "${BLUE}📊 服务状态:${NC}"
    $DOCKER_CMD ps
    
    echo ""
    echo -e "${GREEN}🌐 服务地址:${NC}"
    if [[ "$MODE" == "prod" ]]; then
        echo -e "   - 前端: http://localhost"
        echo -e "   - 后端API: http://localhost:3000"
    else
        echo -e "   - 前端: http://localhost:5173"
        echo -e "   - 后端API: http://localhost:3000"
    fi
    echo -e "   - 数据库: localhost:5432"
    echo -e "   - 健康检查: http://localhost:3000/health"
    
    # 显示日志
    if [[ "$LOGS" == true ]]; then
        echo ""
        echo -e "${YELLOW}📝 实时日志 (Ctrl+C 退出):${NC}"
        $DOCKER_CMD logs -f
    fi
    
else
    echo -e "${RED}❌ TODOMaster Docker 服务启动失败${NC}"
    echo -e "${YELLOW}💡 建议检查:${NC}"
    echo -e "   1. 查看日志: docker-compose -f $COMPOSE_FILE logs"
    echo -e "   2. 检查端口占用: lsof -i :3000 -i :5173"
    echo -e "   3. 重新构建: $0 -b"
    exit 1
fi 