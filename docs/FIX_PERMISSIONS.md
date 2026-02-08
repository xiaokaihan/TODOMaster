# 修复数据库权限问题

## 问题描述

运行 `npm run db:migrate` 时出现错误：
```
permission denied for schema public
```

这是因为 `todomaster` 用户没有在 `public` schema 中创建表的权限。

## 快速修复

### 方法 1：使用超级用户修复（推荐）

**注意：** 在 macOS 上使用 Homebrew 安装 PostgreSQL 时，默认超级用户是你的 macOS 用户名（不是 `postgres`）。

```bash
# 查找你的 macOS 用户名
whoami

# 连接到 PostgreSQL（使用你的 macOS 用户名，例如：key）
psql -U $(whoami)
# 或者直接使用用户名
psql -U key

# 在 psql 中执行以下命令：
```

```sql
-- 连接到 todomaster 数据库
\c todomaster

-- 授予 schema 权限
GRANT ALL ON SCHEMA public TO todomaster;

-- 授予创建表和序列的默认权限
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO todomaster;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO todomaster;

-- 授予所有现有对象的权限（如果已有表）
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO todomaster;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO todomaster;

-- 退出
\q
```

### 方法 2：一行命令修复

```bash
# 使用你的 macOS 用户名（例如：key）
psql -U key -d todomaster -c "GRANT ALL ON SCHEMA public TO todomaster; ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO todomaster; ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO todomaster;"

# 或者使用 $(whoami) 自动获取用户名
psql -U $(whoami) -d todomaster -c "GRANT ALL ON SCHEMA public TO todomaster; ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO todomaster; ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO todomaster;"
```

**如果找不到 psql 命令：**

```bash
# 查找 PostgreSQL 安装路径
brew --prefix postgresql@15
# 或
brew --prefix postgresql

# 使用完整路径（例如）
/opt/homebrew/opt/postgresql@15/bin/psql -U key -d todomaster -c "..."
```

### 方法 3：授予创建扩展的权限（如果需要）

如果迁移时出现 `permission denied to create extension` 错误：

```bash
# 授予创建数据库的权限
psql -U key -d todomaster -c "ALTER USER todomaster WITH CREATEDB;"
psql -U key -d todomaster -c "GRANT CREATE ON DATABASE todomaster TO todomaster;"

# 使用超级用户创建扩展（创建扩展需要超级用户权限）
psql -U key -d todomaster -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\"; CREATE EXTENSION IF NOT EXISTS \"pg_trgm\";"
```

## 验证修复

修复后，重新运行迁移：

```bash
cd packages/backend
npm run db:migrate
```

如果成功，你应该看到：
```
✅ 数据库迁移完成
```

## 完整权限授予命令（首次设置时使用）

如果重新创建用户，使用以下完整命令：

```sql
-- 创建数据库
CREATE DATABASE todomaster;

-- 创建用户
CREATE USER todomaster WITH PASSWORD '123456';

-- 授予数据库权限
GRANT ALL PRIVILEGES ON DATABASE todomaster TO todomaster;

-- 连接到数据库（重要！）
\c todomaster

-- 授予 schema 权限
GRANT ALL ON SCHEMA public TO todomaster;

-- 授予默认权限
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO todomaster;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO todomaster;
```
