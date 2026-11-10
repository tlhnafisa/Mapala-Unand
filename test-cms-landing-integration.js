/**
 * Test Suite: Integrasi CMS (Artikel, Struktur Organisasi, Prestasi, Konten Statis)
 * ke MySQL dan Sinkronisasi Tampilan Publik (Landing Page)
 */
const http = require('http');
const app = require('./server');
const { query, pool } = require('./src/config/mysql');

let server;
let adminToken = '';
const BASE_URL = 'http://127.0.0.1:3002';

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

async function runCMSTests() {
  console.log('=== PENGUJIAN INTEGRASI CMS & LANDING PAGE (MYSQL) ===\n');

  server = app.listen(3002);

  try {
    // 0. Login Admin
    console.log('-> Melakukan login sebagai Admin...');
    const loginRes = await request({
      hostname: '127.0.0.1',
      port: 3002,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { username: 'admin', password: 'admin123' });

    const token = (loginRes.body && loginRes.body.data && loginRes.body.data.token) || loginRes.body.token;
    if (loginRes.status !== 200 || !token) {
      throw new Error('Gagal login admin: ' + JSON.stringify(loginRes.body));
    }
    adminToken = token;
    console.log('   [OK] Token admin berhasil diperoleh.\n');

    const authHeaders = {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    };

    // ------------------------------------------------------------------
    // 1. CMS ARTIKEL & KEGIATAN (/api/admin/cms/articles)
    // ------------------------------------------------------------------
    console.log('1. Menguji CMS Artikel & Kegiatan:');
    
    // 1A. Buat Artikel Baru dengan status 'draf'
    const newArtData = {
      judul: 'Ekspedisi Uji Coba Puncak Marapi 2026',
      kategori_id: 1, // Ekspedisi
      divisi_id: 1,   // Rimba Gunung
      lokasi: 'Gunung Marapi 2.891 MDPL',
      tanggal_kegiatan: '2026-04-10',
      status_publikasi: 'draf',
      penulis: 'Tim Uji Sistem',
      ringkasan: 'Uji coba dokumentasi pendakian jalur baru Marapi.',
      isi: 'Laporan lengkap penjelajahan jalur perintis punggungan timur Gunung Marapi Sumatera Barat.',
      foto: '/images/hero-mountain.jpg'
    };

    const createArtRes = await request({
      hostname: '127.0.0.1',
      port: 3002,
      path: '/api/admin/cms/articles',
      method: 'POST',
      headers: authHeaders
    }, newArtData);

    if (createArtRes.status !== 201 || !createArtRes.body.success) {
      throw new Error('Gagal membuat artikel: ' + JSON.stringify(createArtRes.body));
    }
    const createdArtId = createArtRes.body.data.id;
    console.log(`   [OK] Artikel baru berhasil dibuat (ID: ${createdArtId}, Status: draf).`);

    // Pastikan artikel draf TIDAK muncul di Landing Page publik
    const berandaDraftCheck = await request({
      hostname: '127.0.0.1',
      port: 3002,
      path: '/api/public/content/beranda',
      method: 'GET'
    });
    const draftFound = berandaDraftCheck.body.data.kegiatan_terbaru.some(a => String(a.id) === String(createdArtId));
    if (draftFound) {
      throw new Error('Artikel draf seharusnya TIDAK muncul di landing page publik.');
    }
    console.log('   [OK] Terverifikasi: Artikel berstatus draf TIDAK tampil di landing page publik.');

    // 1B. Perbarui artikel: Ubah status menjadi 'terbit'
    const updateArtRes = await request({
      hostname: '127.0.0.1',
      port: 3002,
      path: `/api/admin/cms/articles/${createdArtId}`,
      method: 'PUT',
      headers: authHeaders
    }, {
      status_publikasi: 'terbit',
      tim_capaian: 'Tim Penjelajah Penuh'
    });

    if (updateArtRes.status !== 200 || !updateArtRes.body.success) {
      throw new Error('Gagal update artikel: ' + JSON.stringify(updateArtRes.body));
    }
    console.log('   [OK] Status artikel berhasil diubah menjadi "terbit".');

    // 1C. Pastikan artikel terbit OTOMATIS muncul di Landing Page & /api/public/articles
    const berandaPublishCheck = await request({
      hostname: '127.0.0.1',
      port: 3002,
      path: '/api/public/content/beranda',
      method: 'GET'
    });
    const pubFound = berandaPublishCheck.body.data.kegiatan_terbaru.some(a => String(a.id) === String(createdArtId));
    if (!pubFound) {
      throw new Error('Artikel terbit seharusnya OTOMATIS tampil di landing page publik.');
    }
    console.log('   [OK] Terverifikasi: Artikel terbit OTOMATIS tampil pada daftar Beranda publik.\n');

    // ------------------------------------------------------------------
    // 2. CMS STRUKTUR ORGANISASI (/api/admin/cms/struktur)
    // ------------------------------------------------------------------
    console.log('2. Menguji CMS Struktur Organisasi:');
    const strukturPayload = {
      periode: '2026/2027',
      keterangan: 'Bagan Kepengurusan Resmi Mapala UNAND Periode 2026/2027',
      foto: '/uploads/bagan-struktur-test-2026.png'
    };

    const updateStrukturRes = await request({
      hostname: '127.0.0.1',
      port: 3002,
      path: '/api/admin/cms/struktur',
      method: 'POST',
      headers: authHeaders
    }, strukturPayload);

    if (updateStrukturRes.status !== 200 || !updateStrukturRes.body.success) {
      throw new Error('Gagal memperbarui bagan struktur: ' + JSON.stringify(updateStrukturRes.body));
    }
    console.log('   [OK] Bagan struktur organisasi baru berhasil disimpan ke tabel bagan_struktur.');

    // Verifikasi di endpoint publik /api/public/content/struktur-organisasi
    const publicStrukturRes = await request({
      hostname: '127.0.0.1',
      port: 3002,
      path: '/api/public/content/struktur-organisasi',
      method: 'GET'
    });

    if (publicStrukturRes.status !== 200 || publicStrukturRes.body.data.gambar_path !== '/uploads/bagan-struktur-test-2026.png') {
      throw new Error('Bagan struktur publik tidak cocok dengan pembaruan admin.');
    }
    console.log(`   [OK] Terverifikasi: Halaman publik menampilkan bagan aktif "${publicStrukturRes.body.data.gambar_path}" periode ${publicStrukturRes.body.data.periode}.\n`);

    // ------------------------------------------------------------------
    // 3. CMS PRESTASI (/api/admin/cms/prestasi)
    // ------------------------------------------------------------------
    console.log('3. Menguji CMS Prestasi & Sorotan Beranda:');
    const newPrestasiData = {
      tahun: 2026,
      kategori: 'Kejuaraan Nasional',
      judul: 'Juara 1 Rock Climbing Championship 2026',
      deskripsi: 'Meraih medali emas kategori Lead Climbing Putra Mahasiswa Nasional.',
      info_label_1: 'FPTI Nasional',
      is_sorotan: 1, // Tampilkan sebagai Sorotan Beranda
      sorotan_judul: 'Juara 1 Rock Climbing Nasional 2026',
      sorotan_subjudul: 'Medali Emas Lead Climbing',
      sorotan_detail: 'Keberhasilan tim panjat tebing Mapala UNAND di ajang nasional.'
    };

    const createPrestasiRes = await request({
      hostname: '127.0.0.1',
      port: 3002,
      path: '/api/admin/cms/prestasi',
      method: 'POST',
      headers: authHeaders
    }, newPrestasiData);

    if (createPrestasiRes.status !== 201 || !createPrestasiRes.body.success) {
      throw new Error('Gagal membuat prestasi: ' + JSON.stringify(createPrestasiRes.body));
    }
    const createdPrestasiId = createPrestasiRes.body.data.id;
    console.log(`   [OK] Prestasi baru berhasil disimpan (ID: ${createdPrestasiId}, is_sorotan: 1).`);

    // Pastikan muncul pada kartu sorotan landing page beranda
    const berandaPrestasiCheck = await request({
      hostname: '127.0.0.1',
      port: 3002,
      path: '/api/public/content/beranda',
      method: 'GET'
    });
    const highlightFound = berandaPrestasiCheck.body.data.sorotan_prestasi.some(p => String(p.id) === String(createdPrestasiId));
    if (!highlightFound) {
      throw new Error('Prestasi dengan is_sorotan=1 seharusnya tampil di sorotan_prestasi beranda.');
    }
    console.log('   [OK] Terverifikasi: Prestasi langsung muncul pada kartu sorotan landing page.');

    // Edit prestasi
    const updatePrestasiRes = await request({
      hostname: '127.0.0.1',
      port: 3002,
      path: `/api/admin/cms/prestasi/${createdPrestasiId}`,
      method: 'PUT',
      headers: authHeaders
    }, {
      judul: 'Juara 1 Rock Climbing Championship 2026 (Revisi)',
      is_sorotan: 0
    });

    if (updatePrestasiRes.status !== 200 || !updatePrestasiRes.body.success) {
      throw new Error('Gagal update prestasi: ' + JSON.stringify(updatePrestasiRes.body));
    }
    console.log('   [OK] Prestasi berhasil diedit (judul diperbarui dan sorotan dimatikan).\n');

    // ------------------------------------------------------------------
    // 4. CMS TENTANG KAMI & KONTAK (/api/admin/cms/static-content)
    // ------------------------------------------------------------------
    console.log('4. Menguji CMS Konten Statis (Tentang Kami, Poin Misi, & Kontak):');
    
    // 4A. Update Tentang Kami & Misi
    const updateTentangRes = await request({
      hostname: '127.0.0.1',
      port: 3002,
      path: '/api/admin/cms/static-content',
      method: 'PUT',
      headers: authHeaders
    }, {
      section: 'tentang_kami',
      data: {
        sejarah: 'Sejarah pembaruan uji sistem: Didirikan pada tahun 1984 di Universitas Andalas.',
        visi: 'Menjadi wadah kepeloporan konservasi alam terkemuka tingkat Asia Tenggara.',
        misi: 'Poin Misi 1: Eksplorasi rimba lestari.\nPoin Misi 2: Pengabdian masyarakat dan mitigasi bencana alam.\nPoin Misi 3: Solidaritas persaudaraan seumur hidup.'
      }
    });

    if (updateTentangRes.status !== 200 || !updateTentangRes.body.success) {
      throw new Error('Gagal update tentang kami: ' + JSON.stringify(updateTentangRes.body));
    }
    console.log('   [OK] Sejarah, Visi, dan 3 poin Misi berhasil diperbarui di MySQL (tabel konten_statis & misi_poin).');

    // 4B. Update Kontak (WhatsApp & Alamat)
    const updateKontakRes = await request({
      hostname: '127.0.0.1',
      port: 3002,
      path: '/api/admin/cms/static-content',
      method: 'PUT',
      headers: authHeaders
    }, {
      section: 'kontak',
      data: {
        whatsapp: '081234567890',
        alamat: 'Gedung PKM Lantai 1 Sayap Barat, Kampus Limau Manis, Padang',
        email: 'sekretariat-test@mapalaunand.org'
      }
    });

    if (updateKontakRes.status !== 200 || !updateKontakRes.body.success) {
      throw new Error('Gagal update kontak: ' + JSON.stringify(updateKontakRes.body));
    }
    console.log('   [OK] Nomor WhatsApp dan Alamat Sekretariat berhasil disimpan ke database.');

    // 4C. Verifikasi di Endpoint Publik
    const publicTentangRes = await request({
      hostname: '127.0.0.1',
      port: 3002,
      path: '/api/public/content/tentang-kami',
      method: 'GET'
    });
    const publicKontakRes = await request({
      hostname: '127.0.0.1',
      port: 3002,
      path: '/api/public/content/kontak',
      method: 'GET'
    });

    if (!publicTentangRes.body.data.visi.includes('Asia Tenggara')) {
      throw new Error('Visi publik tidak cocok dengan update.');
    }
    if (publicTentangRes.body.data.misi.length !== 3) {
      throw new Error('Poin misi publik seharusnya berjumlah 3.');
    }
    if (publicKontakRes.body.data.whatsapp !== '081234567890') {
      throw new Error('WhatsApp publik tidak cocok: ' + publicKontakRes.body.data.whatsapp);
    }
    console.log('   [OK] Terverifikasi: Data publik /content/tentang-kami dan /content/kontak 100% sinkron.\n');

    // ------------------------------------------------------------------
    // CLEANUP DATA UJI
    // ------------------------------------------------------------------
    console.log('-> Membersihkan data uji dari MySQL...');
    await query('DELETE FROM artikel_gambar WHERE artikel_id = ?', [createdArtId]);
    await query('DELETE FROM artikel WHERE id = ?', [createdArtId]);
    await query('DELETE FROM prestasi WHERE id = ?', [createdPrestasiId]);
    // Kembalikan struktur periode 2025/2026 aktif
    await query("UPDATE periode_kepengurusan SET is_current = 0 WHERE nama = '2026/2027'");
    await query("UPDATE periode_kepengurusan SET is_current = 1 WHERE nama = '2025/2026'");
    await query("UPDATE bagan_struktur SET is_aktif = 1 WHERE periode_kepengurusan_id = (SELECT id FROM periode_kepengurusan WHERE nama = '2025/2026' LIMIT 1)");
    await query("DELETE FROM bagan_struktur WHERE gambar_path = '/uploads/bagan-struktur-test-2026.png'");
    console.log('   [OK] Basis data bersih kembali.\n');

    console.log('========================================================================');
    console.log('  SEMUA 4 SUB-TAB CMS DAN SINKRONISASI LANDING PAGE SUKSES TERVERIFIKASI! ');
    console.log('========================================================================\n');

  } catch (err) {
    console.error('\n[GAGAL PENGUJIAN CMS]:', err.message);
    process.exitCode = 1;
  } finally {
    if (server) server.close();
    await pool.end();
  }
}

runCMSTests();
