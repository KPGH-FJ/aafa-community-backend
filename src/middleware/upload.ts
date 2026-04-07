import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';

const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// 允许的文件类型
const ALLOWED_MIMETYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
];

// 允许的文件扩展名
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

// 存储配置
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    // 生成唯一文件名（使用 crypto 替代 uuid）
    const uniqueName = `${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`;
    cb(null, uniqueName);
  },
});

// 文件过滤器
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // 检查 MIME 类型
  if (!ALLOWED_MIMETYPES.includes(file.mimetype)) {
    cb(new Error('只允许上传图片文件 (JPEG, PNG, GIF, WebP)'));
    return;
  }

  // 检查文件扩展名
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    cb(new Error('文件扩展名不被支持'));
    return;
  }

  cb(null, true);
};

// 单文件上传配置
export const uploadSingle = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
}).single('image');

// 多文件上传配置
export const uploadMultiple = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 10, // 最多10个文件
  },
}).array('images', 10);

// 上传错误处理中间件
export const handleUploadError = (err: Error, req: Request, res: Response, next: NextFunction): void => {
  if (err instanceof multer.MulterError) {
    // Multer 错误
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({
        success: false,
        error: '文件大小超过限制 (最大 5MB)',
      });
      return;
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      res.status(400).json({
        success: false,
        error: '文件数量超过限制 (最多 10 个)',
      });
      return;
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      res.status(400).json({
        success: false,
        error: '意外的文件字段名，请使用 "image" 或 "images"',
      });
      return;
    }
    res.status(400).json({
      success: false,
      error: err.message,
    });
    return;
  }

  if (err) {
    // 其他错误（如文件类型错误）
    res.status(400).json({
      success: false,
      error: err.message,
    });
    return;
  }

  next();
};