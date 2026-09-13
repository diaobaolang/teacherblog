const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { pgClient } = require('../db');
const { authMiddleware } = require('../middleware/auth');
require('dotenv').config();

const router = express.Router();

// 管理员登录
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: '请输入用户名和密码' });
  }

  const user = await pgClient.getOne('users', { filters: { username } });
  if (!user) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username },
    process.env.JWT_SECRET || 'default-secret',
    { expiresIn: '7d' }
  );

  res.json({ token, username: user.username });
});

// 修改密码
router.post('/change-password', authMiddleware, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: '请输入原密码和新密码' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: '新密码长度不能少于6位' });
  }

  const user = await pgClient.getOne('users', { filters: { id: req.user.id } });
  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }

  const valid = bcrypt.compareSync(oldPassword, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: '原密码错误' });
  }

  if (oldPassword === newPassword) {
    return res.status(400).json({ error: '新密码不能与原密码相同' });
  }

  const newHash = bcrypt.hashSync(newPassword, 10);
  await pgClient.update('users', { password_hash: newHash }, { id: req.user.id });

  res.json({ message: '密码修改成功' });
});

module.exports = router;
