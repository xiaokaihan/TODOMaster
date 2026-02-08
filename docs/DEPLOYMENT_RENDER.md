# 🏗️ Render 后端部署指南

## 📋 目录

1. [创建 Render 服务](#创建-render-服务)
2. [配置环境变量](#配置环境变量)
3. [快速参考](#快速参考)
4. [常见问题](#常见问题)

---

## 🎯 创建 Render 服务

### 第一步：创建账号和连接仓库

1. **注册 Render 账号**
   - 访问：https://render.com
   - 点击 "Get Started for Free"
   - 使用 GitHub 账号登录（推荐）

2. **连接 GitHub 仓库**
   - 在 Render Dashboard 中，点击 "New +"
   - 选择 "Web Service"
   - 连接您的 GitHub 账号
   - 选择仓库：`xiaokaihan/TODOMaster`

### 第二步：配置 Web Service

**基本设置**：
```
Name: todomaster-backend
Environment: Node
Region: Oregon (US West)
Branch: main
Root Directory: (保留空白)
```

**构建和启动命令**：
```bash
# Build Command:
cd packages/shared && npm install && npm run build && cd ../backend && npm install && npm run build

# Start Command:
cd packages/backend && npm start
```

**高级设置**：
```
Auto-Deploy: Yes
Health Check Path: /health
```

### 第三步：设置 PostgreSQL 数据库

**使用 Render PostgreSQL（推荐）**：
1. 在 Render Dashboard 中，点击 "New +"
2. 选择 "PostgreSQL"
3. 配置：
   ```
   Name: todomaster-postgres
   Database: todomaster
   User: todomaster
   Region: Oregon (US West)
   Plan: Free
   ```

---

## ⚙️ 配置环境变量

### 第一步：进入 Environment 配置

1. 在 Render Dashboard 中找到您的 `todomaster-backend` 服务
2. 点击进入服务详情页
3. 点击左侧菜单的 "Environment"

### 第二步：添加环境变量

点击 "Add Environment Variable" 并逐个添加以下变量：

#### 基本应用配置
```
NODE_ENV = production
PORT = 3000
API_PREFIX = /api/v1
```

#### 数据库配置（连接 Render PostgreSQL）

**重要**：这些值需要从您的 PostgreSQL 数据库获取

1. 进入您的 `todomaster-postgres` 数据库
2. 在数据库详情页找到 "Connections" 或 "Info" 部分
3. 复制以下信息到 Web Service 环境变量：

```
DB_HOST = [从PostgreSQL服务复制 External Database URL 的主机部分]
DB_PORT = 5432
DB_NAME = todomaster
DB_USERNAME = [从PostgreSQL服务复制用户名]
DB_PASSWORD = [从PostgreSQL服务复制密码]
DB_SSL = true
```

**连接信息位置**：
```
Render Dashboard → todomaster-postgres → Info 页面
或者
Render Dashboard → todomaster-postgres → Connect 页面
```

#### JWT 和安全配置

```
JWT_SECRET = [至少32个字符的随机字符串]
JWT_EXPIRES_IN = 7d
CORS_ORIGIN = https://todomaster.vercel.app
```

**推荐的 JWT_SECRET**（选择一个）：
- 选项1（较长，更安全）：
  ```
  2b6c522fe6a0e74886aec3e98203488f36c701c16c2a4ed56c5a0459c393d42e9615514952555d29ce2729a14f1a1e568f7564f5effce9d625ec0760b2f5dcf6
  ```
- 选项2（标准长度，推荐）：
  ```
  12056a029a9cec71cd7d87f6f49d0dc0e3f2d70b4018727ff331d3d36cfabd21
  ```

#### 日志配置
```
LOG_LEVEL = info
```

### 第三步：配置检查清单

完成后，您的环境变量列表应该包含：
- ✅ NODE_ENV
- ✅ PORT
- ✅ API_PREFIX
- ✅ DB_HOST
- ✅ DB_PORT
- ✅ DB_NAME
- ✅ DB_USERNAME
- ✅ DB_PASSWORD
- ✅ DB_SSL
- ✅ JWT_SECRET
- ✅ JWT_EXPIRES_IN
- ✅ CORS_ORIGIN
- ✅ LOG_LEVEL

---

## 📋 快速参考

### 必须添加的 14 个环境变量

| 变量名 | 示例值 | 说明 |
|--------|--------|------|
| `NODE_ENV` | `production` | 运行环境 |
| `PORT` | `3000` | 服务端口 |
| `API_PREFIX` | `/api/v1` | API前缀 |
| `DB_HOST` | `dpg-xxx.oregon-postgres.render.com` | 从数据库复制 |
| `DB_PORT` | `5432` | 从数据库复制 |
| `DB_NAME` | `todomaster` | 数据库名 |
| `DB_USERNAME` | `todomaster` | 从数据库复制 |
| `DB_PASSWORD` | `xxx` | 从数据库复制 |
| `DB_SSL` | `true` | 启用SSL |
| `JWT_SECRET` | `[至少32字符]` | JWT密钥 |
| `JWT_EXPIRES_IN` | `7d` | JWT过期时间 |
| `CORS_ORIGIN` | `https://todomaster.vercel.app` | 前端域名 |
| `LOG_LEVEL` | `info` | 日志级别 |

### 重要提示

1. **DB_HOST**: 通常格式为 `dpg-xxxx.oregon-postgres.render.com`
2. **DB_PASSWORD**: 是一个长随机字符串，请完整复制
3. **JWT_SECRET**: 必须至少32个字符，用于加密JWT令牌
4. **CORS_ORIGIN**: 使用Vercel默认域名，稍后可更新

---

## ✅ 部署状态检查

部署成功的标志：
- ✅ Build 状态显示 "Live"
- ✅ Health Check 显示绿色
- ✅ 可以访问 `your-url.onrender.com/health`

### 验证步骤

配置完成后，检查：
1. ✅ 服务状态显示 "Live"
2. ✅ 没有错误日志
3. ✅ 可以访问 `https://your-service.onrender.com/health`

---

## 🆘 常见问题

### 构建失败
- 检查 Build Command 是否正确
- 确保所有依赖都在 package.json 中
- 查看构建日志了解具体错误

### 启动失败
- 检查 Start Command 是否正确
- 查看 Logs 了解具体错误
- 确认环境变量配置正确

### 数据库连接失败
- 确认环境变量设置正确
- 检查数据库服务是否正常运行
- 确认 DB_HOST、DB_PASSWORD 等信息复制正确
- 确保 PostgreSQL 服务已完全创建完成（需要几分钟）

### 找不到数据库连接信息？
确保 PostgreSQL 服务已完全创建完成（需要几分钟）

### 服务启动失败？
检查 Logs 页面，通常是环境变量配置错误

### 数据库连接失败？
确认 DB_HOST、DB_PASSWORD 等信息复制正确

---

## 🚀 完成后操作

设置完成后，请：
1. 记录后端 URL（格式：`https://todomaster-backend-xxx.onrender.com`）
2. 更新前端环境变量 `VITE_API_BASE_URL`
3. 测试 API 健康检查端点

---

## 📚 相关文档

- [Vercel 前端部署指南](./VERCEL_DEPLOYMENT.md)
- [部署架构总览](../DEPLOYMENT.md)
