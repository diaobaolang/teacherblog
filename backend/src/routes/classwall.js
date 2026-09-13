const express = require('express');
const { pgClient } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// ============ 公开接口 ============

// 获取所有分组（按 sort_order 排序）
router.get('/groups', async (req, res) => {
  const { data } = await pgClient.select('class_groups', {
    columns: '*',
    order: 'sort_order.asc,id.asc',
  });
  res.json(data);
});

// 获取某个分组下的所有照片
router.get('/groups/:id/photos', async (req, res) => {
  const { data } = await pgClient.select('class_photos', {
    columns: '*',
    filters: { group_id: req.params.id },
    order: 'sort_order.asc,id.asc',
  });
  res.json(data);
});

// 获取所有分组及其照片
router.get('/all', async (req, res) => {
  const { data: groups } = await pgClient.select('class_groups', {
    columns: '*',
    order: 'sort_order.asc,id.asc',
  });
  const { data: allPhotos } = await pgClient.select('class_photos', {
    columns: '*',
    order: 'sort_order.asc,id.asc',
  });
  const result = groups.map(g => ({
    ...g,
    photos: allPhotos.filter(p => p.group_id === g.id)
  }));
  res.json(result);
});

// ============ 分组管理（需认证） ============

// 新增分组
router.post('/groups', authMiddleware, async (req, res) => {
  const { name, cover_image } = req.body;
  if (!name) {
    return res.status(400).json({ error: '请提供分组名称' });
  }
  const maxSort = await pgClient.max('class_groups', 'sort_order');
  const sortOrder = (maxSort || 0) + 1;
  const row = await pgClient.insert('class_groups', {
    name, cover_image: cover_image || '', sort_order: sortOrder
  }, { returnData: true });
  res.status(201).json({ id: row?.id, message: '分组已创建' });
});

// 编辑分组
// 注意：数字约束 :id(\d+) 保证 PUT /groups/sort 不会被本路由抢先匹配
router.put('/groups/:id(\\d+)', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { name, cover_image } = req.body;
  const existing = await pgClient.getOne('class_groups', { filters: { id } });
  if (!existing) {
    return res.status(404).json({ error: '分组不存在' });
  }
  await pgClient.update('class_groups', {
    name: name || existing.name,
    cover_image: cover_image !== undefined ? cover_image : existing.cover_image,
  }, { id });
  res.json({ message: '分组已更新' });
});

// 删除分组（同时删除组内照片）
router.delete('/groups/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const existing = await pgClient.getOne('class_groups', { filters: { id } });
  if (!existing) {
    return res.status(404).json({ error: '分组不存在' });
  }
  await pgClient.delete('class_photos', { group_id: id });
  await pgClient.delete('class_groups', { id });
  res.json({ message: '分组已删除' });
});

// 批量调整分组排序
router.put('/groups/sort', authMiddleware, async (req, res) => {
  const { items } = req.body;
  if (!Array.isArray(items)) {
    return res.status(400).json({ error: '请提供排序数组' });
  }
  for (let i = 0; i < items.length; i++) {
    await pgClient.update('class_groups', { sort_order: i + 1 }, { id: items[i].id });
  }
  res.json({ message: '排序已更新' });
});

// ============ 照片管理（需认证） ============

// 新增照片到分组
router.post('/groups/:id/photos', authMiddleware, async (req, res) => {
  const groupId = req.params.id;
  const { image_url, title } = req.body;
  if (!image_url) {
    return res.status(400).json({ error: '请提供图片地址' });
  }
  const group = await pgClient.getOne('class_groups', { filters: { id: groupId } });
  if (!group) {
    return res.status(404).json({ error: '分组不存在' });
  }
  const maxSort = await pgClient.max('class_photos', 'sort_order', { group_id: groupId });
  const sortOrder = (maxSort || 0) + 1;
  const row = await pgClient.insert('class_photos', {
    group_id: groupId, image_url, title: title || '', sort_order: sortOrder
  }, { returnData: true });
  res.status(201).json({ id: row?.id, message: '照片已添加' });
});

// 编辑照片
router.put('/photos/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { image_url, title } = req.body;
  const existing = await pgClient.getOne('class_photos', { filters: { id } });
  if (!existing) {
    return res.status(404).json({ error: '照片不存在' });
  }
  await pgClient.update('class_photos', {
    image_url: image_url || existing.image_url,
    title: title !== undefined ? title : existing.title,
  }, { id });
  res.json({ message: '照片已更新' });
});

// 删除照片
router.delete('/photos/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const existing = await pgClient.getOne('class_photos', { filters: { id } });
  if (!existing) {
    return res.status(404).json({ error: '照片不存在' });
  }
  await pgClient.delete('class_photos', { id });
  res.json({ message: '照片已删除' });
});

// 批量调整组内照片排序
router.put('/groups/:id/photos/sort', authMiddleware, async (req, res) => {
  const groupId = req.params.id;
  const { items } = req.body;
  if (!Array.isArray(items)) {
    return res.status(400).json({ error: '请提供排序数组' });
  }
  for (let i = 0; i < items.length; i++) {
    await pgClient.update('class_photos', { sort_order: i + 1 }, { id: items[i].id, group_id: groupId });
  }
  res.json({ message: '排序已更新' });
});

module.exports = router;
