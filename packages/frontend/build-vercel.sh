#!/bin/bash

# Vercel 构建脚本 - 处理 monorepo 依赖

set -e

echo "🔧 开始 Vercel 构建..."

# 返回项目根目录
cd "$(dirname "$0")"/../..

echo "📦 安装 shared 包依赖..."
cd packages/shared
npm install

echo "🏗️ 构建 shared 包..."
npm run build

echo "🎯 切换到 frontend 目录..."
cd ../frontend

echo "🏗️ 构建 frontend..."
npm run build

echo "📁 为 Vercel 兼容性创建 public 目录..."
# 删除可能存在的 public 目录/链接
rm -rf public
# 直接复制 dist 目录到 public
cp -r dist public

echo "✅ Vercel 构建完成！" 