import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { ApiResponse, EventQueryParams } from '../types';

// 获取活动列表
export const getEvents = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = '1',
      limit = '10',
      status,
    } = req.query as EventQueryParams;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (status) {
      where.status = status.toUpperCase();
    }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: {
          date: 'asc',
        },
      }) as any,
      prisma.event.count({ where }),
    ]);

    res.json({
      success: true,
      data: events,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    } as ApiResponse);
  } catch (error) {
    console.error('获取活动列表错误:', error);
    res.status(500).json({
      success: false,
      error: '获取活动列表失败',
    } as ApiResponse);
  }
};

// 获取即将开始的活动
export const getUpcomingEvents = async (req: Request, res: Response): Promise<void> => {
  try {
    const events = await prisma.event.findMany({
      where: {
        status: 'UPCOMING',
      },
      orderBy: {
        date: 'asc',
      },
    }) as any;

    res.json({
      success: true,
      data: events,
    } as ApiResponse);
  } catch (error) {
    console.error('获取即将开始的活动错误:', error);
    res.status(500).json({
      success: false,
      error: '获取活动失败',
    } as ApiResponse);
  }
};

// 获取往期活动
export const getPastEvents = async (req: Request, res: Response): Promise<void> => {
  try {
    const events = await prisma.event.findMany({
      where: {
        status: 'PAST',
      },
      orderBy: {
        date: 'desc',
      },
    }) as any;

    res.json({
      success: true,
      data: events,
    } as ApiResponse);
  } catch (error) {
    console.error('获取往期活动错误:', error);
    res.status(500).json({
      success: false,
      error: '获取活动失败',
    } as ApiResponse);
  }
};

// 获取单个活动
export const getEventById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    const event: any = await prisma.event.findUnique({
      where: { id },
      include: {
        registers: {
          select: {
            id: true,
            name: true,
            createdAt: true,
          },
        },
      },
    });

    if (!event) {
      res.status(404).json({
        success: false,
        error: '活动不存在',
      } as ApiResponse);
      return;
    }

    res.json({
      success: true,
      data: event,
    } as ApiResponse);
  } catch (error) {
    console.error('获取活动错误:', error);
    res.status(500).json({
      success: false,
      error: '获取活动失败',
    } as ApiResponse);
  }
};

// 创建活动（管理员）
export const createEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      title,
      description,
      coverImage,
      date,
      time,
      location,
      status,
      maxAttendees,
      price,
      tags,
    } = req.body;

    // 验证必填字段
    if (!title || !description || !date || !time || !location) {
      res.status(400).json({
        success: false,
        error: '标题、描述、日期、时间和地点为必填项',
      } as ApiResponse);
      return;
    }

    const event: any = await prisma.event.create({
      data: {
        title,
        description,
        coverImage,
        date: new Date(date),
        time,
        location,
        status: status || 'UPCOMING',
        maxAttendees,
        price: price || 0,
        tags: tags || [],
      },
    });

    res.status(201).json({
      success: true,
      data: event,
      message: '活动创建成功',
    } as ApiResponse);
  } catch (error) {
    console.error('创建活动错误:', error);
    res.status(500).json({
      success: false,
      error: '创建活动失败',
    } as ApiResponse);
  }
};

// 更新活动（管理员）
export const updateEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const updateData: any = { ...req.body };

    const existingEvent = await prisma.event.findUnique({
      where: { id },
    });

    if (!existingEvent) {
      res.status(404).json({
        success: false,
        error: '活动不存在',
      } as ApiResponse);
      return;
    }

    // 转换日期
    if (updateData.date) {
      updateData.date = new Date(updateData.date);
    }

    const event: any = await prisma.event.update({
      where: { id },
      data: updateData,
    });

    res.json({
      success: true,
      data: event,
      message: '活动更新成功',
    } as ApiResponse);
  } catch (error) {
    console.error('更新活动错误:', error);
    res.status(500).json({
      success: false,
      error: '更新活动失败',
    } as ApiResponse);
  }
};

// 删除活动（管理员）
export const deleteEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    const existingEvent = await prisma.event.findUnique({
      where: { id },
    });

    if (!existingEvent) {
      res.status(404).json({
        success: false,
        error: '活动不存在',
      } as ApiResponse);
      return;
    }

    await prisma.event.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: '活动删除成功',
    } as ApiResponse);
  } catch (error) {
    console.error('删除活动错误:', error);
    res.status(500).json({
      success: false,
      error: '删除活动失败',
    } as ApiResponse);
  }
};

// 活动报名
export const registerEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { name, email, phone, remark } = req.body;

    // 验证必填字段
    if (!name || !email) {
      res.status(400).json({
        success: false,
        error: '姓名和邮箱为必填项',
      } as ApiResponse);
      return;
    }

    // 检查活动是否存在
    const event = await prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      res.status(404).json({
        success: false,
        error: '活动不存在',
      } as ApiResponse);
      return;
    }

    if (event.status !== 'UPCOMING') {
      res.status(400).json({
        success: false,
        error: '该活动已结束或已取消',
      } as ApiResponse);
      return;
    }

    // 检查是否已满员
    if (event.maxAttendees && event.currentAttendees >= event.maxAttendees) {
      res.status(400).json({
        success: false,
        error: '该活动名额已满',
      } as ApiResponse);
      return;
    }

    // 检查是否已报名
    const existingRegister = await prisma.eventRegister.findUnique({
      where: {
        eventId_email: {
          eventId: id,
          email,
        },
      },
    });

    if (existingRegister) {
      res.status(409).json({
        success: false,
        error: '您已经报名过该活动',
      } as ApiResponse);
      return;
    }

    // 创建报名记录
    const register = await prisma.eventRegister.create({
      data: {
        name,
        email,
        phone,
        remark,
        eventId: id,
        userId: req.user?.id,
      },
    });

    // 更新当前报名人数
    await prisma.event.update({
      where: { id },
      data: {
        currentAttendees: {
          increment: 1,
        },
      },
    });

    res.status(201).json({
      success: true,
      data: register,
      message: '报名成功',
    } as ApiResponse);
  } catch (error) {
    console.error('活动报名错误:', error);
    res.status(500).json({
      success: false,
      error: '报名失败',
    } as ApiResponse);
  }
};

// 取消报名
export const cancelRegister = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { email } = req.body;

    const register = await prisma.eventRegister.findUnique({
      where: {
        eventId_email: {
          eventId: id,
          email,
        },
      },
    });

    if (!register) {
      res.status(404).json({
        success: false,
        error: '未找到报名记录',
      } as ApiResponse);
      return;
    }

    await prisma.eventRegister.delete({
      where: { id: register.id },
    });

    // 减少报名人数
    await prisma.event.update({
      where: { id },
      data: {
        currentAttendees: {
          decrement: 1,
        },
      },
    });

    res.json({
      success: true,
      message: '取消报名成功',
    } as ApiResponse);
  } catch (error) {
    console.error('取消报名错误:', error);
    res.status(500).json({
      success: false,
      error: '取消报名失败',
    } as ApiResponse);
  }
};
