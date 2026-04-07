# ============================================
# 阶段 1: 构建阶段
# ============================================
FROM node:20-alpine AS builder

# 安装构建依赖
RUN apk add --no-cache python3 make g++

# 设置工作目录
WORKDIR /app

# 复制 package 文件
COPY package*.json ./
COPY prisma ./prisma/

# 安装所有依赖（包括 devDependencies）
RUN npm ci

# 生成 Prisma 客户端
RUN npx prisma generate

# 复制源代码
COPY . .

# 编译 TypeScript
RUN npm run build

# ============================================
# 阶段 2: 生产阶段
# ============================================
FROM node:20-alpine AS production

# 安全：创建非 root 用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# 设置工作目录
WORKDIR /app

# 安装生产环境必需的工具
RUN apk add --no-cache dumb-init

# 仅复制 package 文件
COPY package*.json ./
COPY prisma ./prisma/

# 仅安装生产依赖
RUN npm ci --only=production && npm cache clean --force

# 生成 Prisma 客户端（生产环境）
RUN npx prisma generate

# 从构建阶段复制编译后的代码
COPY --from=builder /app/dist ./dist

# 创建上传目录并设置权限
RUN mkdir -p uploads && chown -R nodejs:nodejs uploads

# 创建日志目录
RUN mkdir -p logs && chown -R nodejs:nodejs logs

# 切换到非 root 用户
USER nodejs

# 暴露端口
EXPOSE 3001

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

# 使用 dumb-init 处理信号
ENTRYPOINT ["dumb-init", "--"]

# 启动命令（执行数据库迁移后启动服务）
CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed && node dist/index.js"]
