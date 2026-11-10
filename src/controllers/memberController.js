const bcrypt = require('bcryptjs');
const { query, execute } = require('../config/mysql');
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
exports.getMembers = async (req, res) => {
  try {
    const { search, angkatan, divisi, status_reg, domisili } = req.query;

    // Find active period (or latest year)
    const periods = await query(`
      SELECT id, tahun, status 
      FROM periode_registrasi 
      ORDER BY (status = 'buka') DESC, tahun DESC 
      LIMIT 1
    `);
    const activePeriod = periods.length > 0 ? periods[0] : { id: 1, tahun: 2026 };

    // Query members joined with division and registration for active period
    let sql = `
      SELECT 
        a.id,
        a.no_register,
        a.nama,
        a.angkatan,
        a.divisi_id,
        COALESCE(d.nama, '-') AS divisi,
        a.tempat_lahir,
        DATE_FORMAT(a.tanggal_lahir, '%Y-%m-%d') AS tanggal_lahir,
        a.golongan_darah,
        a.nama_ayah,
        a.nama_ibu,
        a.is_active,
        a.is_active AS status_aktif,
        a.profil_lengkap,
        a.created_at,
        a.updated_at,
        ru.id AS reg_id,
        ru.no_hp,
        ru.alamat_rumah,
        ru.kota_kabupaten AS domisili_kota,
        ru.provinsi AS domisili_provinsi,
        ru.email,
        ru.pekerjaan,
        ru.sumber_input,
        ru.submitted_at,
        CASE WHEN ru.id IS NOT NULL THEN 'Sudah Registrasi' ELSE 'Belum Registrasi' END AS reg_status
      FROM anggota a
      LEFT JOIN divisi d ON d.id = a.divisi_id
      LEFT JOIN registrasi_ulang ru ON ru.anggota_id = a.id AND ru.periode_id = ?
      WHERE 1=1
    `;
    const params = [activePeriod.id];

    // Filter Real-Time Search (Nama atau No. Register)
    if (search && search.trim() !== '') {
      const q = `%${search.trim()}%`;
      sql += ` AND (a.nama LIKE ? OR a.no_register LIKE ?)`;
      params.push(q, q);
    }

    // Filter Angkatan
    if (angkatan && angkatan.trim() !== '') {
      sql += ` AND a.angkatan = ?`;
      params.push(parseInt(angkatan, 10));
    }

    // Filter Divisi
    if (divisi && divisi.trim() !== '') {
      sql += ` AND (d.nama = ? OR d.slug = ? OR a.divisi_id = ?)`;
      const divNum = isNaN(divisi) ? -1 : parseInt(divisi, 10);
      params.push(divisi, divisi, divNum);
    }

    // Filter Status Registrasi Ulang
    if (status_reg && status_reg.trim() !== '') {
      if (status_reg === 'sudah') {
        sql += ` AND ru.id IS NOT NULL`;
      } else if (status_reg === 'belum') {
        sql += ` AND ru.id IS NULL`;
      }
    }

    // Filter Domisili (Kota atau Provinsi)
    if (domisili && domisili.trim() !== '') {
      const dom = `%${domisili.trim()}%`;
      sql += ` AND (ru.kota_kabupaten LIKE ? OR ru.provinsi LIKE ? OR ru.alamat_rumah LIKE ?)`;
      params.push(dom, dom, dom);
    }

    sql += ` ORDER BY a.angkatan DESC, a.no_register ASC`;

    const rows = await query(sql, params);

    // Ensure status_aktif is boolean for frontend compatibility
    const formatted = rows.map(r => ({
      ...r,
      status_aktif: Boolean(r.is_active)
    }));

    return res.json({
      success: true,
      total: formatted.length,
      data: formatted
    });
  } catch (error) {
    console.error('Error getMembers MySQL:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data anggota dari database: ' + error.message
    });
  }
};

// GET /api/admin/members/:no_register
exports.getMemberDetail = async (req, res) => {
  try {
    const { no_register } = req.params;
    const cleanKey = decodeURIComponent(no_register).trim();

    const members = await query(`
      SELECT 
        a.id, a.no_register, a.nama, a.angkatan, a.divisi_id,
        COALESCE(d.nama, '-') AS divisi,
        a.tempat_lahir,
        DATE_FORMAT(a.tanggal_lahir, '%Y-%m-%d') AS tanggal_lahir,
        a.golongan_darah, a.nama_ayah, a.nama_ibu,
        a.is_active, a.is_active AS status_aktif, a.profil_lengkap,
        a.created_at, a.updated_at
      FROM anggota a
      LEFT JOIN divisi d ON d.id = a.divisi_id
      WHERE LOWER(a.no_register) = LOWER(?)
      LIMIT 1
    `, [cleanKey]);

    if (members.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Data anggota dengan No. Register ${no_register} tidak ditemukan.`
      });
    }

    const member = members[0];
    member.status_aktif = Boolean(member.is_active);

    const periods = await query(`
      SELECT id, tahun, status 
      FROM periode_registrasi 
      ORDER BY (status = 'buka') DESC, tahun DESC 
      LIMIT 1
    `);
    const activePeriod = periods.length > 0 ? periods[0] : { id: 1, tahun: 2026 };

    // Registration in active period
    const currentRegs = await query(`
      SELECT ru.*, pr.tahun AS periode_tahun, u.username AS input_by
      FROM registrasi_ulang ru
      JOIN periode_registrasi pr ON pr.id = ru.periode_id
      LEFT JOIN users u ON u.id = ru.diinput_oleh
      WHERE ru.anggota_id = ? AND ru.periode_id = ?
      LIMIT 1
    `, [member.id, activePeriod.id]);

    // All registration history
    const regHistory = await query(`
      SELECT ru.*, pr.tahun AS periode_tahun
      FROM registrasi_ulang ru
      JOIN periode_registrasi pr ON pr.id = ru.periode_id
      WHERE ru.anggota_id = ?
      ORDER BY pr.tahun DESC
    `, [member.id]);

    // Linked user account
    const users = await query(`
      SELECT username, role, is_active AS status_aktif, must_change_password, last_login_at AS last_login
      FROM users
      WHERE anggota_id = ? OR LOWER(username) = LOWER(?)
      LIMIT 1
    `, [member.id, member.no_register]);

    const account = users.length > 0 ? {
      ...users[0],
      status_aktif: Boolean(users[0].status_aktif),
      must_change_password: Boolean(users[0].must_change_password)
    } : null;

    return res.json({
      success: true,
      data: {
        profile: member,
        currentRegistration: currentRegs.length > 0 ? currentRegs[0] : null,
        registrationHistory: regHistory,
        account
      }
    });
  } catch (error) {
    console.error('Error getMemberDetail MySQL:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil detail anggota: ' + error.message
    });
  }
};

// POST /api/admin/members
exports.createMember = async (req, res) => {
  try {
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

    // Check if already registered in MySQL
    const existing = await query(`
      SELECT id, no_register FROM anggota WHERE LOWER(no_register) = LOWER(?) LIMIT 1
    `, [normalizedNoReg]);

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `No. Register ${normalizedNoReg} sudah terdaftar di database.`
      });
    }

    // Check if user already exists
    const existingUser = await query(`
      SELECT id FROM users WHERE LOWER(username) = LOWER(?) LIMIT 1
    `, [normalizedNoReg]);

    if (existingUser.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Akun dengan username ${normalizedNoReg} sudah ada di database.`
      });
    }

    // Resolve divisi_id
    let divisiId = null;
    if (divisi) {
      const divRows = await query(`
        SELECT id FROM divisi WHERE LOWER(nama) = LOWER(?) OR LOWER(slug) = LOWER(?) OR id = ? LIMIT 1
      `, [divisi, divisi, isNaN(divisi) ? -1 : parseInt(divisi, 10)]);
      if (divRows.length > 0) {
        divisiId = divRows[0].id;
      }
    }

    // Sanitize values
    const safeGoldar = ['A', 'B', 'AB', 'O'].includes((golongan_darah || '').trim().toUpperCase())
      ? (golongan_darah || '').trim().toUpperCase()
      : null;
    const safeTanggalLahir = tanggal_lahir && tanggal_lahir.trim() !== '' ? tanggal_lahir.trim() : null;

    // 1. Insert into MySQL `anggota`
    const insertAnggotaResult = await execute(`
      INSERT INTO anggota (
        no_register, nama, divisi_id, angkatan, tempat_lahir,
        tanggal_lahir, golongan_darah, nama_ayah, nama_ibu,
        is_active, profil_lengkap
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0)
    `, [
      normalizedNoReg,
      nama.trim(),
      divisiId,
      parseInt(angkatan, 10),
      tempat_lahir ? tempat_lahir.trim() : '-',
      safeTanggalLahir,
      safeGoldar,
      nama_ayah ? nama_ayah.trim() : '-',
      nama_ibu ? nama_ibu.trim() : '-'
    ]);

    const newMemberId = insertAnggotaResult.insertId;

    // 2. Insert into MySQL `users` with default password 'mapala123'
    const defaultPassword = 'mapala123';
    const salt = bcrypt.genSaltSync(10);
    const defaultPasswordHash = bcrypt.hashSync(defaultPassword, salt);

    await execute(`
      INSERT INTO users (
        username, password_hash, role, anggota_id, is_active, must_change_password
      ) VALUES (?, ?, 'anggota', ?, 1, 1)
    `, [
      normalizedNoReg,
      defaultPasswordHash,
      newMemberId
    ]);

    // Log Activity
    const adminUser = req.user ? req.user.username : 'admin';
    await logActivity(
      adminUser,
      'TAMBAH_ANGGOTA',
      `Menambahkan anggota baru: ${nama.trim()} (${normalizedNoReg})`,
      { entitas: 'anggota', entitas_id: normalizedNoReg }
    );

    // Sync memory cache
    await db.syncFromMySQL().catch(e => console.warn('Sync memory notice:', e.message));

    const newMember = {
      id: newMemberId,
      no_register: normalizedNoReg,
      nama: nama.trim(),
      divisi: divisi,
      divisi_id: divisiId,
      angkatan: parseInt(angkatan, 10),
      tempat_lahir: tempat_lahir || '-',
      tanggal_lahir: safeTanggalLahir,
      golongan_darah: safeGoldar,
      nama_ayah: nama_ayah || '-',
      nama_ibu: nama_ibu || '-',
      status_aktif: true,
      is_active: 1
    };

    return res.status(201).json({
      success: true,
      message: 'Anggota berhasil ditambahkan dengan password awal sementara (mapala123).',
      data: newMember
    });
  } catch (error) {
    console.error('Error createMember MySQL:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal menambahkan anggota ke database: ' + error.message
    });
  }
};

// PUT /api/admin/members/:no_register
exports.updateMember = async (req, res) => {
  try {
    const { no_register } = req.params;
    const cleanKey = decodeURIComponent(no_register).trim();
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

    const existingMembers = await query(`
      SELECT * FROM anggota WHERE LOWER(no_register) = LOWER(?) LIMIT 1
    `, [cleanKey]);

    if (existingMembers.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Anggota dengan No. Register ${no_register} tidak ditemukan.`
      });
    }

    const current = existingMembers[0];

    // Resolve divisi_id
    let divisiId = current.divisi_id;
    if (divisi) {
      const divRows = await query(`
        SELECT id FROM divisi WHERE LOWER(nama) = LOWER(?) OR LOWER(slug) = LOWER(?) OR id = ? LIMIT 1
      `, [divisi, divisi, isNaN(divisi) ? -1 : parseInt(divisi, 10)]);
      if (divRows.length > 0) {
        divisiId = divRows[0].id;
      }
    }

    const safeGoldar = golongan_darah !== undefined
      ? (['A', 'B', 'AB', 'O'].includes((golongan_darah || '').trim().toUpperCase()) ? (golongan_darah || '').trim().toUpperCase() : null)
      : current.golongan_darah;

    const safeTanggalLahir = tanggal_lahir !== undefined
      ? (tanggal_lahir && tanggal_lahir.trim() !== '' ? tanggal_lahir.trim() : null)
      : current.tanggal_lahir;

    await execute(`
      UPDATE anggota SET
        nama = ?,
        divisi_id = ?,
        angkatan = ?,
        tempat_lahir = ?,
        tanggal_lahir = ?,
        golongan_darah = ?,
        nama_ayah = ?,
        nama_ibu = ?
      WHERE id = ?
    `, [
      nama ? nama.trim() : current.nama,
      divisiId,
      angkatan ? parseInt(angkatan, 10) : current.angkatan,
      tempat_lahir !== undefined ? tempat_lahir : current.tempat_lahir,
      safeTanggalLahir,
      safeGoldar,
      nama_ayah !== undefined ? nama_ayah : current.nama_ayah,
      nama_ibu !== undefined ? nama_ibu : current.nama_ibu,
      current.id
    ]);

    const adminUser = req.user ? req.user.username : 'admin';
    await logActivity(
      adminUser,
      'UPDATE_ANGGOTA',
      `Memperbarui biodata tetap anggota ${current.no_register}`,
      { entitas: 'anggota', entitas_id: current.no_register }
    );

    // Sync memory cache
    await db.syncFromMySQL().catch(e => console.warn('Sync memory notice:', e.message));

    return res.json({
      success: true,
      message: 'Data anggota berhasil diperbarui.',
      data: {
        id: current.id,
        no_register: current.no_register,
        nama: nama || current.nama,
        divisi: divisi,
        angkatan: angkatan || current.angkatan
      }
    });
  } catch (error) {
    console.error('Error updateMember MySQL:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memperbarui data anggota di database: ' + error.message
    });
  }
};

// PATCH /api/admin/members/:no_register/toggle-status
exports.toggleStatusMember = async (req, res) => {
  try {
    const { no_register } = req.params;
    const cleanKey = decodeURIComponent(no_register).trim();

    const members = await query(`
      SELECT id, no_register, is_active FROM anggota WHERE LOWER(no_register) = LOWER(?) LIMIT 1
    `, [cleanKey]);

    if (members.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Anggota tidak ditemukan.'
      });
    }

    const member = members[0];
    const newStatus = member.is_active ? 0 : 1;

    // Update anggota
    await execute(`
      UPDATE anggota SET is_active = ? WHERE id = ?
    `, [newStatus, member.id]);

    // Update users
    await execute(`
      UPDATE users SET is_active = ? WHERE anggota_id = ? OR LOWER(username) = LOWER(?)
    `, [newStatus, member.id, member.no_register]);

    const statusLabel = newStatus ? 'diaktifkan' : 'dinonaktifkan';
    const adminUser = req.user ? req.user.username : 'admin';
    await logActivity(
      adminUser,
      'TOGGLE_STATUS_ANGGOTA',
      `Mengubah status anggota ${member.no_register} menjadi ${statusLabel}`,
      { entitas: 'anggota', entitas_id: member.no_register }
    );

    // Sync memory cache
    await db.syncFromMySQL().catch(e => console.warn('Sync memory notice:', e.message));

    return res.json({
      success: true,
      message: `Status anggota berhasil ${statusLabel}.`,
      status_aktif: Boolean(newStatus)
    });
  } catch (error) {
    console.error('Error toggleStatusMember MySQL:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengubah status anggota: ' + error.message
    });
  }
};

// POST /api/admin/members/:no_register/reset-password
exports.resetPasswordMember = async (req, res) => {
  try {
    const { no_register } = req.params;
    const cleanKey = decodeURIComponent(no_register).trim();

    // Check if user exists directly or via anggota
    const users = await query(`
      SELECT u.id, u.username, u.anggota_id
      FROM users u
      LEFT JOIN anggota a ON a.id = u.anggota_id
      WHERE LOWER(u.username) = LOWER(?) OR LOWER(a.no_register) = LOWER(?)
      LIMIT 1
    `, [cleanKey, cleanKey]);

    const defaultPassword = 'mapala123';
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(defaultPassword, salt);

    let targetUsername = cleanKey;

    if (users.length === 0) {
      // Find member in anggota to create user if missing
      const members = await query(`
        SELECT id, no_register FROM anggota WHERE LOWER(no_register) = LOWER(?) LIMIT 1
      `, [cleanKey]);

      if (members.length === 0) {
        return res.status(404).json({
          success: false,
          message: `Akun atau data anggota untuk No. Register ${no_register} tidak ditemukan.`
        });
      }

      targetUsername = members[0].no_register;
      await execute(`
        INSERT INTO users (username, password_hash, role, anggota_id, is_active, must_change_password)
        VALUES (?, ?, 'anggota', ?, 1, 1)
      `, [targetUsername, passwordHash, members[0].id]);
    } else {
      const user = users[0];
      targetUsername = user.username;
      await execute(`
        UPDATE users 
        SET password_hash = ?, must_change_password = 1, failed_login_count = 0, locked_until = NULL 
        WHERE id = ?
      `, [passwordHash, user.id]);
    }

    const adminUser = req.user ? req.user.username : 'admin';
    await logActivity(
      adminUser,
      'RESET_PASSWORD',
      `Mereset password anggota ${targetUsername} ke password default sementara`,
      { entitas: 'users', entitas_id: targetUsername }
    );

    // Sync memory cache
    await db.syncFromMySQL().catch(e => console.warn('Sync memory notice:', e.message));

    return res.json({
      success: true,
      message: `Password akun ${targetUsername} berhasil direset ke password awal sementara ('${defaultPassword}'). Anggota wajib mengganti password pada login berikutnya.`,
      temporaryPassword: defaultPassword
    });
  } catch (error) {
    console.error('Error resetPasswordMember MySQL:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mereset password anggota: ' + error.message
    });
  }
};

// GET /api/admin/members/template
exports.downloadTemplate = (req, res) => {
  const buffer = generateTemplateWorkbook();
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="Template_Impor_Anggota_Mapala_UNAND.xlsx"');
  return res.send(buffer);
};

// POST /api/admin/members/import-preview
exports.previewImport = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'File Excel (.xlsx / .csv) belum diunggah.'
    });
  }

  try {
    const previewData = await previewExcelFile(req.file.path);
    return res.json({
      success: true,
      data: previewData
    });
  } catch (error) {
    console.error('Error parsing import file:', error);
    return res.status(400).json({
      success: false,
      message: 'Gagal memproses file. Pastikan format kolom sesuai dengan templat: ' + error.message
    });
  }
};

// POST /api/admin/members/import-commit
exports.commitImport = async (req, res) => {
  try {
    const { validRows } = req.body;

    if (!Array.isArray(validRows) || validRows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Tidak ada baris data valid yang siap disimpan.'
      });
    }

    // Hash default password
    const defaultPassword = 'mapala123';
    const salt = bcrypt.genSaltSync(10);
    const defaultPasswordHash = bcrypt.hashSync(defaultPassword, salt);

    // Fetch existing divisions map
    const divisions = await query('SELECT id, nama, slug FROM divisi');
    const divMap = new Map();
    divisions.forEach(d => {
      divMap.set(d.nama.toLowerCase(), d.id);
      divMap.set(d.slug.toLowerCase(), d.id);
    });

    let successCount = 0;

    for (const row of validRows) {
      const normalizedNoReg = row.no_reg;
      const safeGoldar = ['A', 'B', 'AB', 'O'].includes((row.golongan_darah || '').trim().toUpperCase())
        ? (row.golongan_darah || '').trim().toUpperCase()
        : null;
      const safeTanggal = row.tanggal_lahir && row.tanggal_lahir.trim() !== '' ? row.tanggal_lahir.trim() : null;
      const divId = divMap.get((row.divisi || '').toLowerCase()) || null;

      try {
        const insertRes = await execute(`
          INSERT INTO anggota (
            no_register, nama, divisi_id, angkatan, tempat_lahir,
            tanggal_lahir, golongan_darah, nama_ayah, nama_ibu, is_active, profil_lengkap
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0)
          ON DUPLICATE KEY UPDATE
            nama = VALUES(nama),
            divisi_id = VALUES(divisi_id),
            angkatan = VALUES(angkatan)
        `, [
          normalizedNoReg,
          row.nama,
          divId,
          parseInt(row.angkatan, 10),
          row.tempat_lahir || '-',
          safeTanggal,
          safeGoldar,
          row.nama_ayah || '-',
          row.nama_ibu || '-'
        ]);

        const anggotaId = insertRes.insertId || (await query('SELECT id FROM anggota WHERE no_register = ?', [normalizedNoReg]))[0]?.id;

        if (anggotaId) {
          await execute(`
            INSERT INTO users (username, password_hash, role, anggota_id, is_active, must_change_password)
            VALUES (?, ?, 'anggota', ?, 1, 1)
            ON DUPLICATE KEY UPDATE anggota_id = VALUES(anggota_id)
          `, [normalizedNoReg, defaultPasswordHash, anggotaId]);
        }

        successCount++;
      } catch (err) {
        console.warn(`Warning importing row ${normalizedNoReg}:`, err.message);
      }
    }

    const adminUser = req.user ? req.user.username : 'admin';
    await logActivity(
      adminUser,
      'IMPORT_ANGGOTA',
      `Berhasil mengimpor ${successCount} anggota baru secara massal dari Excel ke MySQL.`,
      { entitas: 'anggota', count: successCount }
    );

    // Sync memory cache
    await db.syncFromMySQL().catch(e => console.warn('Sync memory notice:', e.message));

    return res.json({
      success: true,
      message: `Berhasil mengimpor ${successCount} data anggota ke database.`,
      count: successCount
    });
  } catch (error) {
    console.error('Error commitImport MySQL:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal menyimpan data impor ke database: ' + error.message
    });
  }
};

// GET /api/admin/members/export
exports.exportMembers = async (req, res) => {
  try {
    const { angkatan, divisi, status_reg, domisili, format = 'xlsx' } = req.query;

    const periods = await query(`
      SELECT id, tahun, status 
      FROM periode_registrasi 
      ORDER BY (status = 'buka') DESC, tahun DESC 
      LIMIT 1
    `);
    const activePeriod = periods.length > 0 ? periods[0] : { id: 1, tahun: 2026 };

    let sql = `
      SELECT 
        a.id, a.no_register, a.nama, a.angkatan,
        COALESCE(d.nama, '-') AS divisi,
        a.tempat_lahir,
        DATE_FORMAT(a.tanggal_lahir, '%Y-%m-%d') AS tanggal_lahir,
        a.golongan_darah,
        a.is_active AS status_aktif,
        ru.no_hp,
        ru.email,
        ru.kota_kabupaten,
        ru.provinsi,
        ru.pekerjaan,
        ru.sumber_input,
        ru.submitted_at,
        CASE WHEN ru.id IS NOT NULL THEN 'Sudah Registrasi' ELSE 'Belum Registrasi' END AS reg_status
      FROM anggota a
      LEFT JOIN divisi d ON d.id = a.divisi_id
      LEFT JOIN registrasi_ulang ru ON ru.anggota_id = a.id AND ru.periode_id = ?
      WHERE 1=1
    `;
    const params = [activePeriod.id];

    if (angkatan) {
      sql += ` AND a.angkatan = ?`;
      params.push(parseInt(angkatan, 10));
    }
    if (divisi) {
      sql += ` AND (d.nama = ? OR d.slug = ? OR a.divisi_id = ?)`;
      params.push(divisi, divisi, isNaN(divisi) ? -1 : parseInt(divisi, 10));
    }
    if (status_reg) {
      if (status_reg === 'sudah') sql += ` AND ru.id IS NOT NULL`;
      if (status_reg === 'belum') sql += ` AND ru.id IS NULL`;
    }
    if (domisili) {
      const dom = `%${domisili.trim()}%`;
      sql += ` AND (ru.kota_kabupaten LIKE ? OR ru.provinsi LIKE ? OR ru.alamat_rumah LIKE ?)`;
      params.push(dom, dom, dom);
    }

    sql += ` ORDER BY a.angkatan DESC, a.no_register ASC`;

    const members = await query(sql, params);
    const exportFormat = (format || '').toLowerCase() === 'csv' ? 'csv' : 'xlsx';
    const buffer = exportMembersToExcel(members, activePeriod.tahun, exportFormat);

    if (exportFormat === 'csv') {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="Data_Anggota_Mapala_UNAND_${activePeriod.tahun}.csv"`);
    } else {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="Data_Anggota_Mapala_UNAND_${activePeriod.tahun}.xlsx"`);
    }
    return res.send(buffer);
  } catch (error) {
    console.error('Error exportMembers MySQL:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengekspor data anggota: ' + error.message
    });
  }
};

// GET /api/admin/members/:no_register/print-biodata (FR-38)
exports.printBiodata = async (req, res) => {
  try {
    const { no_register } = req.params;
    const cleanKey = decodeURIComponent(no_register).trim();

    const members = await query(`
      SELECT 
        a.id, a.no_register, a.nama, a.angkatan,
        COALESCE(d.nama, '-') AS divisi,
        a.tempat_lahir,
        DATE_FORMAT(a.tanggal_lahir, '%Y-%m-%d') AS tanggal_lahir,
        a.golongan_darah, a.nama_ayah, a.nama_ibu,
        a.is_active, a.profil_lengkap
      FROM anggota a
      LEFT JOIN divisi d ON d.id = a.divisi_id
      WHERE LOWER(a.no_register) = LOWER(?)
      LIMIT 1
    `, [cleanKey]);

    if (members.length === 0) {
      return res.status(404).send('Data Anggota Tidak Ditemukan');
    }

    const member = members[0];

    const periods = await query(`
      SELECT id, tahun, status FROM periode_registrasi 
      ORDER BY (status = 'buka') DESC, tahun DESC LIMIT 1
    `);
    const activePeriod = periods.length > 0 ? periods[0] : { id: 1, tahun: 2026 };

    const regDataRows = await query(`
      SELECT ru.*, pr.tahun AS periode_tahun
      FROM registrasi_ulang ru
      JOIN periode_registrasi pr ON pr.id = ru.periode_id
      WHERE ru.anggota_id = ? AND ru.periode_id = ?
      LIMIT 1
    `, [member.id, activePeriod.id]);

    const attributes = await query(`
      SELECT id, nama FROM jenis_atribut WHERE aktif = 1 ORDER BY urutan ASC
    `);

    const html = generatePrintableBiodataHTML(member, regDataRows[0] || null, attributes);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(html);
  } catch (error) {
    console.error('Error printBiodata MySQL:', error);
    return res.status(500).send('Terjadi kesalahan saat membuat formulir biodata');
  }
};
