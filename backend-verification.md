# TODOMaster 后端API验证测试指南

## API基础信息
- **域名**: https://todomaster-backend-1v0k.onrender.com
- **状态**: ✅ 运行中

## 验证测试步骤

### 1. 基础健康检查 ✅
```bash
# 测试根路径
curl https://todomaster-backend-1v0k.onrender.com

# 期望响应:
{
  "message": "TODOMaster API Server",
  "status": "running", 
  "version": "1.0.0",
  "api": "https://todomaster-backend-1v0k.onrender.com/api"
}
```

### 2. 详细健康检查
```bash
# 基础健康检查
curl https://todomaster-backend-1v0k.onrender.com/api/health

# 系统状态检查（包含数据库连接）
curl https://todomaster-backend-1v0k.onrender.com/api/health/status

# 数据库连接检查
curl https://todomaster-backend-1v0k.onrender.com/api/health/db

# 系统指标
curl https://todomaster-backend-1v0k.onrender.com/api/health/metrics
```

### 3. 用户认证功能测试

#### 3.1 用户注册
```bash
curl -X POST https://todomaster-backend-1v0k.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123456",
    "confirmPassword": "Test123456",
    "firstName": "Test",
    "lastName": "User"
  }'
```

#### 3.2 用户登录
```bash
curl -X POST https://todomaster-backend-1v0k.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123456"
  }'
```

**保存登录返回的token，用于后续API测试**

#### 3.3 获取当前用户信息
```bash
# 替换 YOUR_TOKEN 为登录获得的token
curl https://todomaster-backend-1v0k.onrender.com/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. 核心业务功能测试

#### 4.1 目标管理
```bash
# 获取目标列表
curl https://todomaster-backend-1v0k.onrender.com/api/objectives \
  -H "Authorization: Bearer YOUR_TOKEN"

# 创建新目标
curl -X POST https://todomaster-backend-1v0k.onrender.com/api/objectives \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "测试目标",
    "description": "这是一个测试目标",
    "category": "personal",
    "startDate": "2024-01-01",
    "targetDate": "2024-12-31"
  }'
```

#### 4.2 关键结果管理
```bash
# 获取关键结果列表
curl https://todomaster-backend-1v0k.onrender.com/api/key-results \
  -H "Authorization: Bearer YOUR_TOKEN"

# 创建关键结果（需要先有目标ID）
curl -X POST https://todomaster-backend-1v0k.onrender.com/api/key-results \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "objectiveId": "OBJECTIVE_ID",
    "title": "测试关键结果",
    "description": "测试描述",
    "type": "number",
    "targetValue": 100,
    "unit": "个"
  }'
```

#### 4.3 任务管理
```bash
# 获取任务列表
curl https://todomaster-backend-1v0k.onrender.com/api/tasks \
  -H "Authorization: Bearer YOUR_TOKEN"

# 创建任务
curl -X POST https://todomaster-backend-1v0k.onrender.com/api/tasks \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "objectiveId": "OBJECTIVE_ID",
    "keyResultId": "KEY_RESULT_ID",
    "title": "测试任务",
    "description": "测试任务描述",
    "priority": "medium",
    "dueDate": "2024-12-31"
  }'
```

#### 4.4 统计数据
```bash
# 获取总体统计
curl https://todomaster-backend-1v0k.onrender.com/api/stats/overview \
  -H "Authorization: Bearer YOUR_TOKEN"

# 获取生产力分析
curl https://todomaster-backend-1v0k.onrender.com/api/stats/productivity \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 5. 错误处理测试

#### 5.1 未授权访问
```bash
# 应该返回401错误
curl https://todomaster-backend-1v0k.onrender.com/api/objectives
```

#### 5.2 无效数据测试
```bash
# 测试无效登录
curl -X POST https://todomaster-backend-1v0k.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "invalid@email.com",
    "password": "wrongpassword"
  }'
```

### 6. 性能测试

#### 6.1 响应时间检查
```bash
# 测试API响应时间
curl -w "@curl-format.txt" -o /dev/null -s https://todomaster-backend-1v0k.onrender.com/api/health
```

创建 `curl-format.txt` 文件：
```
     time_namelookup:  %{time_namelookup}\n
        time_connect:  %{time_connect}\n
     time_appconnect:  %{time_appconnect}\n
    time_pretransfer:  %{time_pretransfer}\n
       time_redirect:  %{time_redirect}\n
  time_starttransfer:  %{time_starttransfer}\n
                     ----------\n
          time_total:  %{time_total}\n
```

### 7. 数据库连接验证

确保以下检查点都通过：
- ✅ 基础数据库查询正常
- ✅ 用户认证功能正常
- ✅ 数据写入功能正常
- ✅ 数据查询功能正常

### 8. 安全性验证

#### 8.1 CORS检查
```bash
curl -H "Origin: https://todomaster-frontend.vercel.app" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type,Authorization" \
     -X OPTIONS \
     https://todomaster-backend-1v0k.onrender.com/api/auth/login
```

#### 8.2 JWT Token验证
```bash
# 使用过期或无效token
curl https://todomaster-backend-1v0k.onrender.com/api/objectives \
  -H "Authorization: Bearer invalid_token"
```

## 验证清单

### 基础功能 ✅
- [ ] API服务器正常启动
- [ ] 健康检查端点响应正常
- [ ] 数据库连接正常

### 认证功能
- [ ] 用户注册功能正常
- [ ] 用户登录功能正常
- [ ] JWT token生成和验证正常
- [ ] 受保护路由访问控制正常

### 业务功能
- [ ] 目标CRUD操作正常
- [ ] 关键结果CRUD操作正常
- [ ] 任务CRUD操作正常
- [ ] 统计数据查询正常

### 错误处理
- [ ] 401未授权错误正确返回
- [ ] 400验证错误正确返回
- [ ] 404资源不存在错误正确返回
- [ ] 500服务器错误正确处理

### 性能指标
- [ ] API响应时间 < 2秒
- [ ] 数据库查询响应时间 < 1秒
- [ ] 健康检查响应时间 < 500ms

## 常见问题排查

### 1. 数据库连接失败
检查环境变量配置是否正确：
- DB_HOST
- DB_PORT
- DB_NAME
- DB_USER
- DB_PASSWORD

### 2. JWT Token问题
检查环境变量：
- JWT_SECRET
- JWT_EXPIRES_IN

### 3. CORS问题
检查前端域名是否在CORS白名单中

## 下一步
1. 验证所有测试用例通过
2. 配置前端连接到此后端API
3. 进行端到端集成测试
4. 设置监控和日志记录 