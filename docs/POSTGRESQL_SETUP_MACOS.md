# macOS PostgreSQL 安装指南

> 本文档说明如何在 macOS 上安装和配置 PostgreSQL，用于 TODOMaster 项目

---

## 方法 1：使用 Homebrew（推荐）

### 1. 安装 PostgreSQL

```bash
# 安装 PostgreSQL（最新版本）
brew install postgresql@15

# 或者安装最新版本
brew install postgresql
```

### 2. 启动 PostgreSQL 服务

```bash
# 启动 PostgreSQL 服务
brew services start postgresql@15

# 或者（如果安装的是最新版本）
brew services start postgresql

# 检查服务状态
brew services list | grep postgresql
```

### 3. 创建数据库和用户

```bash
# 连接到 PostgreSQL（默认会以你的 macOS 用户名连接）
psql postgres

# 在 psql 中执行以下命令：
```

```sql
-- 创建数据库
CREATE DATABASE todomaster;

-- 创建用户（项目实际使用的用户）
CREATE USER todomaster WITH PASSWORD '123456';

-- 授予数据库权限
GRANT ALL PRIVILEGES ON DATABASE todomaster TO todomaster;

-- 连接到 todomaster 数据库（重要！）
\c todomaster

-- 授予 schema 权限（必须在目标数据库中执行）
GRANT ALL ON SCHEMA public TO todomaster;

-- 授予在 public schema 中创建表的权限
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO todomaster;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO todomaster;

-- 授予所有现有表的权限（如果已有表）
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO todomaster;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO todomaster;

-- 授予创建数据库的权限（用于创建扩展）
ALTER USER todomaster WITH CREATEDB;
GRANT CREATE ON DATABASE todomaster TO todomaster;

-- 创建必要的扩展（需要超级用户权限，使用超级用户执行）
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 退出 psql
\q
```

**📝 记录信息：**
- 数据库名：`todomaster`
- 用户名：`todomaster`
- 密码：`123456`
- 主机：`localhost`
- 端口：`5432`

### 4. 验证安装

```bash
# 测试连接（使用 todomaster 用户）
psql -U todomaster -d todomaster

# 输入密码：123456

# 在 psql 中查看数据库
\l  # 列出所有数据库
\dt # 列出当前数据库的所有表
\q  # 退出
```

---

## 方法 2：使用 Postgres.app（图形界面）

### 1. 下载安装

访问 [Postgres.app 官网](https://postgresapp.com/) 下载并安装

### 2. 启动应用

- 打开 Postgres.app
- 点击 "Initialize" 初始化数据库
- 应用会自动启动 PostgreSQL 服务

### 3. 配置命令行工具

```bash
# 将 Postgres.app 的 bin 目录添加到 PATH
echo 'export PATH="/Applications/Postgres.app/Contents/Versions/latest/bin:$PATH"' >> ~/.zshrc

# 重新加载配置
source ~/.zshrc
```

### 4. 创建数据库和用户

```bash
# 连接到默认数据库
psql postgres

# 执行创建数据库和用户的 SQL（同上）
```

---

## 配置 TODOMaster 项目

### 1. 创建 .env 文件

在 `packages/backend` 目录下创建 `.env` 文件：

```bash
cd packages/backend
cp .env.save .env
```

### 2. 编辑 .env 文件

**项目实际配置（使用 todomaster 用户）：**
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=todomaster
DB_USERNAME=todomaster
DB_PASSWORD=123456
DB_SSL=false
```

### 3. 测试数据库连接

```bash
cd packages/backend

# 使用项目脚本测试
yarn db:test

# 或使用 Node 脚本
node scripts/test-db-connection.js
```

### 4. 运行数据库迁移

```bash
# 运行迁移创建表结构
yarn db:migrate

# 或使用 db-cli
yarn db:status  # 查看迁移状态
```

---

## 常用命令

### 服务管理

```bash
# 启动服务
brew services start postgresql@15

# 停止服务
brew services stop postgresql@15

# 重启服务
brew services restart postgresql@15

# 查看服务状态
brew services list | grep postgresql
```

### 数据库操作

```bash
# 连接数据库（使用 todomaster 用户）
psql -U todomaster -d todomaster

# 列出所有数据库
psql -U todomaster -l

# 备份数据库
pg_dump -U todomaster todomaster > backup.sql

# 恢复数据库
psql -U todomaster -d todomaster < backup.sql

# 删除数据库（谨慎使用）
dropdb -U todomaster todomaster
```

### 在 psql 中的常用命令

```sql
-- 列出所有数据库
\l

-- 连接到数据库
\c todomaster

-- 列出所有表
\dt

-- 查看表结构
\d users
\d objectives
\d tasks

-- 查看表数据
SELECT * FROM users LIMIT 10;

-- 退出
\q
```

---

## 故障排除

### 问题 1：无法连接到数据库

**错误信息：** `FATAL: password authentication failed`

**解决方案：**
```bash
# 检查用户是否存在
psql -U postgres -c "\du"

# 重置密码
psql -U postgres
ALTER USER todomaster WITH PASSWORD '123456';
```

### 问题 2：数据库不存在

**错误信息：** `FATAL: database "todomaster" does not exist`

**解决方案：**
```bash
# 创建数据库
createdb -U todomaster todomaster

# 或使用 psql
psql -U todomaster
CREATE DATABASE todomaster;
```

### 问题 3：权限不足

**错误信息：** `permission denied for schema public`

**解决方案：**

**注意：** 在 macOS 上，PostgreSQL 的超级用户是你的 macOS 用户名（不是 `postgres`）。

```bash
# 查找你的 macOS 用户名
whoami

# 连接到 PostgreSQL（使用你的 macOS 用户名，例如：key）
psql -U key

# 在 psql 中执行：
```

```sql
-- 连接到目标数据库
\c todomaster

-- 授予 schema 权限
GRANT ALL ON SCHEMA public TO todomaster;

-- 授予创建表和序列的默认权限
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO todomaster;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO todomaster;

-- 授予所有现有对象的权限
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO todomaster;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO todomaster;

-- 退出
\q
```

### 问题 4：端口被占用

**错误信息：** `port 5432 already in use`

**解决方案：**
```bash
# 查找占用端口的进程
lsof -i :5432

# 停止冲突的服务
brew services stop postgresql@15
# 或
kill -9 <PID>
```

### 问题 5：找不到 psql 命令

**解决方案：**
```bash
# 查找 PostgreSQL 安装路径
brew list postgresql@15

# 添加到 PATH（如果使用 Homebrew）
echo 'export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# 或（Intel Mac）
echo 'export PATH="/usr/local/opt/postgresql@15/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

---

## 卸载 PostgreSQL

如果需要卸载：

```bash
# 停止服务
brew services stop postgresql@15

# 卸载 PostgreSQL
brew uninstall postgresql@15

# 删除数据目录（可选，会删除所有数据）
rm -rf /opt/homebrew/var/postgresql@15
# 或（Intel Mac）
rm -rf /usr/local/var/postgresql@15
```

---

## 实际执行的命令记录

### 安装 PostgreSQL
```bash
brew install postgresql@15
brew services start postgresql@15
```

### 创建数据库和用户
```bash
# 连接到 PostgreSQL
psql postgres

# 在 psql 中执行：
CREATE DATABASE todomaster;
CREATE USER todomaster WITH PASSWORD '123456';
GRANT ALL PRIVILEGES ON DATABASE todomaster TO todomaster;
GRANT ALL ON SCHEMA public TO todomaster;
\q
```

### 数据库连接信息
- **数据库名**：`todomaster`
- **用户名**：`todomaster`
- **密码**：`123456`
- **主机**：`localhost`
- **端口**：`5432`

---

## 下一步

安装完成后，继续执行 TODOMaster 项目的数据库设置：

1. ✅ 确认 PostgreSQL 已安装并运行
2. ✅ 创建 `todomaster` 数据库
3. ✅ 创建 `todomaster` 用户（密码：123456）
4. ✅ 配置 `.env` 文件
5. ✅ 运行 `yarn db:test` 测试连接
6. ✅ 运行 `yarn db:migrate` 创建表结构
7. ✅ 运行 `yarn db:seed` 填充示例数据（可选）

---

## 参考资源

- [PostgreSQL 官方文档](https://www.postgresql.org/docs/)
- [Homebrew PostgreSQL](https://formulae.brew.sh/formula/postgresql@15)
- [Postgres.app 官网](https://postgresapp.com/)
