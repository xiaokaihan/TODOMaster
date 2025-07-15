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
MODE="all"
REMOVE_VOLUMES=false

# 帮助信息
show_help() {
    echo -e "${YELLOW}TODOMaster Docker 停止脚本${NC}"
    echo ""
    echo "使用方法:"
    echo "  $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -m, --mode MODE      停止模式: dev, prod, 或 all (默认)"
    echo "  -v, --volumes        删除数据卷 (注意：会删除数据库数据)"
    echo "  -h, --help           显示帮助信息"
    echo ""
    echo "示例:"
    echo "  $0                   # 停止所有容器"
    echo "  $0 -m dev            # 只停止开发环境"
    echo "  $0 -v                # 停止容器并删除数据卷"
}

# 解析命令行参数
while [[ $# -gt 0 ]]; do
    case $1 in
        -m|--mode)
            MODE="$2"
            shift 2
            ;;
        -v|--volumes)
            REMOVE_VOLUMES=true
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

cd "$PROJECT_ROOT"

echo -e "${YELLOW}🛑 开始停止 TODOMaster Docker 服务...${NC}"

# 停止服务函数
stop_services() {
    local compose_file=$1
    local env_name=$2
    
    if [[ -f "$compose_file" ]]; then
        echo -e "${YELLOW}🛑 停止 $env_name 环境服务...${NC}"
        
        if [[ "$REMOVE_VOLUMES" == true ]]; then
            docker-compose -f "$compose_file" down -v
        else
            docker-compose -f "$compose_file" down
        fi
        echo -e "${GREEN}✅ $env_name 环境服务已停止${NC}"
    fi
}

# 根据模式停止服务
case $MODE in
    "dev")
        stop_services "docker-compose.yml" "开发"
        ;;
    "prod")
        stop_services "docker-compose.prod.yml" "生产"
        ;;
    "all")
        stop_services "docker-compose.yml" "开发"
        stop_services "docker-compose.prod.yml" "生产"
        ;;
esac

echo -e "${GREEN}🎉 TODOMaster Docker 服务停止完成！${NC}" 