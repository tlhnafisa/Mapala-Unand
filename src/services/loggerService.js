const db = require('../config/db');
const { execute, query } = require('../config/mysql');

async function logActivity(adminUsername, aksi, detail, extra = {}) {
  try {
    const logs = db.get('logs');
    const newLog = {
      id: `LOG-${Date.now()}`,
      waktu: new Date().toISOString(),
      admin: adminUsername || 'admin',
      aksi,
      detail
    };
    logs.unshift(newLog); // Put newest first
    // Keep max 500 logs
    if (logs.length > 500) {
      logs.length = 500;
    }
    db.set('logs', logs);

    // Also persist into MySQL log_aktivitas table if available
    try {
      let userId = null;
      if (adminUsername) {
        const u = await query('SELECT id FROM users WHERE username = ? LIMIT 1', [adminUsername]);
        if (u.length > 0) userId = u[0].id;
      }
      await execute(`
        INSERT INTO log_aktivitas (user_id, aksi, entitas, entitas_id, data_baru)
        VALUES (?, ?, ?, ?, ?)
      `, [
        userId,
        aksi,
        extra.entitas || 'admin',
        extra.entitas_id || null,
        JSON.stringify({ detail, ...extra })
      ]);
    } catch (mysqlErr) {
      // Do not fail if log table insert fails
      console.warn('Notice: Log activity MySQL persistence:', mysqlErr.message);
    }

    return newLog;
  } catch (error) {
    console.error('Error logging activity:', error);
  }
}

module.exports = {
  logActivity
};
