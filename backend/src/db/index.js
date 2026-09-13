const bcrypt = require('bcryptjs');
require('dotenv').config();

const ENV_ID = process.env.CLOUDBASE_ENV_ID || 'teacherblog-d5gpp8xax79a35603';
const PUBLISHABLE_KEY = process.env.CLOUDBASE_PUBLISHABLE_KEY || 'eyJhbGciOiJSUzI1NiIsImtpZCI6ImRmMTFhOTI4LTZiMzMtNDlmNy05MjU2LWEzNzIxNDI4MWU4YiJ9.eyJpc3MiOiJodHRwczovL3RlYWNoZXJibG9nLWQ1Z3BwOHhheDc5YTM1NjAzLmFwLXNoYW5naGFpLnRjYi1hcGkudGVuY2VudGNsb3VkYXBpLmNvbSIsInN1YiI6ImFub24iLCJhdWQiOiJ0ZWFjaGVyYmxvZy1kNWdwcDh4YXg3OWEzNTYwMyIsImV4cCI6NDA5Mjk2MDIwMywiaWF0IjoxNzg5Mjc3MDAzLCJub25jZSI6Ik1PNE1BX3M2VFpLUFdJem5PTElDTGciLCJhdF9oYXNoIjoiTU80TUFfczZUWktQV0l6bk9MSUNMZyIsIm5hbWUiOiJBbm9ueW1vdXMiLCJzY29wZSI6ImFub255bW91cyIsInByb2plY3RfaWQiOiJ0ZWFjaGVyYmxvZy1kNWdwcDh4YXg3OWEzNTYwMyIsIm1ldGEiOnsicGxhdGZvcm0iOiJQdWJsaXNoYWJsZUtleSJ9LCJyb2xlIjoiYW5vbiIsImlzX2Fub255bW91cyI6dHJ1ZSwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiYW5vbnltb3VzIiwicHJvdmlkZXJzIjpbImFub255bW91cyJdfSwidXNlcl9tZXRhZGF0YSI6eyJuYW1lIjoiQW5vbnltb3VzIn0sInVzZXJfdHlwZSI6IiIsImNsaWVudF90eXBlIjoiY2xpZW50X3VzZXIiLCJpc19zeXN0ZW1fYWRtaW4iOmZhbHNlfQ.f2CYyCVsTwQGPQ1UK_P1Fkb_LnHEuIJG6bkFKCQO2bqwXFYWoFhb5RbxJ847J5mLBZvGnzaImWWVQrlkxz9EdkJODTTqk35eIDSd6Rc36_39EATGMqtQ2Xsl4c8EZN1M5FwEFZuGiLcujE-hK-NrME85t8pLqfT6I065ddAnBiGDwsNiWKRqUlgtNuGOn6xVc3tgF1JrWPAGDC5wCXZDgvoVy5LxB5VmdGvafhiENuZkeXRt5qMuNyTcF0YN7MaslymW9FNot7ARy8WUyypSEYyIHLsuEFcEXX0lttPy1PB4Aim7P8Srp1K0CLY6M2yreM3sVghanlaf1yXAIen_-g';
const PG_API_BASE = `https://${ENV_ID}.api.tcloudbasegateway.com/v1/rdb/rest`;

// PG HTTP API 客户端（PostgREST 风格）
class PgClient {
  constructor() {
    this.base = PG_API_BASE;
    this.headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${PUBLISHABLE_KEY}`,
    };
  }

  // 构建查询参数字符串
  buildQuery(params) {
    const parts = [];
    for (const [key, value] of Object.entries(params || {})) {
      parts.push(`${key}=${encodeURIComponent(value)}`);
    }
    return parts.length > 0 ? `?${parts.join('&')}` : '';
  }

  // SELECT 查询
  async select(table, { columns = '*', filters = {}, order = '', limit = null, offset = null, count = null } = {}) {
    let url = `${this.base}/${table}?select=${encodeURIComponent(columns)}`;
    
    // 添加过滤条件 (PostgREST 格式: column=op.value)
    for (const [key, value] of Object.entries(filters)) {
      if (typeof value === 'object' && value.op) {
        url += `&${key}=${value.op}.${encodeURIComponent(value.value)}`;
      } else {
        url += `&${key}=eq.${encodeURIComponent(value)}`;
      }
    }
    
    if (order) url += `&order=${encodeURIComponent(order)}`;
    if (limit !== null) url += `&limit=${limit}`;
    if (offset !== null) url += `&offset=${offset}`;
    
    const headers = { ...this.headers };
    if (count) headers['Prefer'] = `count=${count}`;
    
    const res = await fetch(url, { headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`PG API error: ${res.status} ${JSON.stringify(err)}`);
    }
    const data = await res.json();
    
    // 返回 count 信息（如果请求了）
    const contentRange = res.headers.get('Content-Range') || res.headers.get('content-range') || '';
    let totalCount = null;
    if (contentRange && contentRange.includes('/')) {
      const parts = contentRange.split('/');
      totalCount = parseInt(parts[1]) || null;
    }
    
    return { data, count: totalCount };
  }

  // INSERT
  async insert(table, data, { returnData = false } = {}) {
    const url = `${this.base}/${table}${returnData ? '?select=*' : ''}`;
    const headers = { ...this.headers };
    if (returnData) headers['Prefer'] = 'return=representation';
    
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    
    if (!res.ok && res.status !== 201) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`PG API insert error: ${res.status} ${JSON.stringify(err)}`);
    }
    
    if (returnData) {
      const result = await res.json();
      return Array.isArray(result) ? result[0] : result;
    }
    return null;
  }

  // UPDATE
  async update(table, data, filters, { returnData = false } = {}) {
    let url = `${this.base}/${table}?`;
    // PostgREST PATCH 需要 WHERE 条件
    for (const [key, value] of Object.entries(filters)) {
      url += `${key}=eq.${encodeURIComponent(value)}&`;
    }
    url = url.slice(0, -1); // 去掉末尾的 & 或 ?
    
    const headers = { ...this.headers };
    if (returnData) {
      headers['Prefer'] = 'return=representation';
      url += '&select=*';
    }
    
    const res = await fetch(url, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(data),
    });
    
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`PG API update error: ${res.status} ${JSON.stringify(err)}`);
    }
    
    if (returnData) {
      const result = await res.json();
      return Array.isArray(result) ? result[0] : result;
    }
    return null;
  }

  // DELETE
  async delete(table, filters) {
    let url = `${this.base}/${table}?`;
    for (const [key, value] of Object.entries(filters)) {
      url += `${key}=eq.${encodeURIComponent(value)}&`;
    }
    url = url.slice(0, -1);
    
    const res = await fetch(url, {
      method: 'DELETE',
      headers: this.headers,
    });
    
    if (!res.ok && res.status !== 204) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`PG API delete error: ${res.status} ${JSON.stringify(err)}`);
    }
    
    return true;
  }

  // 获取单条记录
  async getOne(table, { columns = '*', filters = {}, order = '' }) {
    const { data } = await this.select(table, { columns, filters, order, limit: 1 });
    return data.length > 0 ? data[0] : null;
  }

  // 聚合查询 - MAX
  async max(table, column, filters = {}) {
    // PostgREST 不直接支持 MAX，用 order + limit 1 代替
    const { data } = await this.select(table, {
      columns: column,
      filters,
      order: `${column}.desc`,
      limit: 1,
    });
    return data.length > 0 ? data[0][column] : null;
  }

  // 聚合查询 - COUNT
  async count(table, filters = {}) {
    const { count } = await this.select(table, {
      columns: '*',
      filters,
      count: 'exact',
    });
    return count || 0;
  }
}

const pgClient = new PgClient();

// 数据库封装对象 - 提供和原来兼容的高级接口
const db = {
  client: pgClient,
  
  // PG 不需要手动 save
  save() {},
  async saveAsync() {},
  
  // 事务不支持（PostgREST 限制），用顺序执行代替
  async transaction(fn) {
    // PostgREST 不支持事务，直接执行
    // 对于批量排序更新，顺序执行即可
    await fn(pgClient);
  },
};

// 初始化数据库（建表已通过 migration 完成，这里只插入默认数据）
async function initDatabase() {
  if (!PUBLISHABLE_KEY) {
    console.warn('[db] CLOUDBASE_PUBLISHABLE_KEY not set, PG API will not work');
  }
  
  // 插入默认管理员账号
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123456';
  
  const existingAdmin = await pgClient.getOne('users', { filters: { username: adminUsername } });
  if (!existingAdmin) {
    const hash = bcrypt.hashSync(adminPassword, 10);
    await pgClient.insert('users', { username: adminUsername, password_hash: hash });
    console.log(`[db] 默认管理员账号已创建: ${adminUsername}`);
  }
  
  // 插入默认个人介绍
  const existingProfile = await pgClient.getOne('profile', {});
  if (!existingProfile) {
    await pgClient.insert('profile', { content: '欢迎使用教师个人博客，请在后台编辑此介绍内容。' });
    console.log('[db] 默认个人介绍已创建');
  }
  
  console.log('[db] PostgreSQL (HTTP API) 数据库初始化完成');
}

module.exports = { db, initDatabase, pgClient };
