#!/bin/bash

# API 测试脚本
# 使用方法: ./scripts/test-api.sh [token]
# 如果不提供 token，会自动登录获取

BASE_URL="http://localhost:3000/api"
TOKEN=""

# 颜色输出
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 获取 token
if [ -z "$1" ]; then
    echo -e "${YELLOW}🔐 正在登录获取 token...${NC}"
    LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"email":"test@example.com","password":"Test123456"}')
    
    TOKEN=$(echo $LOGIN_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['token'])" 2>/dev/null)
    
    if [ -z "$TOKEN" ]; then
        echo -e "${RED}❌ 登录失败，请先注册用户${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Token 获取成功${NC}"
else
    TOKEN="$1"
fi

echo -e "\n${YELLOW}=== 开始测试 API ===${NC}\n"

# 测试函数
test_api() {
    local method=$1
    local endpoint=$2
    local data=$3
    local description=$4
    
    echo -e "${YELLOW}测试: $description${NC}"
    echo "  $method $endpoint"
    
    if [ -z "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X $method "$BASE_URL$endpoint" \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json")
    else
        response=$(curl -s -w "\n%{http_code}" -X $method "$BASE_URL$endpoint" \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json" \
            -d "$data")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        echo -e "${GREEN}✅ 成功 (HTTP $http_code)${NC}"
        echo "$body" | python3 -m json.tool 2>/dev/null | head -20
    else
        echo -e "${RED}❌ 失败 (HTTP $http_code)${NC}"
        echo "$body" | python3 -m json.tool 2>/dev/null | head -10
    fi
    echo ""
}

# 1. 测试获取当前用户信息
test_api "GET" "/auth/me" "" "获取当前用户信息"

# 2. 测试创建目标
OBJECTIVE_DATA='{
    "title": "完成 TODOMaster 项目开发",
    "description": "完成所有核心功能的开发和测试",
    "category": "PROFESSIONAL",
    "startDate": "2025-02-08",
    "endDate": "2025-12-31"
}'
OBJECTIVE_RESPONSE=$(test_api "POST" "/objectives" "$OBJECTIVE_DATA" "创建目标")
OBJECTIVE_ID=$(echo "$OBJECTIVE_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('data', {}).get('objective', {}).get('id', ''))" 2>/dev/null)

if [ ! -z "$OBJECTIVE_ID" ] && [ "$OBJECTIVE_ID" != "None" ]; then
    echo -e "${GREEN}✅ 目标 ID: $OBJECTIVE_ID${NC}\n"
    
    # 3. 测试获取目标详情
    test_api "GET" "/objectives/$OBJECTIVE_ID" "" "获取目标详情"
    
    # 4. 测试创建关键结果
    KEY_RESULT_DATA="{
        \"title\": \"完成数据库 Schema 统一\",
        \"description\": \"统一前后端数据库字段命名\",
        \"type\": \"BOOLEAN\",
        \"targetValue\": 1,
        \"objectiveId\": \"$OBJECTIVE_ID\"
    }"
    KR_RESPONSE=$(test_api "POST" "/key-results" "$KEY_RESULT_DATA" "创建关键结果")
    KR_ID=$(echo "$KR_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('data', {}).get('keyResult', {}).get('id', ''))" 2>/dev/null)
    
    if [ ! -z "$KR_ID" ] && [ "$KR_ID" != "None" ]; then
        echo -e "${GREEN}✅ 关键结果 ID: $KR_ID${NC}\n"
        
        # 5. 测试更新关键结果进度
        UPDATE_KR_DATA="{
            \"currentValue\": 1
        }"
        test_api "PUT" "/key-results/$KR_ID" "$UPDATE_KR_DATA" "更新关键结果进度"
        
        # 6. 测试创建任务
        TASK_DATA="{
            \"title\": \"检查数据库 Schema\",
            \"description\": \"检查 objectives 和 tasks 表的字段命名\",
            \"priority\": \"HIGH\",
            \"objectiveId\": \"$OBJECTIVE_ID\",
            \"keyResultId\": \"$KR_ID\"
        }"
        TASK_RESPONSE=$(test_api "POST" "/tasks" "$TASK_DATA" "创建任务")
        TASK_ID=$(echo "$TASK_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('data', {}).get('task', {}).get('id', ''))" 2>/dev/null)
        
        if [ ! -z "$TASK_ID" ] && [ "$TASK_ID" != "None" ]; then
            echo -e "${GREEN}✅ 任务 ID: $TASK_ID${NC}\n"
            
            # 7. 测试更新任务状态
            UPDATE_TASK_DATA='{
                "status": "COMPLETED"
            }'
            test_api "PUT" "/tasks/$TASK_ID" "$UPDATE_TASK_DATA" "更新任务状态"
        fi
    fi
fi

# 8. 测试获取目标列表
test_api "GET" "/objectives" "" "获取目标列表"

# 9. 测试获取关键结果列表
test_api "GET" "/key-results" "" "获取关键结果列表"

# 10. 测试获取任务列表
test_api "GET" "/tasks" "" "获取任务列表"

# 11. 测试统计接口
test_api "GET" "/stats/overview" "" "获取统计概览"

# 12. 测试分类统计
test_api "GET" "/stats/objectives/categories" "" "获取目标分类统计"

# 13. 测试优先级统计
test_api "GET" "/stats/tasks/priorities" "" "获取任务优先级统计"

echo -e "${GREEN}=== API 测试完成 ===${NC}"
