# 数据库设置指南

## PostgreSQL 快速设置

### 方法1: 使用本地 PostgreSQL 服务

#### 1. 启动 PostgreSQL 服务
```bash
# 启动 PostgreSQL 服务
brew services start postgresql@14

# 或者临时启动（不作为后台服务）
/opt/homebrew/opt/postgresql@14/bin/postgres -D /opt/homebrew/var/postgresql@14
```

#### 2. 创建用户和数据库
```bash
# 连接到默认的 postgres 数据库
psql postgres

# 在 psql 中执行以下命令：
CREATE USER admin WITH PASSWORD '123456';
ALTER USER admin CREATEDB;
CREATE DATABASE todomaster OWNER admin;
GRANT ALL PRIVILEGES ON DATABASE todomaster TO admin;

# 退出 psql
\q
```

### 方法2: 使用 Docker（推荐）

如果您想使用 Docker 运行 PostgreSQL，这是最简单的方法：

#### 1. 启动 PostgreSQL Docker 容器
```bash
docker run --name todomaster-postgres \
  -e POSTGRES_USER=admin \
  -e POSTGRES_PASSWORD=123456 \
  -e POSTGRES_DB=todomaster \
  -p 5432:5432 \
  -d postgres:15
```

#### 2. 验证容器运行状态
```bash
docker ps
```

### 验证数据库连接

无论使用哪种方法，完成设置后，运行以下命令测试连接：

```bash
# 进入 backend 目录
cd packages/backend

# 运行连接测试
node scripts/test-db-connection.js
```

### 初始化数据库结构

连接成功后，运行以下命令初始化数据库结构：

#### 方法1: 使用 psql
```bash
PGPASSWORD=123456 psql -h localhost -U admin -d todomaster -f database/migrations/001_initial_schema.sql
```

#### 方法2: 使用我们的迁移脚本
```bash
node scripts/run-migrations.js
```

### 加载示例数据（可选）

```bash
PGPASSWORD=123456 psql -h localhost -U admin -d todomaster -f database/seed_data.sql
```

## 常见问题解决

### 1. 连接被拒绝 (Connection refused)
- 确认 PostgreSQL 服务正在运行
- 检查端口 5432 是否被占用：`lsof -i :5432`
- 如果使用 Docker，确认容器正在运行：`docker ps`

### 2. 认证失败 (Authentication failed)
- 确认用户名和密码正确
- 检查 PostgreSQL 的 `pg_hba.conf` 配置

### 3. 数据库不存在
- 先连接到 `postgres` 数据库
- 创建 `todomaster` 数据库
- 确认用户有足够的权限

### 4. 端口冲突
如果端口 5432 被占用，可以使用其他端口：
```bash
# Docker 方式使用不同端口
docker run --name todomaster-postgres \
  -e POSTGRES_USER=admin \
  -e POSTGRES_PASSWORD=123456 \
  -e POSTGRES_DB=todomaster \
  -p 5433:5432 \
  -d postgres:15
```

然后更新数据库配置为使用端口 5433。

## 下一步

数据库设置完成后，您可以：

1. **开发 API 接口**: 开始创建用户认证、目标管理等 API
2. **前后端集成**: 将前端连接到后端 API
3. **数据导入**: 如果有现有数据，可以导入到新数据库中
4. **生产部署**: 为生产环境配置数据库连接

---

**提示**: 推荐使用 Docker 方式，因为它更简单且易于管理。 