const { query, execute } = require('../config/mysql');
const db = require('../config/db');
const { logActivity } = require('../services/loggerService');

// 1. PERIODE REGISTRASI ULANG (tabel periode_registrasi)
exports.getPeriodes = async (req, res) => {
  try {
    const rows = await query(`
      SELECT 
        id,
        nama,
        nama AS nama_periode,
        tahun,
        DATE_FORMAT(tanggal_buka, '%Y-%m-%d') AS tanggal_buka,
        DATE_FORMAT(tanggal_tutup, '%Y-%m-%d') AS tanggal_tutup,
        status,
        (status = 'buka') AS is_active
      FROM periode_registrasi
      ORDER BY tahun DESC
    `);

    const formatted = rows.map(r => ({
      ...r,
      is_active: Boolean(r.is_active)
    }));

    return res.json({ success: true, data: formatted });
  } catch (error) {
    console.error('Error getPeriodes MySQL:', error);
    return res.status(500).json({ success: false, message: 'Gagal mengambil data periode: ' + error.message });
  }
};

exports.togglePeriodStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const periods = await query('SELECT * FROM periode_registrasi WHERE id = ?', [id]);
    if (periods.length === 0) {
      return res.status(404).json({ success: false, message: 'Periode tidak ditemukan.' });
    }

    const period = periods[0];
    const willBeOpen = period.status !== 'buka';

    if (willBeOpen) {
      // PRD Rule: Hanya 1 periode yang aktif/buka pada satu waktu
      await execute("UPDATE periode_registrasi SET status = 'tutup'");
      await execute("UPDATE periode_registrasi SET status = 'buka' WHERE id = ?", [id]);
    } else {
      await execute("UPDATE periode_registrasi SET status = 'tutup' WHERE id = ?", [id]);
    }

    const statusLabel = willBeOpen ? 'Dibuka' : 'Ditutup';
    const adminUser = req.user ? req.user.username : 'admin';

    await logActivity(
      adminUser,
      'UPDATE_PERIODE',
      `Mengubah status periode ${period.nama} (${period.tahun}) menjadi ${statusLabel.toUpperCase()}`,
      { entitas: 'periode_registrasi', entitas_id: String(id) }
    );

    await db.syncFromMySQL().catch(e => console.warn('Sync memory notice:', e.message));

    return res.json({
      success: true,
      message: `Status periode ${period.nama} berhasil diubah menjadi ${statusLabel}.`,
      data: {
        id: period.id,
        nama: period.nama,
        nama_periode: period.nama,
        tahun: period.tahun,
        status: willBeOpen ? 'buka' : 'tutup',
        is_active: willBeOpen
      }
    });
  } catch (error) {
    console.error('Error togglePeriodStatus MySQL:', error);
    return res.status(500).json({ success: false, message: 'Gagal mengubah status periode: ' + error.message });
  }
};

exports.createPeriod = async (req, res) => {
  try {
    const { tahun, nama_periode, nama, tanggal_buka, tanggal_tutup } = req.body;
    const periodName = (nama_periode || nama || '').trim();
    const yearNum = parseInt(tahun, 10);

    if (!yearNum || !periodName) {
      return res.status(400).json({ success: false, message: 'Tahun dan Nama Periode wajib diisi.' });
    }

    const existing = await query('SELECT id FROM periode_registrasi WHERE tahun = ?', [yearNum]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: `Periode untuk tahun ${yearNum} sudah terdaftar.` });
    }

    const safeBuka = tanggal_buka && tanggal_buka.trim() !== '' ? tanggal_buka.trim() : `${yearNum}-01-01`;
    const safeTutup = tanggal_tutup && tanggal_tutup.trim() !== '' ? tanggal_tutup.trim() : `${yearNum}-12-31`;

    const insertRes = await execute(`
      INSERT INTO periode_registrasi (nama, tahun, tanggal_buka, tanggal_tutup, status)
      VALUES (?, ?, ?, ?, 'tutup')
    `, [periodName, yearNum, safeBuka, safeTutup]);

    const newPeriodId = insertRes.insertId;
    const adminUser = req.user ? req.user.username : 'admin';

    await logActivity(
      adminUser,
      'CREATE_PERIODE',
      `Menambahkan periode registrasi baru: ${periodName} (${yearNum})`,
      { entitas: 'periode_registrasi', entitas_id: String(newPeriodId) }
    );

    await db.syncFromMySQL().catch(e => console.warn('Sync memory notice:', e.message));

    return res.status(201).json({
      success: true,
      message: `Periode registrasi baru (${yearNum}) berhasil dibuat.`,
      data: {
        id: newPeriodId,
        nama: periodName,
        nama_periode: periodName,
        tahun: yearNum,
        tanggal_buka: safeBuka,
        tanggal_tutup: safeTutup,
        status: 'tutup',
        is_active: false
      }
    });
  } catch (error) {
    console.error('Error createPeriod MySQL:', error);
    return res.status(500).json({ success: false, message: 'Gagal membuat periode baru: ' + error.message });
  }
};

// 2. KELOLA MASTER DIVISI (tabel divisi)
exports.getDivisions = async (req, res) => {
  try {
    const rows = await query(`
      SELECT 
        id,
        nama,
        nama AS nama_divisi,
        slug,
        slug AS kode,
        ikon,
        deskripsi,
        urutan,
        aktif
      FROM divisi
      WHERE aktif = 1
      ORDER BY urutan ASC, id ASC
    `);

    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error getDivisions MySQL:', error);
    return res.status(500).json({ success: false, message: 'Gagal mengambil data divisi: ' + error.message });
  }
};

exports.createDivision = async (req, res) => {
  try {
    const { nama_divisi, nama, kode, slug, deskripsi } = req.body;
    const divName = (nama_divisi || nama || '').trim();
    const divKode = (kode || slug || divName.substring(0, 3)).trim().toUpperCase();
    const divSlug = divKode.toLowerCase().replace(/[^a-z0-9_-]/g, '-');

    if (!divName) {
      return res.status(400).json({ success: false, message: 'Nama divisi wajib diisi.' });
    }

    const existing = await query(`
      SELECT id FROM divisi WHERE LOWER(nama) = LOWER(?) OR LOWER(slug) = LOWER(?)
    `, [divName, divSlug]);

    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: `Divisi '${divName}' atau kode '${divKode}' sudah ada di database.` });
    }

    const maxOrder = await query('SELECT MAX(urutan) AS max_u FROM divisi');
    const urutan = (maxOrder[0]?.max_u || 0) + 1;

    const safeDesc = deskripsi && deskripsi.trim() !== '' ? deskripsi.trim() : 'Spesialisasi kegiatan alam bebas Mapala UNAND';

    const insertRes = await execute(`
      INSERT INTO divisi (nama, slug, deskripsi, urutan, aktif)
      VALUES (?, ?, ?, ?, 1)
    `, [divName, divSlug, safeDesc, urutan]);

    const newDivId = insertRes.insertId;
    const adminUser = req.user ? req.user.username : 'admin';

    await logActivity(
      adminUser,
      'CREATE_DIVISI',
      `Menambahkan divisi baru: ${divName} (${divKode})`,
      { entitas: 'divisi', entitas_id: String(newDivId) }
    );

    await db.syncFromMySQL().catch(e => console.warn('Sync memory notice:', e.message));

    return res.status(201).json({
      success: true,
      message: `Divisi '${divName}' berhasil ditambahkan ke database.`,
      data: {
        id: newDivId,
        nama: divName,
        nama_divisi: divName,
        slug: divSlug,
        kode: divKode,
        deskripsi: safeDesc,
        urutan,
        aktif: 1
      }
    });
  } catch (error) {
    console.error('Error createDivision MySQL:', error);
    return res.status(500).json({ success: false, message: 'Gagal menambahkan divisi: ' + error.message });
  }
};

exports.updateDivision = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama_divisi, nama, kode, slug, deskripsi } = req.body;
    const divName = (nama_divisi || nama || '').trim();
    const divKode = (kode || slug || '').trim().toUpperCase();

    if (!divName) {
      return res.status(400).json({ success: false, message: 'Nama divisi wajib diisi.' });
    }

    const existing = await query('SELECT * FROM divisi WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Divisi tidak ditemukan.' });
    }

    const current = existing[0];
    const newSlug = divKode ? divKode.toLowerCase().replace(/[^a-z0-9_-]/g, '-') : current.slug;

    // Check duplicate with other divisions
    const dup = await query(`
      SELECT id FROM divisi 
      WHERE id != ? AND (LOWER(nama) = LOWER(?) OR LOWER(slug) = LOWER(?))
    `, [id, divName, newSlug]);

    if (dup.length > 0) {
      return res.status(400).json({ success: false, message: `Divisi dengan nama '${divName}' atau kode '${divKode}' sudah ada.` });
    }

    const safeDesc = deskripsi !== undefined ? deskripsi.trim() : current.deskripsi;

    await execute(`
      UPDATE divisi 
      SET nama = ?, slug = ?, deskripsi = ?
      WHERE id = ?
    `, [divName, newSlug, safeDesc, id]);

    const adminUser = req.user ? req.user.username : 'admin';

    await logActivity(
      adminUser,
      'UPDATE_DIVISI',
      `Memperbarui nama divisi dari '${current.nama}' menjadi '${divName}'`,
      { entitas: 'divisi', entitas_id: String(id) }
    );

    await db.syncFromMySQL().catch(e => console.warn('Sync memory notice:', e.message));

    return res.json({
      success: true,
      message: `Nama divisi '${divName}' berhasil diperbarui.`,
      data: {
        id: current.id,
        nama: divName,
        nama_divisi: divName,
        slug: newSlug,
        kode: divKode || current.slug.toUpperCase(),
        deskripsi: safeDesc
      }
    });
  } catch (error) {
    console.error('Error updateDivision MySQL:', error);
    return res.status(500).json({ success: false, message: 'Gagal memperbarui divisi: ' + error.message });
  }
};

exports.deleteDivision = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await query('SELECT * FROM divisi WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Divisi tidak ditemukan.' });
    }

    // Periksa apakah divisi digunakan oleh anggota
    const memberCount = await query('SELECT COUNT(*) AS total FROM anggota WHERE divisi_id = ?', [id]);
    if (memberCount[0]?.total > 0) {
      return res.status(403).json({
        success: false,
        message: `Divisi '${existing[0].nama}' tidak dapat dihapus karena masih digunakan oleh ${memberCount[0].total} anggota. Silakan edit penamaannya jika terdapat salah ketik.`
      });
    }

    await execute('DELETE FROM divisi WHERE id = ?', [id]);
    const adminUser = req.user ? req.user.username : 'admin';

    await logActivity(
      adminUser,
      'DELETE_DIVISI',
      `Menghapus divisi: ${existing[0].nama}`,
      { entitas: 'divisi', entitas_id: String(id) }
    );

    await db.syncFromMySQL().catch(e => console.warn('Sync memory notice:', e.message));

    return res.json({
      success: true,
      message: `Divisi '${existing[0].nama}' berhasil dihapus.`
    });
  } catch (error) {
    console.error('Error deleteDivision MySQL:', error);
    return res.status(500).json({ success: false, message: 'Gagal menghapus divisi: ' + error.message });
  }
};

// 3. ATRIBUT ORGANISASI TETAP (tabel jenis_atribut)
exports.getAttributes = async (req, res) => {
  try {
    const rows = await query(`
      SELECT id, nama AS nama_atribut, nama, urutan, aktif 
      FROM jenis_atribut 
      WHERE aktif = 1 
      ORDER BY urutan ASC
    `);

    const formatted = rows.map(r => ({
      id: r.id,
      nama_atribut: r.nama_atribut,
      wajib: true,
      keterangan: `Atribut fisik resmi ${r.nama_atribut} Mapala UNAND`
    }));

    return res.json({ success: true, data: formatted });
  } catch (error) {
    console.error('Error getAttributes MySQL:', error);
    return res.status(500).json({ success: false, message: 'Gagal mengambil atribut: ' + error.message });
  }
};
