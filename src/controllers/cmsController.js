const { query, execute } = require('../config/mysql');
const db = require('../config/db');
const { logActivity } = require('../services/loggerService');

// Helper to generate slug
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

// ============================================================================
// 1. CMS ARTIKEL & KEGIATAN (tabel artikel, artikel_gambar, kategori_artikel)
// ============================================================================
exports.getArticles = async (req, res) => {
  try {
    const rows = await query(`
      SELECT 
        a.id,
        a.judul,
        a.slug,
        a.kategori_id,
        k.nama AS kategori,
        k.slug AS kategori_slug,
        a.divisi_id,
        d.nama AS divisi,
        d.slug AS divisi_slug,
        a.lokasi_id,
        COALESCE(l.nama, '') AS lokasi,
        a.ringkasan,
        a.isi,
        a.status_kegiatan,
        a.tim_capaian,
        DATE_FORMAT(a.tanggal_kegiatan, '%Y-%m-%d') AS tanggal_raw,
        DATE_FORMAT(a.tanggal_kegiatan, '%d %M %Y') AS tanggal,
        a.status_publikasi AS status,
        a.published_at,
        a.created_at,
        COALESCE(u.username, 'Admin Mapala UNAND') AS penulis,
        COALESCE(ag.path, '/images/hero-mountain.jpg') AS foto
      FROM artikel a
      JOIN kategori_artikel k ON k.id = a.kategori_id
      LEFT JOIN divisi d ON d.id = a.divisi_id
      LEFT JOIN lokasi l ON l.id = a.lokasi_id
      LEFT JOIN users u ON u.id = a.penulis_id
      LEFT JOIN artikel_gambar ag ON ag.artikel_id = a.id AND ag.is_sampul = 1
      ORDER BY a.tanggal_kegiatan DESC, a.id DESC
    `);

    // Fetch images for each article to support multi-images (P-02)
    const images = await query(`
      SELECT artikel_id, path, caption, is_sampul, urutan 
      FROM artikel_gambar 
      ORDER BY urutan ASC, id ASC
    `);

    const imageMap = {};
    images.forEach(img => {
      if (!imageMap[img.artikel_id]) imageMap[img.artikel_id] = [];
      imageMap[img.artikel_id].push(img.path);
    });

    const data = rows.map(r => ({
      ...r,
      fotos: imageMap[r.id] && imageMap[r.id].length > 0 ? imageMap[r.id] : [r.foto]
    }));

    return res.json({ success: true, data });
  } catch (err) {
    console.error('Error getArticles MySQL:', err);
    return res.status(500).json({ success: false, message: 'Gagal mengambil data artikel: ' + err.message });
  }
};

exports.createArticle = async (req, res) => {
  try {
    const {
      judul,
      kategori,
      kategori_id,
      divisi_id,
      divisi,
      lokasi_id,
      lokasi,
      tanggal,
      tanggal_kegiatan,
      status,
      status_publikasi,
      penulis,
      tim_capaian,
      status_kegiatan,
      ringkasan,
      isi
    } = req.body;

    if (!judul || !judul.trim()) {
      return res.status(400).json({ success: false, message: 'Judul artikel wajib diisi.' });
    }
    if (!isi || !isi.trim()) {
      return res.status(400).json({ success: false, message: 'Isi narasi/berita artikel wajib diisi.' });
    }

    const cleanJudul = judul.trim();
    const existingTitle = await query(
      'SELECT id FROM artikel WHERE LOWER(TRIM(judul)) = LOWER(?) LIMIT 1',
      [cleanJudul]
    );
    if (existingTitle.length > 0) {
      return res.status(409).json({
        success: false,
        message: `Judul artikel "${cleanJudul}" sudah terdaftar. Satu judul hanya boleh dimiliki 1 artikel — gunakan fitur Edit untuk mengubahnya.`
      });
    }

    // 1. Resolve Kategori ID
    let resolvedKatId = null;
    if (kategori_id && !isNaN(kategori_id)) {
      resolvedKatId = Number(kategori_id);
    } else if (kategori) {
      const katSearch = await query('SELECT id FROM kategori_artikel WHERE id = ? OR slug = ? OR LOWER(nama) = LOWER(?) LIMIT 1', [kategori, kategori, kategori]);
      if (katSearch.length > 0) {
        resolvedKatId = katSearch[0].id;
      }
    }
    if (!resolvedKatId) {
      // Default to Ekspedisi (id 1)
      const defaultKat = await query('SELECT id FROM kategori_artikel ORDER BY id ASC LIMIT 1');
      resolvedKatId = defaultKat.length > 0 ? defaultKat[0].id : 1;
    }

    // 2. Resolve Divisi ID
    let resolvedDivId = null;
    if (divisi_id && !isNaN(divisi_id)) {
      resolvedDivId = Number(divisi_id);
    } else if (divisi) {
      const divSearch = await query('SELECT id FROM divisi WHERE id = ? OR slug = ? OR LOWER(nama) = LOWER(?) LIMIT 1', [divisi, divisi, divisi]);
      if (divSearch.length > 0) {
        resolvedDivId = divSearch[0].id;
      }
    }

    // 3. Resolve Lokasi ID
    let resolvedLokId = null;
    if (lokasi_id && !isNaN(lokasi_id)) {
      resolvedLokId = Number(lokasi_id);
    } else if (lokasi && lokasi.trim()) {
      const lokName = lokasi.trim();
      const lokSearch = await query('SELECT id FROM lokasi WHERE LOWER(nama) = LOWER(?) LIMIT 1', [lokName]);
      if (lokSearch.length > 0) {
        resolvedLokId = lokSearch[0].id;
      } else {
        const lokSlug = slugify(lokName) || `lokasi-${Date.now()}`;
        const newLok = await execute('INSERT INTO lokasi (nama, slug) VALUES (?, ?)', [lokName, lokSlug]);
        resolvedLokId = newLok.insertId;
      }
    }

    // 4. Resolve Penulis & User ID
    const penulisId = req.user && req.user.id ? req.user.id : 1;
    const adminUser = req.user ? req.user.username : 'admin';

    // 5. Generate unique slug
    let baseSlug = slugify(judul.trim());
    if (!baseSlug) baseSlug = `artikel-${Date.now()}`;
    let articleSlug = baseSlug;
    const existingSlug = await query('SELECT id FROM artikel WHERE slug = ?', [articleSlug]);
    if (existingSlug.length > 0) {
      articleSlug = `${baseSlug}-${Date.now().toString().slice(-4)}`;
    }

    // 6. Dates & Status
    const publishStatus = (status === 'terbit' || status_publikasi === 'terbit') ? 'terbit' : 'draf';
    const dateVal = tanggal_kegiatan || tanggal || new Date().toISOString().split('T')[0];
    const publishedAt = publishStatus === 'terbit' ? new Date() : null;

    // 7. Ringkasan
    const summaryVal = ringkasan && ringkasan.trim()
      ? ringkasan.trim()
      : (isi.trim().slice(0, 160) + (isi.trim().length > 160 ? '...' : ''));

    // 8. Insert into MySQL `artikel`
    const insertRes = await execute(`
      INSERT INTO artikel (
        kategori_id, divisi_id, lokasi_id, penulis_id, judul, slug,
        ringkasan, isi, status_kegiatan, tim_capaian, tanggal_kegiatan,
        status_publikasi, published_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      resolvedKatId,
      resolvedDivId,
      resolvedLokId,
      penulisId,
      judul.trim(),
      articleSlug,
      summaryVal,
      isi.trim(),
      status_kegiatan || 'Selesai',
      tim_capaian || (penulis || 'Tim Mapala UNAND'),
      dateVal,
      publishStatus,
      publishedAt
    ]);

    const articleId = insertRes.insertId;

    // 9. Multi-image handling (P-02)
    let uploadedPaths = [];
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      uploadedPaths = req.files.map(f => `/uploads/${f.filename}`);
    } else if (req.file) {
      uploadedPaths = [`/uploads/${req.file.filename}`];
    } else if (req.body.fotos) {
      try {
        uploadedPaths = Array.isArray(req.body.fotos) ? req.body.fotos : JSON.parse(req.body.fotos);
      } catch (_) {
        uploadedPaths = [req.body.fotos];
      }
    } else if (req.body.foto && req.body.foto.trim()) {
      uploadedPaths = [req.body.foto.trim()];
    }

    if (uploadedPaths.length === 0) {
      uploadedPaths = ['/images/hero-mountain.jpg'];
    }

    for (let i = 0; i < uploadedPaths.length; i++) {
      const imgPath = uploadedPaths[i];
      const isSampul = (i === 0) ? 1 : 0;
      await execute(`
        INSERT INTO artikel_gambar (artikel_id, path, caption, is_sampul, urutan)
        VALUES (?, ?, ?, ?, ?)
      `, [articleId, imgPath, judul.trim(), isSampul, i + 1]);
    }

    // 10. Audit log & memory sync
    await logActivity(
      adminUser,
      'CREATE_ARTICLE',
      `Menambahkan artikel: ${judul.trim()} (${publishStatus}) dengan ${uploadedPaths.length} gambar`,
      { entitas: 'artikel', entitas_id: String(articleId) }
    );

    await db.syncFromMySQL().catch(e => console.warn('Sync memory notice:', e.message));

    return res.status(201).json({
      success: true,
      message: `Artikel berhasil disimpan ${publishStatus === 'terbit' ? 'dan dipublikasikan' : 'sebagai draf'}.`,
      data: {
        id: articleId,
        judul: judul.trim(),
        slug: articleSlug,
        status: publishStatus,
        foto: uploadedPaths[0],
        fotos: uploadedPaths
      }
    });
  } catch (err) {
    console.error('Error createArticle MySQL:', err);
    return res.status(500).json({ success: false, message: 'Gagal membuat artikel: ' + err.message });
  }
};

exports.updateArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      judul,
      kategori,
      kategori_id,
      divisi_id,
      divisi,
      lokasi_id,
      lokasi,
      tanggal,
      tanggal_kegiatan,
      status,
      status_publikasi,
      penulis,
      tim_capaian,
      status_kegiatan,
      ringkasan,
      isi
    } = req.body;

    const existing = await query('SELECT * FROM artikel WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Artikel tidak ditemukan.' });
    }
    const current = existing[0];

    // 1. Resolve Kategori ID
    let resolvedKatId = current.kategori_id;
    if (kategori_id && !isNaN(kategori_id)) {
      resolvedKatId = Number(kategori_id);
    } else if (kategori) {
      const katSearch = await query('SELECT id FROM kategori_artikel WHERE id = ? OR slug = ? OR LOWER(nama) = LOWER(?) LIMIT 1', [kategori, kategori, kategori]);
      if (katSearch.length > 0) resolvedKatId = katSearch[0].id;
    }

    // 2. Resolve Divisi ID
    let resolvedDivId = current.divisi_id;
    if (divisi_id !== undefined) {
      if (divisi_id && !isNaN(divisi_id)) resolvedDivId = Number(divisi_id);
      else resolvedDivId = null;
    } else if (divisi) {
      const divSearch = await query('SELECT id FROM divisi WHERE id = ? OR slug = ? OR LOWER(nama) = LOWER(?) LIMIT 1', [divisi, divisi, divisi]);
      if (divSearch.length > 0) resolvedDivId = divSearch[0].id;
    }

    // 3. Resolve Lokasi ID
    let resolvedLokId = current.lokasi_id;
    if (lokasi_id !== undefined && !isNaN(lokasi_id)) {
      resolvedLokId = Number(lokasi_id);
    } else if (lokasi && lokasi.trim()) {
      const lokName = lokasi.trim();
      const lokSearch = await query('SELECT id FROM lokasi WHERE LOWER(nama) = LOWER(?) LIMIT 1', [lokName]);
      if (lokSearch.length > 0) {
        resolvedLokId = lokSearch[0].id;
      } else {
        const lokSlug = slugify(lokName) || `lokasi-${Date.now()}`;
        const newLok = await execute('INSERT INTO lokasi (nama, slug) VALUES (?, ?)', [lokName, lokSlug]);
        resolvedLokId = newLok.insertId;
      }
    }

    // 4. Status & Dates
    const newStatus = status_publikasi || status || current.status_publikasi;
    const dateVal = tanggal_kegiatan || tanggal || current.tanggal_kegiatan;
    const newPublishedAt = newStatus === 'terbit' && !current.published_at ? new Date() : current.published_at;

    const newJudul = judul && judul.trim() ? judul.trim() : current.judul;
    const isTitleChanged = newJudul.toLowerCase() !== (current.judul || '').trim().toLowerCase();

    if (isTitleChanged) {
      const duplicateTitle = await query(
        'SELECT id FROM artikel WHERE LOWER(TRIM(judul)) = LOWER(?) AND id != ? LIMIT 1',
        [newJudul, id]
      );
      if (duplicateTitle.length > 0) {
        return res.status(409).json({
          success: false,
          message: `Judul artikel "${newJudul}" sudah digunakan oleh artikel lain. Satu judul hanya boleh dimiliki 1 artikel.`
        });
      }
    }

    let newSlug = current.slug;
    if (isTitleChanged) {
      const baseSlug = slugify(newJudul) || `artikel-${id}`;
      const existingSlug = await query('SELECT id FROM artikel WHERE slug = ? AND id != ? LIMIT 1', [baseSlug, id]);
      newSlug = existingSlug.length > 0 ? `${baseSlug}-${id}` : baseSlug;
    }

    const newIsi = isi !== undefined ? isi.trim() : current.isi;
    const newSummary = ringkasan !== undefined ? ringkasan.trim() : (newIsi ? newIsi.slice(0, 160) + '...' : current.ringkasan);

    await execute(`
      UPDATE artikel SET
        kategori_id = ?,
        divisi_id = ?,
        lokasi_id = ?,
        judul = ?,
        slug = ?,
        ringkasan = ?,
        isi = ?,
        status_kegiatan = ?,
        tim_capaian = ?,
        tanggal_kegiatan = ?,
        status_publikasi = ?,
        published_at = ?
      WHERE id = ?
    `, [
      resolvedKatId,
      resolvedDivId,
      resolvedLokId,
      newJudul,
      newSlug,
      newSummary,
      newIsi,
      status_kegiatan || current.status_kegiatan,
      tim_capaian || current.tim_capaian,
      dateVal,
      newStatus,
      newPublishedAt,
      id
    ]);

    // Multi-image update
    let uploadedPaths = [];
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      uploadedPaths = req.files.map(f => `/uploads/${f.filename}`);
    } else if (req.file) {
      uploadedPaths = [`/uploads/${req.file.filename}`];
    } else if (req.body.fotos) {
      try {
        uploadedPaths = Array.isArray(req.body.fotos) ? req.body.fotos : JSON.parse(req.body.fotos);
      } catch (_) {
        uploadedPaths = [req.body.fotos];
      }
    } else if (req.body.foto && req.body.foto.trim()) {
      uploadedPaths = [req.body.foto.trim()];
    }

    if (uploadedPaths.length > 0) {
      // Clear previous sampul and update with first new image
      await execute('DELETE FROM artikel_gambar WHERE artikel_id = ?', [id]);
      for (let i = 0; i < uploadedPaths.length; i++) {
        const isSampul = (i === 0) ? 1 : 0;
        await execute(`
          INSERT INTO artikel_gambar (artikel_id, path, caption, is_sampul, urutan)
          VALUES (?, ?, ?, ?, ?)
        `, [id, uploadedPaths[i], newJudul, isSampul, i + 1]);
      }
    }

    const adminUser = req.user ? req.user.username : 'admin';
    await logActivity(
      adminUser,
      'UPDATE_ARTICLE',
      `Memperbarui artikel: ${newJudul} (${newStatus})`,
      { entitas: 'artikel', entitas_id: String(id) }
    );

    await db.syncFromMySQL().catch(e => console.warn('Sync memory notice:', e.message));

    return res.json({
      success: true,
      message: 'Artikel berhasil diperbarui.',
      data: { id, judul: newJudul, status: newStatus }
    });
  } catch (err) {
    console.error('Error updateArticle MySQL:', err);
    return res.status(500).json({ success: false, message: 'Gagal memperbarui artikel: ' + err.message });
  }
};

exports.deleteArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await query('SELECT id, judul FROM artikel WHERE id = ?', [id]);

    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Artikel tidak ditemukan.' });
    }

    const title = existing[0].judul;
    await execute('DELETE FROM artikel_gambar WHERE artikel_id = ?', [id]);
    await execute('DELETE FROM artikel WHERE id = ?', [id]);

    const adminUser = req.user ? req.user.username : 'admin';
    await logActivity(
      adminUser,
      'DELETE_ARTICLE',
      `Menghapus artikel: ${title}`,
      { entitas: 'artikel', entitas_id: String(id) }
    );

    await db.syncFromMySQL().catch(e => console.warn('Sync memory notice:', e.message));

    return res.json({
      success: true,
      message: `Artikel '${title}' berhasil dihapus secara permanen.`
    });
  } catch (err) {
    console.error('Error deleteArticle MySQL:', err);
    return res.status(500).json({ success: false, message: 'Gagal menghapus artikel: ' + err.message });
  }
};


// ============================================================================
// 2. CMS STRUKTUR ORGANISASI (tabel bagan_struktur, periode_kepengurusan)
// ============================================================================
exports.getStrukturOrganisasi = async (req, res) => {
  try {
    const rows = await query(`
      SELECT 
        bs.id,
        bs.judul AS keterangan,
        bs.gambar_path,
        bs.gambar_path AS foto,
        pk.nama AS periode,
        pk.id AS periode_id,
        bs.is_aktif,
        DATE_FORMAT(bs.uploaded_at, '%Y-%m-%d %H:%i') AS uploaded_at
      FROM bagan_struktur bs
      JOIN periode_kepengurusan pk ON pk.id = bs.periode_kepengurusan_id
      WHERE bs.is_aktif = 1 AND pk.is_current = 1
      ORDER BY bs.uploaded_at DESC
      LIMIT 1
    `);

    if (rows.length === 0) {
      // Fallback to latest available
      const latest = await query(`
        SELECT 
          bs.id,
          bs.judul AS keterangan,
          bs.gambar_path,
          bs.gambar_path AS foto,
          pk.nama AS periode,
          pk.id AS periode_id,
          bs.is_aktif,
          DATE_FORMAT(bs.uploaded_at, '%Y-%m-%d %H:%i') AS uploaded_at
        FROM bagan_struktur bs
        JOIN periode_kepengurusan pk ON pk.id = bs.periode_kepengurusan_id
        ORDER BY bs.id DESC
        LIMIT 1
      `);

      if (latest.length > 0) {
        return res.json({ success: true, data: latest[0] });
      }

      return res.json({
        success: true,
        data: {
          periode: '2025/2026',
          keterangan: 'Bagan Struktur Organisasi Resmi Mapala UNAND Periode 2025/2026',
          foto: '/images/struktur-organisasi.svg',
          gambar_path: '/images/struktur-organisasi.svg'
        }
      });
    }

    return res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('Error getStrukturOrganisasi MySQL:', err);
    return res.status(500).json({ success: false, message: 'Gagal memuat bagan struktur: ' + err.message });
  }
};

exports.updateStrukturOrganisasi = async (req, res) => {
  try {
    const { periode, keterangan } = req.body;

    const periodeNama = (periode && periode.trim()) ? periode.trim() : '2025/2026';
    const judulBagan = (keterangan && keterangan.trim())
      ? keterangan.trim()
      : `Bagan Struktur Organisasi Resmi Mapala UNAND Periode ${periodeNama}`;

    // 1. Resolve image path
    let gambarPath = null;
    if (req.file) {
      gambarPath = `/uploads/${req.file.filename}`;
    } else if (req.files && req.files.length > 0) {
      gambarPath = `/uploads/${req.files[0].filename}`;
    } else if (req.body.foto && req.body.foto.trim()) {
      gambarPath = req.body.foto.trim();
    }

    // 2. Parse tahun mulai & selesai from periode name (e.g. 2025/2026)
    const match = periodeNama.match(/(\d{4})\/(\d{4})/);
    const startYear = match ? Number(match[1]) : 2025;
    const endYear = match ? Number(match[2]) : (startYear + 1);

    // 3. Find or create `periode_kepengurusan`
    let periodeId = null;
    const pRows = await query('SELECT id FROM periode_kepengurusan WHERE nama = ? LIMIT 1', [periodeNama]);
    if (pRows.length > 0) {
      periodeId = pRows[0].id;
    } else {
      // Deactivate other current periods
      await execute('UPDATE periode_kepengurusan SET is_current = 0 WHERE is_current = 1');
      const insP = await execute(
        'INSERT INTO periode_kepengurusan (nama, tahun_mulai, tahun_selesai, is_current) VALUES (?, ?, ?, 1)',
        [periodeNama, startYear, endYear]
      );
      periodeId = insP.insertId;
    }

    // Ensure this period is current
    await execute('UPDATE periode_kepengurusan SET is_current = 0 WHERE id != ? AND is_current = 1', [periodeId]);
    await execute('UPDATE periode_kepengurusan SET is_current = 1 WHERE id = ?', [periodeId]);

    // If no new image was uploaded, get the current one
    if (!gambarPath) {
      const curBagan = await query('SELECT gambar_path FROM bagan_struktur WHERE periode_kepengurusan_id = ? ORDER BY id DESC LIMIT 1', [periodeId]);
      if (curBagan.length > 0) {
        gambarPath = curBagan[0].gambar_path;
      } else {
        gambarPath = '/images/struktur-organisasi.svg';
      }
    }

    // 4. Update existing bagan or insert new
    // Note MySQL schema unique constraint: `aktif_unik` allows only one is_aktif = 1 per periode_kepengurusan_id
    await execute('UPDATE bagan_struktur SET is_aktif = 0 WHERE periode_kepengurusan_id = ?', [periodeId]);

    const insBagan = await execute(`
      INSERT INTO bagan_struktur (periode_kepengurusan_id, judul, gambar_path, is_aktif)
      VALUES (?, ?, ?, 1)
    `, [periodeId, judulBagan, gambarPath]);

    const adminUser = req.user ? req.user.username : 'admin';
    await logActivity(
      adminUser,
      'UPDATE_STRUKTUR',
      `Memperbarui gambar bagan struktur organisasi periode ${periodeNama} (${judulBagan})`,
      { entitas: 'bagan_struktur', entitas_id: String(insBagan.insertId) }
    );

    await db.syncFromMySQL().catch(e => console.warn('Sync memory notice:', e.message));

    return res.json({
      success: true,
      message: 'Bagan struktur organisasi berhasil disimpan dan dipublikasikan.',
      data: {
        id: insBagan.insertId,
        periode: periodeNama,
        keterangan: judulBagan,
        foto: gambarPath,
        gambar_path: gambarPath
      }
    });
  } catch (err) {
    console.error('Error updateStrukturOrganisasi MySQL:', err);
    return res.status(500).json({ success: false, message: 'Gagal memperbarui bagan struktur: ' + err.message });
  }
};


// ============================================================================
// 3. CMS PRESTASI & PENGHARGAAN (tabel prestasi)
// ============================================================================
exports.getPrestasi = async (req, res) => {
  try {
    const rows = await query(`
      SELECT 
        id,
        tahun,
        kategori,
        judul,
        deskripsi,
        info_label_1,
        info_label_2,
        COALESCE(gambar_path, '/images/trophy-achievement.jpg') AS foto,
        gambar_path,
        gambar_caption,
        is_sorotan,
        sorotan_judul,
        sorotan_subjudul,
        sorotan_detail,
        urutan
      FROM prestasi
      ORDER BY tahun DESC, urutan ASC, id DESC
    `);

    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Error getPrestasi MySQL:', err);
    return res.status(500).json({ success: false, message: 'Gagal memuat prestasi: ' + err.message });
  }
};

exports.createPrestasi = async (req, res) => {
  try {
    const {
      tahun,
      judul,
      deskripsi,
      kategori,
      is_sorotan,
      sorotan_judul,
      sorotan_subjudul,
      sorotan_detail,
      info_label_1,
      info_label_2,
      gambar_caption
    } = req.body;

    if (!judul || !judul.trim() || !tahun || !deskripsi) {
      return res.status(400).json({ success: false, message: 'Tahun, Judul Prestasi, dan Deskripsi wajib diisi.' });
    }

    let foto = null;
    if (req.file) {
      foto = `/uploads/${req.file.filename}`;
    } else if (req.body.foto && req.body.foto.trim()) {
      foto = req.body.foto.trim();
    } else {
      foto = '/images/trophy-achievement.jpg';
    }

    const isSorotanVal = (is_sorotan === '1' || is_sorotan === 1 || is_sorotan === true || is_sorotan === 'true' || is_sorotan === 'on') ? 1 : 0;
    const sorotanJudulVal = sorotan_judul || judul.trim();
    const sorotanSubVal = sorotan_subjudul || `Tahun ${tahun}`;
    const sorotanDetVal = sorotan_detail || (deskripsi.trim().slice(0, 140));

    const ins = await execute(`
      INSERT INTO prestasi (
        tahun, kategori, judul, deskripsi, info_label_1, info_label_2,
        gambar_path, gambar_caption, is_sorotan, sorotan_judul, sorotan_subjudul, sorotan_detail
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      Number(tahun),
      kategori || 'Kompetisi',
      judul.trim(),
      deskripsi.trim(),
      info_label_1 || null,
      info_label_2 || null,
      foto,
      gambar_caption || judul.trim(),
      isSorotanVal,
      sorotanJudulVal,
      sorotanSubVal,
      sorotanDetVal
    ]);

    const adminUser = req.user ? req.user.username : 'admin';
    await logActivity(
      adminUser,
      'CREATE_PRESTASI',
      `Menambahkan prestasi: ${judul.trim()} (${tahun}) ${isSorotanVal ? '[Sorotan Beranda]' : ''}`,
      { entitas: 'prestasi', entitas_id: String(ins.insertId) }
    );

    await db.syncFromMySQL().catch(e => console.warn('Sync memory notice:', e.message));

    return res.status(201).json({
      success: true,
      message: 'Prestasi baru berhasil ditambahkan.',
      data: {
        id: ins.insertId,
        tahun: Number(tahun),
        judul: judul.trim(),
        deskripsi: deskripsi.trim(),
        foto,
        is_sorotan: isSorotanVal
      }
    });
  } catch (err) {
    console.error('Error createPrestasi MySQL:', err);
    return res.status(500).json({ success: false, message: 'Gagal menambahkan prestasi: ' + err.message });
  }
};

exports.updatePrestasi = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      tahun,
      judul,
      deskripsi,
      kategori,
      is_sorotan,
      sorotan_judul,
      sorotan_subjudul,
      sorotan_detail,
      info_label_1,
      info_label_2
    } = req.body;

    const existing = await query('SELECT * FROM prestasi WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Data prestasi tidak ditemukan.' });
    }
    const current = existing[0];

    let foto = current.gambar_path;
    if (req.file) {
      foto = `/uploads/${req.file.filename}`;
    } else if (req.body.foto && req.body.foto.trim()) {
      foto = req.body.foto.trim();
    }

    const newTahun = tahun ? Number(tahun) : current.tahun;
    const newJudul = judul ? judul.trim() : current.judul;
    const newDeskripsi = deskripsi ? deskripsi.trim() : current.deskripsi;
    const isSorotanVal = (is_sorotan !== undefined)
      ? ((is_sorotan === '1' || is_sorotan === 1 || is_sorotan === true || is_sorotan === 'true' || is_sorotan === 'on') ? 1 : 0)
      : current.is_sorotan;

    await execute(`
      UPDATE prestasi SET
        tahun = ?,
        kategori = ?,
        judul = ?,
        deskripsi = ?,
        info_label_1 = ?,
        info_label_2 = ?,
        gambar_path = ?,
        is_sorotan = ?,
        sorotan_judul = ?,
        sorotan_subjudul = ?,
        sorotan_detail = ?
      WHERE id = ?
    `, [
      newTahun,
      kategori || current.kategori,
      newJudul,
      newDeskripsi,
      info_label_1 !== undefined ? info_label_1 : current.info_label_1,
      info_label_2 !== undefined ? info_label_2 : current.info_label_2,
      foto,
      isSorotanVal,
      sorotan_judul || newJudul,
      sorotan_subjudul || `Tahun ${newTahun}`,
      sorotan_detail || newDeskripsi.slice(0, 140),
      id
    ]);

    const adminUser = req.user ? req.user.username : 'admin';
    await logActivity(
      adminUser,
      'UPDATE_PRESTASI',
      `Memperbarui prestasi: ${newJudul} (${newTahun})`,
      { entitas: 'prestasi', entitas_id: String(id) }
    );

    await db.syncFromMySQL().catch(e => console.warn('Sync memory notice:', e.message));

    return res.json({
      success: true,
      message: 'Data prestasi berhasil diperbarui.',
      data: { id, judul: newJudul, tahun: newTahun, is_sorotan: isSorotanVal }
    });
  } catch (err) {
    console.error('Error updatePrestasi MySQL:', err);
    return res.status(500).json({ success: false, message: 'Gagal memperbarui prestasi: ' + err.message });
  }
};

exports.deletePrestasi = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await query('SELECT id, judul FROM prestasi WHERE id = ?', [id]);

    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Data prestasi tidak ditemukan.' });
    }

    const title = existing[0].judul;
    await execute('DELETE FROM prestasi WHERE id = ?', [id]);

    const adminUser = req.user ? req.user.username : 'admin';
    await logActivity(
      adminUser,
      'DELETE_PRESTASI',
      `Menghapus prestasi: ${title}`,
      { entitas: 'prestasi', entitas_id: String(id) }
    );

    await db.syncFromMySQL().catch(e => console.warn('Sync memory notice:', e.message));

    return res.json({
      success: true,
      message: `Prestasi '${title}' berhasil dihapus.`
    });
  } catch (err) {
    console.error('Error deletePrestasi MySQL:', err);
    return res.status(500).json({ success: false, message: 'Gagal menghapus prestasi: ' + err.message });
  }
};

const DEFAULT_PRESTASI_BOXES = [
  { id: 1, title: 'Juara 1', sub: 'Ekspedisi Navigasi Nasional' },
  { id: 2, title: 'Kalpataru', sub: 'Apresiasi Konservasi Kampus' },
  { id: 3, title: '7 Summits', sub: 'Jalur Ekspedisi Nusantara' },
  { id: 4, title: '30+ Riset', sub: 'Publikasi Ilmiah & Speleologi' }
];

exports.getPrestasiBoxes = async (req, res) => {
  try {
    const rows = await query("SELECT nilai FROM konten_statis WHERE kunci = 'prestasi_boxes' LIMIT 1");
    if (rows.length > 0 && rows[0].nilai) {
      try {
        const parsed = JSON.parse(rows[0].nilai);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return res.json({ success: true, data: parsed });
        }
      } catch (_) {}
    }
    return res.json({ success: true, data: DEFAULT_PRESTASI_BOXES });
  } catch (err) {
    console.error('Error getPrestasiBoxes:', err);
    return res.status(500).json({ success: false, message: 'Gagal memuat data kolom prestasi: ' + err.message });
  }
};

exports.updatePrestasiBoxes = async (req, res) => {
  try {
    const { boxes } = req.body;
    if (!boxes || !Array.isArray(boxes)) {
      return res.status(400).json({ success: false, message: 'Data boxes harus berupa array 4 item.' });
    }

    const cleanBoxes = boxes.slice(0, 4).map((b, idx) => ({
      id: idx + 1,
      title: (b.title || '').trim(),
      sub: (b.sub || '').trim()
    }));

    const jsonVal = JSON.stringify(cleanBoxes);
    await execute(`
      INSERT INTO konten_statis (kunci, nilai, kelompok)
      VALUES ('prestasi_boxes', ?, 'prestasi')
      ON DUPLICATE KEY UPDATE nilai = VALUES(nilai), kelompok = VALUES(kelompok)
    `, [jsonVal]);

    const adminUser = req.user ? req.user.username : 'admin';
    await logActivity(
      adminUser,
      'UPDATE_PRESTASI_BOXES',
      'Memperbarui 4 kolom sorotan prestasi beranda',
      { entitas: 'konten_statis', entitas_id: 'prestasi_boxes' }
    );

    await db.syncFromMySQL().catch(e => console.warn('Sync memory notice:', e.message));

    return res.json({
      success: true,
      message: '4 Kolom capaian prestasi beranda berhasil diperbarui.',
      data: cleanBoxes
    });
  } catch (err) {
    console.error('Error updatePrestasiBoxes:', err);
    return res.status(500).json({ success: false, message: 'Gagal memperbarui kolom prestasi: ' + err.message });
  }
};


// ============================================================================
// 4. CMS KONTEN STATIS & KONTAK (tabel konten_statis, misi_poin, tautan_sosial)
// ============================================================================
exports.getStaticContent = async (req, res) => {
  try {
    const rows = await query('SELECT kunci, nilai, kelompok FROM konten_statis');
    const staticMap = {};
    rows.forEach(r => { staticMap[r.kunci] = r.nilai; });

    const missionRows = await query('SELECT id, teks, urutan FROM misi_poin ORDER BY urutan ASC');
    const missionText = missionRows.map(m => m.teks).join('\n');

    const socialRows = await query('SELECT platform, url FROM tautan_sosial');
    const socialMap = {};
    socialRows.forEach(s => { socialMap[s.platform.toLowerCase()] = s.url; });

    const responseData = {
      tentang_kami: {
        sejarah: staticMap['sejarah'] || '',
        sejarah_foto: staticMap['sejarah_foto'] || '/images/about-unand.jpg',
        visi: staticMap['visi'] || '',
        misi: missionText,
        misi_poin: missionRows,
        kode_etik: staticMap['kode_etik'] || ''
      },
      kontak: {
        email: staticMap['kontak_email'] || 'sekretariat@mapalaunand.org',
        whatsapp: staticMap['kontak_whatsapp'] || '6281267890123',
        alamat: staticMap['kontak_alamat'] || 'Gedung Pusat Kegiatan Mahasiswa (PKM) Lantai 1, Universitas Andalas',
        instagram: socialMap['instagram'] || staticMap['kontak_instagram'] || 'https://instagram.com/mapalaunand_official',
        youtube: socialMap['youtube'] || staticMap['kontak_youtube'] || 'https://youtube.com/@mapalaunandofficial',
        facebook: socialMap['facebook'] || staticMap['kontak_facebook'] || 'https://facebook.com/mapalaunand',
        tiktok: socialMap['tiktok'] || staticMap['kontak_tiktok'] || 'https://tiktok.com/@mapalaunand'
      },
      beranda: {
        headline: staticMap['hero_tagline'] || 'Menjelajah Rimba, Menjaga Lestari, Mengabdi Sepanjang Hayat',
        subheadline: staticMap['hero_deskripsi'] || 'Wadah pembinaan karakter, kecintaan alam, dan riset konservasi keanekaragaman hayati sejak 1984.',
        hero_judul: staticMap['hero_judul'] || 'MAPALA UNAND',
        hero_foto: staticMap['hero_foto'] || '/images/hero-mountain.jpg',
        puncak_angka: staticMap['hero_stat_puncak_angka'] || '120',
        puncak_satuan: staticMap['hero_stat_puncak_satuan'] || '+ Puncak',
        puncak_label: staticMap['hero_stat_puncak_label'] || 'Sumatera & Seven Summits'
      }
    };

    return res.json({ success: true, data: responseData });
  } catch (err) {
    console.error('Error getStaticContent MySQL:', err);
    return res.status(500).json({ success: false, message: 'Gagal memuat konten statis: ' + err.message });
  }
};

async function upsertStatic(kunci, nilai, kelompok) {
  await execute(`
    INSERT INTO konten_statis (kunci, nilai, kelompok)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE nilai = VALUES(nilai), kelompok = VALUES(kelompok)
  `, [kunci, nilai, kelompok]);
}

exports.updateStaticContent = async (req, res) => {
  try {
    const { section, data } = req.body;
    if (!section || !data) {
      return res.status(400).json({ success: false, message: 'Section dan data pembaruan wajib diisi.' });
    }

    if (section === 'tentang_kami' || section === 'tentang') {
      if (data.sejarah !== undefined) {
        await upsertStatic('sejarah', data.sejarah.trim(), 'tentang');
      }
      if (data.visi !== undefined) {
        await upsertStatic('visi', data.visi.trim(), 'tentang');
      }
      if (data.kode_etik !== undefined) {
        await upsertStatic('kode_etik', data.kode_etik.trim(), 'tentang');
      }

      // Pembaruan poin misi (tabel misi_poin)
      if (data.misi !== undefined) {
        let points = [];
        if (Array.isArray(data.misi)) {
          points = data.misi.map(p => typeof p === 'string' ? p : p.teks).filter(Boolean);
        } else if (typeof data.misi === 'string') {
          points = data.misi
            .split('\n')
            .map(line => line.replace(/^[\s\-\*\d\.\)]+/, '').trim())
            .filter(line => line.length > 0);
        }

        if (points.length > 0) {
          await execute('DELETE FROM misi_poin');
          for (let i = 0; i < points.length; i++) {
            await execute('INSERT INTO misi_poin (teks, urutan) VALUES (?, ?)', [points[i], i + 1]);
          }
        }
      }
    } else if (section === 'kontak') {
      if (data.email !== undefined) {
        await upsertStatic('kontak_email', data.email.trim(), 'kontak');
      }
      if (data.whatsapp !== undefined) {
        // Strip out non-digit except possible leading numbers
        const cleanWA = data.whatsapp.replace(/[^\d]/g, '');
        await upsertStatic('kontak_whatsapp', cleanWA, 'kontak');
      }
      if (data.alamat !== undefined) {
        await upsertStatic('kontak_alamat', data.alamat.trim(), 'kontak');
      }

      // Helper untuk menetapkan tepat 1 tautan resmi per masing-masing platform
      const upsertSingleSocial = async (platformName, rawUrl, urutan) => {
        if (!rawUrl || !rawUrl.trim()) return;
        let url = rawUrl.trim();
        if (platformName === 'Instagram' && !url.startsWith('http')) {
          url = `https://instagram.com/${url.replace('@', '')}`;
        }
        // Hapus entri lama platform ini untuk menjamin tepat 1 link per platform
        await execute('DELETE FROM tautan_sosial WHERE LOWER(platform) = LOWER(?)', [platformName]);
        await execute('INSERT INTO tautan_sosial (platform, url, urutan) VALUES (?, ?, ?)', [platformName, url, urutan]);
      };

      // Social Links (Tepat 1 link per platform resmi)
      if (data.instagram !== undefined && data.instagram.trim()) {
        await upsertStatic('kontak_instagram', data.instagram.trim(), 'kontak');
        await upsertSingleSocial('Instagram', data.instagram, 1);
      }
      if (data.youtube !== undefined && data.youtube.trim()) {
        await upsertStatic('kontak_youtube', data.youtube.trim(), 'kontak');
        await upsertSingleSocial('YouTube', data.youtube, 2);
      }
      if (data.facebook !== undefined && data.facebook.trim()) {
        await upsertStatic('kontak_facebook', data.facebook.trim(), 'kontak');
        await upsertSingleSocial('Facebook', data.facebook, 3);
      }
      if (data.tiktok !== undefined && data.tiktok.trim()) {
        await upsertStatic('kontak_tiktok', data.tiktok.trim(), 'kontak');
        await upsertSingleSocial('TikTok', data.tiktok, 4);
      }
    } else if (section === 'beranda') {
      if (data.headline !== undefined) {
        await upsertStatic('hero_tagline', data.headline.trim(), 'beranda');
      }
      if (data.subheadline !== undefined) {
        await upsertStatic('hero_deskripsi', data.subheadline.trim(), 'beranda');
      }
      if (data.hero_judul !== undefined) {
        await upsertStatic('hero_judul', data.hero_judul.trim(), 'beranda');
      }
      if (data.puncak_angka !== undefined) {
        await upsertStatic('hero_stat_puncak_angka', String(data.puncak_angka).trim(), 'beranda');
      }
      if (data.puncak_satuan !== undefined) {
        await upsertStatic('hero_stat_puncak_satuan', String(data.puncak_satuan).trim(), 'beranda');
      }
      if (data.puncak_label !== undefined) {
        await upsertStatic('hero_stat_puncak_label', String(data.puncak_label).trim(), 'beranda');
      }
    }

    const adminUser = req.user ? req.user.username : 'admin';
    await logActivity(
      adminUser,
      'UPDATE_STATIC_CONTENT',
      `Memperbarui konten statis bagian ${section}`,
      { entitas: 'konten_statis', entitas_id: section }
    );

    await db.syncFromMySQL().catch(e => console.warn('Sync memory notice:', e.message));

    return res.json({
      success: true,
      message: `Konten publik bagian ${section} berhasil diperbarui di database.`
    });
  } catch (err) {
    console.error('Error updateStaticContent MySQL:', err);
    return res.status(500).json({ success: false, message: 'Gagal memperbarui konten statis: ' + err.message });
  }
};


// ============================================================================
// 5. LEGACY PENGURUS HANDLERS (untuk kompatibilitas)
// ============================================================================
exports.getPengurus = (req, res) => {
  const pengurus = db.get('pengurus') || [];
  return res.json({ success: true, data: pengurus });
};

exports.createPengurus = (req, res) => {
  const { nama, jabatan, bidang, periode } = req.body;
  const pengurus = db.get('pengurus') || [];
  let foto = req.file ? `/uploads/${req.file.filename}` : (req.body.foto || '/images/about-unand.jpg');
  const newPengurus = {
    id: `PGR-${Date.now()}`,
    nama: (nama || '').trim(),
    jabatan: (jabatan || '').trim(),
    bidang: (bidang || '').trim(),
    foto,
    periode: periode || '2025/2026'
  };
  pengurus.push(newPengurus);
  db.set('pengurus', pengurus);
  return res.status(201).json({ success: true, data: newPengurus });
};

exports.deletePengurus = (req, res) => {
  const { id } = req.params;
  const pengurus = db.get('pengurus') || [];
  const index = pengurus.findIndex(p => p.id === id);
  if (index !== -1) pengurus.splice(index, 1);
  db.set('pengurus', pengurus);
  return res.json({ success: true, message: 'Pengurus dihapus.' });
};
