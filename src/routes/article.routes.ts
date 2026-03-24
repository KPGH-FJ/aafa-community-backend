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

const router = Router();

// 公开接口
// GET /api/v1/articles - 获取文章列表
router.get('/', getArticles);

// GET /api/v1/articles/categories - 获取分类列表
router.get('/categories', getCategories);

// GET /api/v1/articles/tags - 获取标签列表
router.get('/tags', getTags);

// GET /api/v1/articles/slug/:slug - 通过 slug 获取文章
router.get('/slug/:slug', getArticleBySlug);

// GET /api/v1/articles/:id - 获取单篇文章
router.get('/:id', getArticleById);

// 管理员接口
// GET /api/v1/articles/admin/all - 获取所有文章（包含草稿）
router.get('/admin/all', authenticate, requireAdmin, getAllArticlesAdmin);

// POST /api/v1/articles - 创建文章
router.post('/', authenticate, requireAdmin, createArticle);

// PATCH /api/v1/articles/:id - 更新文章
router.patch('/:id', authenticate, requireAdmin, updateArticle);

// DELETE /api/v1/articles/:id - 删除文章
router.delete('/:id', authenticate, requireAdmin, deleteArticle);

export default router;
