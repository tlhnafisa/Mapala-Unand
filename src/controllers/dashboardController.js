const db = require('../config/db');

exports.getOverviewStats = (req, res) => {
  const members = db.get('members');
  const activePeriod = db.get('periodes').find(p => p.is_active) || { tahun: 2026 };
  const reRegistrations = db.get('reRegistrations').filter(r => r.periode_tahun === activePeriod.tahun);
  const logs = db.get('logs').slice(0, 7);

  const totalMembers = members.length;
  const registeredRegs = new Set(reRegistrations.map(r => r.no_register));
  const sudahReg = members.filter(m => registeredRegs.has(m.no_register)).length;
  const belumReg = totalMembers - sudahReg;
  const persentaseKelengkapan = totalMembers > 0 ? Math.round((sudahReg / totalMembers) * 100) : 0;

  // Stats by Division: Include all registered divisions from database
  const divisions = db.get('divisions');
  const divisionCounts = {};
  divisions.forEach(d => {
    divisionCounts[d.nama_divisi] = 0;
  });
  members.forEach(m => {
    const div = m.divisi || 'Lainnya';
    divisionCounts[div] = (divisionCounts[div] || 0) + 1;
  });

  // Stats by Angkatan Group
  const angkatanCounts = {};
  members.forEach(m => {
    const angkatan = m.angkatan || 'Tidak Diketahui';
    angkatanCounts[angkatan] = (angkatanCounts[angkatan] || 0) + 1;
  });

  // Stats by Domisili / Kota
  const domisiliCounts = {};
  reRegistrations.forEach(r => {
    const kota = r.kota_kabupaten || 'Lainnya';
    domisiliCounts[kota] = (domisiliCounts[kota] || 0) + 1;
  });

  return res.json({
    success: true,
    data: {
      periode: activePeriod,
      metrics: {
        totalMembers,
        sudahReg,
        belumReg,
        persentaseKelengkapan,
        inputMandiri: reRegistrations.filter(r => r.sumber_input === 'mandiri').length,
        inputAdmin: reRegistrations.filter(r => r.sumber_input === 'admin').length
      },
      divisionStats: divisionCounts,
      angkatanStats: angkatanCounts,
      domisiliStats: domisiliCounts,
      recentLogs: logs
    }
  });
};

