#!/bin/bash

# TODOMaster 部署状态检查脚本

echo "🔍 TODOMaster 部署状态检查"
echo "=================================="
echo ""

# 检查后端状态
echo "📡 检查后端API状态..."
BACKEND_URL="https://todomaster-backend-1v0k.onrender.com"

if curl -s --max-time 10 "$BACKEND_URL" > /dev/null; then
    echo "✅ 后端API正常运行: $BACKEND_URL"
    
    # 测试健康检查端点
    HEALTH_RESPONSE=$(curl -s --max-time 10 "$BACKEND_URL/api/health")
    if [[ $? -eq 0 ]]; then
        echo "✅ 健康检查端点正常"
        echo "   响应: $(echo $HEALTH_RESPONSE | jq -r '.status // "unknown"' 2>/dev/null || echo "已连接")"
    else
        echo "⚠️  健康检查端点响应慢或异常"
    fi
else
    echo "❌ 后端API无法访问: $BACKEND_URL"
fi

echo ""

# 检查前端状态
echo "🌐 检查前端应用状态..."
FRONTEND_URL="https://todomaster-6sp0sx9z8-xiaokaihans-projects.vercel.app"

if curl -s --max-time 10 -I "$FRONTEND_URL" > /dev/null; then
    echo "✅ 前端应用正常运行: $FRONTEND_URL"
    
    # 检查内容
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$FRONTEND_URL")
    if [[ "$HTTP_STATUS" == "200" ]]; then
        echo "✅ 前端页面加载正常 (HTTP $HTTP_STATUS)"
    else
        echo "⚠️  前端返回状态码: $HTTP_STATUS"
    fi
else
    echo "🔄 前端应用正在部署中或域名未生效"
    echo "   预计等待时间: 3-8分钟"
    echo "   请稍后再试或访问 Vercel Dashboard 查看部署状态"
fi

echo ""

# 检查数据库连接
echo "🗄️  检查数据库连接..."
DB_HEALTH=$(curl -s --max-time 10 "$BACKEND_URL/api/health/db" 2>/dev/null)
if [[ $? -eq 0 ]]; then
    DB_STATUS=$(echo $DB_HEALTH | jq -r '.status // "unknown"' 2>/dev/null || echo "connected")
    if [[ "$DB_STATUS" == "connected" || "$DB_STATUS" == "ok" ]]; then
        echo "✅ 数据库连接正常"
    else
        echo "⚠️  数据库状态: $DB_STATUS"
    fi
else
    echo "❌ 无法检查数据库状态"
fi

echo ""
echo "📊 部署链接汇总"
echo "=================================="
echo "🖥️  前端应用: $FRONTEND_URL"
echo "🔧 后端API:  $BACKEND_URL"
echo "📱 API文档:  $BACKEND_URL/api"
echo "❤️  健康检查: $BACKEND_URL/api/health"
echo ""

echo "🎯 接下来的步骤："
echo "1. 等待前端部署完成 (3-8分钟)"
echo "2. 访问 https://vercel.com/dashboard 查看部署进度"
echo "3. 前端部署完成后，访问: $FRONTEND_URL"
echo "4. 使用测试账户登录: test@example.com / Test123456"
echo ""

echo "📋 故障排除："
echo "- 如果前端无法访问，请检查 Vercel Dashboard"
echo "- 如果API无法连接，请联系技术支持"
echo "- 完整部署指南: ./frontend-deployment-guide.md" 