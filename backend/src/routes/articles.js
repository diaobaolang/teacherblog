const express = require('express');
const { db } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// 公开：文章列表（分页，仅 published）
router.get('/', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;
  const offset = (page - 1) * pageSize;

  const total = db.prepare("SELECT COUNT(*) as count FROM articles WHERE status = 'published'").get().count;
  const articles = db.prepare(
    "SELECT id, title, cover_image, summary, sort_order, created_at FROM articles WHERE status = 'published' ORDER BY sort_order ASC, created_at DESC LIMIT ? OFFSET ?"
  ).all(pageSize, offset);

  res.json({
    list: articles,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize)
  });
});

// 公开：文章详情
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const article = db.prepare(
    "SELECT * FROM articles WHERE id = ? AND status = 'published'"
  ).get(id);

  if (!article) {
    return res.status(404).json({ error: '文章不存在' });
  }

  res.json(article);
});

// ===== 以下为管理接口 =====

// 管理：文章列表（含草稿，不分页）
router.get('/admin/list', authMiddleware, (req, res) => {
  const articles = db.prepare(
    'SELECT id, title, summary, cover_image, status, sort_order, created_at, updated_at FROM articles ORDER BY sort_order ASC, created_at DESC'
  ).all();
  res.json(articles);
});

// 管理：文章详情（含草稿）
router.get('/admin/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const article = db.prepare('SELECT * FROM articles WHERE id = ?').get(id);
  if (!article) {
    return res.status(404).json({ error: '文章不存在' });
  }
  res.json(article);
});

// 管理：新建文章
router.post('/admin', authMiddleware, (req, res) => {
  const { title, content, cover_image, summary, status, sort_order } = req.body;
  if (!title) {
    return res.status(400).json({ error: '请输入文章标题' });
  }

  const maxOrder = db.prepare('SELECT MAX(sort_order) as max FROM articles').get();
  const sortOrder = sort_order !== undefined ? sort_order : ((maxOrder.max || 0) + 1);

  const result = db.prepare(
    'INSERT INTO articles (title, content, cover_image, summary, status, sort_order) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(title, content || '', cover_image || '', summary || '', status || 'draft', sortOrder);

  res.status(201).json({ id: result.lastInsertRowid, message: '文章已创建' });
});

// 管理：编辑文章
router.put('/admin/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const { title, content, cover_image, summary, status, sort_order } = req.body;

  const existing = db.prepare('SELECT * FROM articles WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: '文章不存在' });
  }

  db.prepare(
    'UPDATE articles SET title = ?, content = ?, cover_image = ?, summary = ?, status = ?, sort_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).run(
    title !== undefined ? title : existing.title,
    content !== undefined ? content : existing.content,
    cover_image !== undefined ? cover_image : existing.cover_image,
    summary !== undefined ? summary : existing.summary,
    status !== undefined ? status : existing.status,
    sort_order !== undefined ? sort_order : existing.sort_order,
    id
  );

  res.json({ message: '文章已更新' });
});

// 管理：删除文章
router.delete('/admin/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM articles WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: '文章不存在' });
  }

  db.prepare('DELETE FROM articles WHERE id = ?').run(id);
  res.json({ message: '文章已删除' });
});

// 管理：批量调整排序
router.put('/admin/sort', authMiddleware, (req, res) => {
  const { items } = req.body;
  if (!Array.isArray(items)) {
    return res.status(400).json({ error: '请提供排序数组' });
  }

  const update = db.prepare('UPDATE articles SET sort_order = ? WHERE id = ?');
  const tx = db.transaction(() => {
    items.forEach((item, index) => {
      update.run(index + 1, item.id);
    });
  });
  tx();

  res.json({ message: '排序已更新' });
});

module.exports = router;
