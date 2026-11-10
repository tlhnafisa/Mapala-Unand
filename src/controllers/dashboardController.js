const { query } = require('../config/mysql');
const db = require('../config/db');

exports.getOverviewStats = async (req, res) => {
  try {
    // 1. Get active or latest period
    const periods = await query(`
      SELECT id, tahun, status, nama AS nama_periode
      FROM periode_registrasi
      ORDER BY (status = 'buka') DESC, tahun DESC
      LIMIT 1
    `);
    const activePeriod = periods.length > 0
      ? { ...periods[0], is_active: periods[0].status === 'buka' }
      : { id: 1, tahun: 2026, status: 'buka', nama_periode: 'Periode 2026', is_active: true };

    // 2. Metrics
    const totalMembersRow = await query(`SELECT COUNT(*) AS total FROM anggota`);
    const totalMembers = totalMembersRow[0]?.total || 0;

    const regCountRow = await query(`
      SELECT 
        COUNT(DISTINCT anggota_id) AS sudah_reg,
        SUM(CASE WHEN sumber_input = 'mandiri' THEN 1 ELSE 0 END) AS input_mandiri,
        SUM(CASE WHEN sumber_input = 'admin' THEN 1 ELSE 0 END) AS input_admin
      FROM registrasi_ulang
      WHERE periode_id = ?
    `, [activePeriod.id]);

    const sudahReg = regCountRow[0]?.sudah_reg || 0;
    const belumReg = Math.max(0, totalMembers - sudahReg);
    const persentaseKelengkapan = totalMembers > 0 ? Math.round((sudahReg / totalMembers) * 100) : 0;

    // 3. Division Stats
    const divRows = await query(`
      SELECT d.nama, COUNT(a.id) AS total
      FROM divisi d
      LEFT JOIN anggota a ON a.divisi_id = d.id
      GROUP BY d.id, d.nama
      ORDER BY d.urutan ASC, d.id ASC
    `);
    const divisionCounts = {};
    divRows.forEach(r => {
      divisionCounts[r.nama] = r.total;
    });

    // 4. Angkatan Stats (Diurutkan berdasarkan jumlah anggota terbanyak, lalu tahun terbaru)
    const angkatanRows = await query(`
      SELECT angkatan, COUNT(*) AS total
      FROM anggota
      WHERE angkatan IS NOT NULL
      GROUP BY angkatan
      ORDER BY total DESC, angkatan DESC
    `);
    const angkatanCounts = {};
    angkatanRows.forEach(r => {
      angkatanCounts[r.angkatan] = r.total;
    });

    // 5. Domisili Stats
    const domisiliRows = await query(`
      SELECT kota_kabupaten, COUNT(*) AS total
      FROM registrasi_ulang
      WHERE periode_id = ? AND kota_kabupaten IS NOT NULL AND kota_kabupaten != ''
      GROUP BY kota_kabupaten
      ORDER BY total DESC
      LIMIT 10
    `, [activePeriod.id]);
    const domisiliCounts = {};
    domisiliRows.forEach(r => {
      domisiliCounts[r.kota_kabupaten] = r.total;
    });

    // 6. Recent Logs
    let recentLogs = [];
    try {
      const logRows = await query(`
        SELECT 
          l.id, 
          l.created_at AS waktu, 
          COALESCE(u.username, 'admin') AS admin, 
          l.aksi, 
          COALESCE(JSON_UNQUOTE(JSON_EXTRACT(l.data_baru, '$.detail')), l.aksi) AS detail
        FROM log_aktivitas l
        LEFT JOIN users u ON u.id = l.user_id
        ORDER BY l.created_at DESC
        LIMIT 7
      `);
      recentLogs = logRows;
    } catch {
      recentLogs = db.get('logs').slice(0, 7);
    }

    if (recentLogs.length === 0) {
      recentLogs = db.get('logs').slice(0, 7);
    }

    return res.json({
      success: true,
      data: {
        periode: activePeriod,
        metrics: {
          totalMembers,
          sudahReg,
          belumReg,
          persentaseKelengkapan,
          inputMandiri: regCountRow[0]?.input_mandiri || 0,
          inputAdmin: regCountRow[0]?.input_admin || 0
        },
        divisionStats: divisionCounts,
        angkatanStats: angkatanCounts,
        angkatanList: angkatanRows,
        domisiliStats: domisiliCounts,
        recentLogs
      }
    });
  } catch (error) {
    console.error('Error getOverviewStats MySQL:', error);
    // Fallback to in-memory store
    const members = db.get('members');
    const activePeriod = db.get('periodes').find(p => p.is_active) || { tahun: 2026 };
    return res.json({
      success: true,
      data: {
        periode: activePeriod,
        metrics: {
          totalMembers: members.length,
          sudahReg: 0,
          belumReg: members.length,
          persentaseKelengkapan: 0,
          inputMandiri: 0,
          inputAdmin: 0
        },
        divisionStats: {},
        angkatanStats: {},
        domisiliStats: {},
        recentLogs: db.get('logs').slice(0, 7)
      }
    });
  }
};
