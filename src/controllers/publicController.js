const { query } = require('../config/mysql');

// GET /api/public/content/beranda
exports.getBerandaContent = async (req, res) => {
  try {
    // 1. Static keys for hero & description
    const staticRows = await query(`
      SELECT kunci, nilai FROM konten_statis WHERE kelompok IN ('beranda', 'tentang', 'kontak', 'footer')
    `);
    const staticMap = {};
    staticRows.forEach(r => { staticMap[r.kunci] = r.nilai; });

    // 2. Statistics cards
    const statsRows = await query(`
      SELECT id, ikon, angka, satuan, label FROM statistik_beranda ORDER BY urutan ASC
    `);

    // 3. Latest published articles
    const articleRows = await query(`
      SELECT a.id, a.judul, a.slug, k.nama AS kategori, d.nama AS divisi,
             a.lokasi_id, COALESCE(l.nama, 'Sumatera Barat') AS lokasi,
             a.ringkasan, a.status_kegiatan, a.tim_capaian,
             DATE_FORMAT(a.tanggal_kegiatan, '%d %M %Y') AS tanggal,
             COALESCE(ag.path, '/images/hero-mountain.jpg') AS foto_sampul
      FROM artikel a
      JOIN kategori_artikel k ON k.id = a.kategori_id
      LEFT JOIN divisi d ON d.id = a.divisi_id
      LEFT JOIN lokasi l ON l.id = a.lokasi_id
      LEFT JOIN artikel_gambar ag ON ag.artikel_id = a.id AND ag.is_sampul = 1
      WHERE a.status_publikasi = 'terbit'
      ORDER BY a.tanggal_kegiatan DESC LIMIT 6
    `);

    // 4. Active divisions
    const divRows = await query(`
      SELECT id, nama, slug, ikon, deskripsi FROM divisi WHERE aktif = 1 ORDER BY urutan ASC
    `);

    // 5. Current active organigram structure
    const structureRows = await query(`
      SELECT bs.judul AS judul_bagan, bs.gambar_path AS gambar_url, pk.nama AS periode
      FROM bagan_struktur bs
      JOIN periode_kepengurusan pk ON pk.id = bs.periode_kepengurusan_id
      WHERE bs.is_aktif = 1 AND pk.is_current = 1
      LIMIT 1
    `);

    // 6. Highlighted achievements (is_sorotan = 1)
    const highlightRows = await query(`
      SELECT id, tahun, sorotan_judul AS judul, sorotan_subjudul AS subjudul,
             sorotan_detail AS detail, COALESCE(gambar_path, '/images/trophy-achievement.jpg') AS gambar_url,
             COALESCE(gambar_caption, judul) AS caption
      FROM prestasi WHERE is_sorotan = 1 ORDER BY urutan ASC LIMIT 4
    `);

    return res.json({
      success: true,
      message: 'Data beranda berhasil dimuat dari database.',
      data: {
        hero: {
          judul: staticMap['hero_judul'] || 'MAPALA UNAND',
          tagline: staticMap['hero_tagline'] || 'Menjelajah Rimba, Menjaga Lestari, Mengabdi Sepanjang Hayat',
          deskripsi: staticMap['hero_deskripsi'] || 'Wadah pembinaan karakter dan konservasi sejak 1984.',
          foto_url: staticMap['hero_foto'] || '/images/hero-mountain.jpg'
        },
        statistik: statsRows,
        kegiatan_terbaru: articleRows,
        divisi_list: divRows,
        struktur_ringkas: structureRows[0] || {
          periode: '2025/2026',
          judul_bagan: 'Bagan Struktur Resmi Mapala UNAND',
          gambar_url: '/images/struktur-organisasi.svg'
        },
        sorotan_prestasi: highlightRows
      }
    });
  } catch (err) {
    console.error('Error getBerandaContent:', err);
    return res.status(500).json({ success: false, message: 'Gagal memuat data beranda dari database.' });
  }
};

// GET /api/public/content/tentang-kami
exports.getTentangKamiContent = async (req, res) => {
  try {
    const staticRows = await query(`SELECT kunci, nilai FROM konten_statis WHERE kelompok = 'tentang'`);
    const staticMap = {};
    staticRows.forEach(r => { staticMap[r.kunci] = r.nilai; });

    const missionRows = await query(`SELECT id, teks, urutan FROM misi_poin ORDER BY urutan ASC`);

    return res.json({
      success: true,
      data: {
        sejarah: staticMap['sejarah'],
        sejarah_foto: staticMap['sejarah_foto'] || '/images/about-unand.jpg',
        sejarah_foto_caption: staticMap['sejarah_foto_caption'] || 'Dokumentasi perintis Mapala UNAND',
        visi: staticMap['visi'],
        misi: missionRows,
        kode_etik: staticMap['kode_etik'],
        kode_etik_keterangan: staticMap['kode_etik_keterangan']
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/public/content/kontak
exports.getKontakContent = async (req, res) => {
  try {
    const staticRows = await query(`SELECT kunci, nilai FROM konten_statis WHERE kelompok IN ('kontak', 'footer')`);
    const staticMap = {};
    staticRows.forEach(r => { staticMap[r.kunci] = r.nilai; });

    const socialRows = await query(`SELECT platform, url, urutan FROM tautan_sosial ORDER BY urutan ASC`);

    return res.json({
      success: true,
      data: {
        email: staticMap['kontak_email'] || 'sekretariat@mapalaunand.org',
        whatsapp: staticMap['kontak_whatsapp'] || '6281267890123',
        alamat: staticMap['kontak_alamat'] || 'Gedung PKM Lt. 1 Universitas Andalas',
        footer_deskripsi: staticMap['footer_deskripsi'] || 'Organisasi kepencintaalaman pelopor konservasi sejak 1984.',
        social_links: socialRows
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/public/content/struktur-organisasi
exports.getStrukturOrganisasi = async (req, res) => {
  try {
    const rows = await query(`
      SELECT bs.id, bs.judul, bs.gambar_path, bs.uploaded_at,
             pk.nama AS periode, pk.tahun_mulai, pk.tahun_selesai
      FROM bagan_struktur bs
      JOIN periode_kepengurusan pk ON pk.id = bs.periode_kepengurusan_id
      WHERE bs.is_aktif = 1 AND pk.is_current = 1
      LIMIT 1
    `);

    if (rows.length === 0) {
      return res.json({
        success: true,
        data: {
          judul: 'Bagan Struktur Kepengurusan Mapala UNAND',
          periode: '2025/2026',
          gambar_path: '/images/struktur-organisasi.svg'
        }
      });
    }

    return res.json({ success: true, data: rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/public/divisions
exports.getDivisions = async (req, res) => {
  try {
    const rows = await query(`SELECT id, nama, slug, ikon, deskripsi FROM divisi WHERE aktif = 1 ORDER BY urutan ASC`);
    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/public/filters
exports.getFilters = async (req, res) => {
  try {
    const divisions = await query(`SELECT id, nama, slug FROM divisi WHERE aktif = 1 ORDER BY urutan ASC`);
    const locations = await query(`SELECT id, nama, slug FROM lokasi ORDER BY id ASC`);
    const schedules = await query(`SELECT id, nama, slug FROM jadwal_operasional ORDER BY id ASC`);

    return res.json({
      success: true,
      data: { divisions, locations, schedules }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/public/articles
exports.getArticles = async (req, res) => {
  try {
    const { kategori, divisi, q } = req.query;
    let sql = `
      SELECT a.id, a.judul, a.slug, k.nama AS kategori, k.slug AS kategori_slug,
             d.nama AS divisi, d.slug AS divisi_slug,
             COALESCE(l.nama, 'Sumatera Barat') AS lokasi,
             a.ringkasan, a.status_kegiatan, a.tim_capaian,
             DATE_FORMAT(a.tanggal_kegiatan, '%d %M %Y') AS tanggal,
             COALESCE(ag.path, '/images/hero-mountain.jpg') AS foto_sampul
      FROM artikel a
      JOIN kategori_artikel k ON k.id = a.kategori_id
      LEFT JOIN divisi d ON d.id = a.divisi_id
      LEFT JOIN lokasi l ON l.id = a.lokasi_id
      LEFT JOIN artikel_gambar ag ON ag.artikel_id = a.id AND ag.is_sampul = 1
      WHERE a.status_publikasi = 'terbit'
    `;
    const params = [];

    if (kategori && kategori !== 'semua') {
      sql += ` AND k.slug = ?`;
      params.push(kategori);
    }
    if (divisi) {
      sql += ` AND d.slug = ?`;
      params.push(divisi);
    }
    if (q) {
      sql += ` AND (a.judul LIKE ? OR a.ringkasan LIKE ?)`;
      params.push(`%${q}%`, `%${q}%`);
    }

    sql += ` ORDER BY a.tanggal_kegiatan DESC`;

    const rows = await query(sql, params);
    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/public/articles/:slug
exports.getArticleDetail = async (req, res) => {
  try {
    const { slug } = req.params;
    const rows = await query(`
      SELECT a.id, a.judul, a.slug, k.nama AS kategori, k.slug AS kategori_slug,
             d.nama AS divisi, COALESCE(l.nama, 'Sumatera Barat') AS lokasi,
             a.ringkasan, a.isi, a.status_kegiatan, a.tim_capaian,
             DATE_FORMAT(a.tanggal_kegiatan, '%d %M %Y') AS tanggal,
             COALESCE(u.username, 'Humas Mapala UNAND') AS penulis,
             COALESCE(ag.path, '/images/hero-mountain.jpg') AS foto_sampul
      FROM artikel a
      JOIN kategori_artikel k ON k.id = a.kategori_id
      LEFT JOIN divisi d ON d.id = a.divisi_id
      LEFT JOIN lokasi l ON l.id = a.lokasi_id
      LEFT JOIN artikel_gambar ag ON ag.artikel_id = a.id AND ag.is_sampul = 1
      LEFT JOIN users u ON u.id = a.penulis_id
      WHERE a.slug = ? OR a.id = ?
      LIMIT 1
    `, [slug, slug]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Artikel atau kegiatan tidak ditemukan.' });
    }

    const article = rows[0];

    // Get gallery photos
    const gallery = await query(`
      SELECT id, path, caption, is_sampul FROM artikel_gambar WHERE artikel_id = ? ORDER BY urutan ASC
    `, [article.id]);

    article.galeri = gallery;

    // Get related articles
    const related = await query(`
      SELECT a.id, a.judul, a.slug, COALESCE(ag.path, '/images/hero-mountain.jpg') AS foto_sampul
      FROM artikel a
      LEFT JOIN artikel_gambar ag ON ag.artikel_id = a.id AND ag.is_sampul = 1
      WHERE a.id != ? AND a.status_publikasi = 'terbit'
      LIMIT 3
    `, [article.id]);

    article.artikel_terkait = related;

    return res.json({ success: true, data: article });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/public/categories
exports.getCategories = async (req, res) => {
  try {
    const rows = await query(`SELECT id, nama, slug, urutan FROM kategori_artikel ORDER BY urutan ASC`);
    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/public/prestasi
exports.getPrestasi = async (req, res) => {
  try {
    const rows = await query(`
      SELECT id, tahun, kategori, judul, deskripsi, info_label_1, info_label_2,
             COALESCE(gambar_path, '/images/trophy-achievement.jpg') AS foto,
             gambar_caption, is_sorotan
      FROM prestasi ORDER BY tahun DESC, urutan ASC
    `);
    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
