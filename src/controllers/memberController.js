const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { logActivity } = require('../services/loggerService');
const {
  generateTemplateWorkbook,
  previewExcelFile,
  commitImportedMembers,
  exportMembersToExcel
} = require('../services/excelService');
const { generatePrintableBiodataHTML } = require('../services/pdfService');

// Helper: Validate and normalize No. Register format: MU XXX(3 digit angka) Xxx.(Huruf pertama besar, sisanya kecil diikuti titik)
function validateAndNormalizeNoRegister(input) {
  if (!input || typeof input !== 'string') {
    return { valid: false, error: 'No. Register tidak boleh kosong.' };
  }
  const trimmed = input.trim();
  const regex = /^MU[\s-]?(\d{3})[\s-]?([A-Za-z]{3})\.?$/i;
  const match = trimmed.match(regex);
  if (!match) {
    return {
      valid: false,
      error: "Format No. Register tidak valid. Wajib mengikuti format 'MU XXX(3 digit angka) Xxx.' (contoh: MU 325 Ltn.)."
    };
  }
  const code = match[2];
  const formattedCode = code[0].toUpperCase() + code.slice(1, 3).toLowerCase() + '.';
  return {
    valid: true,
    normalized: `MU ${match[1]} ${formattedCode}`
  };
}

// GET /api/admin/members
exports.getMembers = (req, res) => {
  const { search, angkatan, divisi, status_reg, domisili } = req.query;

  const members = db.get('members');
  const activePeriod = db.get('periodes').find(p => p.is_active) || { tahun: 2026 };
  const reRegistrations = db.get('reRegistrations');

  const regMap = new Map();
  reRegistrations
    .filter(r => r.periode_tahun === activePeriod.tahun)
    .forEach(r => regMap.set(r.no_register, r));

  let results = members.map(m => {
    const reg = regMap.get(m.no_register);
    return {
      ...m,
      reg_status: reg ? 'Sudah Registrasi' : 'Belum Registrasi',
      reg_data: reg || null,
      domisili_kota: reg ? reg.kota_kabupaten : null,
      domisili_provinsi: reg ? reg.provinsi : null,
      no_hp: reg ? reg.no_hp : null
    };
  });

  // Filters
  if (search) {
    const q = search.toLowerCase().trim();
    results = results.filter(
      m =>
        m.nama.toLowerCase().includes(q) ||
        m.no_register.toLowerCase().includes(q)
    );
  }

  if (angkatan) {
    results = results.filter(m => String(m.angkatan) === String(angkatan));
  }

  if (divisi) {
    results = results.filter(m => m.divisi === divisi);
  }

  if (status_reg) {
    if (status_reg === 'sudah') {
      results = results.filter(m => m.reg_status === 'Sudah Registrasi');
    } else if (status_reg === 'belum') {
      results = results.filter(m => m.reg_status === 'Belum Registrasi');
    }
  }

  if (domisili) {
    const dom = domisili.toLowerCase();
    results = results.filter(m =>
      (m.domisili_kota && m.domisili_kota.toLowerCase().includes(dom)) ||
      (m.domisili_provinsi && m.domisili_provinsi.toLowerCase().includes(dom))
    );
  }

  return res.json({
    success: true,
    total: results.length,
    data: results
  });
};

// GET /api/admin/members/:no_register
exports.getMemberDetail = (req, res) => {
  const { no_register } = req.params;
  const cleanKey = decodeURIComponent(no_register).replace(/[\s-]+/g, ' ').trim().toLowerCase();
  const members = db.get('members');
  const member = members.find(m => m.no_register.replace(/[\s-]+/g, ' ').trim().toLowerCase() === cleanKey);

  if (!member) {
    return res.status(404).json({
      success: false,
      message: `Data anggota dengan No. Register ${no_register} tidak ditemukan.`
    });
  }

  const activePeriod = db.get('periodes').find(p => p.is_active) || { tahun: 2026 };
  const reRegistrations = db.get('reRegistrations');
  const currentReg = reRegistrations.find(
    r => r.no_register.replace(/[\s-]+/g, ' ').trim().toLowerCase() === cleanKey && r.periode_tahun === activePeriod.tahun
  );
  const regHistory = reRegistrations.filter(r => r.no_register.replace(/[\s-]+/g, ' ').trim().toLowerCase() === cleanKey);

  const users = db.get('users');
  const user = users.find(u => u.username.replace(/[\s-]+/g, ' ').trim().toLowerCase() === cleanKey);

  return res.json({
    success: true,
    data: {
      profile: member,
      currentRegistration: currentReg || null,
      registrationHistory: regHistory,
      account: user ? {
        username: user.username,
        role: user.role,
        status_aktif: user.status_aktif,
        must_change_password: user.must_change_password,
        last_login: user.last_login
      } : null
    }
  });
};

// POST /api/admin/members
exports.createMember = (req, res) => {
  const {
    no_register,
    nama,
    divisi,
    angkatan,
    tempat_lahir,
    tanggal_lahir,
    golongan_darah,
    nama_ayah,
    nama_ibu
  } = req.body;

  if (!no_register || !nama || !divisi || !angkatan) {
    return res.status(400).json({
      success: false,
      message: 'No. Register, Nama Lengkap, Divisi, dan Angkatan wajib diisi.'
    });
  }

  // Validate No. Register format: MU XXX(digit angka) XXX(3 huruf)
  const regValidation = validateAndNormalizeNoRegister(no_register);
  if (!regValidation.valid) {
    return res.status(400).json({
      success: false,
      message: regValidation.error
    });
  }
  const normalizedNoReg = regValidation.normalized;

  const members = db.get('members');
  const exists = members.find(m => m.no_register.toLowerCase() === normalizedNoReg.toLowerCase());
  if (exists) {
    return res.status(400).json({
      success: false,
      message: `No. Register ${normalizedNoReg} sudah terdaftar.`
    });
  }

  const salt = bcrypt.genSaltSync(10);
  const defaultPasswordHash = bcrypt.hashSync('mapala123', salt);

  const newMember = {
    id: `MBR-${Date.now()}`,
    no_register: normalizedNoReg,
    nama: nama.trim(),
    divisi,
    angkatan: parseInt(angkatan, 10),
    tempat_lahir: tempat_lahir || '-',
    tanggal_lahir: tanggal_lahir || '',
    golongan_darah: golongan_darah || '-',
    nama_ayah: nama_ayah || '-',
    nama_ibu: nama_ibu || '-',
    status_aktif: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const users = db.get('users');
  users.push({
    id: `USR-${Date.now()}`,
    username: newMember.no_register,
    nama: newMember.nama,
    password_hash: defaultPasswordHash,
    role: 'anggota',
    status_aktif: true,
    must_change_password: true,
    last_login: null
  });

  members.push(newMember);
  db.set('members', members);
  db.set('users', users);

  logActivity(req.user.username, 'TAMBAH_ANGGOTA', `Menambahkan anggota baru: ${newMember.nama} (${newMember.no_register})`);

  return res.status(201).json({
    success: true,
    message: 'Anggota berhasil ditambahkan dengan password awal sementara.',
    data: newMember
  });
};

// PUT /api/admin/members/:no_register
exports.updateMember = (req, res) => {
  const { no_register } = req.params;
  const cleanKey = decodeURIComponent(no_register).replace(/[\s-]+/g, ' ').trim().toLowerCase();
  const {
    nama,
    divisi,
    angkatan,
    tempat_lahir,
    tanggal_lahir,
    golongan_darah,
    nama_ayah,
    nama_ibu
  } = req.body;

  const members = db.get('members');
  const index = members.findIndex(m => m.no_register.replace(/[\s-]+/g, ' ').trim().toLowerCase() === cleanKey);

  if (index === -1) {
    return res.status(404).json({
      success: false,
      message: `Anggota ${no_register} tidak ditemukan.`
    });
  }

  members[index] = {
    ...members[index],
    nama: nama || members[index].nama,
    divisi: divisi || members[index].divisi,
    angkatan: angkatan ? parseInt(angkatan, 10) : members[index].angkatan,
    tempat_lahir: tempat_lahir || members[index].tempat_lahir,
    tanggal_lahir: tanggal_lahir || members[index].tanggal_lahir,
    golongan_darah: golongan_darah || members[index].golongan_darah,
    nama_ayah: nama_ayah || members[index].nama_ayah,
    nama_ibu: nama_ibu || members[index].nama_ibu,
    updated_at: new Date().toISOString()
  };

  db.set('members', members);

  logActivity(req.user.username, 'UPDATE_ANGGOTA', `Memperbarui biodata tetap anggota ${members[index].no_register}`);

  return res.json({
    success: true,
    message: 'Data anggota berhasil diperbarui.',
    data: members[index]
  });
};

// PATCH /api/admin/members/:no_register/toggle-status
exports.toggleStatusMember = (req, res) => {
  const { no_register } = req.params;
  const cleanKey = decodeURIComponent(no_register).replace(/[\s-]+/g, ' ').trim().toLowerCase();
  const members = db.get('members');
  const users = db.get('users');

  const member = members.find(m => m.no_register.replace(/[\s-]+/g, ' ').trim().toLowerCase() === cleanKey);
  if (!member) {
    return res.status(404).json({ success: false, message: 'Anggota tidak ditemukan.' });
  }

  member.status_aktif = !member.status_aktif;
  member.updated_at = new Date().toISOString();

  const user = users.find(u => u.username.replace(/[\s-]+/g, ' ').trim().toLowerCase() === cleanKey);
  if (user) {
    user.status_aktif = member.status_aktif;
  }

  db.set('members', members);
  db.set('users', users);

  const statusLabel = member.status_aktif ? 'diaktifkan' : 'dinonaktifkan';
  logActivity(req.user.username, 'TOGGLE_STATUS_ANGGOTA', `Mengubah status anggota ${member.no_register} menjadi ${statusLabel}`);

  return res.json({
    success: true,
    message: `Status anggota berhasil ${statusLabel}.`,
    status_aktif: member.status_aktif
  });
};

// POST /api/admin/members/:no_register/reset-password
exports.resetPasswordMember = (req, res) => {
  const { no_register } = req.params;
  const cleanKey = decodeURIComponent(no_register).replace(/[\s-]+/g, ' ').trim().toLowerCase();
  const users = db.get('users');
  const user = users.find(u => u.username.replace(/[\s-]+/g, ' ').trim().toLowerCase() === cleanKey);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: `Akun untuk No. Register ${no_register} tidak ditemukan.`
    });
  }

  const defaultPassword = 'mapala123';
  const salt = bcrypt.genSaltSync(10);
  user.password_hash = bcrypt.hashSync(defaultPassword, salt);
  user.must_change_password = true;

  db.set('users', users);

  logActivity(req.user.username, 'RESET_PASSWORD', `Mereset password anggota ${user.username} ke password default sementara`);

  return res.json({
    success: true,
    message: `Password akun ${user.username} berhasil direset ke password awal sementara ('${defaultPassword}'). Anggota wajib mengganti password pada login berikutnya.`,
    temporaryPassword: defaultPassword
  });
};

// GET /api/admin/members/template
exports.downloadTemplate = (req, res) => {
  const buffer = generateTemplateWorkbook();
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="Template_Impor_Anggota_Mapala_UNAND.xlsx"');
  return res.send(buffer);
};

// POST /api/admin/members/import-preview
exports.previewImport = (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'File Excel (.xlsx / .csv) belum diunggah.'
    });
  }

  try {
    const previewData = previewExcelFile(req.file.path);
    return res.json({
      success: true,
      data: previewData
    });
  } catch (error) {
    console.error('Error parsing import file:', error);
    return res.status(400).json({
      success: false,
      message: 'Gagal memproses file. Pastikan format kolom sesuai dengan templat.'
    });
  }
};

// POST /api/admin/members/import-commit
exports.commitImport = (req, res) => {
  const { validRows } = req.body;

  if (!Array.isArray(validRows) || validRows.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Tidak ada baris data valid yang siap disimpan.'
    });
  }

  const imported = commitImportedMembers(validRows);

  logActivity(
    req.user.username,
    'IMPORT_ANGGOTA',
    `Berhasil mengimpor ${imported.length} anggota baru secara massal dari Excel.`
  );

  return res.json({
    success: true,
    message: `Berhasil mengimpor ${imported.length} data anggota.`,
    count: imported.length
  });
};

// GET /api/admin/members/export
exports.exportMembers = (req, res) => {
  const { angkatan, divisi, status_reg, domisili, format = 'xlsx' } = req.query;
  const activePeriod = db.get('periodes').find(p => p.is_active) || { tahun: 2026 };

  // Reuse search/filter logic
  const members = db.get('members');
  const reRegistrations = db.get('reRegistrations');
  const regMap = new Map();
  reRegistrations
    .filter(r => r.periode_tahun === activePeriod.tahun)
    .forEach(r => regMap.set(r.no_register, r));

  let results = members.map(m => {
    const reg = regMap.get(m.no_register);
    return {
      ...m,
      reg_status: reg ? 'Sudah Registrasi' : 'Belum Registrasi',
      domisili_kota: reg ? reg.kota_kabupaten : null,
      domisili_provinsi: reg ? reg.provinsi : null
    };
  });

  if (angkatan) results = results.filter(m => String(m.angkatan) === String(angkatan));
  if (divisi) results = results.filter(m => m.divisi === divisi);
  if (status_reg) {
    if (status_reg === 'sudah') results = results.filter(m => m.reg_status === 'Sudah Registrasi');
    if (status_reg === 'belum') results = results.filter(m => m.reg_status === 'Belum Registrasi');
  }
  if (domisili) {
    const dom = domisili.toLowerCase();
    results = results.filter(m =>
      (m.domisili_kota && m.domisili_kota.toLowerCase().includes(dom)) ||
      (m.domisili_provinsi && m.domisili_provinsi.toLowerCase().includes(dom))
    );
  }

  const buffer = exportMembersToExcel(results, activePeriod.tahun);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="Data_Anggota_Mapala_UNAND_${activePeriod.tahun}.xlsx"`);
  return res.send(buffer);
};

// GET /api/admin/members/:no_register/print-biodata (FR-38)
exports.printBiodata = (req, res) => {
  const { no_register } = req.params;
  const cleanKey = decodeURIComponent(no_register).replace(/[\s-]+/g, ' ').trim().toLowerCase();
  const members = db.get('members');
  const member = members.find(m => m.no_register.replace(/[\s-]+/g, ' ').trim().toLowerCase() === cleanKey);

  if (!member) {
    return res.status(404).send('Data Anggota Tidak Ditemukan');
  }

  const activePeriod = db.get('periodes').find(p => p.is_active) || { tahun: 2026 };
  const reRegistrations = db.get('reRegistrations');
  const regData = reRegistrations.find(
    r => r.no_register.replace(/[\s-]+/g, ' ').trim().toLowerCase() === cleanKey && r.periode_tahun === activePeriod.tahun
  );
  const attributes = db.get('atributs');

  const html = generatePrintableBiodataHTML(member, regData, attributes);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.send(html);
};

