# TODOMaster 开发待办事项

> 最后更新：2025-02-08
> 
> 状态图例：`[ ]` 未开始 | `[~]` 进行中 | `[x]` 已完成 | `[-]` 已取消

---

## 阶段 1：打通主流程（1-2 周）

### 1.0 API 测试与修复 ✅

- [x] **1.0.1** 全面 API 测试（CRUD、统计、用户相关）✅ 10/10 通过（100%）
- [x] **1.0.2** 修复枚举值不匹配（PROFESSIONAL → WORK）✅
- [x] **1.0.3** 修复路由顺序问题（/users/profile 被拦截）✅
- [x] **1.0.4** 修复用户角色读取问题（从数据库读取）✅
- [x] **1.0.5** 修复 SQL 查询列引用歧义 ✅
- [x] **1.0.6** 修复 EXTRACT 函数类型错误 ✅
- [x] **1.0.7** 修复 user_preferences 表不存在问题 ✅

**测试结果文档**: `docs/API_COMPREHENSIVE_TEST_RESULTS.md`

### 1.1 数据库 Schema 统一

> 注意：本项目使用 pg + SQL 迁移，**不使用 Prisma**。检查 Schema 请用：
> `cd packages/backend && yarn db:test` 或 `node scripts/test-db-connection.js`

- [x] **1.1.1** 确定主 Schema 标准（001_initial_schema vs migrations.sql）✅ 已使用 001_initial_schema
- [x] **1.1.2** 编写数据库迁移脚本，补齐 users 表缺失字段（role, is_active, avatar_url, timezone）✅ 迁移已完成
- [x] **1.1.3** 统一 objectives 字段：target_date ↔ end_date，status 枚举值 ✅ 已修复为 end_date
- [x] **1.1.4** 统一 tasks 表结构：确认 objective_id、estimated_hours/actual_hours ✅ 字段正确
- [x] **1.1.5** 创建 user_preferences、activity_logs 表（如 routes 依赖）✅ activity_logs 已创建
- [x] **1.1.6** 验证迁移后所有 API 能正常运行 ✅ 全面 API 测试通过（10/10，100%）

### 1.2 Dashboard 接入 API

- [ ] **1.2.1** 移除 Dashboard 中的 mock 数据
- [ ] **1.2.2** 接入 `/api/stats/overview` 获取统计数据
- [ ] **1.2.3** 接入 `/api/stats/trends` 或相关接口获取趋势数据
- [ ] **1.2.4** 接入 objectives、tasks、key-results 列表接口
- [ ] **1.2.5** 添加加载态、错误态、空态处理

### 1.3 Tasks 页面接入 API

- [ ] **1.3.1** 移除 Tasks 页面中的 mock 数据
- [ ] **1.3.2** 接入 taskService 获取任务列表
- [ ] **1.3.3** 实现任务创建、编辑、删除与 API 对接
- [ ] **1.3.4** 实现任务状态变更与 API 对接
- [ ] **1.3.5** 添加加载态、错误态、空态处理

### 1.4 Stats 前后端对接

- [x] **1.4.1** 核对 statsService 与后端 stats 路由的接口路径 ✅ 已测试所有 stats 接口
- [x] **1.4.2** 将 statsService.getDashboardStats 映射到 `/stats/overview` 或适配 ✅ `/api/stats/overview` 已测试通过
- [ ] **1.4.3** 统一响应数据结构，确保前端解析正确

---

## 阶段 2：完善核心功能（约 1 周）

### 2.1 任务快速操作 API

- [ ] **2.1.1** 实现 `PUT /api/tasks/:id/status` 快速更新任务状态
- [ ] **2.1.2** 实现 `PUT /api/tasks/:id/priority` 快速更新任务优先级

### 2.2 关键结果进度

- [ ] **2.2.1** 确认 KeyResultCard 进度更新使用现有 PUT 接口或需新增
- [ ] **2.2.2** 如需要，实现 `PATCH /api/key-results/:id/progress` 专用接口

### 2.3 任务标签

- [ ] **2.3.1** 任务创建/更新 API 支持 tags 字段
- [ ] **2.3.2** 任务列表查询支持按 tags 筛选

### 2.4 认证流程补全（按需）

- [ ] **2.4.1** 实现忘记密码 `POST /api/auth/forgot-password`
- [ ] **2.4.2** 实现重置密码 `POST /api/auth/reset-password`
- [ ] **2.4.3** 实现邮箱验证（可选）

---

## 阶段 3：增强功能（约 1 周）

### 3.1 任务批量操作

- [ ] **3.1.1** 实现 `PUT /api/tasks/bulk` 批量更新
- [ ] **3.1.2** 实现 `POST /api/tasks/bulk-delete` 批量删除

### 3.2 工时记录

- [ ] **3.2.1** 实现 `POST /api/tasks/:id/time-log` 或通过任务更新记录工时

### 3.3 任务快捷接口

- [ ] **3.3.1** 实现 `GET /api/tasks/my` 我的任务
- [ ] **3.3.2** 实现 `GET /api/tasks/overdue` 逾期任务

### 3.4 Dashboard 增强

- [ ] **3.4.1** 今日任务模块接入真实数据
- [ ] **3.4.2** 即将到期任务接入真实数据
- [ ] **3.4.3** 添加简单图表展示（可选）

---

## 阶段 4：可选优化

### 4.1 代码结构

- [ ] **4.1.1** 决定 Controller 与 Route 的职责划分
- [ ] **4.1.2** 统一使用 Controller 或移除未使用的 Controller

### 4.2 文档与测试

- [ ] **4.2.1** 完善 OpenAPI/Swagger 文档
- [ ] **4.2.2** 补充关键 API 的集成测试

---

## 进度统计

| 阶段 | 总任务 | 已完成 | 进度 |
|------|--------|--------|------|
| 阶段 1 | 16 | 6 | 38% |
| 阶段 2 | 8 | 0 | 0% |
| 阶段 3 | 7 | 0 | 0% |
| 阶段 4 | 4 | 0 | 0% |
| **合计** | **35** | **6** | **17%** |

---

## 更新记录

| 日期 | 更新内容 |
|------|----------|
| 2025-02-08 | 创建待办文档，基于模块分析整理任务清单 |
| 2025-02-08 | ✅ 完成数据库迁移，表结构已创建（users, objectives, key_results, tasks 等9个表） |
| 2025-02-08 | ✅ 完成数据库权限配置和扩展创建（uuid-ossp, pg_trgm） |
| 2025-02-08 | ✅ 修复 JWT_REFRESH_SECRET 环境变量，注册/登录 API 测试通过 |
| 2025-02-08 | ✅ 修复 Schema 字段不匹配问题（objectives.target_date→end_date, key_results.due_date移除） |
| 2025-02-08 | ✅ 核心 API 测试通过（objectives, key-results, tasks CRUD 正常） |
