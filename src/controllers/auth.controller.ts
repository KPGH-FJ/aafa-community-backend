import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { prisma } from '../utils/prisma';
import { ApiResponse } from '../types';

// JWT 配置 - 强制要求设置 JWT_SECRET
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'];

if (!JWT_SECRET) {
  console.error('错误: JWT_SECRET 环境变量未设置，服务无法启动');
  console.error('请运行以下命令生成密钥并设置到环境变量:');
  console.error('node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"');
  process.exit(1);
}

// 密码强度验证
const validatePassword = (password: string): { valid: boolean; error?: string } => {
  if (password.length < 8) {
    return { valid: false, error: '密码至少需要8个字符' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: '密码需要包含至少一个小写字母' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: '密码需要包含至少一个大写字母' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: '密码需要包含至少一个数字' };
  }
  return { valid: true };
};

// 邮箱格式验证
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// 用户注册
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name } = req.body;

    // 验证输入
    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: '邮箱和密码为必填项',
      } as ApiResponse);
      return;
    }

    // 验证邮箱格式
    if (!validateEmail(email)) {
      res.status(400).json({
        success: false,
        error: '邮箱格式不正确',
      } as ApiResponse);
      return;
    }

    // 验证密码强度
    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
      res.status(400).json({
        success: false,
        error: passwordCheck.error,
      } as ApiResponse);
      return;
    }

    // 检查用户是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      res.status(409).json({
        success: false,
        error: '该邮箱已被注册',
      } as ApiResponse);
      return;
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 12); // 提高 salt rounds

    // 创建用户
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        bio: true,
        createdAt: true,
      },
    });

    // 生成 JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({
      success: true,
      data: { user, token },
      message: '注册成功',
    } as ApiResponse);
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({
      success: false,
      error: '注册失败，请稍后重试',
    } as ApiResponse);
  }
};

// 用户登录
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // 验证输入
    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: '邮箱和密码为必填项',
      } as ApiResponse);
      return;
    }

    // 查找用户
    let user = await prisma.user.findUnique({
      where: { email },
    });

    // 如果是管理员账号且不存在，自动创建
    if (!user && email === 'admin@aafa.com' && password === 'admin123456') {
      const hashedPassword = await bcrypt.hash('admin123456', 10);
      user = await prisma.user.create({
        data: {
          email: 'admin@aafa.com',
          password: hashedPassword,
          name: 'AAFA管理员',
          role: 'ADMIN',
        },
      });
    }

    if (!user) {
      res.status(401).json({
        success: false,
        error: '邮箱或密码错误',
      } as ApiResponse);
      return;
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        error: '邮箱或密码错误',
      } as ApiResponse);
      return;
    }

    // 生成 JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatar: user.avatar,
          bio: user.bio,
        },
        token,
      },
      message: '登录成功',
    } as ApiResponse);
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({
      success: false,
      error: '登录失败，请稍后重试',
    } as ApiResponse);
  }
};

// 获取当前用户信息
export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;

    if (!user) {
      res.status(401).json({
        success: false,
        error: '未认证',
      } as ApiResponse);
      return;
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        bio: user.bio,
      },
    } as ApiResponse);
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({
      success: false,
      error: '获取用户信息失败',
    } as ApiResponse);
  }
};

// 更新用户信息
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;

    if (!user) {
      res.status(401).json({
        success: false,
        error: '未认证',
      } as ApiResponse);
      return;
    }

    const { name, bio, avatar } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: name !== undefined ? name : undefined,
        bio: bio !== undefined ? bio : undefined,
        avatar: avatar !== undefined ? avatar : undefined,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        bio: true,
        createdAt: true,
      },
    });

    res.json({
      success: true,
      data: updatedUser,
      message: '个人信息更新成功',
    } as ApiResponse);
  } catch (error) {
    console.error('更新用户信息错误:', error);
    res.status(500).json({
      success: false,
      error: '更新个人信息失败',
    } as ApiResponse);
  }
};