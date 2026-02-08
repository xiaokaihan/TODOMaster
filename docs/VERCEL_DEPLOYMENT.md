# Vercel 部署指南

## ✅ 项目已配置支持 Vercel 部署

该项目**完全支持**通过 Vercel 部署前端应用。

## 📋 部署配置概览

### 1. Vercel 配置文件

项目根目录已有 `vercel.json` 配置文件：

```json
{
  "framework": "vite",
  "buildCommand": "yarn workspace @todomaster/shared build && yarn workspace @todomaster/frontend build:vercel",
  "outputDirectory": "packages/frontend/dist",
  "routes": [
    {
      "handle": "filesystem"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

### 2. 构建脚本

前端包包含 `build-vercel.sh` 脚本，处理 monorepo 依赖关系：
- ✅ 构建 shared 包
- ✅ 构建 frontend 包
- ✅ 处理依赖关系

## 🚀 部署方式

### 方式一：通过 Vercel Dashboard（推荐）

1. **访问 Vercel**
   - 登录 https://vercel.com
   - 点击 "Add New Project"

2. **导入项目**
   - 连接 GitHub 仓库
   - 选择 `TODOMaster` 项目

3. **配置项目**
   - **Framework Preset**: Vite（自动检测）
   - **Root Directory**: 保持默认（项目根目录）
   - **Build Command**: 自动从 `vercel.json` 读取
   - **Output Directory**: 自动从 `vercel.json` 读取

4. **环境变量**（重要）
   在 Vercel 项目设置中添加：
   ```
   VITE_API_BASE_URL=https://your-backend-url.onrender.com/api
   ```
   或使用代理（推荐）：
   ```
   VITE_API_BASE_URL=/api
   ```
   然后在 `vercel.json` 中配置 API 代理（如果需要）

5. **部署**
   - 点击 "Deploy"
   - Vercel 会自动构建并部署

### 方式二：通过 Vercel CLI

```bash
# 1. 安装 Vercel CLI
npm install -g vercel

# 2. 登录
vercel login

# 3. 在项目根目录部署
vercel

# 4. 生产环境部署
vercel --prod
```

## ⚙️ 环境变量配置

在 Vercel Dashboard > Project Settings > Environment Variables 中配置：

### 必需变量

```bash
# API 基础 URL（根据后端部署位置调整）
VITE_API_BASE_URL=https://your-backend.onrender.com/api
```

### 可选变量

```bash
# 应用名称
VITE_APP_NAME=TODOMaster

# 应用版本
VITE_APP_VERSION=1.0.0
```

## 🔧 构建流程

Vercel 构建时会执行以下步骤：

1. **安装依赖**
   ```bash
   yarn install  # 或 npm install
   ```

2. **构建 shared 包**
   ```bash
   yarn workspace @todomaster/shared build
   ```

3. **构建 frontend 包**
   ```bash
   yarn workspace @todomaster/frontend build:vercel
   ```

4. **输出目录**
   - 构建产物输出到 `packages/frontend/dist`
   - Vercel 自动部署该目录

## 📝 注意事项

### 1. Monorepo 支持

✅ **已配置**: 项目使用 yarn workspaces，Vercel 会自动识别并处理依赖关系

### 2. 路径别名

✅ **已配置**: `@shared` 别名在 `vite.config.ts` 中已配置，构建时会正确解析

### 3. 路由配置

✅ **已配置**: SPA 路由在 `vercel.json` 中已配置，所有路由都会重定向到 `index.html`

### 4. API 代理（可选）

如果需要代理 API 请求，可以在 `vercel.json` 中添加：

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://your-backend.onrender.com/api/:path*"
    }
  ]
}
```

## 🎯 部署检查清单

部署前确认：

- [ ] `vercel.json` 文件存在且配置正确
- [ ] `packages/frontend/build-vercel.sh` 脚本存在且可执行
- [ ] `packages/shared` 包可以正常构建
- [ ] 环境变量 `VITE_API_BASE_URL` 已配置
- [ ] GitHub 仓库已连接到 Vercel

## 🐛 常见问题

### 1. 构建失败：找不到 @shared/types

**原因**: shared 包未构建  
**解决**: 确保 `buildCommand` 中包含 `yarn workspace @todomaster/shared build`

### 2. 构建失败：yarn 命令不存在

**原因**: Vercel 可能使用 npm  
**解决**: 修改 `vercel.json` 中的 `buildCommand` 使用 npm：
```json
{
  "buildCommand": "cd packages/shared && npm install && npm run build && cd ../frontend && npm run build:vercel"
}
```

### 3. 路由 404 错误

**原因**: SPA 路由未配置  
**解决**: 确认 `vercel.json` 中的 `routes` 配置正确

### 4. API 请求失败

**原因**: 环境变量未配置或 CORS 问题  
**解决**: 
- 检查 `VITE_API_BASE_URL` 环境变量
- 确认后端 CORS 配置允许 Vercel 域名

## 📊 部署架构

```
GitHub Repository
    ↓ (push to main)
Vercel (自动检测)
    ↓ (构建)
Frontend (Vite + React)
    ↓ (API 请求)
Backend (Render/Railway)
    ↓ (数据库查询)
PostgreSQL (Render/Supabase)
```

## ✅ 总结

**该项目完全支持 Vercel 部署！**

- ✅ 配置文件完整
- ✅ 构建脚本就绪
- ✅ Monorepo 支持
- ✅ 路由配置正确
- ✅ 环境变量支持

只需：
1. 连接 GitHub 仓库到 Vercel
2. 配置环境变量
3. 点击部署

即可完成部署！
