# ⚙️ Render 环境变量配置指南

## 🎯 配置Web Service环境变量

在您的 `todomaster-backend` Web Service中：

### 第一步：进入Environment配置
1. 在Render Dashboard中找到您的 `todomaster-backend` 服务
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

#### 数据库配置（连接Render PostgreSQL）
**重要**：这些值需要从您的PostgreSQL数据库获取

1. 首先，进入您的 `todomaster-postgres` 数据库
2. 在数据库详情页找到 "Connections" 部分
3. 复制以下信息到Web Service环境变量：

```
DB_HOST = [从PostgreSQL服务复制 External Database URL 的主机部分]
DB_PORT = [从PostgreSQL服务复制，通常是 5432]
DB_NAME = [您设置的数据库名，应该是 todomaster]
DB_USERNAME = [从PostgreSQL服务复制用户名]
DB_PASSWORD = [从PostgreSQL服务复制密码]
DB_SSL = true
```

#### JWT和安全配置
```
JWT_SECRET = todomaster_super_secret_jwt_key_2024_32chars_min
JWT_EXPIRES_IN = 7d
CORS_ORIGIN = https://todomaster.vercel.app
```

#### 日志配置
```
LOG_LEVEL = info
```

## 🔗 连接数据库的两种方法

### 方法A：手动复制连接信息（推荐）
1. 进入 PostgreSQL 服务详情页
2. 找到 "Info" 或 "Connections" 部分
3. 复制各项连接信息

### 方法B：使用环境变量引用（如果可用）
某些情况下，Render允许引用其他服务的环境变量：
```
DB_HOST = ${{DATABASE_HOST}}
DB_PORT = ${{DATABASE_PORT}}
DB_NAME = ${{DATABASE_NAME}}
DB_USERNAME = ${{DATABASE_USER}}  
DB_PASSWORD = ${{DATABASE_PASSWORD}}
```

## ✅ 配置检查清单

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

## 🚀 下一步

配置完环境变量后：
1. 点击 "Save Changes"
2. 服务会自动重新部署
3. 等待部署完成（约2-5分钟）
4. 记录服务URL并告诉我完成状态 