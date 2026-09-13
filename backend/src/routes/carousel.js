const express = require('express');
const { db } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// 公开：获取轮播图列表（按 sort_order 排序）
router.get('/', (req, res) => {
  const images = db.prepare('SELECT * FROM carousel_images ORDER BY sort_order ASC, id ASC').all();
  res.json(images);
});

// 管理：新增轮播图
router.post('/', authMiddleware, (req, res) => {
  const { image_url, title } = req.body;
  if (!image_url) {
    return res.status(400).json({ error: '请提供图片地址' });
  }

  // sort_order 取当前最大值 + 1
  const maxOrder = db.prepare('SELECT MAX(sort_order) as max FROM carousel_images').get();
  const sortOrder = (maxOrder.max || 0) + 1;

  const result = db.prepare('INSERT INTO carousel_images (image_url, title, sort_order) VALUES (?, ?, ?)')
    .run(image_url, title || '', sortOrder);

  res.status(201).json({ id: result.lastInsertRowid, message: '轮播图已添加' });
});

// 管理：编辑轮播图
router.put('/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const { image_url, title } = req.body;

  const existing = db.prepare('SELECT * FROM carousel_images WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: '轮播图不存在' });
  }

  db.prepare('UPDATE carousel_images SET image_url = ?, title = ? WHERE id = ?')
    .run(image_url || existing.image_url, title !== undefined ? title : existing.title, id);

  res.json({ message: '轮播图已更新' });
});

// 管理：删除轮播图
router.delete('/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM carousel_images WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: '轮播图不存在' });
  }

  db.prepare('DELETE FROM carousel_images WHERE id = ?').run(id);
  res.json({ message: '轮播图已删除' });
});

// 管理：批量调整排序
router.put('/sort', authMiddleware, (req, res) => {
  const { items } = req.body;
  if (!Array.isArray(items)) {
    return res.status(400).json({ error: '请提供排序数组' });
  }

  const update = db.prepare('UPDATE carousel_images SET sort_order = ? WHERE id = ?');
  const tx = db.transaction(() => {
    items.forEach((item, index) => {
      update.run(index + 1, item.id);
    });
  });
  tx();

  res.json({ message: '排序已更新' });
});

module.exports = router;
