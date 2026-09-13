const express = require('express');
const { db } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// 公开：获取个人介绍
router.get('/', (req, res) => {
  const profile = db.prepare('SELECT * FROM profile ORDER BY id DESC LIMIT 1').get();
  res.json({ content: profile ? profile.content : '' });
});

// 管理：更新个人介绍
router.put('/', authMiddleware, (req, res) => {
  const { content } = req.body;
  if (content === undefined) {
    return res.status(400).json({ error: '请提供介绍内容' });
  }

  const existing = db.prepare('SELECT id FROM profile ORDER BY id DESC LIMIT 1').get();
  if (existing) {
    db.prepare('UPDATE profile SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(content, existing.id);
  } else {
    db.prepare('INSERT INTO profile (content) VALUES (?)').run(content);
  }

  res.json({ message: '个人介绍已更新' });
});

module.exports = router;
