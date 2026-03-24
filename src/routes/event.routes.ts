import { Router } from 'express';
import {
  getEvents,
  getUpcomingEvents,
  getPastEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  registerEvent,
  cancelRegister,
} from '../controllers/event.controller';
import { authenticate, requireAdmin, optionalAuth } from '../middleware/auth';

const router = Router();

// 公开接口
// GET /api/v1/events - 获取活动列表
router.get('/', getEvents);

// GET /api/v1/events/upcoming - 获取即将开始的活动
router.get('/upcoming', getUpcomingEvents);

// GET /api/v1/events/past - 获取往期活动
router.get('/past', getPastEvents);

// GET /api/v1/events/:id - 获取单个活动
router.get('/:id', getEventById);

// POST /api/v1/events/:id/register - 活动报名（可选认证）
router.post('/:id/register', optionalAuth, registerEvent);

// DELETE /api/v1/events/:id/register - 取消报名
router.delete('/:id/register', cancelRegister);

// 管理员接口
// POST /api/v1/events - 创建活动
router.post('/', authenticate, requireAdmin, createEvent);

// PATCH /api/v1/events/:id - 更新活动
router.patch('/:id', authenticate, requireAdmin, updateEvent);

// DELETE /api/v1/events/:id - 删除活动
router.delete('/:id', authenticate, requireAdmin, deleteEvent);

export default router;
