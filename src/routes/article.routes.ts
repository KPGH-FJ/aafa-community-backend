import { Router } from 'express';
import {
  getArticles,
  getArticleById,
  getArticleBySlug,
  createArticle,
  updateArticle,
  deleteArticle,
  getAllArticlesAdmin,
  getCategories,
  getTags,
} from '../controllers/article.controller';
import { authenticate, requireAdmin } from '../middleware/auth';
import {
  validate,
  articleSchema,
  articleQuerySchema,
  paginationSchema,
} from '../middleware/validation';
import {
  articlesCache,
  articleCache,
  metadataCache,
  clearCacheByTag,
} from '../middleware/cache';
import { Request, Response } from 'express';
import logger, { logAudit } from '../utils/logger';

const router = Router();

// 公开路由（带缓存）
router.get('/', validate(articleQuerySchema), articlesCache, getArticles);
router.get('/categories', metadataCache, getCategories);
router.get('/tags', metadataCache, getTags);
router.get('/slug/:slug', articleCache, getArticleBySlug);
router.get('/:id', articleCache, getArticleById);

// 管理路由（需要认证）
router.get(
  '/admin/all',
  authenticate,
  requireAdmin,
  validate(articleQuerySchema),
  getAllArticlesAdmin
);

router.post(
  '/',
  authenticate,
  requireAdmin,
  validate(articleSchema),
  async (req, res) => {
    try {
      // 清除文章列表缓存
      clearCacheByTag('articles');
      
      await createArticle(req, res);
      
      // 记录审计日志
      logAudit('ARTICLE_CREATED', req.user!.id, {
        title: req.body.title,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('创建文章失败', { error, userId: req.user?.id });
      throw error;
    }
  }
);

router.patch(
  '/:id',
  authenticate,
  requireAdmin,
  validate(articleSchema.partial()),
  async (req, res) => {
    try {
      // 清除相关缓存
      clearCacheByTag('articles');
      clearCacheByTag(`article:${req.params.id}`);
      
      await updateArticle(req, res);
      
      logAudit('ARTICLE_UPDATED', req.user!.id, {
        articleId: req.params.id,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('更新文章失败', { error, userId: req.user?.id, articleId: req.params.id });
      throw error;
    }
  }
);

router.delete(
  '/:id',
  authenticate,
  requireAdmin,
  async (req, res) => {
    try {
      clearCacheByTag('articles');
      clearCacheByTag(`article:${req.params.id}`);
      
      await deleteArticle(req, res);
      
      logAudit('ARTICLE_DELETED', req.user!.id, {
        articleId: req.params.id,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('删除文章失败', { error, userId: req.user?.id, articleId: req.params.id });
      throw error;
    }
  }
);

export default router;
