#!/bin/bash

# TODOMaster 后端API自动验证脚本
# 使用方法: chmod +x verify-backend.sh && ./verify-backend.sh

# 配置
API_BASE="https://todomaster-backend-1v0k.onrender.com"
API_URL="${API_BASE}/api"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 测试计数器
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# 输出函数
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_test() {
    echo -e "${YELLOW}测试: $1${NC}"
    TESTS_RUN=$((TESTS_RUN + 1))
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}\n"
    TESTS_PASSED=$((TESTS_PASSED + 1))
}

print_error() {
    echo -e "${RED}❌ $1${NC}\n"
    TESTS_FAILED=$((TESTS_FAILED + 1))
}

# HTTP状态码检查函数
check_http_status() {
    local url=$1
    local expected_status=${2:-200}
    local method=${3:-GET}
    local data=$4
    local headers=$5
    
    if [ "$method" = "POST" ] && [ -n "$data" ]; then
        response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X POST \
            -H "Content-Type: application/json" \
            ${headers:+-H "$headers"} \
            -d "$data" "$url")
    else
        response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
            ${headers:+-H "$headers"} "$url")
    fi
    
    body=$(echo "$response" | sed -E 's/HTTPSTATUS\:[0-9]{3}$//')
    status=$(echo "$response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
    
    if [ "$status" -eq "$expected_status" ]; then
        return 0
    else
        echo "期望状态码: $expected_status, 实际状态码: $status"
        echo "响应内容: $body"
        return 1
    fi
}

# 开始测试
print_header "TODOMaster 后端API验证测试"

# 1. 基础健康检查
print_header "1. 基础健康检查"

print_test "API根路径响应"
if check_http_status "$API_BASE"; then
    print_success "API服务器正常运行"
else
    print_error "API服务器无响应"
fi

print_test "健康检查端点"
if check_http_status "$API_URL/health"; then
    print_success "健康检查端点正常"
else
    print_error "健康检查端点异常"
fi

print_test "系统状态检查"
if check_http_status "$API_URL/health/status"; then
    print_success "系统状态检查正常"
else
    print_error "系统状态检查异常"
fi

print_test "数据库连接检查"
if check_http_status "$API_URL/health/db"; then
    print_success "数据库连接正常"
else
    print_error "数据库连接异常"
fi

# 2. 认证功能测试
print_header "2. 用户认证功能测试"

# 生成随机测试用户
TEST_EMAIL="test_$(date +%s)@example.com"
TEST_PASSWORD="Test123456"

print_test "用户注册功能"
register_data='{
  "email": "'$TEST_EMAIL'",
  "password": "'$TEST_PASSWORD'",
  "confirmPassword": "'$TEST_PASSWORD'",
  "firstName": "Test",
  "lastName": "User"
}'

if check_http_status "$API_URL/auth/register" 201 "POST" "$register_data"; then
    print_success "用户注册功能正常"
else
    print_error "用户注册功能异常"
fi

print_test "用户登录功能"
login_data='{
  "email": "'$TEST_EMAIL'",
  "password": "'$TEST_PASSWORD'"
}'

response=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "$login_data" \
    "$API_URL/auth/login")

if echo "$response" | grep -q "token"; then
    TOKEN=$(echo "$response" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    print_success "用户登录功能正常 - Token获取成功"
else
    print_error "用户登录功能异常 - 无法获取Token"
    TOKEN=""
fi

if [ -n "$TOKEN" ]; then
    print_test "受保护路由访问"
    if check_http_status "$API_URL/auth/me" 200 "GET" "" "Authorization: Bearer $TOKEN"; then
        print_success "JWT认证功能正常"
    else
        print_error "JWT认证功能异常"
    fi
fi

# 3. 未授权访问测试
print_header "3. 安全性验证"

print_test "未授权访问保护"
if check_http_status "$API_URL/objectives" 401; then
    print_success "未授权访问被正确拒绝"
else
    print_error "未授权访问保护异常"
fi

print_test "无效Token处理"
if check_http_status "$API_URL/objectives" 401 "GET" "" "Authorization: Bearer invalid_token"; then
    print_success "无效Token被正确拒绝"
else
    print_error "无效Token处理异常"
fi

# 4. 核心业务功能测试（需要有效Token）
if [ -n "$TOKEN" ]; then
    print_header "4. 核心业务功能测试"
    
    print_test "目标列表获取"
    if check_http_status "$API_URL/objectives" 200 "GET" "" "Authorization: Bearer $TOKEN"; then
        print_success "目标API正常访问"
    else
        print_error "目标API访问异常"
    fi
    
    print_test "关键结果列表获取"
    if check_http_status "$API_URL/key-results" 200 "GET" "" "Authorization: Bearer $TOKEN"; then
        print_success "关键结果API正常访问"
    else
        print_error "关键结果API访问异常"
    fi
    
    print_test "任务列表获取"
    if check_http_status "$API_URL/tasks" 200 "GET" "" "Authorization: Bearer $TOKEN"; then
        print_success "任务API正常访问"
    else
        print_error "任务API访问异常"
    fi
    
    print_test "统计数据获取"
    if check_http_status "$API_URL/stats/overview" 200 "GET" "" "Authorization: Bearer $TOKEN"; then
        print_success "统计API正常访问"
    else
        print_error "统计API访问异常"
    fi
fi

# 5. 性能测试
print_header "5. 性能测试"

print_test "API响应时间测试"
start_time=$(date +%s%N)
curl -s "$API_URL/health" > /dev/null
end_time=$(date +%s%N)
response_time=$(( (end_time - start_time) / 1000000 ))

if [ "$response_time" -lt 2000 ]; then
    print_success "API响应时间: ${response_time}ms (< 2000ms)"
else
    print_error "API响应时间过慢: ${response_time}ms"
fi

# 6. CORS测试
print_header "6. CORS配置测试"

print_test "CORS预检请求"
cors_response=$(curl -s -I -X OPTIONS \
    -H "Origin: https://todomaster-frontend.vercel.app" \
    -H "Access-Control-Request-Method: POST" \
    -H "Access-Control-Request-Headers: Content-Type,Authorization" \
    "$API_URL/auth/login")

if echo "$cors_response" | grep -q "Access-Control-Allow-Origin"; then
    print_success "CORS配置正常"
else
    print_error "CORS配置可能存在问题"
fi

# 测试总结
print_header "测试总结"

echo -e "总共运行测试: ${BLUE}$TESTS_RUN${NC}"
echo -e "通过测试: ${GREEN}$TESTS_PASSED${NC}"
echo -e "失败测试: ${RED}$TESTS_FAILED${NC}"

if [ "$TESTS_FAILED" -eq 0 ]; then
    echo -e "\n${GREEN}🎉 所有测试通过！后端API部署成功！${NC}"
    exit 0
else
    echo -e "\n${RED}⚠️  有 $TESTS_FAILED 个测试失败，请检查相关配置${NC}"
    exit 1
fi 