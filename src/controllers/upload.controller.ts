import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { ApiResponse } from '../types';

const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';

// 上传单张图片
export const uploadImage = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: '请选择要上传的文件',
      } as ApiResponse);
      return;
    }

    // 构建文件 URL
    const fileUrl = `/uploads/${req.file.filename}`;

    res.json({
      success: true,
      data: {
        url: fileUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
      },
      message: '上传成功',
    } as ApiResponse);
  } catch (error) {
    console.error('上传错误:', error);
    res.status(500).json({
      success: false,
      error: '上传失败',
    } as ApiResponse);
  }
};

// 上传多张图片
export const uploadMultipleImages = async (req: Request, res: Response): Promise<void> => {
  try {
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      res.status(400).json({
        success: false,
        error: '请选择要上传的文件',
      } as ApiResponse);
      return;
    }

    const fileUrls = files.map((file) => ({
      url: `/uploads/${file.filename}`,
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
    }));

    res.json({
      success: true,
      data: fileUrls,
      message: `成功上传 ${files.length} 个文件`,
    } as ApiResponse);
  } catch (error) {
    console.error('上传错误:', error);
    res.status(500).json({
      success: false,
      error: '上传失败',
    } as ApiResponse);
  }
};

// 删除图片
export const deleteImage = async (req: Request, res: Response): Promise<void> => {
  try {
    const filename = req.params.filename as string;
    const filePath = path.join(UPLOAD_DIR, filename);

    // 安全检查：确保文件路径在 uploads 目录内
    const resolvedPath = path.resolve(filePath);
    const uploadDirResolved = path.resolve(UPLOAD_DIR);
    
    if (!resolvedPath.startsWith(uploadDirResolved)) {
      res.status(403).json({
        success: false,
        error: '无效的文件路径',
      } as ApiResponse);
      return;
    }

    if (!fs.existsSync(filePath)) {
      res.status(404).json({
        success: false,
        error: '文件不存在',
      } as ApiResponse);
      return;
    }

    fs.unlinkSync(filePath);

    res.json({
      success: true,
      message: '文件删除成功',
    } as ApiResponse);
  } catch (error) {
    console.error('删除文件错误:', error);
    res.status(500).json({
      success: false,
      error: '删除文件失败',
    } as ApiResponse);
  }
};

// 获取图片（用于本地开发时提供图片访问）
export const getImage = async (req: Request, res: Response): Promise<void> => {
  try {
    const filename = req.params.filename as string;
    const filePath = path.join(UPLOAD_DIR, filename);

    // 安全检查
    const resolvedPath = path.resolve(filePath);
    const uploadDirResolved = path.resolve(UPLOAD_DIR);
    
    if (!resolvedPath.startsWith(uploadDirResolved)) {
      res.status(403).json({
        success: false,
        error: '无效的文件路径',
      } as ApiResponse);
      return;
    }

    if (!fs.existsSync(filePath)) {
      res.status(404).json({
        success: false,
        error: '文件不存在',
      } as ApiResponse);
      return;
    }

    res.sendFile(path.resolve(filePath));
  } catch (error) {
    console.error('获取文件错误:', error);
    res.status(500).json({
      success: false,
      error: '获取文件失败',
    } as ApiResponse);
  }
};
