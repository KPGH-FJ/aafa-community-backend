import { Request, Response, NextFunction } from 'express';
import NodeCache from 'node-cache';
import { createHash } from 'crypto';

// 内存缓存实例
const memoryCache = new NodeCache({
  stdTTL: 300, // 默认 5 分钟
  checkperiod: 60, // 每分钟检查过期
  useClones: true,
});

/**
 * 生成缓存键
 */
function generateCacheKey(req: Request): string {
  const data = `${req.method}:${req.originalUrl}:${JSON.stringify(req.query)}`;
  return createHash('md5').update(data).digest('hex');
}

interface CacheOptions {
  ttl?: number; // 缓存时间（秒）
  key?: string | ((req: Request) => string); // 自定义缓存键
  condition?: (req: Request) => boolean; // 是否启用缓存的条件
}

/**
 * 响应缓存中间件
 * 
 * 使用示例：
 * app.get('/api/v1/articles', cacheMiddleware({ ttl: 60 }), getArticles);
 */
export function cacheMiddleware(options: CacheOptions = {}) {
  const { ttl = 300, key, condition } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    // 非 GET 请求不缓存
    if (req.method !== 'GET') {
      next();
      return;
    }

    // 检查条件
    if (condition && !condition(req)) {
      next();
      return;
    }

    // 生成缓存键
    const cacheKey = typeof key === 'function' 
      ? key(req) 
      : (key || generateCacheKey(req));

    // 尝试从缓存获取
    const cached = memoryCache.get<{
      body: unknown;
      statusCode: number;
    }>(cacheKey);

    if (cached) {
      res.status(cached.statusCode).json(cached.body);
      return;
    }

    // 重写 res.json 以缓存响应
    const originalJson = res.json.bind(res);
    res.json = function(body: unknown): Response {
      // 只缓存成功的响应
      if (res.statusCode >= 200 && res.statusCode < 300) {
        memoryCache.set(
          cacheKey,
          { body, statusCode: res.statusCode },
          ttl
        );
      }
      return originalJson(body);
    };

    next();
  };
}

/**
 * 清除缓存
 */
export function clearCache(pattern?: string): void {
  if (pattern) {
    const keys = memoryCache.keys().filter((key) => key.includes(pattern));
    memoryCache.del(keys);
  } else {
    memoryCache.flushAll();
  }
}

/**
 * 获取缓存统计
 */
export function getCacheStats(): {
  keys: number;
  hits: number;
  misses: number;
  ksize: number;
  vsize: number;
} {
  return memoryCache.getStats();
}

/**
 * 缓存标签（用于关联清除）
 */
const tagMap = new Map<string, Set<string>>();

/**
 * 带标签的缓存中间件
 * 可以通过标签清除相关缓存
 */
export function cacheWithTag(tag: string, ttl = 300) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (req.method !== 'GET') {
      next();
      return;
    }

    const cacheKey = generateCacheKey(req);
    
    // 关联标签
    if (!tagMap.has(tag)) {
      tagMap.set(tag, new Set());
    }
    tagMap.get(tag)!.add(cacheKey);

    const cached = memoryCache.get<{ body: unknown; statusCode: number }>(cacheKey);

    if (cached) {
      res.status(cached.statusCode).json(cached.body);
      return;
    }

    const originalJson = res.json.bind(res);
    res.json = function(body: unknown): Response {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        memoryCache.set(cacheKey, { body, statusCode: res.statusCode }, ttl);
      }
      return originalJson(body);
    };

    next();
  };
}

/**
 * 通过标签清除缓存
 */
export function clearCacheByTag(tag: string): void {
  const keys = tagMap.get(tag);
  if (keys) {
    memoryCache.del(Array.from(keys));
    tagMap.delete(tag);
  }
}

/**
 * 文章列表缓存（1分钟）
 */
export const articlesCache = cacheMiddleware({
  ttl: 60,
  key: (req) => `articles:${JSON.stringify(req.query)}`,
});

/**
 * 单篇文章缓存（5分钟）
 */
export const articleCache = cacheMiddleware({
  ttl: 300,
  key: (req) => `article:${req.params.id || req.params.slug}`,
});

/**
 * 活动列表缓存（1分钟）
 */
export const eventsCache = cacheMiddleware({
  ttl: 60,
  key: (req) => `events:${JSON.stringify(req.query)}`,
});

/**
 * 分类和标签缓存（10分钟）
 */
export const metadataCache = cacheMiddleware({
  ttl: 600,
});
