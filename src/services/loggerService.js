const db = require('../config/db');

function logActivity(adminUsername, aksi, detail) {
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
    return newLog;
  } catch (error) {
    console.error('Error logging activity:', error);
  }
}

module.exports = {
  logActivity
};

