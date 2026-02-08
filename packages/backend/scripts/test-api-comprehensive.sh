#!/bin/bash

# 全面 API 测试脚本
# 测试所有 CRUD 操作和其他功能

BASE_URL="http://localhost:3000/api"
TOKEN=""
USER_ID=""
OBJECTIVE_ID=""
KEY_RESULT_ID=""
TASK_ID=""

# 颜色输出
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 测试计数器
PASSED=0
FAILED=0

# 测试函数
test_api() {
    local method=$1
    local endpoint=$2
    local data=$3
    local description=$4
    local save_id_var=$5  # 可选：保存返回的 ID 到变量
    
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}测试: $description${NC}"
    echo -e "${BLUE}  $method $endpoint${NC}"
    
    if [ -z "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X $method "$BASE_URL$endpoint" \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json" 2>/dev/null)
    else
        response=$(curl -s -w "\n%{http_code}" -X $method "$BASE_URL$endpoint" \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json" \
            -d "$data" 2>/dev/null)
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        echo -e "${GREEN}✅ 成功 (HTTP $http_code)${NC}"
        
        # 如果指定了保存 ID 的变量，尝试提取 ID
        if [ ! -z "$save_id_var" ]; then
            extracted_id=$(echo "$body" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('data', {}).get('${save_id_var}', {}).get('id', '') or data.get('data', {}).get('${save_id_var}', '') or '')" 2>/dev/null)
            if [ ! -z "$extracted_id" ] && [ "$extracted_id" != "None" ]; then
                eval "$save_id_var='$extracted_id'"
                echo -e "${GREEN}  📌 ID: $extracted_id${NC}"
            fi
        fi
        
        # 显示响应摘要
        echo "$body" | python3 -m json.tool 2>/dev/null | head -15
        ((PASSED++))
    else
        echo -e "${RED}❌ 失败 (HTTP $http_code)${NC}"
        echo "$body" | python3 -m json.tool 2>/dev/null | head -10
        ((FAILED++))
    fi
    echo ""
}

# 获取 token
echo -e "${YELLOW}🔐 正在登录获取 token...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"Test123456"}')

TOKEN=$(echo $LOGIN_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('token', ''))" 2>/dev/null)
USER_ID=$(echo $LOGIN_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('user', {}).get('id', ''))" 2>/dev/null)

if [ -z "$TOKEN" ]; then
    echo -e "${RED}❌ 登录失败，请先注册用户${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Token 获取成功${NC}"
echo -e "${GREEN}✅ 用户 ID: $USER_ID${NC}\n"

echo -e "${BLUE}════════════════════════════════════════════════${NC}"
echo -e "${BLUE}           开始全面 API 测试${NC}"
echo -e "${BLUE}════════════════════════════════════════════════${NC}\n"

# ============================================
# 1. 认证相关 API
# ============================================
echo -e "${YELLOW}【1. 认证相关 API】${NC}\n"

test_api "GET" "/auth/me" "" "获取当前用户信息"

# ============================================
# 2. 目标 (Objectives) CRUD
# ============================================
echo -e "${YELLOW}【2. 目标 (Objectives) CRUD】${NC}\n"

# 创建目标
OBJECTIVE_DATA='{
    "title": "完成 TODOMaster 项目开发",
    "description": "完成所有核心功能的开发和测试，包括前后端对接",
    "category": "WORK",
    "startDate": "2025-02-08",
    "endDate": "2025-12-31"
}'
test_api "POST" "/objectives" "$OBJECTIVE_DATA" "创建目标" "objective"

if [ ! -z "$OBJECTIVE_ID" ] && [ "$OBJECTIVE_ID" != "None" ]; then
    # 获取目标详情
    test_api "GET" "/objectives/$OBJECTIVE_ID" "" "获取目标详情"
    
    # 更新目标
    UPDATE_OBJECTIVE_DATA='{
        "title": "完成 TODOMaster 项目开发（已更新）",
        "description": "更新后的描述",
        "status": "ACTIVE"
    }'
    test_api "PUT" "/objectives/$OBJECTIVE_ID" "$UPDATE_OBJECTIVE_DATA" "更新目标"
    
    # 获取目标列表（带筛选）
    test_api "GET" "/objectives?category=PROFESSIONAL" "" "获取目标列表（按分类筛选）"
fi

# ============================================
# 3. 关键结果 (Key Results) CRUD
# ============================================
echo -e "${YELLOW}【3. 关键结果 (Key Results) CRUD】${NC}\n"

if [ ! -z "$OBJECTIVE_ID" ] && [ "$OBJECTIVE_ID" != "None" ]; then
    # 创建关键结果
    KEY_RESULT_DATA="{
        \"title\": \"完成数据库 Schema 统一\",
        \"description\": \"统一前后端数据库字段命名，确保一致性\",
        \"type\": \"BOOLEAN\",
        \"targetValue\": 1,
        \"objectiveId\": \"$OBJECTIVE_ID\"
    }"
    test_api "POST" "/key-results" "$KEY_RESULT_DATA" "创建关键结果" "keyResult"
    
    if [ ! -z "$KEY_RESULT_ID" ] && [ "$KEY_RESULT_ID" != "None" ]; then
        # 获取关键结果详情
        test_api "GET" "/key-results/$KEY_RESULT_ID" "" "获取关键结果详情"
        
        # 更新关键结果进度
        UPDATE_KR_PROGRESS='{
            "currentValue": 1
        }'
        test_api "PUT" "/key-results/$KEY_RESULT_ID" "$UPDATE_KR_PROGRESS" "更新关键结果进度"
        
        # 更新关键结果信息
        UPDATE_KR_DATA="{
            \"title\": \"完成数据库 Schema 统一（已更新）\",
            \"description\": \"更新后的描述\"
        }"
        test_api "PUT" "/key-results/$KEY_RESULT_ID" "$UPDATE_KR_DATA" "更新关键结果信息"
        
        # 获取关键结果列表
        test_api "GET" "/key-results?objectiveId=$OBJECTIVE_ID" "" "获取关键结果列表（按目标筛选）"
    fi
fi

# ============================================
# 4. 任务 (Tasks) CRUD
# ============================================
echo -e "${YELLOW}【4. 任务 (Tasks) CRUD】${NC}\n"

if [ ! -z "$OBJECTIVE_ID" ] && [ "$OBJECTIVE_ID" != "None" ] && [ ! -z "$KEY_RESULT_ID" ] && [ "$KEY_RESULT_ID" != "None" ]; then
    # 创建任务
    TASK_DATA="{
        \"title\": \"检查数据库 Schema 字段\",
        \"description\": \"检查 objectives 和 tasks 表的字段命名是否一致\",
        \"priority\": \"HIGH\",
        \"objectiveId\": \"$OBJECTIVE_ID\",
        \"keyResultId\": \"$KEY_RESULT_ID\",
        \"estimatedHours\": 2
    }"
    test_api "POST" "/tasks" "$TASK_DATA" "创建任务" "task"
    
    if [ ! -z "$TASK_ID" ] && [ "$TASK_ID" != "None" ]; then
        # 获取任务详情
        test_api "GET" "/tasks/$TASK_ID" "" "获取任务详情"
        
        # 更新任务状态
        UPDATE_TASK_STATUS='{
            "status": "IN_PROGRESS"
        }'
        test_api "PUT" "/tasks/$TASK_ID" "$UPDATE_TASK_STATUS" "更新任务状态为进行中"
        
        # 更新任务信息
        UPDATE_TASK_DATA='{
            "title": "检查数据库 Schema 字段（已更新）",
            "description": "更新后的任务描述",
            "priority": "CRITICAL",
            "actualHours": 1.5
        }'
        test_api "PUT" "/tasks/$TASK_ID" "$UPDATE_TASK_DATA" "更新任务信息"
        
        # 完成任务
        COMPLETE_TASK='{
            "status": "COMPLETED"
        }'
        test_api "PUT" "/tasks/$TASK_ID" "$COMPLETE_TASK" "完成任务"
        
        # 获取任务列表（带筛选）
        test_api "GET" "/tasks?status=COMPLETED" "" "获取任务列表（已完成）"
        test_api "GET" "/tasks?priority=CRITICAL" "" "获取任务列表（按优先级筛选）"
        test_api "GET" "/tasks?objectiveId=$OBJECTIVE_ID" "" "获取任务列表（按目标筛选）"
    fi
fi

# ============================================
# 5. 统计 API
# ============================================
echo -e "${YELLOW}【5. 统计 API】${NC}\n"

test_api "GET" "/stats/overview" "" "获取统计概览"
test_api "GET" "/stats/objectives/categories" "" "获取目标分类统计"
test_api "GET" "/stats/tasks/priorities" "" "获取任务优先级统计"
test_api "GET" "/stats/trends?days=30" "" "获取趋势数据（30天）"
test_api "GET" "/stats/productivity" "" "获取生产力统计"
test_api "GET" "/stats/objectives/progress" "" "获取目标进度报告"

# ============================================
# 6. 用户相关 API
# ============================================
echo -e "${YELLOW}【6. 用户相关 API】${NC}\n"

test_api "GET" "/users/profile" "" "获取用户资料"
test_api "GET" "/users/preferences" "" "获取用户偏好设置"

# ============================================
# 7. 清理测试数据（可选）
# ============================================
echo -e "${YELLOW}【7. 清理测试数据（可选）】${NC}\n"

read -p "是否删除测试数据？(y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if [ ! -z "$TASK_ID" ] && [ "$TASK_ID" != "None" ]; then
        test_api "DELETE" "/tasks/$TASK_ID" "" "删除任务"
    fi
    if [ ! -z "$KEY_RESULT_ID" ] && [ "$KEY_RESULT_ID" != "None" ]; then
        test_api "DELETE" "/key-results/$KEY_RESULT_ID" "" "删除关键结果"
    fi
    if [ ! -z "$OBJECTIVE_ID" ] && [ "$OBJECTIVE_ID" != "None" ]; then
        test_api "DELETE" "/objectives/$OBJECTIVE_ID" "" "删除目标"
    fi
fi

# ============================================
# 测试总结
# ============================================
echo -e "${BLUE}════════════════════════════════════════════════${NC}"
echo -e "${BLUE}           测试总结${NC}"
echo -e "${BLUE}════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ 通过: $PASSED${NC}"
echo -e "${RED}❌ 失败: $FAILED${NC}"
TOTAL=$((PASSED + FAILED))
if [ $TOTAL -gt 0 ]; then
    SUCCESS_RATE=$((PASSED * 100 / TOTAL))
    echo -e "${BLUE}📊 成功率: ${SUCCESS_RATE}%${NC}"
fi
echo ""
