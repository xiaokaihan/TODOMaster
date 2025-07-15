# 🚀 Render 配置快速参考

## 📍 在哪里找什么

### PostgreSQL 数据库连接信息位置
```
Render Dashboard → todomaster-postgres → Info 页面
或者
Render Dashboard → todomaster-postgres → Connect 页面
```

### Web Service 环境变量配置位置  
```
Render Dashboard → todomaster-backend → Environment 页面
```

## 📋 必须添加的14个环境变量

| 变量名 | 示例值 | 说明 |
|--------|--------|------|
| `NODE_ENV` | `production` | 运行环境 |
| `PORT` | `3000` | 服务端口 |
| `API_PREFIX` | `/api/v1` | API前缀 |
| `DB_HOST` | `dpg-xxx.oregon-postgres.render.com` | 从数据库复制 |
| `DB_PORT` | `5432` | 从数据库复制 |
| `DB_NAME` | `todomaster` | 数据库名 |
| `DB_USERNAME` | `todomaster` | 从数据库复制 |
| `DB_PASSWORD` | `xxx` | 从数据库复制 |
| `DB_SSL` | `true` | 启用SSL |
| `JWT_SECRET` | `todomaster_super_secret_jwt_key_2024_32chars_min` | JWT密钥 |
| `JWT_EXPIRES_IN` | `7d` | JWT过期时间 |
| `CORS_ORIGIN` | `https://todomaster.vercel.app` | 前端域名 |
| `LOG_LEVEL` | `info` | 日志级别 |

## ⚠️ 重要提示

postgresql://todomaster:aVRDTerViP8S1jBGntA8GZuMxcIRWLFr@dpg-d1r8qc7fte5s73cq3ul0-a.singapore-postgres.render.com/todomaster_if5t

1. **DB_HOST**: 通常格式为 `dpg-xxxx.oregon-postgres.render.com`
2. **DB_PASSWORD**: 是一个长随机字符串，请完整复制
3. **JWT_SECRET**: 必须至少32个字符，用于加密JWT令牌
4. **CORS_ORIGIN**: 使用Vercel默认域名，稍后可更新

## 🔍 验证步骤

配置完成后，检查：
1. ✅ 服务状态显示 "Live"
2. ✅ 没有错误日志
3. ✅ 可以访问 `https://your-service.onrender.com/health`

## 🆘 常见问题

**Q: 找不到数据库连接信息？**
A: 确保PostgreSQL服务已完全创建完成（需要几分钟）

**Q: 服务启动失败？**  
A: 检查Logs页面，通常是环境变量配置错误

**Q: 数据库连接失败？**
A: 确认DB_HOST、DB_PASSWORD等信息复制正确 

## 推荐使用的JWT_SECRET

您可以选择以下任一个：

### 选项1（较长，更安全）：
```
2b6c522fe6a0e74886aec3e98203488f36c701c16c2a4ed56c5a0459c393d42e9615514952555d29ce2729a14f1a1e568f7564f5effce9d625ec0760b2f5dcf6
```

### 选项2（标准长度）：
```
12056a029a9cec71cd7d87f6f49d0dc0e3f2d70b4018727ff331d3d36cfabd21
```

## 使用说明

1. **在Render环境变量中配置**：
   - 变量名：`JWT_SECRET`
   - 变量值：选择上面任一个密钥

2. **安全要求**：
   - ✅ 至少32个字符长
   - ✅ 随机生成，不可预测
   - ✅ 生产环境和开发环境使用不同的密钥
   - ⚠️ 绝不要将JWT_SECRET提交到代码仓库

3. **在Render中设置**：
   ```
   JWT_SECRET=12056a029a9cec71cd7d87f6f49d0dc0e3f2d70b4018727ff331d3d36cfabd21
   ```

现在您可以复制其中一个JWT_SECRET值，在Render的环境变量配置中使用了！

建议使用**选项2**（标准长度），既安全又便于管理。 