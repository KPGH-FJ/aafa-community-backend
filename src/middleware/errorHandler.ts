import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types';

// 404 错误处理
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  res.status(404).json({
    success: false,
    error: `未找到路由: ${req.originalUrl}`,
  } as ApiResponse);
};

// 全局错误处理
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('错误:', err);

  // 处理 multer 错误
  if (err.name === 'MulterError') {
    res.status(400).json({
      success: false,
      error: err.message,
    } as ApiResponse);
    return;
  }

  // 处理 Prisma 错误
  if (err.name === 'PrismaClientKnownRequestError') {
    const prismaError = err as any;
    
    // 唯一约束冲突
    if (prismaError.code === 'P2002') {
      const target = prismaError.meta?.target?.[0] || '字段';
      res.status(409).json({
        success: false,
        error: `${target} 已存在`,
      } as ApiResponse);
      return;
    }

    // 记录不存在
    if (prismaError.code === 'P2025') {
      res.status(404).json({
        success: false,
        error: '记录不存在',
      } as ApiResponse);
      return;
    }

    res.status(400).json({
      success: false,
      error: '数据库操作失败',
    } as ApiResponse);
    return;
  }

  // 默认错误响应
  const statusCode = (err as any).statusCode || 500;
  const message = err.message || '服务器内部错误';

  res.status(statusCode).json({
    success: false,
    error: message,
  } as ApiResponse);
};
