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
EXPOSE 5173
# 启动开发服务器
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# 构建阶段
FROM base AS builder
# 安装所有依赖
RUN npm ci
# 复制源代码
COPY . .
# 构建应用
RUN npm run build

# 生产阶段 - 使用nginx提供静态文件服务
FROM nginx:alpine AS production
# 复制构建后的文件到nginx目录
COPY --from=builder /app/dist /usr/share/nginx/html
# 复制nginx配置
COPY nginx.conf /etc/nginx/conf.d/default.conf
# 暴露端口
EXPOSE 80
# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/ || exit 1
# 启动nginx
CMD ["nginx", "-g", "daemon off;"] 