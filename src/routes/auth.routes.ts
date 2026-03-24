import { Router } from 'express';
import { register, login, getMe, updateProfile } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// POST /api/v1/auth/register - 用户注册
router.post('/register', register);

// POST /api/v1/auth/login - 用户登录
router.post('/login', login);

// GET /api/v1/auth/me - 获取当前用户信息（需要认证）
router.get('/me', authenticate, getMe);

// PATCH /api/v1/auth/me - 更新用户信息（需要认证）
router.patch('/me', authenticate, updateProfile);

export default router;
