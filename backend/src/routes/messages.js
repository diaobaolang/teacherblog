const express = require('express');
const { db } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// 公开：提交留言
router.post('/', (req, res) => {
  const { nickname, content } = req.body;
  if (!nickname || !nickname.trim()) {
    return res.status(400).json({ error: '请输入昵称' });
  }
  if (!content || !content.trim()) {
    return res.status(400).json({ error: '请输入留言内容' });
  }

  // 简单防刷：同名昵称 1 分钟内只能提交一次
  const recent = db.prepare(
    "SELECT id FROM messages WHERE nickname = ? AND datetime(created_at) > datetime('now', '-1 minute')"
  ).get(nickname.trim());
  if (recent) {
    return res.status(429).json({ error: '提交过于频繁，请稍后再试' });
  }

  const maxOrder = db.prepare('SELECT MAX(sort_order) as max FROM messages WHERE status = ?').get('approved');
  const sortOrder = (maxOrder.max || 0) + 1;

  const result = db.prepare('INSERT INTO messages (nickname, content, sort_order) VALUES (?, ?, ?)')
    .run(nickname.trim(), content.trim(), sortOrder);

  res.status(201).json({ id: result.lastInsertRowid, message: '留言已提交，等待审核' });
});

// 公开：获取已审核通过的留言（按 sort_order 排序）
router.get('/', (req, res) => {
  const messages = db.prepare(
    "SELECT id, nickname, content, created_at FROM messages WHERE status = 'approved' ORDER BY sort_order ASC, created_at DESC"
  ).all();
  res.json(messages);
});

// ===== 以下为管理接口 =====

// 管理：留言列表（含未审核）
router.get('/admin/list', authMiddleware, (req, res) => {
  const messages = db.prepare(
    'SELECT id, nickname, content, status, sort_order, created_at, reviewed_at FROM messages ORDER BY created_at DESC'
  ).all();
  res.json(messages);
});

// 管理：审核留言
router.put('/admin/:id/review', authMiddleware, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: '无效的审核状态' });
  }

  const existing = db.prepare('SELECT * FROM messages WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: '留言不存在' });
  }

  db.prepare('UPDATE messages SET status = ?, reviewed_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(status, id);

  res.json({ message: `留言已${status === 'approved' ? '通过' : '拒绝'}` });
});

// 管理：删除留言
router.delete('/admin/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM messages WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: '留言不存在' });
  }

  db.prepare('DELETE FROM messages WHERE id = ?').run(id);
  res.json({ message: '留言已删除' });
});

// 管理：批量调整排序（仅对已审核通过的留言排序）
router.put('/admin/sort', authMiddleware, (req, res) => {
  const { items } = req.body;
  if (!Array.isArray(items)) {
    return res.status(400).json({ error: '请提供排序数组' });
  }

  const update = db.prepare('UPDATE messages SET sort_order = ? WHERE id = ?');
  const tx = db.transaction(() => {
    items.forEach((item, index) => {
      update.run(index + 1, item.id);
    });
  });
  tx();

  res.json({ message: '排序已更新' });
});

module.exports = router;
