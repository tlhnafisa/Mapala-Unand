const db = require('../config/db');
const { logActivity } = require('../services/loggerService');

// 1. PERIODE REGISTRASI ULANG
exports.getPeriodes = (req, res) => {
  const periodes = db.get('periodes');
  return res.json({ success: true, data: periodes });
};

exports.togglePeriodStatus = (req, res) => {
  const { id } = req.params;
  const periodes = db.get('periodes');
  const period = periodes.find(p => p.id === id);

  if (!period) {
    return res.status(404).json({ success: false, message: 'Periode tidak ditemukan.' });
  }

  // If opening this period, close other periods
  const willBeActive = !period.is_active;
  if (willBeActive) {
    periodes.forEach(p => { p.is_active = false; });
  }
  period.is_active = willBeActive;

  db.set('periodes', periodes);

  logActivity(
    req.user.username,
    'UPDATE_PERIODE',
    `Mengubah status ${period.nama_periode} (${period.tahun}) menjadi ${willBeActive ? 'DIBUKA' : 'DITUTUP'}`
  );

  return res.json({
    success: true,
    message: `Status periode ${period.nama_periode} berhasil diubah menjadi ${willBeActive ? 'Dibuka' : 'Ditutup'}.`,
    data: period
  });
};

exports.createPeriod = (req, res) => {
  const { tahun, nama_periode, tanggal_buka, tanggal_tutup, deskripsi } = req.body;

  if (!tahun || !nama_periode) {
    return res.status(400).json({ success: false, message: 'Tahun dan Nama Periode wajib diisi.' });
  }

  const periodes = db.get('periodes');
  const exists = periodes.find(p => p.tahun === parseInt(tahun, 10));
  if (exists) {
    return res.status(400).json({ success: false, message: `Periode untuk tahun ${tahun} sudah ada.` });
  }

  const newPeriod = {
    id: `PRD-${tahun}`,
    tahun: parseInt(tahun, 10),
    nama_periode,
    tanggal_buka: tanggal_buka || `${tahun}-01-01`,
    tanggal_tutup: tanggal_tutup || `${tahun}-12-31`,
    is_active: false,
    deskripsi: deskripsi || ''
  };

  periodes.unshift(newPeriod);
  db.set('periodes', periodes);

  logActivity(req.user.username, 'CREATE_PERIODE', `Menambahkan periode baru: ${nama_periode}`);

  return res.status(201).json({
    success: true,
    message: 'Periode registrasi baru berhasil dibuat.',
    data: newPeriod
  });
};

// 2. KELOLA DIVISI ORGANISASI (Menggantikan Kelola Jenis Atribut)
exports.getDivisions = (req, res) => {
  const divisions = db.get('divisions');
  return res.json({ success: true, data: divisions });
};

exports.createDivision = (req, res) => {
  const { nama_divisi, kode, deskripsi } = req.body;

  if (!nama_divisi) {
    return res.status(400).json({ success: false, message: 'Nama divisi wajib diisi.' });
  }

  const divisions = db.get('divisions');
  const exists = divisions.find(
    d => d.nama_divisi.trim().toLowerCase() === nama_divisi.trim().toLowerCase()
  );

  if (exists) {
    return res.status(400).json({ success: false, message: `Divisi '${nama_divisi}' sudah ada di database.` });
  }

  const newDiv = {
    id: `DIV-${String(divisions.length + 1).padStart(3, '0')}`,
    nama_divisi: nama_divisi.trim(),
    kode: (kode || nama_divisi.substring(0, 3)).trim().toUpperCase(),
    deskripsi: deskripsi || 'Spesialisasi kegiatan alam bebas Mapala UNAND'
  };

  divisions.push(newDiv);
  db.set('divisions', divisions);

  logActivity(req.user.username, 'CREATE_DIVISI', `Menambahkan divisi baru: ${newDiv.nama_divisi} (${newDiv.kode})`);

  return res.status(201).json({
    success: true,
    message: `Divisi '${newDiv.nama_divisi}' berhasil ditambahkan.`,
    data: newDiv
  });
};

exports.updateDivision = (req, res) => {
  const { id } = req.params;
  const { nama_divisi, kode, deskripsi } = req.body;

  if (!nama_divisi || !nama_divisi.trim()) {
    return res.status(400).json({ success: false, message: 'Nama divisi wajib diisi.' });
  }

  const divisions = db.get('divisions');
  const index = divisions.findIndex(d => d.id === id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Divisi tidak ditemukan.' });
  }

  const oldName = divisions[index].nama_divisi;
  const newName = nama_divisi.trim();

  // Check duplicate with other divisions
  const duplicate = divisions.find(
    d => d.id !== id && d.nama_divisi.trim().toLowerCase() === newName.toLowerCase()
  );
  if (duplicate) {
    return res.status(400).json({ success: false, message: `Divisi '${newName}' sudah ada di database.` });
  }

  divisions[index] = {
    ...divisions[index],
    nama_divisi: newName,
    kode: (kode || divisions[index].kode).trim().toUpperCase(),
    deskripsi: deskripsi !== undefined ? deskripsi.trim() : divisions[index].deskripsi
  };
  db.set('divisions', divisions);

  // Update all members if division name changed
  let updatedCount = 0;
  if (oldName !== newName) {
    const members = db.get('members');
    members.forEach(m => {
      if (m.divisi === oldName) {
        m.divisi = newName;
        m.updated_at = new Date().toISOString();
        updatedCount++;
      }
    });
    if (updatedCount > 0) {
      db.set('members', members);
    }
  }

  logActivity(
    req.user.username,
    'UPDATE_DIVISI',
    `Memperbarui nama divisi dari '${oldName}' menjadi '${newName}' (${updatedCount} data anggota disinkronkan)`
  );

  return res.json({
    success: true,
    message: `Nama divisi '${newName}' berhasil diperbarui.${updatedCount > 0 ? ` Sebanyak ${updatedCount} anggota diselaraskan.` : ''}`,
    data: divisions[index],
    updatedCount
  });
};

exports.deleteDivision = (req, res) => {
  // Sesuai kebijakan baru: Divisi permanen dan tidak dapat dihapus, hanya dapat diedit untuk mencegah typo
  return res.status(403).json({
    success: false,
    message: 'Divisi tidak dapat dihapus sesuai kebijakan keanggotaan. Anda dapat mengedit penamaannya jika terdapat salah ketik (typo).'
  });
};

// 3. ATRIBUT ORGANISASI TETAP (HANYA Topi Rimba & Baju Lapangan - TIDAK ADA PENAMBAHAN)
exports.getAttributes = (req, res) => {
  const atributs = [
    { id: 'ATR-001', nama_atribut: 'Topi Rimba', wajib: true, keterangan: 'Topi rimba resmi Mapala UNAND' },
    { id: 'ATR-002', nama_atribut: 'Baju Lapangan', wajib: true, keterangan: 'Baju dinas lapangan (PDL) resmi' }
  ];
  return res.json({ success: true, data: atributs });
};
