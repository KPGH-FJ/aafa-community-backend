import { Router } from 'express';
import {
  uploadImage,
  uploadMultipleImages,
  deleteImage,
  getImage,
} from '../controllers/upload.controller';
import { authenticate, requireAdmin } from '../middleware/auth';
import { uploadSingle, uploadMultiple } from '../middleware/upload';

const router = Router();

// POST /api/v1/upload/image - 上传单张图片（管理员）
router.post(
  '/image',
  authenticate,
  requireAdmin,
  uploadSingle('image'),
  uploadImage
);

// POST /api/v1/upload/images - 上传多张图片（管理员）
router.post(
  '/images',
  authenticate,
  requireAdmin,
  uploadMultiple('images', 5),
  uploadMultipleImages
);

// DELETE /api/v1/upload/:filename - 删除图片（管理员）
router.delete('/:filename', authenticate, requireAdmin, deleteImage);

// GET /api/v1/upload/:filename - 获取图片（公开）
router.get('/:filename', getImage);

export default router;
