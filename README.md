# AAFA 网站后端 API

AAFA 社区网站的后端服务，基于 Node.js + Express + Prisma + PostgreSQL 构建。

## 🛠 技术栈

- **框架**: Express.js 4.x
- **语言**: TypeScript 5.x
- **ORM**: Prisma 6.x
- **数据库**: PostgreSQL
- **认证**: JWT
- **文件上传**: Multer

## 📁 项目结构

```
aafa-website-backend/
├── src/
│   ├── controllers/    # 控制器
│   ├── middleware/     # 中间件
│   ├── routes/         # 路由
│   ├── types/          # 类型定义
│   ├── utils/          # 工具函数
│   └── index.ts        # 入口文件
├── prisma/
│   ├── schema.prisma   # 数据模型
│   └── seed.ts         # 种子数据
├── uploads/            # 上传文件目录
├── .env.example        # 环境变量示例
└── package.json
```

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env` 文件，配置数据库连接和其他参数：

```env
PORT=3001
DATABASE_URL="postgresql://username:password@localhost:5432/aafa_db?schema=public"
JWT_SECRET=your-super-secret-key
FRONTEND_URL=http://localhost:3000
```

### 3. 初始化数据库

```bash
# 生成 Prisma Client
npm run db:generate

# 创建数据库表
npm run db:migrate

# 填充种子数据
npm run db:seed
```

### 4. 启动开发服务器

```bash
npm run dev
```

服务将运行在 http://localhost:3001

## 📚 API 文档

### 基础信息

- **Base URL**: `http://localhost:3001/api/v1`
- **认证方式**: Bearer Token (JWT)

### 认证接口

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | `/auth/register` | 用户注册 | 否 |
| POST | `/auth/login` | 用户登录 | 否 |
| GET | `/auth/me` | 获取当前用户 | 是 |
| PATCH | `/auth/me` | 更新用户信息 | 是 |

### 文章接口

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/articles` | 获取文章列表 | 否 |
| GET | `/articles/:id` | 获取文章详情 | 否 |
| GET | `/articles/slug/:slug` | 通过 slug 获取文章 | 否 |
| GET | `/articles/categories` | 获取分类列表 | 否 |
| GET | `/articles/tags` | 获取标签列表 | 否 |
| POST | `/articles` | 创建文章 | 管理员 |
| PATCH | `/articles/:id` | 更新文章 | 管理员 |
| DELETE | `/articles/:id` | 删除文章 | 管理员 |

### 活动接口

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/events` | 获取活动列表 | 否 |
| GET | `/events/upcoming` | 即将开始的活动 | 否 |
| GET | `/events/past` | 往期活动 | 否 |
| GET | `/events/:id` | 获取活动详情 | 否 |
| POST | `/events/:id/register` | 活动报名 | 可选 |
| POST | `/events` | 创建活动 | 管理员 |
| PATCH | `/events/:id` | 更新活动 | 管理员 |
| DELETE | `/events/:id` | 删除活动 | 管理员 |

### 文件上传接口

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | `/upload/image` | 上传单张图片 | 管理员 |
| POST | `/upload/images` | 上传多张图片 | 管理员 |
| GET | `/upload/:filename` | 获取图片 | 否 |
| DELETE | `/upload/:filename` | 删除图片 | 管理员 |

### Newsletter 接口

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | `/newsletter/subscribe` | 订阅 | 否 |
| POST | `/newsletter/unsubscribe` | 取消订阅 | 否 |
| GET | `/newsletter/subscribers` | 获取订阅列表 | 管理员 |

## 🔑 默认账号

运行种子数据后会创建以下账号：

- **管理员**: `admin@aafa.com` / `admin123456`
- **编辑**: `editor@aafa.com` / `author123456`

## 📝 常用命令

```bash
# 开发模式
npm run dev

# 构建
npm run build

# 生产模式
npm run start

# 数据库迁移
npm run db:migrate

# 数据库可视化
npm run db:studio

# 重置并填充种子数据
npm run db:seed
```

## 🔗 前端对接

前端项目已配置好 API 调用，只需在 `.env.local` 中设置：

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

## 📄 许可证

MIT
