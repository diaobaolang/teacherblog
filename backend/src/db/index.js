const initSqlJs = require('sql.js');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const DB_PATH = path.join(__dirname, '..', '..', 'data', 'teacherblog.db');
const DB_DIR = path.dirname(DB_PATH);

// 确保数据目录存在
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

let SQL = null;
let dbInstance = null;

// Statement 封装：模拟 better-sqlite3 的 prepare().run()/get()/all()
class Statement {
  constructor(db, sql) {
    this.db = db;
    this.sql = sql;
  }

  run(...params) {
    this.db.run(this.sql, params);
    return {
      lastInsertRowid: this.db.exec('SELECT last_insert_rowid() as id')[0].values[0][0],
      changes: this.db.getRowsModified()
    };
  }

  get(...params) {
    const stmt = this.db.prepare(this.sql);
    stmt.bind(params);
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return row;
    }
    stmt.free();
    return undefined;
  }

  all(...params) {
    const stmt = this.db.prepare(this.sql);
    stmt.bind(params);
    const rows = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
    stmt.free();
    return rows;
  }
}

// 事务封装
class Transaction {
  constructor(db, fn) {
    this.db = db;
    this.fn = fn;
  }

  run() {
    this.db.exec('BEGIN');
    try {
      this.fn();
      this.db.exec('COMMIT');
    } catch (e) {
      this.db.exec('ROLLBACK');
      throw e;
    }
  }
}

// 数据库封装对象
const db = {
  prepare(sql) {
    return new Statement(dbInstance, sql);
  },

  exec(sql) {
    dbInstance.exec(sql);
  },

  transaction(fn) {
    return new Transaction(dbInstance, fn);
  },

  pragma() {
    // sql.js 不支持 pragma 方法，空实现
  },

  save() {
    const data = dbInstance.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }
};

// 初始化数据库
async function initDatabase() {
  if (!SQL) {
    SQL = await initSqlJs();
  }

  // 如果已有数据库文件，加载它
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    dbInstance = new SQL.Database(buffer);
  } else {
    dbInstance = new SQL.Database();
  }

  // 设置 WAL 模式（sql.js 不支持，跳过）
  // dbInstance.pragma('journal_mode = WAL');

  // 创建表
  dbInstance.run(`
    CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      username      TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  dbInstance.run(`
    CREATE TABLE IF NOT EXISTS profile (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      content    TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  dbInstance.run(`
    CREATE TABLE IF NOT EXISTS carousel_images (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      image_url   TEXT NOT NULL,
      title       TEXT,
      sort_order  INTEGER DEFAULT 0,
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  dbInstance.run(`
    CREATE TABLE IF NOT EXISTS articles (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      title       TEXT NOT NULL,
      content     TEXT,
      cover_image TEXT,
      summary     TEXT,
      status      TEXT DEFAULT 'draft',
      sort_order  INTEGER DEFAULT 0,
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  dbInstance.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      nickname     TEXT NOT NULL,
      content      TEXT NOT NULL,
      status       TEXT DEFAULT 'pending',
      sort_order   INTEGER DEFAULT 0,
      created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
      reviewed_at  DATETIME
    )
  `);

  // 荣誉墙分组
  dbInstance.run(`
    CREATE TABLE IF NOT EXISTS photo_groups (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT NOT NULL,
      cover_image TEXT,
      sort_order  INTEGER DEFAULT 0,
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 荣誉墙照片（属于某个分组）
  dbInstance.run(`
    CREATE TABLE IF NOT EXISTS photos (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id    INTEGER NOT NULL,
      image_url   TEXT NOT NULL,
      title       TEXT,
      sort_order  INTEGER DEFAULT 0,
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (group_id) REFERENCES photo_groups(id)
    )
  `);

  // 班级照分组
  dbInstance.run(`
    CREATE TABLE IF NOT EXISTS class_groups (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT NOT NULL,
      cover_image TEXT,
      sort_order  INTEGER DEFAULT 0,
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 班级照（属于某个分组）
  dbInstance.run(`
    CREATE TABLE IF NOT EXISTS class_photos (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id    INTEGER NOT NULL,
      image_url   TEXT NOT NULL,
      title       TEXT,
      sort_order  INTEGER DEFAULT 0,
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (group_id) REFERENCES class_groups(id)
    )
  `);

  // 插入默认管理员账号
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123456';
  const stmt = dbInstance.prepare('SELECT id FROM users WHERE username = ?');
  stmt.bind([adminUsername]);
  const hasAdmin = stmt.step();
  stmt.free();
  if (!hasAdmin) {
    const hash = bcrypt.hashSync(adminPassword, 10);
    dbInstance.run('INSERT INTO users (username, password_hash) VALUES (?, ?)', [adminUsername, hash]);
    console.log(`[db] 默认管理员账号已创建: ${adminUsername}`);
  }

  // 插入默认个人介绍
  const profileStmt = dbInstance.prepare('SELECT id FROM profile');
  const hasProfile = profileStmt.step();
  profileStmt.free();
  if (!hasProfile) {
    dbInstance.run("INSERT INTO profile (content) VALUES (?)", ['欢迎使用教师个人博客，请在后台编辑此介绍内容。']);
    console.log('[db] 默认个人介绍已创建');
  }

  // 持久化
  db.save();

  console.log('[db] 数据库初始化完成');
}

module.exports = { db, initDatabase };
