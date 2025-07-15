# TODOMaster API 文档

## 📋 概述

TODOMaster是一个基于OKR（Objectives and Key Results）方法论的任务管理系统。本API提供了完整的用户管理、目标设置、关键结果跟踪和任务管理功能。

### 🔗 基本信息

- **Base URL**: `http://localhost:3000/api/v1`
- **协议**: HTTP/HTTPS
- **数据格式**: JSON
- **认证方式**: JWT Bearer Token

### 🏗️ 架构说明

API采用RESTful设计原则，支持标准的HTTP方法：
- `GET` - 获取资源
- `POST` - 创建资源
- `PUT` - 更新资源
- `DELETE` - 删除资源

## 🔐 认证

### JWT Token认证

所有需要认证的接口都需要在请求头中包含JWT Token：

```http
Authorization: Bearer <your-jwt-token>
```

### 获取Token

通过登录接口获取JWT Token：

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**响应示例：**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "用户名",
      "role": "user"
    }
  }
}
```

## 📊 响应格式

### 成功响应

```json
{
  "success": true,
  "data": {
    // 响应数据
  },
  "message": "操作成功" // 可选
}
```

### 错误响应

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误信息",
    "details": {} // 可选，详细错误信息
  }
}
```

### HTTP状态码

- `200` - 成功
- `201` - 创建成功
- `400` - 请求参数错误
- `401` - 未认证
- `403` - 权限不足
- `404` - 资源不存在
- `422` - 数据验证失败
- `500` - 服务器内部错误

## 🩺 健康检查

### 基本健康检查

**接口：** `GET /health`

**描述：** 检查API服务状态

**响应：**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "database": "connected",
  "version": "1.0.0",
  "environment": "production"
}
```

### 详细健康检查

**接口：** `GET /api/v1/health`

**描述：** 获取详细的系统健康状态

**响应：**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600.123,
  "message": "服务运行正常",
  "version": "1.0.0"
}
```

### 数据库健康检查

**接口：** `GET /api/v1/health/database`

**描述：** 检查数据库连接状态

**响应：**
```json
{
  "status": "healthy",
  "responseTime": 15,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 👥 用户管理

### 获取用户列表

**接口：** `GET /api/v1/users`

**权限：** 管理员

**查询参数：**
- `page` (number) - 页码，默认1
- `limit` (number) - 每页数量，默认10
- `search` (string) - 搜索关键词
- `role` (string) - 角色筛选：user, admin

**响应：**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "uuid",
        "email": "user@example.com",
        "name": "用户名",
        "role": "user",
        "isActive": true,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "lastLoginAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "pages": 5
    }
  }
}
```

### 获取用户详情

**接口：** `GET /api/v1/users/:id`

**权限：** 管理员

**响应：**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "用户名",
      "role": "user",
      "isActive": true,
      "timezone": "Asia/Shanghai",
      "preferences": {},
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### 更新用户信息

**接口：** `PUT /api/v1/users/:id`

**权限：** 管理员

**请求体：**
```json
{
  "name": "新用户名",
  "role": "admin",
  "isActive": false
}
```

### 删除用户

**接口：** `DELETE /api/v1/users/:id`

**权限：** 管理员

**响应：**
```json
{
  "success": true,
  "message": "用户删除成功"
}
```

### 获取个人资料

**接口：** `GET /api/v1/users/profile`

**权限：** 用户本人

**响应：**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "用户名",
      "timezone": "Asia/Shanghai",
      "preferences": {}
    }
  }
}
```

### 更新个人资料

**接口：** `PUT /api/v1/users/profile`

**权限：** 用户本人

**请求体：**
```json
{
  "name": "新用户名",
  "timezone": "Asia/Shanghai",
  "preferences": {
    "theme": "dark",
    "language": "zh-CN"
  }
}
```

### 修改密码

**接口：** `POST /api/v1/users/change-password`

**权限：** 用户本人

**请求体：**
```json
{
  "currentPassword": "old_password",
  "newPassword": "new_password",
  "confirmPassword": "new_password"
}
```

## 🎯 目标管理

### 获取目标列表

**接口：** `GET /api/v1/objectives`

**权限：** 用户本人

**查询参数：**
- `page` (number) - 页码
- `limit` (number) - 每页数量
- `status` (string) - 状态筛选：active, completed, archived
- `category` (string) - 类别筛选：work, personal, learning, health
- `search` (string) - 搜索关键词

**响应：**
```json
{
  "success": true,
  "data": {
    "objectives": [
      {
        "id": "uuid",
        "title": "提升技术能力",
        "description": "通过学习和实践提升开发技能",
        "category": "learning",
        "status": "active",
        "progress": 65,
        "startDate": "2024-01-01",
        "endDate": "2024-12-31",
        "keyResultsCount": 3,
        "tasksCount": 8,
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    }
  }
}
```

### 获取目标详情

**接口：** `GET /api/v1/objectives/:id`

**权限：** 用户本人

**响应：**
```json
{
  "success": true,
  "data": {
    "objective": {
      "id": "uuid",
      "title": "提升技术能力",
      "description": "通过学习和实践提升开发技能",
      "category": "learning",
      "status": "active",
      "progress": 65,
      "startDate": "2024-01-01",
      "endDate": "2024-12-31",
      "keyResults": [
        {
          "id": "uuid",
          "title": "完成在线课程",
          "currentValue": 8,
          "targetValue": 10,
          "progress": 80
        }
      ],
      "tasks": [
        {
          "id": "uuid",
          "title": "学习React进阶",
          "status": "in_progress",
          "priority": "high"
        }
      ]
    }
  }
}
```

### 创建目标

**接口：** `POST /api/v1/objectives`

**权限：** 用户本人

**请求体：**
```json
{
  "title": "提升技术能力",
  "description": "通过学习和实践提升开发技能",
  "category": "learning",
  "startDate": "2024-01-01",
  "endDate": "2024-12-31"
}
```

### 更新目标

**接口：** `PUT /api/v1/objectives/:id`

**权限：** 用户本人

**请求体：**
```json
{
  "title": "更新的目标标题",
  "description": "更新的描述",
  "status": "active"
}
```

### 删除目标

**接口：** `DELETE /api/v1/objectives/:id`

**权限：** 用户本人

### 完成目标

**接口：** `POST /api/v1/objectives/:id/complete`

**权限：** 用户本人

**响应：**
```json
{
  "success": true,
  "data": {
    "objective": {
      "id": "uuid",
      "status": "completed",
      "progress": 100,
      "completedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### 重新打开目标

**接口：** `POST /api/v1/objectives/:id/reopen`

**权限：** 用户本人

## 🔑 关键结果管理

### 获取关键结果列表

**接口：** `GET /api/v1/key-results`

**权限：** 用户本人

**查询参数：**
- `page`, `limit` - 分页参数
- `objectiveId` (string) - 目标ID筛选
- `status` (string) - 状态筛选
- `search` (string) - 搜索关键词

**响应：**
```json
{
  "success": true,
  "data": {
    "keyResults": [
      {
        "id": "uuid",
        "title": "完成10门在线课程",
        "description": "学习前端和后端技术课程",
        "type": "number",
        "currentValue": 7,
        "targetValue": 10,
        "unit": "门",
        "progress": 70,
        "status": "active",
        "objectiveId": "uuid",
        "objectiveTitle": "提升技术能力"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 15,
      "pages": 2
    }
  }
}
```

### 获取关键结果详情

**接口：** `GET /api/v1/key-results/:id`

**权限：** 用户本人

### 创建关键结果

**接口：** `POST /api/v1/key-results`

**权限：** 用户本人

**请求体：**
```json
{
  "title": "完成10门在线课程",
  "description": "学习前端和后端技术课程",
  "type": "number",
  "targetValue": 10,
  "currentValue": 0,
  "unit": "门",
  "objectiveId": "uuid"
}
```

### 更新关键结果

**接口：** `PUT /api/v1/key-results/:id`

**权限：** 用户本人

### 删除关键结果

**接口：** `DELETE /api/v1/key-results/:id`

**权限：** 用户本人

### 更新关键结果进度

**接口：** `POST /api/v1/key-results/:id/update-progress`

**权限：** 用户本人

**请求体：**
```json
{
  "currentValue": 8,
  "notes": "本周完成了React和Vue课程"
}
```

**响应：**
```json
{
  "success": true,
  "data": {
    "keyResult": {
      "id": "uuid",
      "currentValue": 8,
      "progress": 80,
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### 完成关键结果

**接口：** `POST /api/v1/key-results/:id/complete`

**权限：** 用户本人

### 重新打开关键结果

**接口：** `POST /api/v1/key-results/:id/reopen`

**权限：** 用户本人

## ✅ 任务管理

### 获取任务列表

**接口：** `GET /api/v1/tasks`

**权限：** 用户本人

**查询参数：**
- `page`, `limit` - 分页参数
- `status` (string) - 状态筛选：pending, in_progress, completed, cancelled
- `priority` (string) - 优先级筛选：low, medium, high, urgent
- `objectiveId` (string) - 目标ID筛选
- `keyResultId` (string) - 关键结果ID筛选
- `search` (string) - 搜索关键词

**响应：**
```json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "id": "uuid",
        "title": "学习React Hooks",
        "description": "深入学习React Hooks的使用方法",
        "status": "in_progress",
        "priority": "high",
        "estimatedHours": 8,
        "actualHours": 5.5,
        "dueDate": "2024-01-15",
        "objectiveId": "uuid",
        "keyResultId": "uuid",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "objective": {
          "title": "提升技术能力"
        },
        "keyResult": {
          "title": "完成10门在线课程"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    }
  }
}
```

### 获取任务详情

**接口：** `GET /api/v1/tasks/:id`

**权限：** 用户本人

**响应：**
```json
{
  "success": true,
  "data": {
    "task": {
      "id": "uuid",
      "title": "学习React Hooks",
      "description": "深入学习React Hooks的使用方法",
      "status": "in_progress",
      "priority": "high",
      "estimatedHours": 8,
      "actualHours": 5.5,
      "dueDate": "2024-01-15",
      "completedAt": null,
      "notes": "进展顺利，已完成useState和useEffect部分",
      "objectiveId": "uuid",
      "keyResultId": "uuid",
      "dependencies": [
        {
          "id": "uuid",
          "title": "搭建开发环境",
          "status": "completed"
        }
      ]
    }
  }
}
```

### 创建任务

**接口：** `POST /api/v1/tasks`

**权限：** 用户本人

**请求体：**
```json
{
  "title": "学习React Hooks",
  "description": "深入学习React Hooks的使用方法",
  "priority": "high",
  "estimatedHours": 8,
  "dueDate": "2024-01-15",
  "objectiveId": "uuid",
  "keyResultId": "uuid"
}
```

### 更新任务

**接口：** `PUT /api/v1/tasks/:id`

**权限：** 用户本人

**请求体：**
```json
{
  "title": "更新的任务标题",
  "status": "in_progress",
  "priority": "high",
  "actualHours": 6
}
```

### 删除任务

**接口：** `DELETE /api/v1/tasks/:id`

**权限：** 用户本人

### 完成任务

**接口：** `POST /api/v1/tasks/:id/complete`

**权限：** 用户本人

**请求体：**
```json
{
  "actualHours": 8,
  "notes": "任务完成，学会了所有主要Hooks"
}
```

**响应：**
```json
{
  "success": true,
  "data": {
    "task": {
      "id": "uuid",
      "status": "completed",
      "actualHours": 8,
      "completedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### 重新打开任务

**接口：** `POST /api/v1/tasks/:id/reopen`

**权限：** 用户本人

### 更新任务进度

**接口：** `POST /api/v1/tasks/:id/update-progress`

**权限：** 用户本人

**请求体：**
```json
{
  "actualHours": 6.5,
  "notes": "完成了75%的内容"
}
```

## 📊 统计数据

### 仪表板统计

**接口：** `GET /api/v1/stats/dashboard`

**权限：** 用户本人

**响应：**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalObjectives": 5,
      "activeObjectives": 3,
      "completedObjectives": 2,
      "totalKeyResults": 15,
      "completedKeyResults": 8,
      "totalTasks": 45,
      "completedTasks": 28,
      "overallProgress": 72
    },
    "recentActivity": [
      {
        "type": "task_completed",
        "title": "完成了任务：学习React Hooks",
        "timestamp": "2024-01-01T00:00:00.000Z"
      }
    ],
    "upcomingDeadlines": [
      {
        "type": "task",
        "title": "完成项目文档",
        "dueDate": "2024-01-05",
        "daysLeft": 4
      }
    ]
  }
}
```

### 目标统计

**接口：** `GET /api/v1/stats/objectives`

**权限：** 用户本人

**查询参数：**
- `startDate` (string) - 开始日期
- `endDate` (string) - 结束日期

**响应：**
```json
{
  "success": true,
  "data": {
    "summary": {
      "total": 5,
      "active": 3,
      "completed": 2,
      "averageProgress": 68
    },
    "statusDistribution": {
      "active": 3,
      "completed": 2,
      "archived": 0
    },
    "categoryDistribution": {
      "work": 2,
      "personal": 1,
      "learning": 2,
      "health": 0
    },
    "progressDistribution": {
      "0-25": 1,
      "26-50": 0,
      "51-75": 1,
      "76-100": 3
    }
  }
}
```

### 任务统计

**接口：** `GET /api/v1/stats/tasks`

**权限：** 用户本人

**查询参数：**
- `priority` (string) - 优先级筛选
- `status` (string) - 状态筛选

**响应：**
```json
{
  "success": true,
  "data": {
    "summary": {
      "total": 45,
      "completed": 28,
      "inProgress": 12,
      "pending": 5,
      "completionRate": 62
    },
    "statusDistribution": {
      "pending": 5,
      "in_progress": 12,
      "completed": 28,
      "cancelled": 0
    },
    "priorityDistribution": {
      "low": 8,
      "medium": 22,
      "high": 12,
      "urgent": 3
    },
    "completionTrend": [
      {
        "date": "2024-01-01",
        "completed": 3
      }
    ]
  }
}
```

### 生产力统计

**接口：** `GET /api/v1/stats/productivity`

**权限：** 用户本人

**查询参数：**
- `period` (string) - 时间周期：day, week, month, year

**响应：**
```json
{
  "success": true,
  "data": {
    "timeStats": {
      "totalHours": 156.5,
      "averageHoursPerDay": 6.2,
      "estimatedVsActual": {
        "estimated": 180,
        "actual": 156.5,
        "efficiency": 87
      }
    },
    "completionRate": {
      "tasks": 62,
      "keyResults": 53,
      "objectives": 40
    },
    "efficiencyMetrics": {
      "onTimeCompletion": 85,
      "averageTaskDuration": 5.5,
      "productiveHours": 132
    },
    "trends": {
      "productivity": "increasing",
      "efficiency": "stable",
      "workload": "optimal"
    }
  }
}
```

### 时间跟踪统计

**接口：** `GET /api/v1/stats/time-tracking`

**权限：** 用户本人

**查询参数：**
- `startDate` (string) - 开始日期
- `endDate` (string) - 结束日期

**响应：**
```json
{
  "success": true,
  "data": {
    "totalHours": 156.5,
    "estimatedVsActual": {
      "totalEstimated": 180,
      "totalActual": 156.5,
      "variance": -23.5,
      "accuracyRate": 87
    },
    "dailyBreakdown": [
      {
        "date": "2024-01-01",
        "hours": 8.5,
        "tasksCompleted": 3
      }
    ],
    "taskBreakdown": [
      {
        "category": "learning",
        "hours": 45.5,
        "percentage": 29
      }
    ]
  }
}
```

### 进度趋势

**接口：** `GET /api/v1/stats/progress-trends`

**权限：** 用户本人

**查询参数：**
- `granularity` (string) - 时间粒度：daily, weekly, monthly

**响应：**
```json
{
  "success": true,
  "data": {
    "objectiveProgress": [
      {
        "date": "2024-01-01",
        "averageProgress": 65
      }
    ],
    "keyResultProgress": [
      {
        "date": "2024-01-01",
        "completedCount": 2,
        "totalCount": 15
      }
    ],
    "taskCompletion": [
      {
        "date": "2024-01-01",
        "completedCount": 3,
        "totalCount": 8
      }
    ],
    "timeline": {
      "startDate": "2024-01-01",
      "endDate": "2024-01-31",
      "dataPoints": 31
    }
  }
}
```

### 管理员统计

#### 系统概览

**接口：** `GET /api/v1/stats/admin/overview`

**权限：** 管理员

**响应：**
```json
{
  "success": true,
  "data": {
    "userStats": {
      "totalUsers": 150,
      "activeUsers": 120,
      "newUsersThisMonth": 15
    },
    "contentStats": {
      "totalObjectives": 500,
      "totalKeyResults": 1200,
      "totalTasks": 3500
    },
    "activityStats": {
      "dailyActiveUsers": 85,
      "tasksCompletedToday": 45,
      "objectivesCreatedThisWeek": 12
    },
    "systemHealth": {
      "uptime": 99.9,
      "responseTime": 120,
      "errorRate": 0.1
    }
  }
}
```

#### 用户统计

**接口：** `GET /api/v1/stats/admin/users`

**权限：** 管理员

**响应：**
```json
{
  "success": true,
  "data": {
    "totalUsers": 150,
    "activeUsers": 120,
    "userGrowth": [
      {
        "month": "2024-01",
        "newUsers": 15,
        "totalUsers": 150
      }
    ],
    "engagementMetrics": {
      "averageSessionDuration": 45,
      "averageTasksPerUser": 23,
      "retentionRate": 85
    }
  }
}
```

#### 性能统计

**接口：** `GET /api/v1/stats/admin/performance`

**权限：** 管理员

**响应：**
```json
{
  "success": true,
  "data": {
    "responseTime": {
      "average": 120,
      "p95": 300,
      "p99": 500
    },
    "throughput": {
      "requestsPerSecond": 50,
      "requestsPerDay": 4320000
    },
    "errorRate": {
      "percentage": 0.1,
      "count": 432
    },
    "resourceUsage": {
      "cpu": 65,
      "memory": 78,
      "disk": 45
    }
  }
}
```

### 数据导出

**接口：** `GET /api/v1/stats/export`

**权限：** 用户本人

**查询参数：**
- `format` (string) - 导出格式：json, csv

**响应（JSON格式）：**
```json
{
  "success": true,
  "data": {
    "exportData": {
      "objectives": [...],
      "keyResults": [...],
      "tasks": [...]
    },
    "exportDate": "2024-01-01T00:00:00.000Z",
    "format": "json"
  }
}
```

## 📋 数据模型

### User（用户）

```typescript
interface User {
  id: string
  email: string
  name: string
  role: 'user' | 'admin'
  isActive: boolean
  timezone?: string
  preferences?: object
  createdAt: Date
  updatedAt: Date
  lastLoginAt?: Date
}
```

### Objective（目标）

```typescript
interface Objective {
  id: string
  title: string
  description?: string
  category: 'work' | 'personal' | 'learning' | 'health'
  status: 'active' | 'completed' | 'archived'
  progress: number // 0-100
  startDate: Date
  endDate: Date
  userId: string
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
}
```

### KeyResult（关键结果）

```typescript
interface KeyResult {
  id: string
  title: string
  description?: string
  type: 'number' | 'percentage' | 'boolean'
  currentValue: number
  targetValue: number
  unit?: string
  progress: number // 0-100
  status: 'active' | 'completed' | 'archived'
  objectiveId: string
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
}
```

### Task（任务）

```typescript
interface Task {
  id: string
  title: string
  description?: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  estimatedHours?: number
  actualHours?: number
  dueDate?: Date
  completedAt?: Date
  notes?: string
  userId: string
  objectiveId: string
  keyResultId?: string
  createdAt: Date
  updatedAt: Date
}
```

## 🚫 错误代码

| 错误代码 | HTTP状态码 | 描述 |
|---------|-----------|------|
| INVALID_CREDENTIALS | 401 | 无效的登录凭据 |
| TOKEN_EXPIRED | 401 | JWT Token已过期 |
| INSUFFICIENT_PERMISSIONS | 403 | 权限不足 |
| RESOURCE_NOT_FOUND | 404 | 资源不存在 |
| VALIDATION_ERROR | 422 | 数据验证失败 |
| DUPLICATE_EMAIL | 422 | 邮箱已存在 |
| WEAK_PASSWORD | 422 | 密码强度不足 |
| INVALID_DATE_RANGE | 400 | 无效的日期范围 |
| OBJECTIVE_NOT_FOUND | 404 | 目标不存在 |
| KEYRESULT_NOT_FOUND | 404 | 关键结果不存在 |
| TASK_NOT_FOUND | 404 | 任务不存在 |
| CANNOT_DELETE_SELF | 400 | 不能删除自己的账户 |
| INTERNAL_SERVER_ERROR | 500 | 服务器内部错误 |

## 📝 请求示例

### 使用curl

```bash
# 登录获取token
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# 使用token访问API
curl -X GET http://localhost:3000/api/v1/objectives \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 创建目标
curl -X POST http://localhost:3000/api/v1/objectives \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"学习新技术","category":"learning","startDate":"2024-01-01","endDate":"2024-12-31"}'
```

### 使用JavaScript

```javascript
// 设置基础配置
const API_BASE = 'http://localhost:3000/api/v1'
const token = localStorage.getItem('jwt_token')

// 通用请求函数
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers
    },
    ...options
  }
  
  const response = await fetch(url, config)
  return response.json()
}

// 获取目标列表
const objectives = await apiRequest('/objectives')

// 创建新目标
const newObjective = await apiRequest('/objectives', {
  method: 'POST',
  body: JSON.stringify({
    title: '学习新技术',
    category: 'learning',
    startDate: '2024-01-01',
    endDate: '2024-12-31'
  })
})
```

## 🔄 更新日志

### v1.0.0 (2024-01-01)
- 初始版本发布
- 实现用户管理功能
- 实现目标和关键结果管理
- 实现任务管理功能
- 实现统计数据功能
- 添加管理员功能

---

📚 **更多信息：**
- [项目README](../README.md)
- [测试文档](../TESTING.md)
- [部署指南](./DEPLOYMENT.md) 