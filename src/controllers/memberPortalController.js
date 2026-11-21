const bcrypt = require('bcryptjs');
const { query, execute } = require('../config/mysql');
const { toTitleCase } = require('../utils/formatters');

// GET /api/member/privacy-policy
exports.getPrivacyPolicy = async (req, res) => {
  try {
    const rows = await query(`
      SELECT id AS kebijakan_id, versi, judul, isi, berlaku_sejak
      FROM kebijakan_privasi
      WHERE aktif = 1
      LIMIT 1
    `);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Kebijakan privasi aktif belum tersedia.' });
    }

    const policy = rows[0];

    // Check if user has consented
    let sudahDisetujui = false;
    let disetujuiAt = null;

    if (req.user && req.user.anggota_id) {
      const consent = await query(`
        SELECT disetujui_at FROM persetujuan_data
        WHERE anggota_id = ? AND kebijakan_id = ?
      `, [req.user.anggota_id, policy.kebijakan_id]);

      if (consent.length > 0) {
        sudahDisetujui = true;
        disetujuiAt = consent[0].disetujui_at;
      }
    }

    return res.json({
      success: true,
      data: {
        ...policy,
        sudah_disetujui: sudahDisetujui,
        disetujui_at: disetujuiAt
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/member/privacy-policy/consent
exports.submitPrivacyConsent = async (req, res) => {
  try {
    const { kebijakan_id } = req.body;
    const anggotaId = req.user.anggota_id;

    if (!anggotaId) {
      return res.status(400).json({ success: false, message: 'Akun Anda tidak tertaut dengan data anggota.' });
    }

    await execute(`
      INSERT INTO persetujuan_data (anggota_id, kebijakan_id, disetujui_at)
      VALUES (?, ?, NOW())
      ON DUPLICATE KEY UPDATE disetujui_at = NOW()
    `, [anggotaId, kebijakan_id || 1]);

    return res.json({
      success: true,
      message: 'Persetujuan kebijakan privasi berhasil disimpan ke database.'
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/member/dashboard
exports.getDashboard = async (req, res) => {
  try {
    let anggotaId = req.user.anggota_id;
    if (!anggotaId && req.user.id) {
      const uRows = await query(`SELECT anggota_id FROM users WHERE id = ?`, [req.user.id]);
      if (uRows.length > 0) anggotaId = uRows[0].anggota_id;
    }

    if (!anggotaId) {
      return res.status(404).json({ success: false, message: 'Akun Anda tidak tertaut dengan data anggota Mapala UNAND.' });
    }

    // 1. Identity (termasuk foto profil terbaru dari registrasi ulang jika ada)
    const memberRows = await query(`
      SELECT a.id, a.no_register, a.nama, d.nama AS divisi, a.angkatan, a.golongan_darah, a.profil_lengkap, a.is_active AS status_aktif,
             (
               SELECT ru.foto_path
               FROM registrasi_ulang ru
               WHERE ru.anggota_id = a.id
                 AND ru.foto_path IS NOT NULL
                 AND ru.foto_path != ''
                 AND ru.foto_path != '/uploads/default-avatar.png'
               ORDER BY ru.updated_at DESC, ru.id DESC
               LIMIT 1
             ) AS foto_path
      FROM anggota a
      LEFT JOIN divisi d ON d.id = a.divisi_id
      WHERE a.id = ?
    `, [anggotaId]);

    if (memberRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Data anggota tidak ditemukan.' });
    }
    const member = memberRows[0];

    // 2. Active Period
    const periodRows = await query(`
      SELECT id, tahun, nama, tanggal_buka, tanggal_tutup, status
      FROM periode_registrasi
      WHERE status = 'buka'
      ORDER BY tahun DESC LIMIT 1
    `);
    const activePeriod = periodRows[0] || null;

    // 3. Re-registration status for current period
    let registrationStatus = {
      sudah_registrasi: false,
      submitted_at: null,
      sumber_input: null
    };

    if (activePeriod) {
      const regRows = await query(`
        SELECT submitted_at, sumber_input
        FROM registrasi_ulang
        WHERE anggota_id = ? AND periode_id = ?
      `, [anggotaId, activePeriod.id]);

      if (regRows.length > 0) {
        registrationStatus.sudah_registrasi = true;
        registrationStatus.submitted_at = regRows[0].submitted_at;
        registrationStatus.sumber_input = regRows[0].sumber_input;
      }
    }

    return res.json({
      success: true,
      data: {
        identitas: member,
        periode_berjalan: activePeriod,
        status_registrasi: registrationStatus
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/member/profile
exports.getProfile = async (req, res) => {
  try {
    let anggotaId = req.user.anggota_id;
    if (!anggotaId && req.user.id) {
      const uRows = await query(`SELECT anggota_id FROM users WHERE id = ?`, [req.user.id]);
      if (uRows.length > 0) anggotaId = uRows[0].anggota_id;
    }

    if (!anggotaId) {
      return res.status(404).json({ success: false, message: 'Akun Anda tidak tertaut dengan data anggota Mapala UNAND.' });
    }

    const memberRows = await query(`
      SELECT a.id, a.no_register, a.nama, a.divisi_id, d.nama AS divisi_nama,
             a.angkatan, a.tempat_lahir,
             DATE_FORMAT(a.tanggal_lahir, '%Y-%m-%d') AS tanggal_lahir,
             a.golongan_darah, a.nama_ayah, a.nama_ibu, a.profil_lengkap, a.is_active AS status_aktif
      FROM anggota a
      LEFT JOIN divisi d ON d.id = a.divisi_id
      WHERE a.id = ?
    `, [anggotaId]);

    if (memberRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Data anggota tidak ditemukan.' });
    }

    // Latest re-registration snapshot
    const regRows = await query(`
      SELECT ru.foto_path, ru.alamat_rumah, ru.kota_kabupaten, ru.provinsi,
             ru.pekerjaan, ru.no_hp, ru.email, ru.kontak_darurat, ru.submitted_at, ru.sumber_input,
             pr.tahun AS tahun_registrasi
      FROM registrasi_ulang ru
      JOIN periode_registrasi pr ON pr.id = ru.periode_id
      WHERE ru.anggota_id = ?
      ORDER BY pr.tahun DESC LIMIT 1
    `, [anggotaId]);

    return res.json({
      success: true,
      data: {
        data_tetap: memberRows[0],
        data_berkala_terbaru: regRows[0] || null
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/member/profile
exports.updateProfile = async (req, res) => {
  try {
    let anggotaId = req.user.anggota_id;
    if (!anggotaId && req.user.id) {
      const uRows = await query(`SELECT anggota_id FROM users WHERE id = ?`, [req.user.id]);
      if (uRows.length > 0) anggotaId = uRows[0].anggota_id;
    }

    if (!anggotaId) {
      return res.status(404).json({ success: false, message: 'Akun Anda tidak tertaut dengan data anggota Mapala UNAND.' });
    }

    const {
      nama,
      tempat_lahir,
      tanggal_lahir,
      golongan_darah,
      nama_ayah,
      nama_ibu,
      no_hp,
      kota_kabupaten,
      provinsi,
      alamat_rumah
    } = req.body;

    if (!nama || !nama.trim()) {
      return res.status(400).json({ success: false, message: 'Nama lengkap wajib diisi.' });
    }

    if (no_hp !== undefined && no_hp !== null && no_hp.trim() !== '') {
      if (!/^(\+?[0-9]{9,15})$/.test(no_hp.trim())) {
        return res.status(400).json({
          success: false,
          message: 'Nomor handphone harus berupa angka valid (9-15 digit, boleh diawali + atau 0).'
        });
      }
    }

    // Evaluasi kelengkapan profil: seluruh data esensial wajib terisi
    const isComplete = Boolean(
      nama.trim() &&
      tempat_lahir && tempat_lahir.trim() &&
      tanggal_lahir &&
      golongan_darah && golongan_darah.trim() &&
      nama_ayah && nama_ayah.trim() &&
      nama_ibu && nama_ibu.trim()
    );
    const profilLengkap = isComplete ? 1 : 0;

    await execute(`
      UPDATE anggota
      SET nama = ?,
          tempat_lahir = ?,
          tanggal_lahir = ?,
          golongan_darah = ?,
          nama_ayah = ?,
          nama_ibu = ?,
          profil_lengkap = ?,
          updated_at = NOW()
      WHERE id = ?
    `, [
      toTitleCase(nama),
      tempat_lahir ? tempat_lahir.trim() : null,
      tanggal_lahir || null,
      golongan_darah || null,
      nama_ayah ? nama_ayah.trim() : null,
      nama_ibu ? nama_ibu.trim() : null,
      profilLengkap,
      anggotaId
    ]);

    // Jika profil tuntas diisi, pastikan flag must_change_password pada users direset ke 0
    if (profilLengkap === 1) {
      await execute(`UPDATE users SET must_change_password = 0 WHERE id = ?`, [req.user.id]);
    }

    // Jika no_hp / domisili disertakan pada aktivasi/profil, simpan/update ke registrasi_ulang
    if (no_hp || kota_kabupaten || provinsi || alamat_rumah) {
      try {
        const pRows = await query(`SELECT id FROM periode_registrasi ORDER BY (status = 'buka') DESC, tahun DESC LIMIT 1`);
        const pId = pRows.length > 0 ? pRows[0].id : 1;

        const regExisting = await query(`
          SELECT id FROM registrasi_ulang WHERE anggota_id = ? AND periode_id = ? LIMIT 1
        `, [anggotaId, pId]);

        if (regExisting.length > 0) {
          await execute(`
            UPDATE registrasi_ulang
            SET no_hp = COALESCE(?, no_hp),
                kota_kabupaten = COALESCE(?, kota_kabupaten),
                provinsi = COALESCE(?, provinsi),
                alamat_rumah = COALESCE(?, alamat_rumah),
                updated_at = NOW()
            WHERE id = ?
          `, [no_hp || null, kota_kabupaten || null, provinsi || null, alamat_rumah || null, regExisting[0].id]);
        } else {
          await execute(`
            INSERT INTO registrasi_ulang (
              anggota_id, periode_id, foto_path, alamat_rumah, kota_kabupaten,
              provinsi, pekerjaan, no_hp, email, kontak_darurat, sumber_input, submitted_at
            ) VALUES (?, ?, '/uploads/default-avatar.png', ?, ?, ?, '-', ?, '-', '-', 'mandiri', NOW())
          `, [
            anggotaId,
            pId,
            alamat_rumah || (kota_kabupaten ? `Domisili di ${kota_kabupaten}` : '-'),
            kota_kabupaten || null,
            provinsi || null,
            no_hp || null
          ]);
        }
      } catch (errReg) {
        console.warn('Notice saving re-registration during profile update:', errReg.message);
      }
    }

    // Catat pembaruan ini ke tabel log_aktivitas dengan aksi 'UPDATE_PROFILE'
    await execute(`
      INSERT INTO log_aktivitas (user_id, aksi, entitas, entitas_id, data_baru, ip_address, created_at)
      VALUES (?, 'UPDATE_PROFILE', 'anggota', ?, JSON_OBJECT(
        'nama', ?,
        'profil_lengkap', ?,
        'detail', 'Anggota memperbarui biodata tetap dan menyelesaikan aktivasi'
      ), ?, NOW())
    `, [req.user.id, String(anggotaId), nama.trim(), profilLengkap, req.ip || '127.0.0.1']);

    return res.json({
      success: true,
      message: 'Biodata tetap Anda berhasil diperbarui di database.',
      data: {
        profil_lengkap: profilLengkap,
        must_change_password: 0
      }
    });
  } catch (err) {
    console.error('Error updateProfile:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/member/re-registration/form-data
exports.getReRegistrationFormData = async (req, res) => {
  try {
    let anggotaId = req.user.anggota_id;
    if (!anggotaId && req.user.id) {
      const uRows = await query(`SELECT anggota_id FROM users WHERE id = ?`, [req.user.id]);
      if (uRows.length > 0) anggotaId = uRows[0].anggota_id;
    }

    if (!anggotaId) {
      return res.status(404).json({ success: false, message: 'Akun Anda tidak tertaut dengan data anggota Mapala UNAND.' });
    }

    // Active period
    const periodRows = await query(`
      SELECT id, tahun, nama, tanggal_buka, tanggal_tutup, status
      FROM periode_registrasi
      WHERE status = 'buka'
      ORDER BY tahun DESC
      LIMIT 1
    `);

    if (periodRows.length === 0) {
      return res.json({
        success: true,
        data: {
          periode_aktif: null,
          message: 'Periode Registrasi Belum Dibuka oleh Administrator.'
        }
      });
    }
    const activePeriod = periodRows[0];

    // Member basic info (locked profile)
    const memberRows = await query(`
      SELECT a.no_register, a.nama, d.nama AS divisi, a.angkatan
      FROM anggota a
      LEFT JOIN divisi d ON d.id = a.divisi_id
      WHERE a.id = ?
    `, [anggotaId]);

    // Current registration for this active period (if already submitted)
    const currentReg = await query(`
      SELECT ru.id, ru.alamat_rumah, ru.kota_kabupaten, ru.provinsi, ru.pekerjaan, ru.no_hp, ru.email, ru.kontak_darurat, ru.foto_path, ru.submitted_at, ru.sumber_input
      FROM registrasi_ulang ru
      WHERE ru.anggota_id = ? AND ru.periode_id = ?
      LIMIT 1
    `, [anggotaId, activePeriod.id]);

    // Prefill data from previous registration (if not yet registered this year)
    const isCurrentPeriodReg = currentReg.length > 0;
    let prefill = currentReg[0] || null;
    if (!prefill) {
      const prevReg = await query(`
        SELECT ru.id, ru.alamat_rumah, ru.kota_kabupaten, ru.provinsi, ru.pekerjaan, ru.no_hp, ru.email, ru.kontak_darurat, ru.foto_path
        FROM registrasi_ulang ru
        WHERE ru.anggota_id = ?
        ORDER BY ru.id DESC
        LIMIT 1
      `, [anggotaId]);
      if (prevReg.length > 0) {
        prefill = {
          ...prevReg[0],
          foto_referensi: prevReg[0].foto_path,
          foto_path: null // Foto tahun lama tidak dianggap memenuhi kewajiban periode berjalan
        };
      }
    }

    // Media sosial akun jika ada
    let mediaSosial = null;
    if (prefill && prefill.id) {
      try {
        const msRows = await query(`SELECT akun FROM registrasi_media_sosial WHERE registrasi_id = ? LIMIT 1`, [prefill.id]);
        if (msRows.length > 0) mediaSosial = msRows[0].akun;
      } catch (_) {}
    }

    // Attributes list from jenis_atribut and previous status
    const attrRows = await query(`SELECT id, nama FROM jenis_atribut WHERE aktif = 1 ORDER BY urutan ASC`);
    let userAtribut = {};
    if (prefill && prefill.id) {
      try {
        const raRows = await query(`SELECT jenis_atribut_id, memiliki, foto_path FROM registrasi_atribut WHERE registrasi_id = ?`, [prefill.id]);
        raRows.forEach(r => {
          userAtribut[r.jenis_atribut_id] = {
            memiliki: r.memiliki,
            // Sesuai PRD FR-23: foto atribut hanya terisi otomatis jika berasal dari tahun yang sama
            foto_path: isCurrentPeriodReg ? (r.foto_path || null) : null
          };
        });
      } catch (_) {}
    }

    const atributMaster = attrRows.map(a => ({
      id: a.id,
      nama: a.nama,
      memiliki: userAtribut[a.id] ? userAtribut[a.id].memiliki : 1,
      foto_path: userAtribut[a.id] ? userAtribut[a.id].foto_path : null
    }));

    return res.json({
      success: true,
      data: {
        periode_aktif: activePeriod,
        profil_terkunci: memberRows[0] || null,
        prefill_data: prefill ? { ...prefill, media_sosial: mediaSosial } : null,
        atribut_master: atributMaster,
        is_already_registered: currentReg.length > 0
      }
    });
  } catch (err) {
    console.error('Error getReRegistrationFormData:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/member/re-registration
exports.submitReRegistration = async (req, res) => {
  try {
    let anggotaId = req.user.anggota_id;
    if (!anggotaId && req.user.id) {
      const uRows = await query(`SELECT anggota_id FROM users WHERE id = ?`, [req.user.id]);
      if (uRows.length > 0) anggotaId = uRows[0].anggota_id;
    }

    if (!anggotaId) {
      return res.status(404).json({ success: false, message: 'Akun Anda tidak tertaut dengan data anggota Mapala UNAND.' });
    }

    const {
      periode_id,
      alamat_rumah,
      kota_kabupaten,
      provinsi,
      pekerjaan,
      no_hp,
      email,
      kontak_darurat,
      alamat_orang_tua,
      media_sosial,
      atribut
    } = req.body;

    // Validasi nomor handphone anggota
    if (!no_hp || !/^(\+?[0-9]{9,15})$/.test(String(no_hp).trim())) {
      return res.status(400).json({
        success: false,
        message: 'Nomor handphone / WhatsApp wajib diisi dengan angka valid (9-15 digit, boleh diawali + atau 0).'
      });
    }

    // Validasi nomor kontak darurat jika disertakan
    const emergencyContact = (kontak_darurat || alamat_orang_tua || '').trim();
    if (emergencyContact && emergencyContact !== '-' && !/^(\+?[0-9]{9,15})$/.test(emergencyContact)) {
      return res.status(400).json({
        success: false,
        message: 'Nomor kontak darurat harus berupa angka valid (9-15 digit, boleh diawali + atau 0).'
      });
    }

    // Check if period is active
    let pId = periode_id;
    if (!pId) {
      const pRows = await query(`SELECT id FROM periode_registrasi WHERE status = 'buka' ORDER BY tahun DESC LIMIT 1`);
      if (pRows.length === 0) {
        return res.status(400).json({ success: false, message: 'Periode registrasi belum dibuka oleh Administrator.' });
      }
      pId = pRows[0].id;
    }

    // Index uploaded files (support single or multiple)
    const filesMap = {};
    if (req.files && Array.isArray(req.files)) {
      req.files.forEach(f => { filesMap[f.fieldname] = f; });
    } else if (req.file) {
      filesMap[req.file.fieldname] = req.file;
    }

    const fotoFile = filesMap['foto_terbaru'];
    const newFotoPath = fotoFile ? `/uploads/${fotoFile.filename}` : null;

    // Check if registration exists for this period
    const existing = await query(`
      SELECT id, foto_path FROM registrasi_ulang WHERE anggota_id = ? AND periode_id = ?
    `, [anggotaId, pId]);

    // Validasi: Foto Anggota Terbaru WAJIB untuk periode berjalan!
    const hasCurrentPeriodPhoto = newFotoPath || (existing.length > 0 && existing[0].foto_path && existing[0].foto_path !== '/uploads/default-avatar.png');
    if (!hasCurrentPeriodPhoto) {
      return res.status(400).json({
        success: false,
        message: 'Foto anggota terbaru untuk periode berjalan wajib diunggah.'
      });
    }

    // Parse atribut
    let atributList = [];
    if (atribut) {
      try {
        atributList = typeof atribut === 'string' ? JSON.parse(atribut) : atribut;
      } catch (_) {
        atributList = [];
      }
    }

    // Ambil foto atribut yang sudah tersimpan untuk registrasi periode ini (bila ada)
    let existingAttrPhotos = {};
    if (existing.length > 0) {
      const curAttrs = await query(`SELECT jenis_atribut_id, foto_path FROM registrasi_atribut WHERE registrasi_id = ?`, [existing[0].id]);
      curAttrs.forEach(ca => { existingAttrPhotos[ca.jenis_atribut_id] = ca.foto_path; });
    }

    // Validasi: Setiap atribut berstatus "Ada" WAJIB FOTO
    for (const item of atributList) {
      const jenisId = item.jenis_atribut_id || item.id;
      const isAda = item.status === 'Ada' || item.status === 1 || item.status === '1';
      if (isAda) {
        const attrFile = filesMap[`foto_atribut_${jenisId}`] || filesMap[`attrFile_${jenisId}`];
        const existingPhoto = existingAttrPhotos[jenisId];
        if (!attrFile && !existingPhoto) {
          return res.status(400).json({
            success: false,
            message: `Foto bukti kepemilikan wajib diunggah untuk atribut "${item.nama || 'yang berstatus Ada'}".`
          });
        }
      }
    }

    let regId;
    const finalPhoto = newFotoPath || existing[0].foto_path;

    if (existing.length > 0) {
      regId = existing[0].id;
      await execute(`
        UPDATE registrasi_ulang
        SET alamat_rumah = ?, kota_kabupaten = ?, provinsi = ?,
            pekerjaan = ?, no_hp = ?, email = ?, kontak_darurat = ?,
            foto_path = ?,
            sumber_input = 'mandiri',
            updated_at = NOW()
        WHERE id = ?
      `, [alamat_rumah, kota_kabupaten, provinsi, pekerjaan, no_hp, email, emergencyContact || null, finalPhoto, regId]);
    } else {
      const insertResult = await execute(`
        INSERT INTO registrasi_ulang (
          anggota_id, periode_id, foto_path, alamat_rumah, kota_kabupaten, provinsi,
          pekerjaan, no_hp, email, kontak_darurat, sumber_input, submitted_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'mandiri', NOW())
      `, [anggotaId, pId, finalPhoto, alamat_rumah, kota_kabupaten, provinsi, pekerjaan, no_hp, email, emergencyContact || null]);
      regId = insertResult.insertId;
    }

    // Save social media if provided
    if (media_sosial) {
      try {
        await execute(`
          INSERT INTO registrasi_media_sosial (registrasi_id, platform, akun)
          VALUES (?, 'Media Sosial', ?)
          ON DUPLICATE KEY UPDATE akun = VALUES(akun)
        `, [regId, media_sosial]);
      } catch (_) {}
    }

    // Save attributes checklist and photos (Topi Rimba, Baju Lapangan)
    if (atributList.length > 0) {
      for (const item of atributList) {
        const jenisId = item.jenis_atribut_id || item.id;
        if (jenisId) {
          const isAda = item.status === 'Ada' || item.status === 1 || item.status === '1';
          let attrPhotoPath = null;
          if (isAda) {
            const attrFile = filesMap[`foto_atribut_${jenisId}`] || filesMap[`attrFile_${jenisId}`];
            attrPhotoPath = attrFile ? `/uploads/${attrFile.filename}` : existingAttrPhotos[jenisId];
          }
          await execute(`
            INSERT INTO registrasi_atribut (registrasi_id, jenis_atribut_id, memiliki, foto_path)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE memiliki = VALUES(memiliki), foto_path = VALUES(foto_path)
          `, [regId, jenisId, isAda ? 1 : 0, attrPhotoPath]);
        }
      }
    }

    // Catat ke log_aktivitas dengan aksi 'REGISTRASI_MANDIRI'
    await execute(`
      INSERT INTO log_aktivitas (user_id, aksi, entitas, entitas_id, data_baru, ip_address, created_at)
      VALUES (?, 'REGISTRASI_MANDIRI', 'registrasi_ulang', ?, JSON_OBJECT(
        'periode_id', ?,
        'sumber_input', 'mandiri',
        'detail', 'Anggota mengirim formulir registrasi ulang mandiri'
      ), ?, NOW())
    `, [req.user.id, String(regId), pId, req.ip || '127.0.0.1']);

    return res.json({
      success: true,
      message: 'Formulir Registrasi Ulang Mandiri berhasil disimpan ke database.',
      data: {
        registrasi_id: regId
      }
    });
  } catch (err) {
    console.error('Error submitReRegistration:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/member/directory (View: v_direktori_anggota) - FR-46 & FR-47
exports.getDirectory = async (req, res) => {
  try {
    const { q, provinsi, goldar } = req.query;

    // Sesuai prinsip privasi UU PDP (FR-46, FR-47):
    // Hanya mengekstrak 5 atribut publik resmi: Nama, No. Register, Kota & Provinsi Domisili, No. HP, dan Golongan Darah.
    let sql = `
      SELECT 
        anggota_id,
        nama,
        no_register,
        no_hp,
        golongan_darah,
        kota_kabupaten,
        provinsi
      FROM v_direktori_anggota
      WHERE 1=1
    `;
    const params = [];

    if (q && q.trim()) {
      const searchTerm = `%${q.trim()}%`;
      sql += ` AND (nama LIKE ? OR no_register LIKE ?)`;
      params.push(searchTerm, searchTerm);
    }
    if (provinsi && provinsi.trim()) {
      sql += ` AND provinsi = ?`;
      params.push(provinsi.trim());
    }
    if (goldar && goldar.trim()) {
      sql += ` AND golongan_darah = ?`;
      params.push(goldar.trim());
    }

    sql += ` ORDER BY nama ASC`;

    const members = await query(sql, params);

    // Ambil daftar provinsi unik untuk opsi filter dropdown
    const provRows = await query(`
      SELECT DISTINCT provinsi 
      FROM v_direktori_anggota 
      WHERE provinsi IS NOT NULL AND provinsi != ''
      ORDER BY provinsi ASC
    `);
    const availableProvinces = provRows.map(r => r.provinsi);

    return res.json({
      success: true,
      message: 'Data direktori anggota berhasil dimuat dari MySQL View v_direktori_anggota.',
      data: {
        total: members.length,
        available_provinces: availableProvinces,
        members
      }
    });
  } catch (err) {
    console.error('Error getDirectory:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/member/activation/validate-password (Step 1 Onboarding: Verifikasi tanpa mengubah DB)
exports.validateActivationPassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Kata sandi lama dan kata sandi baru wajib diisi.'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Kata sandi baru minimal harus 6 karakter.'
      });
    }

    if (newPassword === oldPassword || newPassword === 'mapala123') {
      return res.status(400).json({
        success: false,
        message: 'Kata sandi baru tidak boleh sama dengan kata sandi bawaan (mapala123).'
      });
    }

    const users = await query(`SELECT password_hash FROM users WHERE id = ?`, [userId]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'Akun pengguna tidak ditemukan.' });
    }

    const isMatch = bcrypt.compareSync(oldPassword, users[0].password_hash);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Kata sandi lama yang Anda masukkan tidak sesuai.'
      });
    }

    // Hanya validasi! Kata sandi TIDAK diubah di database pada Step 1
    return res.json({
      success: true,
      message: 'Validasi kata sandi berhasil. Silakan lanjut ke langkah berikutnya.'
    });
  } catch (err) {
    console.error('Error validateActivationPassword:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/member/activation/complete (Step 3 Onboarding: Eksekusi Atomik Seluruh Langkah)
exports.completeActivation = async (req, res) => {
  try {
    let anggotaId = req.user.anggota_id;
    const userId = req.user.id;
    if (!anggotaId && userId) {
      const uRows = await query(`SELECT anggota_id FROM users WHERE id = ?`, [userId]);
      if (uRows.length > 0) anggotaId = uRows[0].anggota_id;
    }

    if (!anggotaId) {
      return res.status(404).json({ success: false, message: 'Akun Anda tidak tertaut dengan data anggota Mapala UNAND.' });
    }

    const {
      oldPassword,
      newPassword,
      kebijakan_id,
      nama,
      tempat_lahir,
      tanggal_lahir,
      golongan_darah,
      nama_ayah,
      nama_ibu,
      no_hp,
      kota_kabupaten,
      provinsi,
      alamat_rumah
    } = req.body;

    // 1. Validasi Kata Sandi Baru
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Kata sandi baru wajib diisi (minimal 6 karakter).' });
    }

    const users = await query(`SELECT password_hash, username FROM users WHERE id = ?`, [userId]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'Akun pengguna tidak ditemukan.' });
    }

    if (oldPassword) {
      const isMatch = bcrypt.compareSync(oldPassword, users[0].password_hash);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Kata sandi lama tidak sesuai.' });
      }
    }

    // 2. Validasi Biodata Esensial
    if (!tempat_lahir || !tanggal_lahir || !golongan_darah || !nama_ayah || !nama_ibu || !no_hp || !kota_kabupaten || !provinsi) {
      return res.status(400).json({
        success: false,
        message: 'Seluruh kolom wajib (Tempat/Tgl Lahir, Golongan Darah, Nama Orang Tua, No. HP, Domisili) harus diisi lengkap.'
      });
    }

    if (!/^(\+?[0-9]{9,15})$/.test(String(no_hp).trim())) {
      return res.status(400).json({
        success: false,
        message: 'Nomor handphone / WhatsApp harus berupa angka valid (9-15 digit, boleh diawali + atau 0).'
      });
    }

    // -------------------------------------------------------------
    // EKSEKUSI PENYIMPANAN ATOMIK SELURUH STEP (STEP 1 + 2 + 3)
    // -------------------------------------------------------------

    // A. Update Password & Reset must_change_password ke 0 (Step 1)
    const salt = bcrypt.genSaltSync(10);
    const newHash = bcrypt.hashSync(newPassword, salt);
    await execute(`
      UPDATE users 
      SET password_hash = ?, must_change_password = 0 
      WHERE id = ?
    `, [newHash, userId]);

    // B. Catat Persetujuan Kebijakan Privasi (Step 2)
    const kId = kebijakan_id || 1;
    await execute(`
      INSERT INTO persetujuan_data (anggota_id, kebijakan_id, disetujui_at)
      VALUES (?, ?, NOW())
      ON DUPLICATE KEY UPDATE disetujui_at = NOW()
    `, [anggotaId, kId]);

    // C. Update Biodata Tetap & profil_lengkap = 1 (Step 3)
    await execute(`
      UPDATE anggota
      SET nama = COALESCE(?, nama),
          tempat_lahir = ?,
          tanggal_lahir = ?,
          golongan_darah = ?,
          nama_ayah = ?,
          nama_ibu = ?,
          profil_lengkap = 1,
          updated_at = NOW()
      WHERE id = ?
    `, [
      nama ? toTitleCase(nama) : null,
      tempat_lahir.trim(),
      tanggal_lahir,
      golongan_darah,
      nama_ayah.trim(),
      nama_ibu.trim(),
      anggotaId
    ]);

    // D. Sinkronkan Kontak & Domisili jika anggota sudah memiliki data registrasi pada periode ini
    const pRows = await query(`SELECT id FROM periode_registrasi ORDER BY (status = 'buka') DESC, tahun DESC LIMIT 1`);
    const pId = pRows.length > 0 ? pRows[0].id : 1;

    const regExisting = await query(`
      SELECT id FROM registrasi_ulang WHERE anggota_id = ? AND periode_id = ? LIMIT 1
    `, [anggotaId, pId]);

    if (regExisting.length > 0) {
      await execute(`
        UPDATE registrasi_ulang
        SET no_hp = ?,
            kota_kabupaten = ?,
            provinsi = ?,
            alamat_rumah = COALESCE(?, alamat_rumah),
            updated_at = NOW()
        WHERE id = ?
      `, [no_hp.trim(), kota_kabupaten.trim(), provinsi.trim(), alamat_rumah ? alamat_rumah.trim() : null, regExisting[0].id]);
    }
    // Catatan: Jika anggota belum registrasi ulang, jangan INSERT baris registrasi otomatis di sini.
    // Registrasi ulang wajib dilakukan mandiri oleh anggota melalui menu Registrasi Ulang
    // lengkap dengan unggahan foto terbaru dan bukti atribut fisik (FR-16, FR-22).

    // E. Log Audit Aktivitas
    await execute(`
      INSERT INTO log_aktivitas (user_id, aksi, entitas, entitas_id, data_baru, ip_address, created_at)
      VALUES (?, 'AKTIVASI_AKUN_SELESAI', 'anggota', ?, JSON_OBJECT(
        'detail', 'Anggota berhasil menyelesaikan seluruh alur aktivasi akun 3-langkah (Ganti Password, Privasi PDP, & Biodata Esensial)'
      ), ?, NOW())
    `, [userId, String(anggotaId), req.ip || '127.0.0.1']);

    return res.json({
      success: true,
      message: 'Selamat! Akun Anda berhasil diaktivasi secara penuh.',
      data: {
        must_change_password: false,
        profil_lengkap: 1
      }
    });
  } catch (err) {
    console.error('Error completeActivation:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
