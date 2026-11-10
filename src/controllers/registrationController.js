const { query, execute } = require('../config/mysql');
const db = require('../config/db');
const { logActivity } = require('../services/loggerService');

// GET /api/admin/registrations/monitoring
exports.getMonitoringList = async (req, res) => {
  try {
    const { periode_tahun, status, sumber_input, search } = req.query;

    // Tentukan target periode
    let targetPeriod = null;
    if (periode_tahun && periode_tahun.trim() !== '') {
      const pRows = await query('SELECT id, tahun, status, nama FROM periode_registrasi WHERE tahun = ?', [parseInt(periode_tahun, 10)]);
      if (pRows.length > 0) targetPeriod = pRows[0];
    }
    if (!targetPeriod) {
      const pRows = await query("SELECT id, tahun, status, nama FROM periode_registrasi ORDER BY (status = 'buka') DESC, tahun DESC LIMIT 1");
      targetPeriod = pRows.length > 0 ? pRows[0] : { id: 1, tahun: 2026, status: 'buka', nama: 'Periode 2026' };
    }

    // Query daftar anggota dengan status registrasi ulang pada target periode
    let sql = `
      SELECT 
        a.id AS anggota_id,
        a.no_register,
        a.nama,
        a.angkatan,
        COALESCE(d.nama, '-') AS divisi,
        ru.id AS reg_id,
        ru.no_hp,
        ru.email,
        ru.kota_kabupaten,
        ru.provinsi,
        ru.alamat_rumah,
        ru.pekerjaan,
        ru.sumber_input,
        COALESCE(u_admin.username, 'admin') AS input_by,
        ru.submitted_at,
        ru.updated_at,
        CASE WHEN ru.id IS NOT NULL THEN 'Sudah Registrasi' ELSE 'Belum Registrasi' END AS status_registrasi,
        CASE WHEN ru.id IS NOT NULL THEN CONCAT(COALESCE(ru.kota_kabupaten, '-'), ', ', COALESCE(ru.provinsi, '-')) ELSE NULL END AS domisili,
        COALESCE(ru.updated_at, ru.submitted_at) AS waktu_terakhir
      FROM anggota a
      LEFT JOIN divisi d ON d.id = a.divisi_id
      LEFT JOIN registrasi_ulang ru ON ru.anggota_id = a.id AND ru.periode_id = ?
      LEFT JOIN users u_admin ON u_admin.id = ru.diinput_oleh
      WHERE a.is_active = 1
    `;
    const params = [targetPeriod.id];

    if (search && search.trim() !== '') {
      const q = `%${search.trim()}%`;
      sql += ` AND (a.nama LIKE ? OR a.no_register LIKE ?)`;
      params.push(q, q);
    }

    if (status && status.trim() !== '') {
      if (status === 'sudah') sql += ` AND ru.id IS NOT NULL`;
      if (status === 'belum') sql += ` AND ru.id IS NULL`;
    }

    if (sumber_input && sumber_input.trim() !== '') {
      sql += ` AND ru.sumber_input = ?`;
      params.push(sumber_input.trim());
    }

    sql += ` ORDER BY (ru.id IS NOT NULL) DESC, a.angkatan DESC, a.no_register ASC`;

    const rows = await query(sql, params);

    // Hitung statistik kepatuhan untuk periode aktif across seluruh anggota aktif
    const statsRow = await query(`
      SELECT 
        COUNT(DISTINCT a.id) AS total_anggota,
        COUNT(DISTINCT ru.anggota_id) AS sudah_count
      FROM anggota a
      LEFT JOIN registrasi_ulang ru ON ru.anggota_id = a.id AND ru.periode_id = ?
      WHERE a.is_active = 1
    `, [targetPeriod.id]);

    const totalAnggota = statsRow[0]?.total_anggota || 0;
    const sudahCount = statsRow[0]?.sudah_count || 0;
    const belumCount = Math.max(0, totalAnggota - sudahCount);
    const persentaseKepatuhan = totalAnggota > 0 ? Math.round((sudahCount / totalAnggota) * 100) : 0;

    return res.json({
      success: true,
      periode_tahun: targetPeriod.tahun,
      periode_status: targetPeriod.status,
      total: rows.length,
      sudahCount,
      belumCount,
      persentaseKepatuhan,
      data: rows
    });
  } catch (error) {
    console.error('Error getMonitoringList MySQL:', error);
    return res.status(500).json({ success: false, message: 'Gagal memuat monitoring registrasi: ' + error.message });
  }
};

// POST /api/admin/registrations/override (FR-32: Admin input on behalf of member)
exports.adminInputReRegistration = async (req, res) => {
  try {
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

    // 1. Temukan anggota di MySQL
    const cleanNoReg = no_register.trim();
    const members = await query('SELECT id, nama, no_register FROM anggota WHERE LOWER(no_register) = LOWER(?) LIMIT 1', [cleanNoReg]);
    if (members.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Data anggota dengan No. Register ${no_register} tidak ditemukan di database.`
      });
    }
    const member = members[0];

    // 2. Tentukan periode registrasi
    let period = null;
    if (periode_tahun) {
      const pRows = await query('SELECT id, tahun FROM periode_registrasi WHERE tahun = ?', [parseInt(periode_tahun, 10)]);
      if (pRows.length > 0) period = pRows[0];
    }
    if (!period) {
      const pRows = await query("SELECT id, tahun FROM periode_registrasi ORDER BY (status = 'buka') DESC, tahun DESC LIMIT 1");
      period = pRows.length > 0 ? pRows[0] : { id: 1, tahun: 2026 };
    }

    // 3. ID Admin yang menginput
    let adminUserId = null;
    const adminUsername = req.user ? req.user.username : 'admin';
    const adminUsers = await query('SELECT id FROM users WHERE username = ? LIMIT 1', [adminUsername]);
    if (adminUsers.length > 0) adminUserId = adminUsers[0].id;

    // 4. File uploads
    let photoUrl = null;
    let fileMap = {};
    if (req.files && Array.isArray(req.files)) {
      req.files.forEach(f => { fileMap[f.fieldname] = f; });
      if (fileMap['foto_terbaru']) {
        photoUrl = `/uploads/${fileMap['foto_terbaru'].filename}`;
      }
    } else if (req.file) {
      photoUrl = `/uploads/${req.file.filename}`;
    }

    // 5. Periksa apakah sudah ada data registrasi periode ini
    const existingReg = await query('SELECT id, foto_path FROM registrasi_ulang WHERE anggota_id = ? AND periode_id = ? LIMIT 1', [member.id, period.id]);

    let regId = null;
    const finalPhoto = photoUrl || (existingReg.length > 0 ? existingReg[0].foto_path : null);

    if (existingReg.length > 0) {
      regId = existingReg[0].id;
      await execute(`
        UPDATE registrasi_ulang SET
          foto_path = ?,
          alamat_rumah = ?,
          kota_kabupaten = ?,
          provinsi = ?,
          pekerjaan = ?,
          no_hp = ?,
          email = ?,
          alamat_orang_tua = ?,
          sumber_input = 'admin',
          diinput_oleh = ?,
          updated_at = NOW()
        WHERE id = ?
      `, [
        finalPhoto,
        alamat_rumah.trim(),
        kota_kabupaten.trim(),
        provinsi.trim(),
        pekerjaan ? pekerjaan.trim() : '-',
        no_hp.trim(),
        email ? email.trim() : '-',
        alamat_ortu ? alamat_ortu.trim() : '-',
        adminUserId,
        regId
      ]);
    } else {
      const insertRes = await execute(`
        INSERT INTO registrasi_ulang (
          anggota_id, periode_id, foto_path, alamat_rumah, kota_kabupaten,
          provinsi, pekerjaan, no_hp, email, alamat_orang_tua,
          sumber_input, diinput_oleh, submitted_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'admin', ?, NOW(), NOW())
      `, [
        member.id,
        period.id,
        finalPhoto,
        alamat_rumah.trim(),
        kota_kabupaten.trim(),
        provinsi.trim(),
        pekerjaan ? pekerjaan.trim() : '-',
        no_hp.trim(),
        email ? email.trim() : '-',
        alamat_ortu ? alamat_ortu.trim() : '-',
        adminUserId
      ]);
      regId = insertRes.insertId;
    }

    // 6. Simpan media sosial
    if (media_sosial && media_sosial.trim() !== '' && regId) {
      try {
        await execute(`
          INSERT INTO registrasi_media_sosial (registrasi_id, platform, akun)
          VALUES (?, 'Instagram', ?)
          ON DUPLICATE KEY UPDATE akun = VALUES(akun)
        `, [regId, media_sosial.trim()]);
      } catch (errMedsos) {
        console.warn('Warning inserting registrasi_media_sosial:', errMedsos.message);
      }
    }

    // 7. Simpan atribut fisik
    let atributList = [];
    try {
      atributList = Array.isArray(atribut)
        ? atribut
        : (typeof atribut === 'string' ? JSON.parse(atribut) : []);
    } catch (_) {
      atributList = [];
    }

    if (atributList.length > 0 && regId) {
      for (const a of atributList) {
        const fieldName = `attrFile_${a.atribut_id}`;
        const attrPhoto = fileMap[fieldName] ? `/uploads/${fileMap[fieldName].filename}` : (a.foto || null);
        const jenisId = a.atribut_id || a.id;
        if (jenisId) {
          try {
            await execute(`
              INSERT INTO registrasi_atribut (registrasi_id, jenis_atribut_id, memiliki, foto_path)
              VALUES (?, ?, 1, ?)
              ON DUPLICATE KEY UPDATE memiliki = 1, foto_path = COALESCE(VALUES(foto_path), foto_path)
            `, [regId, jenisId, attrPhoto]);
          } catch (errAttr) {
            console.warn('Warning inserting registrasi_atribut:', errAttr.message);
          }
        }
      }
    }

    // 8. Tandai profil_lengkap pada anggota
    await execute('UPDATE anggota SET profil_lengkap = 1 WHERE id = ?', [member.id]);

    // 9. Catat Log Aktivitas Audit
    await logActivity(
      adminUsername,
      'INPUT_REGISTRASI_ADMIN',
      `Admin mengisi data registrasi ulang tahun ${period.tahun} atas nama ${member.nama} (${member.no_register}) [Override]`,
      { entitas: 'registrasi_ulang', entitas_id: String(regId) }
    );

    await db.syncFromMySQL().catch(e => console.warn('Sync memory notice:', e.message));

    return res.json({
      success: true,
      message: `Data registrasi ulang atas nama ${member.nama} (${member.no_register}) berhasil disimpan dengan penanda 'diinput admin'.`,
      data: {
        id: regId,
        no_register: member.no_register,
        nama: member.nama,
        periode_tahun: period.tahun,
        sumber_input: 'admin',
        input_by: adminUsername,
        alamat_rumah,
        kota_kabupaten,
        provinsi,
        no_hp
      }
    });
  } catch (error) {
    console.error('Error adminInputReRegistration MySQL:', error);
    return res.status(500).json({ success: false, message: 'Gagal menyimpan override registrasi: ' + error.message });
  }
};
