const express = require('express');
const { pgClient } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// 公开：文章列表（分页，仅 published）
router.get('/', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;
  const offset = (page - 1) * pageSize;

  const { data, count } = await pgClient.select('articles', {
    columns: 'id,title,cover_image,summary,sort_order,created_at',
    filters: { status: 'published' },
    order: 'sort_order.asc,created_at.desc',
    limit: pageSize,
    offset,
    count: 'exact',
  });

  res.json({
    list: data,
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize)
  });
});

// 公开：文章详情（:id 只匹配数字，避免和 /admin/* 路由冲突）
router.get('/:id(\\d+)', async (req, res) => {
  const { id } = req.params;
  const article = await pgClient.getOne('articles', {
    filters: { id, status: 'published' }
  });

  if (!article) {
    return res.status(404).json({ error: '文章不存在' });
  }

  res.json(article);
});

// ===== 以下为管理接口 =====

// 管理：文章列表（含草稿，不分页）
router.get('/admin/list', authMiddleware, async (req, res) => {
  const { data } = await pgClient.select('articles', {
    columns: 'id,title,summary,cover_image,status,sort_order,created_at,updated_at',
    order: 'sort_order.asc,created_at.desc',
  });
  res.json(data);
});

// 管理：文章详情（含草稿）
router.get('/admin/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const article = await pgClient.getOne('articles', { filters: { id } });
  if (!article) {
    return res.status(404).json({ error: '文章不存在' });
  }
  res.json(article);
});

// 管理：新建文章
router.post('/admin', authMiddleware, async (req, res) => {
  const { title, content, cover_image, summary, status, sort_order } = req.body;
  if (!title) {
    return res.status(400).json({ error: '请输入文章标题' });
  }

  const maxSort = await pgClient.max('articles', 'sort_order');
  const sortOrder = sort_order !== undefined ? sort_order : ((maxSort || 0) + 1);

  const row = await pgClient.insert('articles', {
    title,
    content: content || '',
    cover_image: cover_image || '',
    summary: summary || '',
    status: status || 'draft',
    sort_order: sortOrder,
  }, { returnData: true });

  res.status(201).json({ id: row?.id, message: '文章已创建' });
});

// 管理：编辑文章
// 注意：数字约束 :id(\d+) 保证 PUT /admin/sort 不会被本路由抢先匹配
router.put('/admin/:id(\\d+)', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { title, content, cover_image, summary, status, sort_order } = req.body;

  const existing = await pgClient.getOne('articles', { filters: { id } });
  if (!existing) {
    return res.status(404).json({ error: '文章不存在' });
  }

  await pgClient.update('articles', {
    title: title !== undefined ? title : existing.title,
    content: content !== undefined ? content : existing.content,
    cover_image: cover_image !== undefined ? cover_image : existing.cover_image,
    summary: summary !== undefined ? summary : existing.summary,
    status: status !== undefined ? status : existing.status,
    sort_order: sort_order !== undefined ? sort_order : existing.sort_order,
    updated_at: new Date().toISOString(),
  }, { id });

  res.json({ message: '文章已更新' });
});

// 管理：删除文章
router.delete('/admin/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const existing = await pgClient.getOne('articles', { filters: { id } });
  if (!existing) {
    return res.status(404).json({ error: '文章不存在' });
  }

  await pgClient.delete('articles', { id });
  res.json({ message: '文章已删除' });
});

// 管理：批量调整排序
router.put('/admin/sort', authMiddleware, async (req, res) => {
  const { items } = req.body;
  if (!Array.isArray(items)) {
    return res.status(400).json({ error: '请提供排序数组' });
  }

  for (let i = 0; i < items.length; i++) {
    await pgClient.update('articles', { sort_order: i + 1 }, { id: items[i].id });
  }

  res.json({ message: '排序已更新' });
});

module.exports = router;
