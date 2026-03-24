import { Router } from 'express';
import {
  subscribe,
  unsubscribe,
  getSubscribers,
} from '../controllers/newsletter.controller';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// 公开接口
// POST /api/v1/newsletter/subscribe - 订阅 Newsletter
router.post('/subscribe', subscribe);

// POST /api/v1/newsletter/unsubscribe - 取消订阅
router.post('/unsubscribe', unsubscribe);

// 管理员接口
// GET /api/v1/newsletter/subscribers - 获取订阅列表
router.get('/subscribers', authenticate, requireAdmin, getSubscribers);

export default router;
