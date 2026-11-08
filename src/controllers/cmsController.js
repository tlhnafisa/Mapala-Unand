const db = require('../config/db');
const { logActivity } = require('../services/loggerService');

// ARTICLES & ACTIVITIES (P-02, FR-05, FR-39: Mendukung beberapa gambar per artikel)
exports.getArticles = (req, res) => {
  const articles = db.get('articles');
  return res.json({ success: true, data: articles });
};

exports.createArticle = (req, res) => {
  const { judul, kategori, tanggal, status, penulis, isi } = req.body;

  if (!judul || !kategori || !isi) {
    return res.status(400).json({ success: false, message: 'Judul, Kategori, dan Isi artikel wajib diisi.' });
  }

  const articles = db.get('articles');

  // Multi-image collection (P-02)
  let fotos = [];
  if (req.files && Array.isArray(req.files) && req.files.length > 0) {
    fotos = req.files.map(f => `/uploads/${f.filename}`);
  } else if (req.file) {
    fotos = [`/uploads/${req.file.filename}`];
  } else if (req.body.fotos) {
    try {
      fotos = Array.isArray(req.body.fotos) ? req.body.fotos : JSON.parse(req.body.fotos);
    } catch (_) {
      fotos = [req.body.fotos];
    }
  } else if (req.body.foto) {
    fotos = [req.body.foto];
  } else {
    fotos = ['https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80'];
  }

  const primaryFoto = fotos[0] || 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80';

  const newArticle = {
    id: `ART-${Date.now()}`,
    judul: judul.trim(),
    kategori,
    foto: primaryFoto,
    fotos: fotos,
    tanggal: tanggal || new Date().toISOString().split('T')[0],
    status: status || 'draf',
    penulis: penulis || 'Admin Mapala UNAND',
    isi: isi.trim()
  };

  articles.unshift(newArticle);
  db.set('articles', articles);

  logActivity(req.user.username, 'CREATE_ARTICLE', `Menambahkan artikel: ${newArticle.judul} (${newArticle.status}) dengan ${fotos.length} gambar`);

  return res.status(201).json({
    success: true,
    message: `Artikel berhasil disimpan ${newArticle.status === 'terbit' ? 'dan dipublikasikan' : 'sebagai draf'}.`,
    data: newArticle
  });
};

exports.updateArticle = (req, res) => {
  const { id } = req.params;
  const { judul, kategori, tanggal, status, penulis, isi } = req.body;

  const articles = db.get('articles');
  const index = articles.findIndex(a => a.id === id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Artikel tidak ditemukan.' });
  }

  // Handle multi-image updates (P-02)
  let fotos = articles[index].fotos || (articles[index].foto ? [articles[index].foto] : []);
  if (req.files && Array.isArray(req.files) && req.files.length > 0) {
    fotos = req.files.map(f => `/uploads/${f.filename}`);
  } else if (req.file) {
    fotos = [`/uploads/${req.file.filename}`];
  } else if (req.body.fotos) {
    try {
      fotos = Array.isArray(req.body.fotos) ? req.body.fotos : JSON.parse(req.body.fotos);
    } catch (_) {
      fotos = [req.body.fotos];
    }
  }

  const primaryFoto = fotos[0] || articles[index].foto;

  articles[index] = {
    ...articles[index],
    judul: judul || articles[index].judul,
    kategori: kategori || articles[index].kategori,
    foto: primaryFoto,
    fotos: fotos,
    tanggal: tanggal || articles[index].tanggal,
    status: status || articles[index].status,
    penulis: penulis || articles[index].penulis,
    isi: isi || articles[index].isi
  };

  db.set('articles', articles);

  logActivity(req.user.username, 'UPDATE_ARTICLE', `Memperbarui artikel: ${articles[index].judul}`);

  return res.json({
    success: true,
    message: 'Artikel berhasil diperbarui.',
    data: articles[index]
  });
};

exports.deleteArticle = (req, res) => {
  const { id } = req.params;
  const articles = db.get('articles');
  const index = articles.findIndex(a => a.id === id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Artikel tidak ditemukan.' });
  }

  const removed = articles.splice(index, 1)[0];
  db.set('articles', articles);

  logActivity(req.user.username, 'DELETE_ARTICLE', `Menghapus artikel: ${removed.judul}`);

  return res.json({
    success: true,
    message: `Artikel '${removed.judul}' berhasil dihapus.`
  });
};

// STRUKTUR ORGANISASI (P-01, FR-04, FR-40: Berupa gambar bagan yang diunggah admin)
exports.getStrukturOrganisasi = (req, res) => {
  const kontenStatis = db.get('kontenStatis');
  const struktur = kontenStatis.struktur_organisasi || {
    foto: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=1200&q=80',
    periode: '2025/2026',
    keterangan: 'Bagan Struktur Organisasi Resmi Mapala UNAND Periode 2025/2026',
    updated_at: new Date().toISOString()
  };
  return res.json({ success: true, data: struktur });
};

exports.updateStrukturOrganisasi = (req, res) => {
  const { periode, keterangan } = req.body;
  const kontenStatis = db.get('kontenStatis');

  let foto = kontenStatis.struktur_organisasi?.foto || 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=1200&q=80';
  if (req.file) {
    foto = `/uploads/${req.file.filename}`;
  } else if (req.files && req.files[0]) {
    foto = `/uploads/${req.files[0].filename}`;
  }

  kontenStatis.struktur_organisasi = {
    foto,
    periode: periode || kontenStatis.struktur_organisasi?.periode || '2025/2026',
    keterangan: keterangan || kontenStatis.struktur_organisasi?.keterangan || 'Bagan Struktur Organisasi Resmi Mapala UNAND',
    updated_at: new Date().toISOString()
  };

  db.set('kontenStatis', kontenStatis);

  logActivity(req.user.username, 'UPDATE_STRUKTUR', `Memperbarui gambar bagan struktur organisasi periode ${kontenStatis.struktur_organisasi.periode}`);

  return res.json({
    success: true,
    message: 'Gambar bagan struktur organisasi berhasil diperbarui.',
    data: kontenStatis.struktur_organisasi
  });
};

// PENGURUS (FR-40)
exports.getPengurus = (req, res) => {
  const pengurus = db.get('pengurus');
  return res.json({ success: true, data: pengurus });
};

exports.createPengurus = (req, res) => {
  const { nama, jabatan, bidang, periode } = req.body;

  if (!nama || !jabatan || !bidang) {
    return res.status(400).json({ success: false, message: 'Nama, Jabatan, dan Bidang pengurus wajib diisi.' });
  }

  const pengurus = db.get('pengurus');
  let foto = req.file ? `/uploads/${req.file.filename}` : (req.body.foto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80');

  const newPengurus = {
    id: `PGR-${Date.now()}`,
    nama: nama.trim(),
    jabatan: jabatan.trim(),
    bidang: bidang.trim(),
    foto,
    periode: periode || '2025/2026'
  };

  pengurus.push(newPengurus);
  db.set('pengurus', pengurus);

  logActivity(req.user.username, 'CREATE_PENGURUS', `Menambahkan pengurus: ${newPengurus.nama} (${newPengurus.jabatan})`);

  return res.status(201).json({
    success: true,
    message: 'Pengurus baru berhasil ditambahkan.',
    data: newPengurus
  });
};

exports.deletePengurus = (req, res) => {
  const { id } = req.params;
  const pengurus = db.get('pengurus');
  const index = pengurus.findIndex(p => p.id === id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Data pengurus tidak ditemukan.' });
  }

  const removed = pengurus.splice(index, 1)[0];
  db.set('pengurus', pengurus);

  logActivity(req.user.username, 'DELETE_PENGURUS', `Menghapus pengurus: ${removed.nama}`);

  return res.json({ success: true, message: `Data pengurus ${removed.nama} berhasil dihapus.` });
};

// PRESTASI (FR-41)
exports.getPrestasi = (req, res) => {
  const prestasi = db.get('prestasi');
  return res.json({ success: true, data: prestasi });
};

exports.createPrestasi = (req, res) => {
  const { judul, tahun, deskripsi } = req.body;

  if (!judul || !tahun || !deskripsi) {
    return res.status(400).json({ success: false, message: 'Judul, Tahun, dan Deskripsi prestasi wajib diisi.' });
  }

  const prestasi = db.get('prestasi');
  let foto = req.file ? `/uploads/${req.file.filename}` : (req.body.foto || 'https://images.unsplash.com/photo-1522163182402-834f871fd851?auto=format&fit=crop&w=600&q=80');

  const newPrestasi = {
    id: `PRS-${Date.now()}`,
    judul: judul.trim(),
    tahun: String(tahun).trim(),
    deskripsi: deskripsi.trim(),
    foto
  };

  prestasi.unshift(newPrestasi);
  db.set('prestasi', prestasi);

  logActivity(req.user.username, 'CREATE_PRESTASI', `Menambahkan prestasi: ${newPrestasi.judul}`);

  return res.status(201).json({
    success: true,
    message: 'Data prestasi berhasil ditambahkan.',
    data: newPrestasi
  });
};

exports.deletePrestasi = (req, res) => {
  const { id } = req.params;
  const prestasi = db.get('prestasi');
  const index = prestasi.findIndex(p => p.id === id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Data prestasi tidak ditemukan.' });
  }

  const removed = prestasi.splice(index, 1)[0];
  db.set('prestasi', prestasi);

  logActivity(req.user.username, 'DELETE_PRESTASI', `Menghapus prestasi: ${removed.judul}`);

  return res.json({ success: true, message: `Prestasi '${removed.judul}' berhasil dihapus.` });
};

// STATIC CONTENT & CONTACT (FR-42)
exports.getStaticContent = (req, res) => {
  const kontenStatis = db.get('kontenStatis');
  return res.json({ success: true, data: kontenStatis });
};

exports.updateStaticContent = (req, res) => {
  const { section, data } = req.body;
  const kontenStatis = db.get('kontenStatis');

  if (!kontenStatis[section]) {
    kontenStatis[section] = {};
  }

  kontenStatis[section] = {
    ...kontenStatis[section],
    ...data
  };

  db.set('kontenStatis', kontenStatis);

  logActivity(req.user.username, 'UPDATE_STATIC_CONTENT', `Memperbarui konten bagian: ${section}`);

  return res.json({
    success: true,
    message: `Konten bagian ${section} berhasil diperbarui.`,
    data: kontenStatis[section]
  });
};

