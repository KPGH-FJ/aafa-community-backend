import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma';
import { JwtPayload } from '../types';

// 强制要求环境变量
const JWT_SECRET = process.env.JWT_SECRET!;

if (!JWT_SECRET) {
  console.error('错误: JWT_SECRET 环境变量未设置');
  process.exit(1);
}

/**
 * JWT Token 验证中间件
 * 验证请求头中的 Bearer Token
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: '未提供认证令牌',
      });
      return;
    }

    const token = authHeader.substring(7);
    
    const decoded = jwt.verify(token, JWT_SECRET as jwt.Secret) as JwtPayload;
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        error: '用户不存在',
      });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        error: '认证令牌已过期',
        code: 'TOKEN_EXPIRED',
      });
      return;
    }
    
    res.status(401).json({
      success: false,
      error: '无效的认证令牌',
    });
  }
};

/**
 * 管理员权限验证中间件
 * 必须在 authenticate 之后使用
 */
export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user || req.user.role !== 'ADMIN') {
    res.status(403).json({
      success: false,
      error: '需要管理员权限',
    });
    return;
  }
  next();
};

/**
 * 可选认证中间件
 * 用于某些公共 API，如果提供 token 则解析用户信息
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET as jwt.Secret) as JwtPayload;
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (user) {
      req.user = user;
    }
    
    next();
  } catch {
    // 可选认证失败不报错，继续执行
    next();
  }
};

/**
 * 生成 JWT Token
 */
export const generateToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, JWT_SECRET as jwt.Secret, {
    expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'],
  } as jwt.SignOptions);
};
