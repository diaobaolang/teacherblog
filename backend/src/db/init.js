// init.js - 数据库初始化入口
// 建表已通过 CloudBase PG migration 完成，此脚本仅用于插入默认数据
const { initDatabase } = require('./index');

initDatabase().then(() => {
  console.log('[init-db] 数据库初始化完成');
  process.exit(0);
}).catch(err => {
  console.error('[init-db] 数据库初始化失败:', err);
  process.exit(1);
});
