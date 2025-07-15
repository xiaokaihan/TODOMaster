# 🚀 TODOMaster 部署指南

## 📋 方案一：分离式部署 (推荐)

使用 **Vercel** (前端) + **Railway** (后端) + **Supabase** (数据库) 的免费部署方案。

### 🎯 一键部署 vs 自动化部署

| 方式 | 适用场景 | 设置复杂度 | 优势 |
|------|----------|------------|------|
| **手动一键部署** | 个人项目、快速验证 | ⭐⭐ | 简单快速，完全控制 |
| **CI/CD自动部署** | 团队项目、生产环境 | ⭐⭐⭐⭐ | 自动化，减少错误 |

## 🚀 快速开始 (手动部署)

### 1. 准备工作

```bash
# 安装必要的CLI工具
npm install -g vercel @railway/cli

# 登录到各平台
vercel login
railway login
```

### 2. 数据库设置 (Supabase)

1. 访问 [supabase.com](https://supabase.com) 创建项目
2. 获取数据库连接信息
3. 运行数据库迁移：
```bash
cd packages/backend
npm run db:migrate
```

### 3. 一键部署

```bash
# 执行部署脚本
./scripts/deploy-vercel-railway.sh prod
```

脚本会自动：
- ✅ 检查必要工具
- ✅ 构建共享包
- ✅ 部署后端到Railway
- ✅ 部署前端到Vercel
- ✅ 自动配置API连接
- ✅ 执行健康检查

## 🔄 自动化部署 (CI/CD)

### 1. 配置 GitHub Secrets

在 GitHub Repository > Settings > Secrets and variables > Actions 中添加：

```
VERCEL_TOKEN=your_token
VERCEL_ORG_ID=your_org_id  
VERCEL_PROJECT_ID=your_project_id
RAILWAY_TOKEN=your_token
```

### 2. 获取Token方法

#### Vercel Token:
```bash
# 方法1: 网页获取
# 访问 https://vercel.com/account/tokens
# 创建名为 "todomaster-deploy" 的token

# 方法2: CLI获取
vercel whoami
```

#### Railway Token:
```bash
# 访问 https://railway.app/account/tokens
# 创建名为 "todomaster-deploy" 的token
```

#### Vercel Project ID:
```bash
# 在项目中执行vercel命令后
cat .vercel/project.json
```

### 3. 自动部署触发

推送代码到 `main` 分支即可自动触发部署：

```bash
git add .
git commit -m "feat: 添加新功能"
git push origin main
```

## 📊 部署监控

### 查看部署状态

```bash
# Vercel状态
vercel ls

# Railway状态  
railway status

# 查看日志
vercel logs
railway logs
```

### 健康检查

```bash
# 检查后端API
curl https://your-backend.railway.app/health

# 检查前端
curl https://your-frontend.vercel.app
```

## 🔧 故障排除

### 常见问题

#### 1. 构建失败
```bash
# 本地测试构建
cd packages/shared && npm run build
cd ../frontend && npm run build:vercel
cd ../backend && npm run build
```

#### 2. 环境变量问题
```bash
# 检查Railway环境变量
railway variables

# 检查Vercel环境变量  
vercel env ls
```

#### 3. 数据库连接失败
```bash
# 测试数据库连接
cd packages/backend
npm run db:test
```

### 回滚部署

```bash
# Vercel回滚
vercel rollback

# Railway回滚
railway rollback
```

## 📈 性能优化

### 前端优化
- ✅ 已启用gzip压缩
- ✅ 已配置静态资源缓存
- ✅ 已优化构建包大小

### 后端优化
- ✅ 已配置健康检查
- ✅ 已启用生产模式
- ✅ 已配置数据库连接池

## 💰 成本控制

### 免费额度监控

| 平台 | 免费额度 | 监控方法 |
|------|----------|----------|
| **Vercel** | 100GB带宽/月 | Dashboard > Usage |
| **Railway** | 500小时/月 | Dashboard > Usage |
| **Supabase** | 500MB存储 | Dashboard > Settings |

### 节省资源技巧

1. **Railway**: 设置自动睡眠
```bash
railway settings update --auto-sleep=true
```

2. **Vercel**: 启用图片优化
```json
// vercel.json
{
  "images": {
    "unoptimized": false
  }
}
```

## 🔒 安全最佳实践

### 环境变量安全
- ✅ 所有敏感信息使用环境变量
- ✅ 生产环境使用强密码
- ✅ 定期轮换JWT密钥

### CORS配置
```javascript
// 生产环境严格限制CORS
CORS_ORIGIN=https://your-domain.vercel.app
```

### SSL配置
- ✅ Vercel自动提供SSL
- ✅ Railway自动提供SSL
- ✅ 强制HTTPS重定向

## 📚 进阶配置

### 自定义域名

```bash
# Vercel添加域名
vercel domains add your-domain.com

# 配置DNS
# A record: @ -> 76.76.19.61
# CNAME: www -> cname.vercel-dns.com
```

### 多环境部署

```bash
# 部署到staging环境
./scripts/deploy-vercel-railway.sh staging

# 部署到production环境  
./scripts/deploy-vercel-railway.sh prod
```

### 备份策略

```bash
# 数据库备份 (Supabase自动备份)
# 代码备份 (Git自动备份)
# 配置备份
cp deploy.config.example deploy.config.backup
```

---

## 🎉 部署成功检查清单

- [ ] 前端可正常访问
- [ ] 后端API响应正常  
- [ ] 数据库连接正常
- [ ] 用户注册/登录功能正常
- [ ] CORS配置正确
- [ ] 环境变量配置完整
- [ ] 监控和日志正常
- [ ] 备份策略已设置

**恭喜！您的TODOMaster已成功部署！🎉** 