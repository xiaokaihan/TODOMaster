#!/bin/bash

# 设置颜色
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目根目录
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# 检查Docker服务健康状态
check_docker_health() {
    echo -e "${YELLOW}🔍 检查 Docker 服务健康状态...${NC}"
    echo "========================================="
    
    # 检查开发环境
    echo -e "${BLUE}📊 开发环境状态:${NC}"
    if [[ -f "$PROJECT_ROOT/docker-compose.yml" ]]; then
        docker-compose -f docker-compose.yml ps
        echo ""
        
        # 检查各个服务的健康状态
        check_container_health "todomaster-postgres" "数据库"
        check_container_health "todomaster-backend" "后端"
        check_container_health "todomaster-frontend" "前端"
    else
        echo -e "${YELLOW}⚠️  开发环境配置文件不存在${NC}"
    fi
    
    echo ""
    echo -e "${BLUE}📊 生产环境状态:${NC}"
    if [[ -f "$PROJECT_ROOT/docker-compose.prod.yml" ]]; then
        docker-compose -f docker-compose.prod.yml ps
        echo ""
        
        # 检查各个服务的健康状态
        check_container_health "todomaster-postgres-prod" "数据库"
        check_container_health "todomaster-backend-prod" "后端"
        check_container_health "todomaster-frontend-prod" "前端"
    else
        echo -e "${YELLOW}⚠️  生产环境配置文件不存在${NC}"
    fi
}

# 检查单个容器健康状态
check_container_health() {
    local container_name=$1
    local service_name=$2
    
    if docker ps --filter "name=$container_name" --format "{{.Names}}" | grep -q "$container_name"; then
        local status=$(docker inspect --format='{{.State.Health.Status}}' "$container_name" 2>/dev/null)
        local running=$(docker inspect --format='{{.State.Running}}' "$container_name" 2>/dev/null)
        
        if [[ "$running" == "true" ]]; then
            if [[ "$status" == "healthy" ]]; then
                echo -e "${GREEN}✅ $service_name ($container_name): 运行正常${NC}"
            elif [[ "$status" == "unhealthy" ]]; then
                echo -e "${RED}❌ $service_name ($container_name): 健康检查失败${NC}"
            else
                echo -e "${YELLOW}⚠️  $service_name ($container_name): 运行中 (无健康检查)${NC}"
            fi
        else
            echo -e "${RED}❌ $service_name ($container_name): 未运行${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  $service_name ($container_name): 容器不存在${NC}"
    fi
}

# 检查端口连通性
check_port_connectivity() {
    echo -e "${YELLOW}🔍 检查端口连通性...${NC}"
    echo "========================================="
    
    # 检查前端端口
    if curl -s http://localhost:5173 >/dev/null 2>&1; then
        echo -e "${GREEN}✅ 前端服务 (端口 5173): 可访问${NC}"
    else
        echo -e "${RED}❌ 前端服务 (端口 5173): 不可访问${NC}"
    fi
    
    # 检查后端API端口
    if curl -s http://localhost:3000/health >/dev/null 2>&1; then
        echo -e "${GREEN}✅ 后端API (端口 3000): 可访问${NC}"
        
        # 获取健康检查详情
        local health_response=$(curl -s http://localhost:3000/health)
        echo -e "${BLUE}📋 后端健康状态: $health_response${NC}"
    else
        echo -e "${RED}❌ 后端API (端口 3000): 不可访问${NC}"
    fi
    
    # 检查数据库端口
    if nc -z localhost 5432 2>/dev/null; then
        echo -e "${GREEN}✅ 数据库 (端口 5432): 可访问${NC}"
    else
        echo -e "${RED}❌ 数据库 (端口 5432): 不可访问${NC}"
    fi
}

# 检查资源使用情况
check_resource_usage() {
    echo -e "${YELLOW}🔍 检查资源使用情况...${NC}"
    echo "========================================="
    
    # 检查Docker系统信息
    echo -e "${BLUE}📊 Docker 系统信息:${NC}"
    docker system df
    
    echo ""
    echo -e "${BLUE}📊 容器资源使用:${NC}"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}" $(docker ps --filter "name=todomaster" -q) 2>/dev/null || echo "没有运行的容器"
}

# 检查日志
check_logs() {
    echo -e "${YELLOW}🔍 检查最近的错误日志...${NC}"
    echo "========================================="
    
    local containers=("todomaster-postgres" "todomaster-backend" "todomaster-frontend" "todomaster-postgres-prod" "todomaster-backend-prod" "todomaster-frontend-prod")
    
    for container in "${containers[@]}"; do
        if docker ps --filter "name=$container" --format "{{.Names}}" | grep -q "$container"; then
            echo -e "${BLUE}📝 $container 最近错误:${NC}"
            docker logs --tail=10 "$container" 2>&1 | grep -i "error\|fail\|exception" | head -3 || echo "  无错误日志"
            echo ""
        fi
    done
}

# 主函数
main() {
    echo -e "${YELLOW}🐳 TODOMaster Docker 健康检查${NC}"
    echo ""
    
    cd "$PROJECT_ROOT"
    
    # 检查Docker是否运行
    if ! docker info >/dev/null 2>&1; then
        echo -e "${RED}❌ Docker 未运行，请先启动 Docker${NC}"
        exit 1
    fi
    
    check_docker_health
    echo ""
    check_port_connectivity
    echo ""
    check_resource_usage
    echo ""
    check_logs
    
    echo "========================================="
    echo -e "${GREEN}🎉 健康检查完成！${NC}"
    echo -e "${YELLOW}💡 有用的命令:${NC}"
    echo -e "   - 查看详细日志: docker-compose logs -f [service_name]"
    echo -e "   - 重启服务: ./scripts/docker-start.sh -b"
    echo -e "   - 停止服务: ./scripts/docker-stop.sh"
}

# 执行主函数
main "$@" 