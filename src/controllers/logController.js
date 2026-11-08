const db = require('../config/db');

exports.getActivityLogs = (req, res) => {
  const { limit = 100, search } = req.query;
  let logs = db.get('logs');

  if (search) {
    const q = search.toLowerCase();
    logs = logs.filter(
      l =>
        l.admin.toLowerCase().includes(q) ||
        l.aksi.toLowerCase().includes(q) ||
        l.detail.toLowerCase().includes(q)
    );
  }

  return res.json({
    success: true,
    total: logs.length,
    data: logs.slice(0, parseInt(limit, 10))
  });
};

