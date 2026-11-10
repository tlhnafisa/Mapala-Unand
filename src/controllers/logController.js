const { query } = require('../config/mysql');
const db = require('../config/db');

exports.getActivityLogs = async (req, res) => {
  try {
    const { limit = 100, search } = req.query;
    const limitNum = parseInt(limit, 10) || 100;

    let sql = `
      SELECT 
        l.id,
        l.aksi,
        l.entitas,
        l.entitas_id,
        l.data_baru,
        l.data_lama,
        l.ip_address,
        l.created_at AS waktu,
        DATE_FORMAT(l.created_at, '%Y-%m-%d %H:%i:%s') AS waktu_formatted,
        COALESCE(u.username, 'admin') AS admin
      FROM log_aktivitas l
      LEFT JOIN users u ON u.id = l.user_id
    `;
    const params = [];

    if (search && search.trim()) {
      sql += ` WHERE l.aksi LIKE ? OR l.entitas LIKE ? OR u.username LIKE ?`;
      params.push(`%${search.trim()}%`, `%${search.trim()}%`, `%${search.trim()}%`);
    }

    sql += ` ORDER BY l.created_at DESC, l.id DESC LIMIT ?`;
    params.push(limitNum);

    const rows = await query(sql, params);

    const formatted = rows.map(r => {
      let detail = `${r.aksi} pada ${r.entitas || 'sistem'}`;
      if (r.data_baru) {
        try {
          const parsed = typeof r.data_baru === 'string' ? JSON.parse(r.data_baru) : r.data_baru;
          if (parsed && parsed.detail) {
            detail = parsed.detail;
          }
        } catch (_) {}
      }

      return {
        id: String(r.id),
        waktu: r.waktu,
        waktu_formatted: r.waktu_formatted,
        admin: r.admin,
        aksi: r.aksi,
        entitas: r.entitas,
        entitas_id: r.entitas_id,
        detail
      };
    });

    return res.json({
      success: true,
      total: formatted.length,
      data: formatted
    });
  } catch (err) {
    console.error('Error getActivityLogs MySQL:', err);
    // Fallback to in-memory db
    let logs = db.get('logs') || [];
    return res.json({
      success: true,
      total: logs.length,
      data: logs.slice(0, 100)
    });
  }
};
