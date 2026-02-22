# 系统 → 目标 → 任务 流转检查报告

## 检查结果摘要

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 数据库 Schema | ⚠️ 需迁移 | 001+002 创建的 DB 需执行 003 迁移 |
| 后端 API | ✅ 正常 | 任务路由支持 systemId 筛选，系统详情含任务列表 |
| 前端系统切换 | ✅ 正常 | 侧边栏系统列表，点击切换 |
| 前端系统详情 | ✅ 正常 | 目标+任务层级展示，支持创建/完成 |
| 前端任务中心 | ✅ 正常 | 支持按系统、目标筛选 |

---

## 数据库迁移（重要）

若数据库由 `001_initial_schema.sql` + `002_add_systems.sql` 创建，**必须**执行 003 迁移，否则任务创建会失败。

### 执行 003 迁移

```bash
# 连接到数据库后执行
psql -h localhost -U your_user -d todomaster -f packages/backend/database/migrations/003_tasks_objective_id.sql
```

或手动执行：

```bash
cd packages/backend/database/migrations
psql $DATABASE_URL -f 003_tasks_objective_id.sql
```

### 003 迁移内容

1. **estimated_hours / actual_hours**：若仅有 estimated_duration，则新增并回填
2. **objective_id**：新增并回填，支持任务直连目标
3. **key_result_id**：改为可空（任务可不关联关键结果）
4. **user_id 触发器**：INSERT 时从 objective 自动填充 user_id（001 schema）

---

## 推荐数据库初始化方式

### 方式 A：使用迁移脚本（推荐）

```bash
# 1. 创建数据库
createdb todomaster

# 2. 执行迁移（按顺序）
psql -d todomaster -f packages/backend/database/migrations/001_initial_schema.sql
psql -d todomaster -f packages/backend/database/migrations/002_add_systems.sql
psql -d todomaster -f packages/backend/database/migrations/003_tasks_objective_id.sql

# 3. 填充测试数据
yarn db:seed
```

### 方式 B：使用 Migrator（migrations.sql）

```bash
yarn db:migrate
yarn db:seed
```

> 注意：migrations.sql 的 schema 与 001/002 不同，无 systems 表。若已采用系统功能，请使用方式 A。

---

## 流转测试步骤

### 1. 启动服务

```bash
yarn dev
```

### 2. 登录并创建系统

- 进入「我的系统」
- 点击「创建系统」，填写名称、图标、颜色
- 例如：健康生活 💪

### 3. 进入系统详情并创建目标

- 侧边栏点击系统名称，或从系统列表进入
- 点击「添加目标」
- 例如：每周运动 3 次

### 4. 为目标创建任务

- 展开目标卡片（点击左侧箭头）
- 点击「添加任务」或「+ 添加第一个任务」
- 填写标题，选择关联目标（通常已预选）

### 5. 完成任务

- 点击任务前的圆形复选框
- 状态循环：待办 → 进行中 → 已完成

### 6. 验证进度更新

- 目标下方进度条变化
- 系统头部「已完成任务」「完成率」更新

### 7. 任务中心筛选

- 进入「任务中心」
- 「所属系统」选该系统
- 「关联目标」选该目标
- 确认任务列表正确过滤

---

## 已知问题与限制

1. **Dashboard.tsx**：存在未使用的 `handleEditTask` 等 TypeScript 警告，不影响流转
2. **任务状态**：后端使用 `URGENT`，部分前端使用 `CRITICAL`，需确认枚举一致
3. **task_priority 枚举**：001 使用 `priority_level`，migrations.sql 使用 `task_priority`，字段名可能不同

---

## 快速验证命令

```bash
# 检查数据库是否有 objective_id
psql -d todomaster -c "\d tasks" | grep objective_id

# 检查 systems 表
psql -d todomaster -c "SELECT id, name FROM systems LIMIT 3;"
```
