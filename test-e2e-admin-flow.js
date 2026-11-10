/**
 * End-to-End (E2E) Test Suite: Alur Integrasi Penuh Admin, Audit Trail, dan Verifikasi Publik
 * Sesuai Permintaan Verifikasi Menyeluruh:
 * 1. Seluruh aksi penting admin (tambah anggota, reset password, terbitkan artikel, override registrasi)
 *    otomatis tercatat ke tabel `log_aktivitas` dan tampil di menu 'Log Audit' (/api/admin/logs).
 * 2. Simulasi:
 *    a. Admin membuka periode registrasi 2026.
 *    b. Admin membuat 1 artikel ekspedisi baru berstatus 'terbit' -> dicek di halaman publik /kegiatan-artikel & beranda.
 *    c. Admin mengunggah bagan kepengurusan baru -> dicek di halaman /struktur-organisasi.
 *    d. Admin mereset password salah satu anggota -> anggota berhasil login dengan password 'mapala123'.
 */

const http = require('http');
const app = require('./server');
const { query, execute, pool } = require('./src/config/mysql');

let server;
let adminToken = '';
const PORT = 3003;

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

async function runE2ETest() {
  console.log('========================================================================');
  console.log('    PENGUJIAN MENYELURUH (END-TO-END TEST) ALUR INTEGRASI ADMIN         ');
  console.log('========================================================================\n');

  server = app.listen(PORT);

  const testMemberReg = 'MU 777 Ete.';
  let createdArticleId = null;
  let testMemberId = null;

  try {
    // Pre-cleanup in case of previous run abort
    await query('DELETE FROM registrasi_atribut WHERE registrasi_id IN (SELECT id FROM registrasi_ulang WHERE anggota_id IN (SELECT id FROM anggota WHERE no_register = ?))', [testMemberReg]);
    await query('DELETE FROM registrasi_media_sosial WHERE registrasi_id IN (SELECT id FROM registrasi_ulang WHERE anggota_id IN (SELECT id FROM anggota WHERE no_register = ?))', [testMemberReg]);
    await query('DELETE FROM registrasi_ulang WHERE anggota_id IN (SELECT id FROM anggota WHERE no_register = ?)', [testMemberReg]);
    await query('DELETE FROM persetujuan_data WHERE anggota_id IN (SELECT id FROM anggota WHERE no_register = ?)', [testMemberReg]);
    await query('DELETE FROM users WHERE username = ?', [testMemberReg]);
    await query('DELETE FROM anggota WHERE no_register = ?', [testMemberReg]);

    // 0. Login Admin
    console.log('[FASE 0] Autentikasi Admin:');
    const loginRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { username: 'admin', password: 'admin123' });

    const token = (loginRes.body && loginRes.body.data && loginRes.body.data.token) || loginRes.body.token;
    if (loginRes.status !== 200 || !token) {
      throw new Error('Gagal login admin: ' + JSON.stringify(loginRes.body));
    }
    adminToken = token;
    console.log('   [OK] Admin berhasil login. JWT Token diperoleh.\n');

    const authHeaders = {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    };

    // -------------------------------------------------------------------------
    // SIMULASI A: Admin Membuka Periode Registrasi 2026
    // -------------------------------------------------------------------------
    console.log('[SIMULASI A] Admin Membuka Periode Registrasi 2026:');
    const periodListRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/admin/periodes',
      method: 'GET',
      headers: authHeaders
    });

    const periods = periodListRes.body.data || [];
    let targetPeriod = periods.find(p => p.tahun === 2026);
    if (!targetPeriod) {
      // Buat periode 2026 jika belum ada
      const newP = await request({
        hostname: '127.0.0.1',
        port: PORT,
        path: '/api/admin/periodes',
        method: 'POST',
        headers: authHeaders
      }, { tahun: 2026, nama_periode: 'Registrasi Ulang 2026' });
      targetPeriod = newP.body.data;
    }

    // Jalankan aksi buka/tutup periode agar tercatat pada log aktivitas audit
    if (targetPeriod.status === 'buka') {
      // Tutup sebentar lalu buka kembali untuk mensimulasikan pembukaan periode
      await request({
        hostname: '127.0.0.1',
        port: PORT,
        path: `/api/admin/periodes/${targetPeriod.id}/toggle`,
        method: 'PATCH',
        headers: authHeaders
      });
    }

    const toggleOpenRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: `/api/admin/periodes/${targetPeriod.id}/toggle`,
      method: 'PATCH',
      headers: authHeaders
    });

    if (toggleOpenRes.status !== 200 || !toggleOpenRes.body.success) {
      throw new Error('Gagal membuka periode 2026: ' + JSON.stringify(toggleOpenRes.body));
    }

    console.log(`   [OK] Periode Registrasi 2026 berhasil dibuka oleh Admin (status='buka').`);
    console.log(`   [LOG AUDIT] Tercatat aksi UPDATE_PERIODE pada periode ID ${targetPeriod.id}.\n`);

    // -------------------------------------------------------------------------
    // SIMULASI B: Admin Membuat 1 Artikel Ekspedisi Baru Berstatus 'terbit'
    // -------------------------------------------------------------------------
    console.log('[SIMULASI B] Admin Membuat Artikel Ekspedisi Baru (Status: terbit):');
    const articlePayload = {
      judul: 'Ekspedisi Penjelajahan Punggung Rimba Singgalang 2026 (E2E Test)',
      kategori_id: 1, // Ekspedisi
      divisi_id: 1,   // Rimba Gunung
      lokasi: 'Gunung Singgalang 2.877 MDPL',
      tanggal_kegiatan: '2026-05-15',
      status_publikasi: 'terbit',
      penulis: 'Humas Mapala UNAND',
      ringkasan: 'Riset keanekaragaman flora dan jalur perintis rimba basah Singgalang.',
      isi: 'Laporan narasi mendalam penjelajahan alam bebas Mapala UNAND melewati lintasan hutan lumut.',
      foto: '/images/hero-mountain.jpg'
    };

    const artRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/admin/cms/articles',
      method: 'POST',
      headers: authHeaders
    }, articlePayload);

    if (artRes.status !== 201 || !artRes.body.success) {
      throw new Error('Gagal membuat artikel: ' + JSON.stringify(artRes.body));
    }
    createdArticleId = artRes.body.data.id;
    console.log(`   [OK] Artikel berhasil dibuat di database (ID: ${createdArticleId}).`);

    // Verifikasi artikel langsung muncul di halaman publik /api/public/articles
    const pubArticlesRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/public/articles',
      method: 'GET'
    });
    const foundInPubArticles = (pubArticlesRes.body.data || []).some(a => String(a.id) === String(createdArticleId));
    if (!foundInPubArticles) {
      throw new Error('Artikel terbit tidak ditemukan di endpoint publik /api/public/articles!');
    }
    console.log('   [OK] Terverifikasi: Artikel langsung tampil di daftar publik /kegiatan-artikel.');

    // Verifikasi artikel juga muncul di Beranda publik (/api/public/content/beranda)
    const berandaRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/public/content/beranda',
      method: 'GET'
    });
    const foundInBeranda = (berandaRes.body.data.kegiatan_terbaru || []).some(a => String(a.id) === String(createdArticleId));
    if (!foundInBeranda) {
      throw new Error('Artikel terbit tidak muncul pada kartu Beranda landing page!');
    }
    console.log('   [OK] Terverifikasi: Artikel langsung tampil di kartu Beranda landing page.');
    console.log(`   [LOG AUDIT] Tercatat aksi CREATE_ARTICLE pada tabel log_aktivitas.\n`);

    // -------------------------------------------------------------------------
    // SIMULASI C: Admin Mengunggah Bagan Kepengurusan Baru
    // -------------------------------------------------------------------------
    console.log('[SIMULASI C] Admin Mengunggah Bagan Organigram Kepengurusan Baru:');
    const baganPayload = {
      periode: '2026/2027',
      keterangan: 'Bagan Kepengurusan Resmi Periode 2026/2027 (E2E Test)',
      foto: '/uploads/organigram-resmi-2026-2027.png'
    };

    const strukturRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/admin/cms/struktur',
      method: 'POST',
      headers: authHeaders
    }, baganPayload);

    if (strukturRes.status !== 200 || !strukturRes.body.success) {
      throw new Error('Gagal unggah bagan: ' + JSON.stringify(strukturRes.body));
    }
    console.log('   [OK] Bagan struktur organisasi tersimpan di MySQL bagan_struktur (is_aktif=1).');

    // Verifikasi langsung berganti di halaman publik /struktur-organisasi
    const pubStrukturRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/public/content/struktur-organisasi',
      method: 'GET'
    });
    if (pubStrukturRes.body.data.gambar_path !== '/uploads/organigram-resmi-2026-2027.png') {
      throw new Error('Bagan pada /struktur-organisasi belum berganti: ' + pubStrukturRes.body.data.gambar_path);
    }
    console.log('   [OK] Terverifikasi: Halaman publik /struktur-organisasi langsung memuat bagan baru.');
    console.log(`   [LOG AUDIT] Tercatat aksi UPDATE_STRUKTUR pada tabel log_aktivitas.\n`);

    // -------------------------------------------------------------------------
    // SIMULASI D: Tambah Anggota, Override Registrasi & Reset Password -> Login Anggota
    // -------------------------------------------------------------------------
    console.log('[SIMULASI D] Manajemen Anggota, Override Registrasi, dan Uji Reset Password:');
    
    // D1. Tambah Anggota Baru
    const memberPayload = {
      no_register: testMemberReg,
      nama: 'Fauzan Maulana E2E',
      divisi: 'Rimba Gunung',
      divisi_id: 1,
      angkatan: 2023,
      no_hp: '081233445566',
      email: 'fauzan.e2e@mapalaunand.org',
      alamat: 'Padang Barat',
      provinsi: 'Sumatera Barat',
      kota_kabupaten: 'Kota Padang',
      golongan_darah: 'O'
    };

    const addMemberRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/admin/members',
      method: 'POST',
      headers: authHeaders
    }, memberPayload);

    if (addMemberRes.status !== 201 || !addMemberRes.body.success) {
      throw new Error('Gagal menambah anggota: ' + JSON.stringify(addMemberRes.body));
    }
    testMemberId = addMemberRes.body.data.id;
    console.log(`   [OK] Anggota baru didaftarkan: ${testMemberReg} (${memberPayload.nama}).`);
    console.log(`   [LOG AUDIT] Tercatat aksi CREATE_MEMBER.`);

    // D2. Override Registrasi Ulang oleh Admin
    const overridePayload = {
      no_register: testMemberReg,
      alamat_rumah: 'Jl. Perintis Kemerdekaan No. 12',
      kota_kabupaten: 'Kota Padang',
      provinsi: 'Sumatera Barat',
      no_hp: '081233445566',
      sosmed_instagram: '@fauzan_mapala',
      memiliki_topi_rimba: '1',
      memiliki_baju_lapangan: '1'
    };

    const overrideRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/admin/registrations/override',
      method: 'POST',
      headers: authHeaders
    }, overridePayload);

    if (overrideRes.status !== 200 || !overrideRes.body.success) {
      throw new Error('Gagal override registrasi: ' + JSON.stringify(overrideRes.body));
    }
    console.log(`   [OK] Override registrasi berhasil disimpan dengan penanda sumber_input='admin'.`);
    console.log(`   [LOG AUDIT] Tercatat aksi ADMIN_OVERRIDE_REGISTRATION.`);

    // D3. Reset Password Anggota oleh Admin
    const resetRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: `/api/admin/members/${encodeURIComponent(testMemberReg)}/reset-password`,
      method: 'POST',
      headers: authHeaders
    });

    if (resetRes.status !== 200 || !resetRes.body.success) {
      throw new Error('Gagal reset password: ' + JSON.stringify(resetRes.body));
    }
    console.log(`   [OK] Password anggota ${testMemberReg} direset menjadi password default ('mapala123').`);
    console.log(`   [LOG AUDIT] Tercatat aksi RESET_PASSWORD.`);

    // D4. Simulasi Login Anggota dengan Password Baru ('mapala123')
    console.log('   -> Menguji Login Anggota dengan akun baru & password hasil reset...');
    const memberLoginRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      username: testMemberReg,
      password: 'mapala123'
    });

    if (memberLoginRes.status !== 200 || !memberLoginRes.body.data.token) {
      throw new Error('Anggota GAGAL login dengan password baru! ' + JSON.stringify(memberLoginRes.body));
    }
    const memberData = memberLoginRes.body.data.user;
    if (memberData.must_change_password !== true) {
      throw new Error('Flag must_change_password seharusnya bernilai true setelah reset.');
    }
    console.log(`   [OK] SUKSES: Anggota ${testMemberReg} berhasil login ke sistem.`);
    console.log(`   [OK] Terverifikasi: Flag must_change_password=true mewajibkan ganti password saat login pertama.\n`);

    // -------------------------------------------------------------------------
    // VERIFIKASI LOG AUDIT TERINTEGRASI (/api/admin/logs)
    // -------------------------------------------------------------------------
    console.log('[VERIFIKASI LOG AUDIT] Memeriksa Riwayat Aktivitas Admin dari MySQL (tabel log_aktivitas):');
    const logsRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/admin/logs?limit=20',
      method: 'GET',
      headers: authHeaders
    });

    if (logsRes.status !== 200 || !logsRes.body.success) {
      throw new Error('Gagal mengambil log aktivitas: ' + JSON.stringify(logsRes.body));
    }

    const auditLogs = logsRes.body.data || [];
    console.log(`   [INFO] Total log terbaca dari basis data: ${auditLogs.length} riwayat.`);

    const requiredActionChecks = [
      { name: 'Tambah Anggota', keys: ['TAMBAH_ANGGOTA', 'CREATE_MEMBER'] },
      { name: 'Reset Password', keys: ['RESET_PASSWORD'] },
      { name: 'Terbitkan Artikel', keys: ['CREATE_ARTICLE'] },
      { name: 'Override Registrasi', keys: ['INPUT_REGISTRASI_ADMIN', 'ADMIN_OVERRIDE_REGISTRATION'] },
      { name: 'Buka Periode', keys: ['UPDATE_PERIODE'] },
      { name: 'Unggah Bagan Organigram', keys: ['UPDATE_STRUKTUR'] }
    ];

    const foundActions = {};
    requiredActionChecks.forEach(check => {
      const logItem = auditLogs.find(l => check.keys.includes(l.aksi));
      if (logItem) {
        foundActions[check.name] = logItem;
        console.log(`   [TERCATAT DI AUDIT] [${logItem.waktu_formatted || logItem.waktu}] Admin '${logItem.admin}': ${logItem.aksi} -> "${logItem.detail}"`);
      } else {
        console.warn(`   [PERINGATAN] Aksi ${check.name} (${check.keys.join('/')}) belum ditemukan di log audit.`);
      }
    });

    const allPresent = requiredActionChecks.every(check => Boolean(foundActions[check.name]));
    if (!allPresent) {
      throw new Error('Tidak semua aksi penting admin tercatat di log audit!');
    }
    console.log('\n   [OK] 100% Seluruh aksi penting admin otomatis tercatat ke log_aktivitas dan tampil di menu Log Audit!\n');

    // -------------------------------------------------------------------------
    // CLEANUP DATA UJI
    // -------------------------------------------------------------------------
    console.log('[CLEANUP] Membersihkan data uji simulasi dari MySQL:');
    if (createdArticleId) {
      await query('DELETE FROM artikel_gambar WHERE artikel_id = ?', [createdArticleId]);
      await query('DELETE FROM artikel WHERE id = ?', [createdArticleId]);
    }
    if (testMemberReg) {
      await query('DELETE FROM registrasi_atribut WHERE registrasi_id IN (SELECT id FROM registrasi_ulang WHERE anggota_id = ?)', [testMemberId]);
      await query('DELETE FROM registrasi_media_sosial WHERE registrasi_id IN (SELECT id FROM registrasi_ulang WHERE anggota_id = ?)', [testMemberId]);
      await query('DELETE FROM registrasi_ulang WHERE anggota_id = ?', [testMemberId]);
      await query('DELETE FROM persetujuan_data WHERE anggota_id = ?', [testMemberId]);
      await query('DELETE FROM users WHERE username = ?', [testMemberReg]);
      await query('DELETE FROM anggota WHERE no_register = ?', [testMemberReg]);
    }
    // Kembalikan struktur periode 2025/2026
    await query("UPDATE periode_kepengurusan SET is_current = 0 WHERE nama = '2026/2027'");
    await query("UPDATE periode_kepengurusan SET is_current = 1 WHERE nama = '2025/2026'");
    await query("UPDATE bagan_struktur SET is_aktif = 1 WHERE periode_kepengurusan_id = (SELECT id FROM periode_kepengurusan WHERE nama = '2025/2026' LIMIT 1)");
    await query("DELETE FROM bagan_struktur WHERE gambar_path = '/uploads/organigram-resmi-2026-2027.png'");

    console.log('   [OK] Basis data MySQL bersih kembali.\n');

    console.log('========================================================================');
    console.log('  HASIL PENGUJIAN END-TO-END (E2E): SEMUA TAHAPAN SUKSES 100%!          ');
    console.log('========================================================================\n');

  } catch (err) {
    console.error('\n[GAGAL PENGUJIAN E2E]:', err.message);
    process.exitCode = 1;
  } finally {
    if (server) server.close();
    await pool.end();
  }
}

runE2ETest();
