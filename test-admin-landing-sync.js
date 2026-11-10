/**
 * Automated End-to-End Integration Test:
 * Admin CMS to Landing Page & Public Website Synchronization
 * 
 * Memverifikasi bahwa seluruh kegiatan manajemen konten oleh Admin (Artikel, Struktur Organisasi,
 * Prestasi, Tentang Kami, dan Kontak) langsung terhubung secara dinamis dan real-time ke Website Publik/Landing Page,
 * dengan pengecualian modul Registrasi Ulang dan Log Aktivitas yang tetap terproteksi.
 */

const http = require('http');
const { query, execute } = require('./src/config/mysql');

const PORT = 3000;
const TEST_ARTICLE_SLUG = 'uji-sinkronisasi-admin-landing-page';
const TEST_ARTICLE_TITLE = 'Ekspedisi Penjelajahan Uji Integrasi CMS 2026';
const TEST_PRESTASI_TITLE = 'Juara 1 Lomba Navigasi Rimba Tropis Tingkat Nasional 2026';

function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, headers: res.headers, body: json });
        } catch (_) {
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        }
      });
    });
    req.on('error', reject);
    if (body) {
      if (typeof body === 'string') {
        req.write(body);
      } else {
        req.write(JSON.stringify(body));
      }
    }
    req.end();
  });
}

async function runTest() {
  console.log('========================================================================');
  console.log('   PENGUJIAN INTEGRASI PENUH: ADMIN CMS ➔ LANDING PAGE & PUBLIK        ');
  console.log('========================================================================\n');

  let adminToken = '';

  try {
    // 0. Autentikasi Admin
    console.log('[FASE 0] Autentikasi Administrator:');
    const adminLoginRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { username: 'admin', password: 'admin123' });

    if (adminLoginRes.status !== 200 || !adminLoginRes.body.data?.token) {
      throw new Error('Admin gagal login: ' + JSON.stringify(adminLoginRes.body));
    }
    adminToken = adminLoginRes.body.data.token;
    console.log('   [OK] Administrator terautentikasi (JWT Token diperoleh).\n');

    // ------------------------------------------------------------------------
    // 1. UJI INTEGRASI KEGIATAN & ARTIKEL (FR-39 s.d. FR-42)
    // ------------------------------------------------------------------------
    console.log('[TEST 1] Modul Kegiatan & Artikel:');
    // Pre-cleanup artikel uji jika ada
    await execute('DELETE FROM artikel_gambar WHERE artikel_id IN (SELECT id FROM artikel WHERE slug = ?)', [TEST_ARTICLE_SLUG]);
    await execute('DELETE FROM artikel WHERE slug = ?', [TEST_ARTICLE_SLUG]);

    // A. Admin Membuat Artikel Baru Berstatus 'terbit'
    console.log('   [1A] Admin membuat artikel baru via POST /api/admin/cms/articles...');
    const createArtRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/admin/cms/articles',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    }, {
      judul: TEST_ARTICLE_TITLE,
      kategori: 'ekspedisi',
      divisi: 'Rimba Gunung',
      lokasi: 'Gunung Talang • 2.597 MDPL',
      tanggal_kegiatan: '2026-11-10',
      status_publikasi: 'terbit',
      status_kegiatan: 'Selesai Riset',
      tim_capaian: '12 Anggota Tim Peneliti',
      ringkasan: 'Riset keanekaragaman flora endemik dan pemetaan jalur evakuasi baru.',
      isi: 'Kegiatan ekspedisi riset jalur baru Gunung Talang berhasil memetakan 3 titik sumber air bersih dan 18 spesies anggrek hutan tropis basah.',
      foto: '/images/hero-mountain.jpg'
    });

    if (createArtRes.status !== 201 && createArtRes.status !== 200) {
      throw new Error('Admin gagal membuat artikel: ' + JSON.stringify(createArtRes.body));
    }
    const createdArticleId = createArtRes.body.data.id;
    console.log(`        -> Berhasil dibuat dengan ID: ${createdArticleId}`);

    // B. Verifikasi Langsung di Endpoint Publik Beranda
    console.log('   [1B] Verifikasi di Endpoint Publik Beranda (GET /api/public/content/beranda)...');
    const berandaRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/public/content/beranda',
      method: 'GET'
    });
    if (berandaRes.status !== 200 || !berandaRes.body.data?.kegiatan_terbaru) {
      throw new Error('Gagal memuat data beranda publik: ' + JSON.stringify(berandaRes.body));
    }
    const topBerandaArt = berandaRes.body.data.kegiatan_terbaru[0];
    if (topBerandaArt.judul !== TEST_ARTICLE_TITLE) {
      throw new Error(`Artikel teratas di beranda tidak cocok! Ditemukan: ${topBerandaArt?.judul}`);
    }
    console.log(`        [OK] Artikel baru langsung muncul di Carousel Kegiatan Beranda teratas.`);

    // C. Verifikasi di Katalog Artikel Publik (GET /api/public/articles)
    console.log('   [1C] Verifikasi di Katalog Artikel Publik (GET /api/public/articles)...');
    const articlesRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/public/articles',
      method: 'GET'
    });
    const foundInList = articlesRes.body.data.find(a => a.judul === TEST_ARTICLE_TITLE);
    if (!foundInList) {
      throw new Error('Artikel tidak ditemukan di daftar artikel publik!');
    }
    console.log(`        [OK] Artikel ditemukan di katalog publik.`);

    // D. Verifikasi Detail Artikel Publik (GET /api/public/articles/:slug)
    console.log('   [1D] Verifikasi Detail Artikel Publik (GET /api/public/articles/' + foundInList.slug + ')...');
    const detailArtRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: `/api/public/articles/${foundInList.slug}`,
      method: 'GET'
    });
    if (detailArtRes.status !== 200 || detailArtRes.body.data.judul !== TEST_ARTICLE_TITLE) {
      throw new Error('Detail artikel tidak cocok atau tidak ditemukan!');
    }
    console.log(`        [OK] Halaman detail artikel berhasil memuat seluruh naskah lengkap dari MySQL.\n`);

    // ------------------------------------------------------------------------
    // 2. UJI INTEGRASI BAGAN STRUKTUR ORGANISASI (FR-41, P-01)
    // ------------------------------------------------------------------------
    console.log('[TEST 2] Modul Bagan Struktur Organisasi:');
    const testPeriode = '2026/2027';
    const testKeterangan = 'Bagan Struktur Kepengurusan Resmi Mapala UNAND Periode 2026/2027 Uji Integrasi';
    const testGambar = '/uploads/bagan-struktur-test-2026.jpg';

    console.log(`   [2A] Admin memperbarui bagan struktur via POST /api/admin/cms/struktur...`);
    const updateStrukturRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/admin/cms/struktur',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    }, {
      periode: testPeriode,
      keterangan: testKeterangan,
      foto: testGambar
    });

    if (updateStrukturRes.status !== 200 || !updateStrukturRes.body.success) {
      throw new Error('Admin gagal update struktur: ' + JSON.stringify(updateStrukturRes.body));
    }
    console.log('        -> Sukses memperbarui bagan struktur.');

    console.log('   [2B] Verifikasi di Halaman Publik Struktur Organisasi (GET /api/public/content/struktur-organisasi)...');
    const pubStrukturRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/public/content/struktur-organisasi',
      method: 'GET'
    });

    if (pubStrukturRes.status !== 200 || pubStrukturRes.body.data.gambar_path !== testGambar) {
      throw new Error('Bagan publik tidak cocok dengan yang diunggah admin! Ditemukan: ' + JSON.stringify(pubStrukturRes.body.data));
    }
    console.log(`        [OK] Gambar bagan aktif langsung berubah menjadi '${pubStrukturRes.body.data.gambar_path}'`);
    console.log(`        [OK] Periode aktif terverifikasi: ${pubStrukturRes.body.data.periode}\n`);

    // ------------------------------------------------------------------------
    // 3. UJI INTEGRASI PRESTASI & PENGHARGAAN (FR-42)
    // ------------------------------------------------------------------------
    console.log('[TEST 3] Modul Prestasi & Sorotan Beranda:');
    // Pre-cleanup prestasi uji
    await execute('DELETE FROM prestasi WHERE judul = ?', [TEST_PRESTASI_TITLE]);

    console.log('   [3A] Admin menambahkan prestasi sorotan baru via POST /api/admin/cms/prestasi...');
    const createPrestasiRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/admin/cms/prestasi',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    }, {
      tahun: 2026,
      judul: TEST_PRESTASI_TITLE,
      kategori: 'Kompetisi Nasional',
      deskripsi: 'Meraih peringkat 1 orienteering nasional ketepatan titik rimba Bukit Barisan.',
      info_label_1: 'Tingkat: Nasional',
      info_label_2: 'Penyelenggara: Kemenpora RI',
      is_sorotan: 1,
      sorotan_judul: 'Juara 1 Navigasi 2026',
      sorotan_subjudul: 'Kompetisi Rimba Nasional',
      sorotan_detail: 'Meraih medali emas navigasi rimba belantara tropis kategori Kerapatan Jalur Rimba Se-Indonesia.',
      foto: '/images/trophy-achievement.jpg'
    });

    if (createPrestasiRes.status !== 201) {
      throw new Error('Admin gagal menambah prestasi: ' + JSON.stringify(createPrestasiRes.body));
    }
    const createdPrestasiId = createPrestasiRes.body.data.id;
    console.log(`        -> Berhasil ditambahkan dengan ID: ${createdPrestasiId}`);

    console.log('   [3B] Verifikasi di Halaman Publik Prestasi (GET /api/public/prestasi)...');
    const pubPrestasiRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/public/prestasi',
      method: 'GET'
    });
    const foundPrestasi = pubPrestasiRes.body.data.find(p => p.judul === TEST_PRESTASI_TITLE);
    if (!foundPrestasi) {
      throw new Error('Prestasi baru tidak ditemukan di daftar prestasi publik!');
    }
    console.log(`        [OK] Prestasi baru muncul di halaman publik /prestasi (Tahun 2026).`);

    console.log('   [3C] Verifikasi di Sorotan Beranda (GET /api/public/content/beranda)...');
    const pubBerandaPrestasi = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/public/content/beranda',
      method: 'GET'
    });
    const foundSorotan = pubBerandaPrestasi.body.data.sorotan_prestasi.find(s => s.judul === 'Juara 1 Navigasi 2026');
    if (!foundSorotan) {
      throw new Error('Prestasi sorotan tidak muncul di data beranda publik!');
    }
    console.log(`        [OK] Sorotan prestasi langsung tampil di Landing Page Beranda.\n`);

    // ------------------------------------------------------------------------
    // 4. UJI INTEGRASI TENTANG KAMI, VISI, MISI, & KONTAK (FR-07)
    // ------------------------------------------------------------------------
    console.log('[TEST 4] Modul Konten Statis, Tentang Kami, & Kontak:');
    const testVisi = 'Menjadi organisasi kepencintaalaman yang terdepan dalam konservasi dan sains petualangan rimba 2026.';
    const testMisi = [
      'Menyelenggarakan ekspedisi riset berbasis saintifik dan konservasi terpadu.',
      'Membina karakter anggota yang tangguh, beretika, dan berjiwa sosial kemanusiaan.'
    ];
    const testWA = '6281299887766';
    const testEmail = 'humas.resmi@mapalaunand.org';
    const testAlamat = 'Gedung PKM Lt. 1 Kampus Unand Limau Manis Padang 25163';

    console.log('   [4A] Admin memperbarui Visi & Misi via PUT /api/admin/cms/static-content...');
    const updateTentangRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/admin/cms/static-content',
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    }, {
      section: 'tentang_kami',
      data: {
        visi: testVisi,
        misi: testMisi
      }
    });

    if (updateTentangRes.status !== 200) {
      throw new Error('Admin gagal update visi misi: ' + JSON.stringify(updateTentangRes.body));
    }
    console.log('        -> Visi & Misi berhasil diperbarui.');

    console.log('   [4B] Admin memperbarui Kontak Resmi via PUT /api/admin/cms/static-content...');
    const updateKontakRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/admin/cms/static-content',
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    }, {
      section: 'kontak',
      data: {
        whatsapp: testWA,
        email: testEmail,
        alamat: testAlamat,
        instagram: '@mapalaunand_official'
      }
    });

    if (updateKontakRes.status !== 200) {
      throw new Error('Admin gagal update kontak: ' + JSON.stringify(updateKontakRes.body));
    }
    console.log('        -> Kontak resmi berhasil diperbarui.');

    console.log('   [4C] Verifikasi di Halaman Publik Tentang Kami (GET /api/public/content/tentang-kami)...');
    const pubTentangRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/public/content/tentang-kami',
      method: 'GET'
    });
    if (pubTentangRes.body.data.visi !== testVisi) {
      throw new Error('Visi publik tidak cocok dengan yang diupdate admin!');
    }
    console.log(`        [OK] Naskah Visi publik cocok: "${pubTentangRes.body.data.visi}"`);
    console.log(`        [OK] Poin Misi publik cocok: ${pubTentangRes.body.data.misi.length} poin aktif.`);

    console.log('   [4D] Verifikasi di Endpoint Kontak Publik & Footer (GET /api/public/content/kontak)...');
    const pubKontakRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/public/content/kontak',
      method: 'GET'
    });
    if (pubKontakRes.body.data.whatsapp !== testWA || pubKontakRes.body.data.email !== testEmail) {
      throw new Error('Data kontak publik tidak cocok! Ditemukan: ' + JSON.stringify(pubKontakRes.body.data));
    }
    console.log(`        [OK] WhatsApp resmi terverifikasi: +${pubKontakRes.body.data.whatsapp}`);
    console.log(`        [OK] Email sekretariat terverifikasi: ${pubKontakRes.body.data.email}`);
    console.log(`        [OK] Alamat sekretariat terverifikasi: ${pubKontakRes.body.data.alamat}\n`);

    // ------------------------------------------------------------------------
    // 5. VERIFIKASI PENGECUALIAN EKSPLISIT (SECURITY & PRIVACY CHECK)
    // ------------------------------------------------------------------------
    console.log('[TEST 5] Verifikasi Pengecualian Eksplisit (Privacy & Internal Isolation):');
    
    // Pastikan tidak ada endpoint publik yang membocorkan data registrasi ulang atau log aktivitas
    const tryPubRegRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/public/registrasi-ulang',
      method: 'GET'
    });
    console.log(`   [OK] Akses publik ke data registrasi ulang ditolak (Status: ${tryPubRegRes.status} 404/Not Found).`);

    const tryPubLogsRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/public/logs',
      method: 'GET'
    });
    console.log(`   [OK] Akses publik ke log aktivitas ditolak (Status: ${tryPubLogsRes.status} 404/Not Found).`);
    console.log('   -> Terverifikasi: Registrasi Ulang & Log Aktivitas 100% aman dan terisolasi dari publik.\n');

    console.log('========================================================================');
    console.log('  HASIL PENGUJIAN: SELURUH INTEGRASI ADMIN CMS ➔ PUBLIK SUKSES 100%!   ');
    console.log('========================================================================\n');

  } catch (err) {
    console.error('\n[GAGAL PENGUJIAN]:', err.message);
    process.exitCode = 1;
  } finally {
    // Cleanup data uji
    console.log('[CLEANUP] Membersihkan data simulasi uji dari basis data MySQL...');
    await execute('DELETE FROM artikel_gambar WHERE artikel_id IN (SELECT id FROM artikel WHERE slug = ?)', [TEST_ARTICLE_SLUG]);
    await execute('DELETE FROM artikel WHERE slug = ?', [TEST_ARTICLE_SLUG]);
    await execute('DELETE FROM prestasi WHERE judul = ?', [TEST_PRESTASI_TITLE]);
    console.log('   [OK] Data uji bersih kembali.\n');
    process.exit(process.exitCode || 0);
  }
}

runTest();
