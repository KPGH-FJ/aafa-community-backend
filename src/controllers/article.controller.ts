import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { ApiResponse, ArticleQueryParams } from '../types';

// 生成 slug
const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 100);
};

// 获取文章列表
export const getArticles = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = '1',
      limit = '10',
      category,
      tag,
      featured,
    } = req.query as ArticleQueryParams;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    // 构建查询条件
    const where: any = {
      status: 'PUBLISHED',
    };

    if (category) {
      where.category = category;
    }

    if (tag) {
      where.tags = {
        has: tag,
      };
    }

    if (featured === 'true') {
      where.featured = true;
    }

    // 并行查询文章和总数
    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: {
          publishedAt: 'desc',
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
      }) as any,
      prisma.article.count({ where }),
    ]);

    res.json({
      success: true,
      data: articles,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    } as ApiResponse);
  } catch (error) {
    console.error('获取文章列表错误:', error);
    res.status(500).json({
      success: false,
      error: '获取文章列表失败',
    } as ApiResponse);
  }
};

// 获取单篇文章
export const getArticleById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    const article: any = await prisma.article.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
            bio: true,
          },
        },
      },
    });

    if (!article || article.status !== 'PUBLISHED') {
      res.status(404).json({
        success: false,
        error: '文章不存在',
      } as ApiResponse);
      return;
    }

    res.json({
      success: true,
      data: article,
    } as ApiResponse);
  } catch (error) {
    console.error('获取文章错误:', error);
    res.status(500).json({
      success: false,
      error: '获取文章失败',
    } as ApiResponse);
  }
};

// 通过 slug 获取文章
export const getArticleBySlug = async (req: Request, res: Response): Promise<void> => {
  try {
    const slug = req.params.slug as string;

    const article: any = await prisma.article.findUnique({
      where: { slug },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
            bio: true,
          },
        },
      },
    });

    if (!article || article.status !== 'PUBLISHED') {
      res.status(404).json({
        success: false,
        error: '文章不存在',
      } as ApiResponse);
      return;
    }

    res.json({
      success: true,
      data: article,
    } as ApiResponse);
  } catch (error) {
    console.error('获取文章错误:', error);
    res.status(500).json({
      success: false,
      error: '获取文章失败',
    } as ApiResponse);
  }
};

// 创建文章（管理员）
export const createArticle = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;

    const {
      title,
      excerpt,
      content,
      coverImage,
      category,
      tags,
      readTime,
      featured,
      status,
    } = req.body;

    // 验证必填字段
    if (!title || !excerpt || !content || !category) {
      res.status(400).json({
        success: false,
        error: '标题、摘要、内容和分类为必填项',
      } as ApiResponse);
      return;
    }

    // 验证 tags 是数组
    let parsedTags: string[] = [];
    if (tags) {
      parsedTags = Array.isArray(tags) ? tags : [tags];
    }

    // 生成 slug
    let slug = generateSlug(title);
    
    // 检查 slug 是否已存在
    const existingArticle = await prisma.article.findUnique({
      where: { slug },
    });

    if (existingArticle) {
      slug = `${slug}-${Date.now()}`;
    }

    const article: any = await prisma.article.create({
      data: {
        title,
        slug,
        excerpt,
        content,
        coverImage,
        category,
        tags: parsedTags,
        readTime: readTime || 5,
        featured: featured || false,
        status: status || 'DRAFT',
        authorId: user!.id,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: article,
      message: '文章创建成功',
    } as ApiResponse);
  } catch (error) {
    console.error('创建文章错误:', error);
    res.status(500).json({
      success: false,
      error: '创建文章失败',
    } as ApiResponse);
  }
};

// 更新文章（管理员）
export const updateArticle = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const updateData: any = { ...req.body };

    // 检查文章是否存在
    const existingArticle = await prisma.article.findUnique({
      where: { id },
    });

    if (!existingArticle) {
      res.status(404).json({
        success: false,
        error: '文章不存在',
      } as ApiResponse);
      return;
    }

    // 转换 tags 为数组
    if (updateData.tags) {
      updateData.tags = Array.isArray(updateData.tags) 
        ? updateData.tags 
        : [updateData.tags];
    }

    // 如果更新标题，重新生成 slug
    if (updateData.title && updateData.title !== existingArticle.title) {
      let newSlug = generateSlug(updateData.title);
      const slugExists = await prisma.article.findUnique({
        where: { slug: newSlug },
      });
      if (slugExists && slugExists.id !== id) {
        newSlug = `${newSlug}-${Date.now()}`;
      }
      updateData.slug = newSlug;
    }

    const article: any = await prisma.article.update({
      where: { id },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: article,
      message: '文章更新成功',
    } as ApiResponse);
  } catch (error) {
    console.error('更新文章错误:', error);
    res.status(500).json({
      success: false,
      error: '更新文章失败',
    } as ApiResponse);
  }
};

// 删除文章（管理员）
export const deleteArticle = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    const existingArticle = await prisma.article.findUnique({
      where: { id },
    });

    if (!existingArticle) {
      res.status(404).json({
        success: false,
        error: '文章不存在',
      } as ApiResponse);
      return;
    }

    await prisma.article.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: '文章删除成功',
    } as ApiResponse);
  } catch (error) {
    console.error('删除文章错误:', error);
    res.status(500).json({
      success: false,
      error: '删除文章失败',
    } as ApiResponse);
  }
};

// 获取所有文章（管理员，包含草稿）
export const getAllArticlesAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = '1', limit = '10', status } = req.query as ArticleQueryParams;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
      }) as any,
      prisma.article.count({ where }),
    ]);

    res.json({
      success: true,
      data: articles,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    } as ApiResponse);
  } catch (error) {
    console.error('获取文章列表错误:', error);
    res.status(500).json({
      success: false,
      error: '获取文章列表失败',
    } as ApiResponse);
  }
};

// 获取分类列表
export const getCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = await prisma.article.groupBy({
      by: ['category'],
      where: {
        status: 'PUBLISHED',
      },
      _count: {
        category: true,
      },
    });

    const result = categories.map((c) => ({
      name: c.category,
      count: c._count.category,
    }));

    res.json({
      success: true,
      data: result,
    } as ApiResponse);
  } catch (error) {
    console.error('获取分类错误:', error);
    res.status(500).json({
      success: false,
      error: '获取分类失败',
    } as ApiResponse);
  }
};

// 获取标签列表
export const getTags = async (req: Request, res: Response): Promise<void> => {
  try {
    // 使用 PostgreSQL 的 unnest 函数展开数组
    const result: any = await prisma.$queryRaw`
      SELECT DISTINCT unnest(tags) as name, COUNT(*) as count
      FROM articles
      WHERE status = 'PUBLISHED'
      GROUP BY unnest(tags)
      ORDER BY count DESC
    `;

    res.json({
      success: true,
      data: result.map((r: any) => ({
        name: r.name,
        count: Number(r.count),
      })),
    } as ApiResponse);
  } catch (error) {
    console.error('获取标签错误:', error);
    res.status(500).json({
      success: false,
      error: '获取标签失败',
    } as ApiResponse);
  }
};