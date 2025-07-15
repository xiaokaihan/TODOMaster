# 使用官方Node.js镜像作为基础镜像
FROM node:18-alpine AS base

# 设置工作目录
WORKDIR /app

# 安装必要的系统依赖
RUN apk add --no-cache libc6-compat curl

# 复制package.json和package-lock.json
COPY package*.json ./
COPY yarn.lock* ./

# 安装依赖
RUN npm ci --only=production && npm cache clean --force

# 开发阶段
FROM base AS development
# 安装所有依赖（包括开发依赖）
RUN npm ci
# 复制源代码
COPY . .
# 暴露端口
EXPOSE 3000
# 启动开发服务器
CMD ["npm", "run", "dev"]

# 构建阶段
FROM base AS builder
# 安装所有依赖
RUN npm ci
# 复制源代码
COPY . .
# 构建应用
RUN npm run build

# 生产阶段
FROM base AS production
# 复制构建后的文件
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
# 创建非root用户
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 todomaster
# 设置文件权限
USER todomaster
# 暴露端口
EXPOSE 3000
# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1
# 启动应用
CMD ["npm", "start"] 