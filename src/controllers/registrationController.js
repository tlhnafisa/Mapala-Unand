const db = require('../config/db');
const { logActivity } = require('../services/loggerService');

// GET /api/admin/registrations/monitoring
exports.getMonitoringList = (req, res) => {
  const { periode_tahun, status, sumber_input, search } = req.query;

  const periodes = db.get('periodes');
  const targetYear = periode_tahun ? parseInt(periode_tahun, 10) : (periodes.find(p => p.is_active)?.tahun || 2026);

  const members = db.get('members');
  const reRegistrations = db.get('reRegistrations');

  const regMap = new Map();
  reRegistrations
    .filter(r => r.periode_tahun === targetYear)
    .forEach(r => regMap.set(r.no_register, r));

  let results = members.map(m => {
    const reg = regMap.get(m.no_register);
    return {
      no_register: m.no_register,
      nama: m.nama,
      divisi: m.divisi,
      angkatan: m.angkatan,
      status_registrasi: reg ? 'Sudah Registrasi' : 'Belum Registrasi',
      sumber_input: reg ? reg.sumber_input : null,
      input_by: reg ? reg.input_by : null,
      waktu_terakhir: reg ? reg.updated_at || reg.submitted_at : null,
      no_hp: reg ? reg.no_hp : null,
      email: reg ? reg.email : null,
      domisili: reg ? `${reg.kota_kabupaten}, ${reg.provinsi}` : null,
      reg_detail: reg || null
    };
  });

  if (search) {
    const q = search.toLowerCase();
    results = results.filter(r => r.nama.toLowerCase().includes(q) || r.no_register.toLowerCase().includes(q));
  }

  if (status) {
    if (status === 'sudah') results = results.filter(r => r.status_registrasi === 'Sudah Registrasi');
    if (status === 'belum') results = results.filter(r => r.status_registrasi === 'Belum Registrasi');
  }

  if (sumber_input) {
    results = results.filter(r => r.sumber_input === sumber_input);
  }

  return res.json({
    success: true,
    periode_tahun: targetYear,
    total: results.length,
    sudahCount: results.filter(r => r.status_registrasi === 'Sudah Registrasi').length,
    belumCount: results.filter(r => r.status_registrasi === 'Belum Registrasi').length,
    data: results
  });
};

// POST /api/admin/registrations/override (FR-32: Admin input on behalf of member)
exports.adminInputReRegistration = (req, res) => {
  const {
    no_register,
    periode_tahun,
    alamat_rumah,
    kota_kabupaten,
    provinsi,
    pekerjaan,
    no_hp,
    email,
    media_sosial,
    alamat_ortu,
    atribut
  } = req.body;

  if (!no_register || !alamat_rumah || !kota_kabupaten || !provinsi || !no_hp) {
    return res.status(400).json({
      success: false,
      message: 'No. Register, Alamat Rumah, Kota/Kabupaten, Provinsi, dan No. HP wajib diisi.'
    });
  }

  const members = db.get('members');
  const cleanInput = no_register.replace(/\s+/g, ' ').trim().toLowerCase();
  const member = members.find(m => m.no_register.replace(/\s+/g, ' ').toLowerCase() === cleanInput);

  if (!member) {
    return res.status(404).json({
      success: false,
      message: `Data anggota ${no_register} tidak ditemukan di sistem.`
    });
  }

  const year = periode_tahun ? parseInt(periode_tahun, 10) : 2026;
  const reRegistrations = db.get('reRegistrations');
  const existingIndex = reRegistrations.findIndex(
    r => r.no_register.toLowerCase() === no_register.trim().toLowerCase() && r.periode_tahun === year
  );

  const adminName = req.user ? req.user.username : 'admin';
  const now = new Date().toISOString();

  // Handle foto_terbaru & attribute file uploads
  // upload.any() places files as req.files = [{fieldname, filename, ...}]
  let photoUrl = null;
  let atributList = [];

  // Parse atribut JSON (sent as stringified JSON in FormData)
  try {
    atributList = Array.isArray(atribut)
      ? atribut
      : (typeof atribut === 'string' ? JSON.parse(atribut) : []);
  } catch (_) {
    atributList = [];
  }

  if (req.files && Array.isArray(req.files)) {
    // Build a fieldname → file object map
    const fileMap = {};
    req.files.forEach(f => { fileMap[f.fieldname] = f; });

    // foto_terbaru
    if (fileMap['foto_terbaru']) {
      photoUrl = `/uploads/${fileMap['foto_terbaru'].filename}`;
    }

    // Map attribute file uploads onto atributList
    atributList = atributList.map(a => {
      const fieldName = `attrFile_${a.atribut_id}`;
      const fotoUrl = fileMap[fieldName] ? `/uploads/${fileMap[fieldName].filename}` : (a.foto || null);
      return { ...a, foto: fotoUrl };
    });
  } else if (req.file) {
    // Fallback: single file upload (foto_terbaru)
    photoUrl = `/uploads/${req.file.filename}`;
  }

  const regRecord = {
    id: existingIndex !== -1 ? reRegistrations[existingIndex].id : `REG-${year}-${Date.now()}`,
    no_register: member.no_register,
    periode_tahun: year,
    foto_terbaru: photoUrl || (existingIndex !== -1 ? reRegistrations[existingIndex].foto_terbaru : '/uploads/default-avatar.png'),
    alamat_rumah,
    kota_kabupaten,
    provinsi,
    pekerjaan: pekerjaan || '-',
    no_hp,
    email: email || '-',
    media_sosial: media_sosial || '-',
    alamat_ortu: alamat_ortu || '-',
    status_registrasi: 'Sudah Registrasi Ulang',
    sumber_input: 'admin',
    input_by: `admin (${adminName})`,
    submitted_at: existingIndex !== -1 ? reRegistrations[existingIndex].submitted_at : now,
    updated_at: now,
    atribut: atributList
  };

  if (existingIndex !== -1) {
    reRegistrations[existingIndex] = regRecord;
  } else {
    reRegistrations.push(regRecord);
  }

  db.set('reRegistrations', reRegistrations);

  logActivity(
    adminName,
    'INPUT_REGISTRASI_ADMIN',
    `Admin mengisi data registrasi ulang tahun ${year} atas nama ${member.nama} (${member.no_register})`
  );

  return res.json({
    success: true,
    message: `Data registrasi ulang atas nama ${member.nama} berhasil disimpan dengan penanda 'diinput admin'.`,
    data: regRecord
  });
};

