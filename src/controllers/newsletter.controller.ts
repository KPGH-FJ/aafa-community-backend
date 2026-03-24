import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { ApiResponse } from '../types';

// 订阅 Newsletter
export const subscribe = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, name } = req.body;

    if (!email) {
      res.status(400).json({
        success: false,
        error: '邮箱为必填项',
      } as ApiResponse);
      return;
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({
        success: false,
        error: '请输入有效的邮箱地址',
      } as ApiResponse);
      return;
    }

    // 检查是否已订阅
    const existing = await prisma.newsletter.findUnique({
      where: { email },
    });

    if (existing) {
      if (existing.status === 'ACTIVE') {
        res.status(409).json({
          success: false,
          error: '该邮箱已订阅',
        } as ApiResponse);
        return;
      }

      // 重新订阅
      await prisma.newsletter.update({
        where: { email },
        data: {
          status: 'ACTIVE',
          name: name || existing.name,
        },
      });

      res.json({
        success: true,
        message: '订阅成功',
      } as ApiResponse);
      return;
    }

    // 创建新订阅
    await prisma.newsletter.create({
      data: {
        email,
        name: name || null,
        status: 'ACTIVE',
      },
    });

    res.status(201).json({
      success: true,
      message: '订阅成功',
    } as ApiResponse);
  } catch (error) {
    console.error('订阅错误:', error);
    res.status(500).json({
      success: false,
      error: '订阅失败，请稍后重试',
    } as ApiResponse);
  }
};

// 取消订阅
export const unsubscribe = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({
        success: false,
        error: '邮箱为必填项',
      } as ApiResponse);
      return;
    }

    const existing = await prisma.newsletter.findUnique({
      where: { email },
    });

    if (!existing) {
      res.status(404).json({
        success: false,
        error: '未找到该邮箱的订阅记录',
      } as ApiResponse);
      return;
    }

    await prisma.newsletter.update({
      where: { email },
      data: { status: 'UNSUBSCRIBED' },
    });

    res.json({
      success: true,
      message: '取消订阅成功',
    } as ApiResponse);
  } catch (error) {
    console.error('取消订阅错误:', error);
    res.status(500).json({
      success: false,
      error: '取消订阅失败',
    } as ApiResponse);
  }
};

// 获取订阅列表（管理员）
export const getSubscribers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = '1', limit = '10', status } = req.query;

    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string)));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const [subscribers, total] = await Promise.all([
      prisma.newsletter.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.newsletter.count({ where }),
    ]);

    res.json({
      success: true,
      data: subscribers,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    } as ApiResponse);
  } catch (error) {
    console.error('获取订阅列表错误:', error);
    res.status(500).json({
      success: false,
      error: '获取订阅列表失败',
    } as ApiResponse);
  }
};
