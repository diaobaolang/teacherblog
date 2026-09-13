const express = require('express');
const { db } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// ============ 公开接口 ============

// 获取所有分组（含封面，按 sort_order 排序）
router.get('/groups', (req, res) => {
  const groups = db.prepare('SELECT * FROM class_groups ORDER BY sort_order ASC, id ASC').all();
  res.json(groups);
});

// 获取某个分组下的所有照片
router.get('/groups/:id/photos', (req, res) => {
  const photos = db.prepare('SELECT * FROM class_photos WHERE group_id = ? ORDER BY sort_order ASC, id ASC').all(req.params.id);
  res.json(photos);
});

// 获取所有分组及其照片（一次性返回）
router.get('/all', (req, res) => {
  const groups = db.prepare('SELECT * FROM class_groups ORDER BY sort_order ASC, id ASC').all();
  const allPhotos = db.prepare('SELECT * FROM class_photos ORDER BY sort_order ASC, id ASC').all();
  const result = groups.map(g => ({
    ...g,
    photos: allPhotos.filter(p => p.group_id === g.id)
  }));
  res.json(result);
});

// ============ 分组管理（需认证） ============

// 新增分组
router.post('/groups', authMiddleware, (req, res) => {
  const { name, cover_image } = req.body;
  if (!name) {
    return res.status(400).json({ error: '请提供分组名称' });
  }
  const maxOrder = db.prepare('SELECT MAX(sort_order) as max FROM class_groups').get();
  const sortOrder = (maxOrder.max || 0) + 1;
  const result = db.prepare('INSERT INTO class_groups (name, cover_image, sort_order) VALUES (?, ?, ?)')
    .run(name, cover_image || '', sortOrder);
  db.save();
  res.status(201).json({ id: result.lastInsertRowid, message: '分组已创建' });
});

// 编辑分组
router.put('/groups/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const { name, cover_image } = req.body;
  const existing = db.prepare('SELECT * FROM class_groups WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: '分组不存在' });
  }
  db.prepare('UPDATE class_groups SET name = ?, cover_image = ? WHERE id = ?')
    .run(name || existing.name, cover_image !== undefined ? cover_image : existing.cover_image, id);
  db.save();
  res.json({ message: '分组已更新' });
});

// 删除分组（同时删除组内照片）
router.delete('/groups/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM class_groups WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: '分组不存在' });
  }
  db.prepare('DELETE FROM class_photos WHERE group_id = ?').run(id);
  db.prepare('DELETE FROM class_groups WHERE id = ?').run(id);
  db.save();
  res.json({ message: '分组已删除' });
});

// 批量调整分组排序
router.put('/groups/sort', authMiddleware, (req, res) => {
  const { items } = req.body;
  if (!Array.isArray(items)) {
    return res.status(400).json({ error: '请提供排序数组' });
  }
  const update = db.prepare('UPDATE class_groups SET sort_order = ? WHERE id = ?');
  const tx = db.transaction(() => {
    items.forEach((item, index) => {
      update.run(index + 1, item.id);
    });
  });
  tx();
  db.save();
  res.json({ message: '排序已更新' });
});

// ============ 照片管理（需认证） ============

// 新增照片到分组
router.post('/groups/:id/photos', authMiddleware, (req, res) => {
  const groupId = req.params.id;
  const { image_url, title } = req.body;
  if (!image_url) {
    return res.status(400).json({ error: '请提供图片地址' });
  }
  const group = db.prepare('SELECT * FROM class_groups WHERE id = ?').get(groupId);
  if (!group) {
    return res.status(404).json({ error: '分组不存在' });
  }
  const maxOrder = db.prepare('SELECT MAX(sort_order) as max FROM class_photos WHERE group_id = ?').get(groupId);
  const sortOrder = (maxOrder.max || 0) + 1;
  const result = db.prepare('INSERT INTO class_photos (group_id, image_url, title, sort_order) VALUES (?, ?, ?, ?)')
    .run(groupId, image_url, title || '', sortOrder);
  db.save();
  res.status(201).json({ id: result.lastInsertRowid, message: '照片已添加' });
});

// 编辑照片
router.put('/photos/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const { image_url, title } = req.body;
  const existing = db.prepare('SELECT * FROM class_photos WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: '照片不存在' });
  }
  db.prepare('UPDATE class_photos SET image_url = ?, title = ? WHERE id = ?')
    .run(image_url || existing.image_url, title !== undefined ? title : existing.title, id);
  db.save();
  res.json({ message: '照片已更新' });
});

// 删除照片
router.delete('/photos/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM class_photos WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: '照片不存在' });
  }
  db.prepare('DELETE FROM class_photos WHERE id = ?').run(id);
  db.save();
  res.json({ message: '照片已删除' });
});

// 批量调整组内照片排序
router.put('/groups/:id/photos/sort', authMiddleware, (req, res) => {
  const groupId = req.params.id;
  const { items } = req.body;
  if (!Array.isArray(items)) {
    return res.status(400).json({ error: '请提供排序数组' });
  }
  const update = db.prepare('UPDATE class_photos SET sort_order = ? WHERE id = ? AND group_id = ?');
  const tx = db.transaction(() => {
    items.forEach((item, index) => {
      update.run(index + 1, item.id, groupId);
    });
  });
  tx();
  db.save();
  res.json({ message: '排序已更新' });
});

module.exports = router;
