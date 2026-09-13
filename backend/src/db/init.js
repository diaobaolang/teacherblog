const { initDatabase, db } = require('./index');

(async () => {
  console.log('[init] 开始初始化数据库...');
  await initDatabase();
  console.log('[init] 数据库初始化完成，退出。');
  process.exit(0);
})();
