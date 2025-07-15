# TODOMaster 数据库设计文档

## 概述

TODOMaster 使用 PostgreSQL 作为主要数据库，设计遵循目标驱动的任务管理理念。数据库架构支持完整的 OKR（Objectives and Key Results）管理体系。

## 数据库架构

### 核心表结构

```
用户 (users)
    ↓
目标 (objectives)
    ↓
关键结果 (key_results)
    ↓
任务 (tasks)
    ↓
任务依赖 (task_dependencies)
```

### 表关系说明

1. **users** → **objectives**: 一对多，用户可以创建多个目标
2. **objectives** → **key_results**: 一对多，每个目标包含多个关键结果
3. **key_results** → **tasks**: 一对多，每个关键结果关联多个任务
4. **tasks** → **task_dependencies**: 多对多，任务之间可以有依赖关系

## 快速开始

### 1. 安装 PostgreSQL

```bash
# macOS
brew install postgresql
brew services start postgresql

# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql

# Windows
# 下载并安装 PostgreSQL 官方安装包
```

### 2. 创建数据库

```bash
# 连接到 PostgreSQL
psql postgres

# 创建数据库
CREATE DATABASE todomaster;

# 创建用户（可选）
CREATE USER todomaster_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE todomaster TO todomaster_user;

# 退出
\q
```

### 3. 配置环境变量

复制 `env.example` 到 `.env` 并修改数据库配置：

```bash
cp env.example .env
```

编辑 `.env` 文件：

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=todomaster
DB_USERNAME=todomaster_user
DB_PASSWORD=your_password
DB_SSL=false
```

### 4. 运行数据库迁移

```bash
# 连接到数据库
psql -h localhost -U todomaster_user -d todomaster

# 执行迁移脚本
\i migrations/001_initial_schema.sql

# 验证表创建
\dt

# 退出
\q
```

### 5. 加载示例数据（可选）

```bash
# 加载示例数据
psql -h localhost -U todomaster_user -d todomaster -f seed_data.sql
```

## 表结构详细说明

### 1. users 表

用户认证和基本信息表。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键，自动生成 |
| email | VARCHAR(255) | 邮箱，唯一索引 |
| name | VARCHAR(100) | 用户姓名 |
| password_hash | VARCHAR(255) | 加密后的密码 |
| avatar | TEXT | 头像URL |
| email_verified | BOOLEAN | 邮箱验证状态 |
| last_login_at | TIMESTAMP | 最后登录时间 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

### 2. objectives 表

目标管理表，存储用户的主要目标。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| title | VARCHAR(200) | 目标标题 |
| description | TEXT | 详细描述 |
| category | objective_category | 目标分类枚举 |
| priority | priority_level | 优先级枚举 |
| status | objective_status | 状态枚举 |
| start_date | DATE | 开始日期 |
| target_date | DATE | 目标完成日期 |
| progress | INTEGER | 完成进度(0-100) |
| user_id | UUID | 关联用户ID |

### 3. key_results 表

关键结果表，存储目标的可量化指标。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| title | VARCHAR(200) | 关键结果标题 |
| description | TEXT | 详细描述 |
| target_value | DECIMAL(12,3) | 目标值 |
| current_value | DECIMAL(12,3) | 当前值 |
| unit | VARCHAR(50) | 单位 |
| type | key_result_type | 类型(数值/百分比/布尔) |
| status | key_result_status | 状态枚举 |
| due_date | DATE | 截止日期 |
| completed_at | TIMESTAMP | 完成时间 |
| objective_id | UUID | 关联目标ID |

### 4. tasks 表

任务表，存储具体的执行任务。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| title | VARCHAR(200) | 任务标题 |
| description | TEXT | 详细描述 |
| priority | priority_level | 优先级枚举 |
| status | task_status | 状态枚举 |
| due_date | TIMESTAMP | 截止时间 |
| estimated_duration | INTEGER | 预估时长(分钟) |
| actual_duration | INTEGER | 实际时长(分钟) |
| tags | TEXT[] | 标签数组 |
| completed_at | TIMESTAMP | 完成时间 |
| key_result_id | UUID | 关联关键结果ID |
| user_id | UUID | 关联用户ID |

### 5. task_dependencies 表

任务依赖关系表，管理任务之间的依赖。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| task_id | UUID | 任务ID |
| depends_on_task_id | UUID | 依赖的任务ID |
| created_at | TIMESTAMP | 创建时间 |

## 枚举类型

### objective_category (目标分类)
- PERSONAL: 个人发展
- PROFESSIONAL: 职业发展
- HEALTH: 健康生活
- LEARNING: 学习成长
- FINANCIAL: 财务规划
- RELATIONSHIP: 人际关系
- CREATIVE: 创意项目
- OTHER: 其他

### priority_level (优先级)
- LOW: 低
- MEDIUM: 中
- HIGH: 高
- CRITICAL: 紧急

### objective_status (目标状态)
- DRAFT: 草稿
- ACTIVE: 进行中
- ON_HOLD: 暂停
- COMPLETED: 已完成
- CANCELLED: 已取消

### key_result_type (关键结果类型)
- NUMERIC: 数值型 (如：完成10个功能)
- PERCENTAGE: 百分比型 (如：代码覆盖率80%)
- BOOLEAN: 布尔型 (如：是否完成项目)

### key_result_status (关键结果状态)
- NOT_STARTED: 未开始
- IN_PROGRESS: 进行中
- COMPLETED: 已完成
- FAILED: 失败

### task_status (任务状态)
- TODO: 待办
- IN_PROGRESS: 进行中
- WAITING: 等待中
- COMPLETED: 已完成
- CANCELLED: 已取消

## 智能特性

### 1. 自动触发器

- **自动更新时间戳**: 所有表的 `updated_at` 字段自动更新
- **进度自动计算**: 目标的进度根据关键结果完成情况自动计算
- **状态自动更新**: 关键结果状态根据当前值自动更新
- **循环依赖检查**: 防止任务依赖形成循环

### 2. 智能视图

- **objectives_with_stats**: 目标及其统计信息
- **key_results_with_stats**: 关键结果及其完成百分比
- **tasks_with_details**: 任务及其详细信息（包含逾期状态）

### 3. 性能优化

- **索引策略**: 针对常用查询创建了复合索引
- **全文搜索**: 支持标题的全文搜索
- **GIN索引**: 优化标签数组的查询性能

## 常用查询示例

### 1. 获取用户的活跃目标

```sql
SELECT * FROM objectives_with_stats 
WHERE user_id = $1 AND status = 'ACTIVE'
ORDER BY priority DESC, created_at DESC;
```

### 2. 获取即将到期的任务

```sql
SELECT * FROM tasks_with_details 
WHERE user_id = $1 
  AND due_date BETWEEN NOW() AND NOW() + INTERVAL '7 days'
  AND status NOT IN ('COMPLETED', 'CANCELLED')
ORDER BY due_date ASC;
```

### 3. 获取逾期任务

```sql
SELECT * FROM tasks_with_details 
WHERE user_id = $1 AND is_overdue = true
ORDER BY due_date ASC;
```

### 4. 按标签搜索任务

```sql
SELECT * FROM tasks 
WHERE user_id = $1 AND tags && ARRAY['React', '前端']
ORDER BY created_at DESC;
```

### 5. 获取目标完成统计

```sql
SELECT 
  category,
  COUNT(*) as total_objectives,
  COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed_objectives,
  ROUND(AVG(progress), 2) as avg_progress
FROM objectives 
WHERE user_id = $1 
GROUP BY category;
```

## 数据库维护

### 1. 备份数据库

```bash
# 完整备份
pg_dump -h localhost -U todomaster_user todomaster > backup_$(date +%Y%m%d_%H%M%S).sql

# 仅数据备份
pg_dump -h localhost -U todomaster_user --data-only todomaster > data_backup.sql

# 仅结构备份
pg_dump -h localhost -U todomaster_user --schema-only todomaster > schema_backup.sql
```

### 2. 恢复数据库

```bash
# 从备份恢复
psql -h localhost -U todomaster_user todomaster < backup_file.sql
```

### 3. 数据库统计

```sql
-- 表大小统计
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- 索引使用情况
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes 
ORDER BY idx_scan DESC;
```

## 性能调优建议

1. **连接池配置**: 根据应用负载调整连接池大小
2. **查询优化**: 使用 EXPLAIN ANALYZE 分析慢查询
3. **索引维护**: 定期检查索引使用情况，删除无用索引
4. **表维护**: 定期执行 VACUUM 和 ANALYZE
5. **监控**: 使用 pg_stat_statements 监控查询性能

## 注意事项

1. **数据一致性**: 所有外键都设置了 CASCADE 删除，请谨慎操作
2. **备份策略**: 生产环境建议设置自动备份
3. **安全性**: 生产环境必须启用 SSL 连接
4. **权限管理**: 根据最小权限原则分配数据库权限
5. **版本控制**: 所有数据库变更都应通过迁移脚本管理 