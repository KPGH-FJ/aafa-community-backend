import { Router } from 'express';
import { uploadImage, uploadMultipleImages, deleteImage, getImage } from '../controllers/upload.controller';
import { uploadSingle, uploadMultiple, handleUploadError } from '../middleware/upload';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// POST /api/v1/upload/image - 上传单张图片（管理员）
router.post(
  '/image',
  authenticate,
  requireAdmin,
  (req, res, next) => {
    uploadSingle(req, res, (err) => {
      if (err) {
        handleUploadError(err, req, res, next);
      } else {
        next();
      }
    });
  },
  uploadImage
);

// POST /api/v1/upload/images - 上传多张图片（管理员）
router.post(
  '/images',
  authenticate,
  requireAdmin,
  (req, res, next) => {
    uploadMultiple(req, res, (err) => {
      if (err) {
        handleUploadError(err, req, res, next);
      } else {
        next();
      }
    });
  },
  uploadMultipleImages
);

// GET /api/v1/upload/:filename - 获取图片
router.get('/:filename', getImage);

// DELETE /api/v1/upload/:filename - 删除图片（管理员）
router.delete('/:filename', authenticate, requireAdmin, deleteImage);

export default router;