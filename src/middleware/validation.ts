import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import { ApiResponse } from '../types';

/**
 * 通用验证中间件工厂
 */
export function validate<T extends z.ZodType>(schema: T) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validated = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      
      // 将验证后的数据附加到请求对象
      (req as any).validated = validated;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));

        res.status(400).json({
          success: false,
          error: '输入数据验证失败',
          details: formattedErrors,
        } as ApiResponse);
        return;
      }
      next(error);
    }
  };
}

/**
 * 文章创建/更新验证模式
 */
export const articleSchema = z.object({
  body: z.object({
    title: z.string().min(1, '标题不能为空').max(200, '标题不能超过200字符'),
    excerpt: z.string().min(1, '摘要不能为空').max(500, '摘要不能超过500字符'),
    content: z.string().min(1, '内容不能为空'),
    coverImage: z.string().url('封面图片URL格式不正确').optional().or(z.literal('')),
    category: z.string().min(1, '分类不能为空'),
    tags: z.array(z.string()).default([]),
    readTime: z.number().int().min(1).max(120).optional(),
    featured: z.boolean().optional(),
    status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  }),
});

/**
 * 活动创建/更新验证模式
 */
export const eventSchema = z.object({
  body: z.object({
    title: z.string().min(1, '标题不能为空').max(200, '标题不能超过200字符'),
    description: z.string().min(1, '描述不能为空'),
    coverImage: z.string().url('封面图片URL格式不正确').optional().or(z.literal('')),
    date: z.string().datetime('日期格式不正确'),
    time: z.string().min(1, '时间不能为空'),
    location: z.string().min(1, '地点不能为空'),
    maxAttendees: z.number().int().min(1).optional(),
    price: z.number().int().min(0).default(0),
    tags: z.array(z.string()).default([]),
    status: z.enum(['UPCOMING', 'ONGOING', 'PAST', 'CANCELLED']).optional(),
  }),
});

/**
 * 登录验证模式
 */
export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('邮箱格式不正确'),
    password: z.string().min(6, '密码至少6位字符'),
  }),
});

/**
 * 注册验证模式
 */
export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('邮箱格式不正确'),
    password: z.string().min(6, '密码至少6位字符'),
    name: z.string().min(1, '姓名不能为空').max(50, '姓名不能超过50字符').optional(),
  }),
});

/**
 * Newsletter 订阅验证模式
 */
export const newsletterSchema = z.object({
  body: z.object({
    email: z.string().email('邮箱格式不正确'),
    name: z.string().max(50, '姓名不能超过50字符').optional(),
  }),
});

/**
 * 活动报名验证模式
 */
export const eventRegisterSchema = z.object({
  body: z.object({
    name: z.string().min(1, '姓名不能为空').max(50, '姓名不能超过50字符'),
    email: z.string().email('邮箱格式不正确'),
    phone: z.string().regex(/^1[3-9]\d{9}$/, '手机号格式不正确').optional().or(z.literal('')),
    remark: z.string().max(500, '备注不能超过500字符').optional(),
  }),
});

/**
 * 分页查询验证模式
 */
export const paginationSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).default('10'),
  }),
});

/**
 * 文章查询验证模式
 */
export const articleQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).default('10'),
    category: z.string().optional(),
    tag: z.string().optional(),
    featured: z.enum(['true', 'false']).optional().transform((v) => v === 'true'),
    status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  }),
});
