import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('开始种子数据...');

  // 创建管理员用户
  const adminPassword = await bcrypt.hash('admin123456', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@aafa.com' },
    update: {},
    create: {
      email: 'admin@aafa.com',
      password: adminPassword,
      name: 'AAFA管理员',
      role: 'ADMIN',
      bio: 'AAFA社区管理员',
    },
  });
  console.log('✓ 管理员用户创建完成:', admin.email);

  // 创建示例作者
  const authorPassword = await bcrypt.hash('author123456', 10);
  const author = await prisma.user.upsert({
    where: { email: 'editor@aafa.com' },
    update: {},
    create: {
      email: 'editor@aafa.com',
      password: authorPassword,
      name: 'AAFA编辑部',
      role: 'USER',
      bio: '专注于AI内容创作',
    },
  });
  console.log('✓ 作者用户创建完成:', author.email);

  // 创建示例文章 (PostgreSQL 使用 String[] 存储 tags)
  const articles = [
    {
      title: '实测：Cursor真的能提高3倍编程效率吗？',
      slug: 'cursor-efficiency-test',
      excerpt: '我们花了两周时间，让5位不同水平的开发者使用Cursor进行真实项目开发，结果出乎意料...',
      content: `# 实测：Cursor真的能提高3倍编程效率吗？

## 测试背景

我们邀请了5位不同水平的开发者...

## 测试结果

实际提升约为1.5倍...

## 结论

Cursor确实能提高效率，但...
`,
      coverImage: '/images/article-1.jpg',
      category: 'AI真相揭秘',
      tags: ['Cursor', '编程工具', '效率测评'],
      readTime: 8,
      featured: true,
      status: 'PUBLISHED' as const,
      authorId: author.id,
    },
    {
      title: 'AGI时代，什么技能不会贬值？',
      slug: 'agi-era-skills',
      excerpt: '当AI能写出比你更好的代码、画出比你更美的画，人类还剩下什么不可替代的价值？',
      content: `# AGI时代，什么技能不会贬值？

## 创造力的价值

人类创造力的独特性...

## 情感连接的重要性

AI无法替代的情感交流...
`,
      coverImage: '/images/article-2.jpg',
      category: '人文思考',
      tags: ['AGI', '职业发展', '未来技能'],
      readTime: 12,
      featured: true,
      status: 'PUBLISHED' as const,
      authorId: author.id,
    },
    {
      title: '非程序员如何用AI做数据分析',
      slug: 'ai-data-analysis-for-non-programmers',
      excerpt: '不用写Python，不用学SQL，ChatGPT+Claude组合拳让数据分析变得像聊天一样简单。',
      content: `# 非程序员如何用AI做数据分析

## 工具介绍

ChatGPT和Claude的配合使用...

## 实战案例

一个电商数据分析的真实案例...
`,
      coverImage: '/images/article-3.jpg',
      category: '工具实操',
      tags: ['ChatGPT', 'Claude', '数据分析'],
      readTime: 6,
      featured: false,
      status: 'PUBLISHED' as const,
      authorId: author.id,
    },
    {
      title: '避雷：这5款"AI神器"千万别买',
      slug: 'ai-tools-to-avoid',
      excerpt: '我们测试了市面上热门的AI工具，发现这些产品要么功能鸡肋，要么纯属智商税...',
      content: `# 避雷：这5款"AI神器"千万别买

## 产品1：XXX

问题描述...

## 产品2：YYY

问题描述...
`,
      coverImage: '/images/article-4.jpg',
      category: 'AI真相揭秘',
      tags: ['避雷', '产品测评', '避坑指南'],
      readTime: 5,
      featured: false,
      status: 'PUBLISHED' as const,
      authorId: author.id,
    },
    {
      title: 'OpenAI的野心：GPT-5会改变什么？',
      slug: 'openai-gpt5-impact',
      excerpt: '深度解析OpenAI最新技术路线图，以及它可能对整个AI行业产生的连锁反应。',
      content: `# OpenAI的野心：GPT-5会改变什么？

## 技术突破

GPT-5 的新特性...

## 行业影响

对各行业的影响分析...
`,
      coverImage: '/images/article-5.jpg',
      category: '前沿资讯',
      tags: ['OpenAI', 'GPT-5', '行业观察'],
      readTime: 15,
      featured: false,
      status: 'PUBLISHED' as const,
      authorId: author.id,
    },
    {
      title: '普通人如何用AI做自媒体？',
      slug: 'ai-for-creators',
      excerpt: '从零开始，用AI工具完成选题、写作、配图、发布的完整工作流。',
      content: `# 普通人如何用AI做自媒体？

## 选题策略

如何找到热门话题...

## 内容创作

AI辅助写作技巧...
`,
      coverImage: '/images/article-6.jpg',
      category: '工具实操',
      tags: ['自媒体', '内容创作', 'AI工具'],
      readTime: 10,
      featured: false,
      status: 'PUBLISHED' as const,
      authorId: author.id,
    },
  ];

  for (const article of articles) {
    await prisma.article.upsert({
      where: { slug: article.slug },
      update: {},
      create: article,
    });
  }
  console.log('✓ 示例文章创建完成:', articles.length, '篇');

  // 创建示例活动
  const events = [
    {
      title: 'AI工具漂流瓶：带上你最爱的AI工具来交换',
      description: '每个人分享一款自己最常用的AI工具，讲述使用心得和踩过的坑。没有PPT，只有真实体验。',
      coverImage: '/images/event-1.jpg',
      date: new Date('2026-04-06'),
      time: '14:00 - 17:00',
      location: '上海市静安区某咖啡馆',
      status: 'UPCOMING' as const,
      maxAttendees: 20,
      currentAttendees: 15,
      price: 49,
      tags: ['线下活动', '工具分享', '社交'],
    },
    {
      title: 'AGI辩论赛：AI会取代程序员吗？',
      description: '正反双方现场辩论，观众投票决定胜负。无论你是AI乐观派还是悲观派，都欢迎来battle。',
      coverImage: '/images/event-2.jpg',
      date: new Date('2026-04-13'),
      time: '19:00 - 21:30',
      location: '线上直播',
      status: 'UPCOMING' as const,
      maxAttendees: 200,
      currentAttendees: 86,
      price: 0,
      tags: ['辩论赛', '线上活动', 'AGI'],
    },
    {
      title: 'AI产品共创工作坊',
      description: '用一天时间，从0到1设计一款AI产品。适合对AI产品感兴趣的非技术背景朋友。',
      coverImage: '/images/event-3.jpg',
      date: new Date('2026-04-20'),
      time: '10:00 - 18:00',
      location: '北京市朝阳区某共享办公空间',
      status: 'UPCOMING' as const,
      maxAttendees: 12,
      currentAttendees: 8,
      price: 199,
      tags: ['工作坊', '产品设计', '共创'],
    },
    {
      title: '第一期：AI时代的焦虑与从容',
      description: '我们邀请了10位不同背景的普通人，聊聊他们对AI的真实感受。没有专家，只有真话。',
      coverImage: '/images/event-4.jpg',
      date: new Date('2026-03-15'),
      time: '14:00 - 17:00',
      location: '上海市静安区',
      status: 'PAST' as const,
      maxAttendees: 20,
      currentAttendees: 18,
      price: 49,
      tags: ['线下活动', '对话', '已结束'],
    },
  ];

  for (const event of events) {
    await prisma.event.create({
      data: event,
    });
  }
  console.log('✓ 示例活动创建完成:', events.length, '个');

  console.log('\n✅ 种子数据全部完成！');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
