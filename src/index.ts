import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';

// 加载环境变量
dotenv.config();

// 导入路由
import authRoutes from './routes/auth.routes';
import articleRoutes from './routes/article.routes';
import eventRoutes from './routes/event.routes';
import uploadRoutes from './routes/upload.routes';
import newsletterRoutes from './routes/newsletter.routes';

// 导入中间件
import { notFoundHandler, errorHandler } from './middleware/errorHandler';
import { handleUploadError } from './middleware/upload';

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// 中间件
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 静态文件服务
const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';
app.use('/uploads', express.static(path.resolve(UPLOAD_DIR)));

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
  });
});

// API 路由
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/articles', articleRoutes);
app.use('/api/v1/events', eventRoutes);
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1/newsletter', newsletterRoutes);

// 上传错误处理
app.use(handleUploadError);

// 404 处理
app.use(notFoundHandler);

// 全局错误处理
app.use(errorHandler);

// 启动服务器
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════╗
║                                                      ║
║   🚀 AAFA 后端服务已启动                             ║
║                                                      ║
║   📍 服务地址: http://localhost:${PORT}                 ║
║   🔗 API 前缀: /api/v1                               ║
║   📁 上传目录: ${UPLOAD_DIR}                          ║
║   🌐 前端地址: ${FRONTEND_URL}        ║
║                                                      ║
╚══════════════════════════════════════════════════════╝
  `);
});

export default app;
