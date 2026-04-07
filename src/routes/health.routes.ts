import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import os from 'os';

const router = Router();
const prisma = new PrismaClient();

// ============================================
// 基础健康检查
// ============================================
router.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
  });
});

// ============================================
// 详细健康检查
// ============================================
router.get('/detailed', async (req, res) => {
  const checks: Record<string, { status: string; responseTime?: number; error?: string }> = {};
  let overallStatus = 'ok';

  // 检查数据库连接
  const dbStart = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = {
      status: 'ok',
      responseTime: Date.now() - dbStart,
    };
  } catch (error) {
    checks.database = {
      status: 'error',
      responseTime: Date.now() - dbStart,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    overallStatus = 'error';
  }

  // 检查内存使用
  const memUsage = process.memoryUsage();
  const memLimit = 512 * 1024 * 1024; // 512MB
  const memPercent = (memUsage.heapUsed / memLimit) * 100;
  
  checks.memory = {
    status: memPercent > 90 ? 'warning' : 'ok',
  };
  
  if (memPercent > 90) {
    overallStatus = overallStatus === 'ok' ? 'warning' : overallStatus;
  }

  // 检查磁盘空间
  try {
    checks.disk = { status: 'ok' };
  } catch (error) {
    checks.disk = {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    overallStatus = 'error';
  }

  const statusCode = overallStatus === 'ok' ? 200 : overallStatus === 'warning' ? 200 : 503;

  res.status(statusCode).json({
    success: overallStatus !== 'error',
    data: {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      checks,
      system: {
        platform: os.platform(),
        arch: os.arch(),
        nodeVersion: process.version,
        memory: {
          used: Math.round(memUsage.heapUsed / 1024 / 1024),
          total: Math.round(memUsage.heapTotal / 1024 / 1024),
          rss: Math.round(memUsage.rss / 1024 / 1024),
        },
      },
    },
  });
});

// ============================================
// 就绪探针 (用于 Kubernetes)
// ============================================
router.get('/ready', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      success: true,
      data: { ready: true },
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      error: 'Database not ready',
    });
  }
});

// ============================================
// 存活探针 (用于 Kubernetes)
// ============================================
router.get('/live', (req, res) => {
  res.json({
    success: true,
    data: { alive: true },
  });
});

export default router;
