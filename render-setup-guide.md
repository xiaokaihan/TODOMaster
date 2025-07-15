# 🏗️ Render 后端服务设置指南

## 🎯 第一步：创建Render账号和连接仓库

### 1.1 注册Render账号
访问：**https://render.com**
- 点击 "Get Started for Free"
- 使用GitHub账号登录（推荐）

### 1.2 连接GitHub仓库
- 在Render Dashboard中，点击 "New +"
- 选择 "Web Service"
- 连接您的GitHub账号
- 选择仓库：`xiaokaihan/TODOMaster`

## 🔧 第二步：配置Web Service

### 2.1 基本设置
```
Name: todomaster-backend
Environment: Node
Region: Oregon (US West)
Branch: main
Root Directory: (保留空白)
```

### 2.2 构建和启动命令
```bash
# Build Command:
cd packages/shared && npm install && npm run build && cd ../backend && npm install && npm run build

# Start Command:
cd packages/backend && npm start
```

### 2.3 高级设置
```
Auto-Deploy: Yes
Health Check Path: /health
```

## 🗄️ 第三步：设置PostgreSQL数据库

### 选项A：使用Render PostgreSQL（推荐）
1. 在Render Dashboard中，点击 "New +"
2. 选择 "PostgreSQL"
3. 配置：
   ```
   Name: todomaster-postgres
   Database: todomaster
   User: todomaster
   Region: Oregon (US West)
   Plan: Free
   ```

### 选项B：继续使用Supabase
如果您已设置Supabase，可以继续使用现有数据库。

## ⚙️ 第四步：配置环境变量

在Web Service的Environment页面添加：

### 4.1 基本配置
```
NODE_ENV = production
PORT = 3000
API_PREFIX = /api/v1
```

### 4.2 数据库配置（选择一种）

**使用Render PostgreSQL：**
```
DB_HOST = [自动从数据库获取]
DB_PORT = [自动从数据库获取]
DB_NAME = [自动从数据库获取]
DB_USERNAME = [自动从数据库获取]
DB_PASSWORD = [自动从数据库获取]
DB_SSL = true
```

**使用Supabase：**
```
DB_HOST = db.your-project.supabase.co
DB_PORT = 5432
DB_NAME = postgres
DB_USERNAME = postgres
DB_PASSWORD = your_supabase_password
DB_SSL = true
```

### 4.3 安全配置
```
JWT_SECRET = your-super-secret-jwt-key-change-this-32chars
JWT_EXPIRES_IN = 7d
CORS_ORIGIN = https://todomaster.vercel.app
```

## 🎯 第五步：获取后端URL

部署完成后：
1. 在Render Dashboard中找到您的服务
2. 复制服务URL，格式如：`https://todomaster-backend-xxx.onrender.com`
3. 记录这个URL，我们需要将它添加到GitHub Secrets

## ✅ 部署状态检查

部署成功的标志：
- ✅ Build状态显示 "Live"
- ✅ Health Check显示绿色
- ✅ 可以访问 `your-url.onrender.com/health`

## 🆘 常见问题

### 构建失败
- 检查Build Command是否正确
- 确保所有依赖都在package.json中

### 启动失败
- 检查Start Command是否正确
- 查看Logs了解具体错误

### 数据库连接失败
- 确认环境变量设置正确
- 检查数据库服务是否正常运行

---

## 🚀 完成后操作

设置完成后，请：
1. 记录后端URL
2. 告诉我："Render服务已创建，URL是：[your-url]" 