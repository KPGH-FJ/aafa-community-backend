import { Request } from 'express';
import { User, Article, Event, EventRegister, Newsletter } from '@prisma/client';

// 扩展 Express Request 类型
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

// API 响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
}

// 分页参数
export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

// 文章查询参数
export interface ArticleQueryParams {
  page?: string;
  limit?: string;
  category?: string;
  tag?: string;
  featured?: string;
  status?: string;
}

// 活动查询参数
export interface EventQueryParams {
  page?: string;
  limit?: string;
  status?: string;
}

// JWT Payload
export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

// 导出 Prisma 类型
export type { User, Article, Event, EventRegister, Newsletter };
