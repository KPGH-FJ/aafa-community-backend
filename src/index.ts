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
import healthRoutes from './routes/health.routes';

// 导入中间件
import { notFoundHandler, errorHandler } from './middleware/errorHandler';
import { handleUploadError } from './middleware/upload';

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

// 支持多来源 CORS（本地开发 + 生产环境）
const getCorsOrigins = (): (string | RegExp)[] => {
  const defaultOrigins: (string | RegExp)[] = [
    'http://localhost:3000',
    // 自动允许所有 Vercel 预览域名
    /^https:\/\/.*\.vercel\.app$/,
  ];
  
  // 从环境变量解析来源列表（支持逗号分隔）
  if (process.env.FRONTEND_URL) {
    const origins = process.env.FRONTEND_URL.split(',').map(url => url.trim());
    return [...defaultOrigins, ...origins];
  }
  
  return defaultOrigins;
};

const corsOrigins = getCorsOrigins();

// 中间件
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// 配置 CORS
const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // 允许无来源的请求（如 Postman 或移动应用）
    if (!origin) return callback(null, true);
    
    // 检查是否匹配允许的域名
    const isAllowed = corsOrigins.some(allowed => {
      if (typeof allowed === 'string') {
        return allowed === origin;
      }
      // 支持正则匹配
      return allowed.test(origin);
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`[CORS] 拒绝来源: ${origin}`);
      console.warn(`[CORS] 允许的域名: ${JSON.stringify(corsOrigins)}`);
      callback(new Error('CORS 策略阻止了该请求'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

// 全局 CORS 中间件
app.use(cors(corsOptions));

// 显式处理 OPTIONS 预检请求
app.options('*', cors(corsOptions));

app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 静态文件服务
const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';
app.use('/uploads', express.static(path.resolve(UPLOAD_DIR)));

// API 根路由
app.get('/api/v1', (req, res) => {
  res.json({
    success: true,
    message: 'AAFA API v1',
    version: '1.0.0',
    endpoints: {
      auth: '/api/v1/auth',
      articles: '/api/v1/articles',
      events: '/api/v1/events',
      upload: '/api/v1/upload',
      newsletter: '/api/v1/newsletter',
      health: '/health',
    },
  });
});

// API 路由
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/articles', articleRoutes);
app.use('/api/v1/events', eventRoutes);
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1/newsletter', newsletterRoutes);

// 健康检查路由
app.use('/health', healthRoutes);

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
║   🌐 允许的前端地址:                                   ║
${corsOrigins.map(url => `║      - ${url}`).join('\n')}
║                                                      ║
╚══════════════════════════════════════════════════════╝
  `);
});

export default app;
