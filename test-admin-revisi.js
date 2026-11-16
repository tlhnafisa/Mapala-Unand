/**
 * Test Suite: Validasi Aturan Revisi Admin
 * 1. Aturan Sorotan Tunggal Prestasi (HTTP 409 Conflict & confirm_replace)
 * 2. Penghapusan Bagan Struktur Organisasi & Penanganan Empty State
 * 3. Keamanan & Sanitasi Template Cetak Biodata (XSS Escaping & Safe Image Path)
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const app = require('./server');
const { query, pool } = require('./src/config/mysql');
const { escapeHtml, getSafeImageSrc, generatePrintableBiodataHTML } = require('./src/services/pdfService');

let server;
const PORT = 3005;

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

async function runRevisiTests() {
  console.log('========================================================================');
  console.log('       PENGUJIAN ATURAN REVISI MODUL ADMIN (MAPALA UNAND)               ');
  console.log('========================================================================\n');

  server = app.listen(PORT);

  try {
    // 0. Autentikasi Admin
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
    const authHeaders = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    console.log('   [OK] Token admin diperoleh.\n');

    // -------------------------------------------------------------------------
    // TEST 1: ATURAN PRESTASI SOROTAN TUNGGAL (create & update)
    // -------------------------------------------------------------------------
    console.log('[TEST 1] Aturan Prestasi Sorotan Tunggal:');

    // Pre-cleanup
    await query("DELETE FROM prestasi WHERE judul LIKE 'Uji Sorotan%'");

    // A. Buat Prestasi Sorotan A
    const sorotanARes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/admin/cms/prestasi',
      method: 'POST',
      headers: authHeaders
    }, {
      tahun: 2026,
      kategori: 'Kejuaraan',
      judul: 'Uji Sorotan A',
      deskripsi: 'Prestasi A untuk uji sorotan tunggal',
      is_sorotan: 1,
      confirm_replace: 1,
      sorotan_judul: 'Prestasi Sorotan A 2026'
    });
    if (sorotanARes.status !== 201) {
      throw new Error('Gagal membuat Sorotan A: ' + JSON.stringify(sorotanARes.body));
    }
    const idA = sorotanARes.body.data.id;
    console.log(`   [1A] Prestasi Sorotan A dibuat (ID: ${idA}, is_sorotan: 1).`);

    // B. Buat Prestasi Sorotan B tanpa confirm_replace -> HARUS DITOLAK HTTP 409
    const sorotanBRejectRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/admin/cms/prestasi',
      method: 'POST',
      headers: authHeaders
    }, {
      tahun: 2026,
      kategori: 'Kejuaraan',
      judul: 'Uji Sorotan B',
      deskripsi: 'Prestasi B untuk uji penolakan',
      is_sorotan: 1,
      sorotan_judul: 'Prestasi Sorotan B 2026'
    });
    if (sorotanBRejectRes.status !== 409) {
      throw new Error(`Seharusnya ditolak dengan HTTP 409 tapi menghasilkan status ${sorotanBRejectRes.status}: ` + JSON.stringify(sorotanBRejectRes.body));
    }
    if (!sorotanBRejectRes.body.current_sorotan || sorotanBRejectRes.body.current_sorotan.id !== idA) {
      throw new Error('Data current_sorotan pada respon 409 tidak sesuai: ' + JSON.stringify(sorotanBRejectRes.body));
    }
    console.log(`   [1B] Penolakan 409 sukses saat menambah sorotan baru tanpa konfirmasi.`);
    console.log(`        Pesan: "${sorotanBRejectRes.body.message}"`);
    console.log(`        Sorotan aktif saat ini: ID ${sorotanBRejectRes.body.current_sorotan.id} (${sorotanBRejectRes.body.current_sorotan.judul}).`);

    // C. Buat Prestasi Sorotan B dengan confirm_replace = 1 -> HARUS SUKSES & A DINONAKTIFKAN
    const sorotanBSuccessRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/admin/cms/prestasi',
      method: 'POST',
      headers: authHeaders
    }, {
      tahun: 2026,
      kategori: 'Kejuaraan',
      judul: 'Uji Sorotan B',
      deskripsi: 'Prestasi B dengan konfirmasi ganti',
      is_sorotan: 1,
      confirm_replace: 1,
      sorotan_judul: 'Prestasi Sorotan B 2026'
    });
    if (sorotanBSuccessRes.status !== 201) {
      throw new Error('Gagal membuat Sorotan B dengan konfirmasi: ' + JSON.stringify(sorotanBSuccessRes.body));
    }
    const idB = sorotanBSuccessRes.body.data.id;
    console.log(`   [1C] Prestasi Sorotan B berhasil menggantikan Sorotan A secara atomik (ID: ${idB}).`);

    // Cek di DB bahwa hanya B yang is_sorotan=1 dan A menjadi 0
    const rowsA = await query('SELECT is_sorotan FROM prestasi WHERE id = ?', [idA]);
    const rowsB = await query('SELECT is_sorotan FROM prestasi WHERE id = ?', [idB]);
    if (rowsA[0].is_sorotan !== 0 || rowsB[0].is_sorotan !== 1) {
      throw new Error(`Kondisi DB tidak valid: Sorotan A = ${rowsA[0]?.is_sorotan}, Sorotan B = ${rowsB[0]?.is_sorotan}`);
    }
    console.log('   [1D] Verifikasi DB: Sorotan A otomatis menjadi is_sorotan=0, Sorotan B menjadi is_sorotan=1.');

    // D. Uji Update: Coba ubah Sorotan A menjadi is_sorotan=1 tanpa confirm_replace -> HARUS DITOLAK HTTP 409
    const updateARejectRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: `/api/admin/cms/prestasi/${idA}`,
      method: 'PUT',
      headers: authHeaders
    }, {
      is_sorotan: 1
    });
    if (updateARejectRes.status !== 409) {
      throw new Error(`Update seharusnya ditolak dengan HTTP 409 tapi menghasilkan ${updateARejectRes.status}`);
    }
    console.log('   [1E] Update prestasi lain menjadi sorotan tanpa konfirmasi berhasil ditolak dengan HTTP 409.');

    // E. Uji Update dengan confirm_replace=1 -> Berhasil
    const updateASuccessRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: `/api/admin/cms/prestasi/${idA}`,
      method: 'PUT',
      headers: authHeaders
    }, {
      is_sorotan: 1,
      confirm_replace: 1
    });
    if (updateASuccessRes.status !== 200) {
      throw new Error('Update dengan konfirmasi gagal: ' + JSON.stringify(updateASuccessRes.body));
    }
    console.log('   [1F] Update prestasi dengan confirm_replace=1 berhasil menggantikan sorotan aktif.');

    // Cleanup prestasi uji
    await query('DELETE FROM prestasi WHERE id IN (?, ?)', [idA, idB]);
    await query('UPDATE prestasi SET is_sorotan = 1 ORDER BY id DESC LIMIT 1');
    console.log('   [OK] Test 1 Selesai & Lulus 100%.\n');

    // -------------------------------------------------------------------------
    // TEST 2: PENGHAPUSAN BAGAN STRUKTUR ORGANISASI & EMPTY STATE
    // -------------------------------------------------------------------------
    console.log('[TEST 2] Penghapusan Bagan Struktur Organisasi:');

    // A. Buat file dummy di public/uploads
    const uploadsDir = path.join(__dirname, 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const dummyFileName = `bagan-test-${Date.now()}.png`;
    const dummyFilePath = path.join(uploadsDir, dummyFileName);
    fs.writeFileSync(dummyFilePath, 'dummy image content');

    // B. Simpan ke database via POST
    const createBaganRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/admin/cms/struktur',
      method: 'POST',
      headers: authHeaders
    }, {
      periode: '2026/2027',
      keterangan: 'Bagan Uji Penghapusan',
      foto: `/uploads/${dummyFileName}`
    });
    if (createBaganRes.status !== 200) {
      throw new Error('Gagal membuat bagan uji: ' + JSON.stringify(createBaganRes.body));
    }
    const baganId = createBaganRes.body.data.id;
    console.log(`   [2A] Bagan struktur tersimpan di DB (ID: ${baganId}) dan file fisik dibuat (${dummyFileName}).`);

    // Pastikan file fisik benar-benar ada sebelum dihapus
    if (!fs.existsSync(dummyFilePath)) {
      throw new Error('File dummy seharusnya ada di disk.');
    }

    // C. Hapus bagan via DELETE /api/admin/cms/struktur/:id
    const deleteRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: `/api/admin/cms/struktur/${baganId}`,
      method: 'DELETE',
      headers: authHeaders
    });
    if (deleteRes.status !== 200 || !deleteRes.body.success) {
      throw new Error('Gagal menghapus bagan struktur: ' + JSON.stringify(deleteRes.body));
    }
    console.log(`   [2B] DELETE /api/admin/cms/struktur/${baganId} berhasil dipanggil.`);

    // D. Verifikasi file fisik terhapus dari disk
    if (fs.existsSync(dummyFilePath)) {
      throw new Error('File fisik bagan seharusnya sudah terhapus dari disk!');
    }
    console.log('   [2C] Verifikasi: File fisik di public/uploads berhasil dihapus.');

    // E. Verifikasi record di DB terhapus
    const deletedRows = await query('SELECT * FROM bagan_struktur WHERE id = ?', [baganId]);
    if (deletedRows.length > 0) {
      throw new Error('Record bagan_struktur di DB seharusnya sudah dihapus.');
    }
    console.log('   [2D] Verifikasi: Record pada tabel bagan_struktur berhasil dihapus.');

    // F. Verifikasi tercatat di log_aktivitas
    const logRows = await query("SELECT * FROM log_aktivitas WHERE aksi = 'DELETE_STRUKTUR' ORDER BY id DESC LIMIT 1");
    const dataBaruStr = typeof logRows[0]?.data_baru === 'string' ? logRows[0].data_baru : JSON.stringify(logRows[0]?.data_baru || {});
    if (logRows.length === 0 || !dataBaruStr.includes(String(baganId))) {
      throw new Error('Aksi penghapusan tidak tercatat di log_aktivitas!');
    }
    console.log(`   [2E] Verifikasi Audit Log: Tercatat aksi DELETE_STRUKTUR -> "${dataBaruStr}".`);

    // G. Verifikasi keadaan kosong di halaman publik
    const pubStrukturRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/public/content/struktur-organisasi',
      method: 'GET'
    });
    if (pubStrukturRes.body.data !== null) {
      throw new Error('Publik struktur-organisasi seharusnya mengembalikan data: null saat kosong.');
    }
    const berandaRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/public/content/beranda',
      method: 'GET'
    });
    if (berandaRes.body.data.struktur_ringkas !== null) {
      throw new Error('Beranda struktur_ringkas seharusnya bernilai null saat bagan aktif kosong.');
    }
    console.log('   [2F] Verifikasi Publik: Endpoint publik mengembalikan null dengan rapi tanpa error.');

    // H. Uji ketahanan jika file fisik sudah tidak ada (idempotency)
    // Buat record tanpa file fisik lalu hapus
    const orphanInsert = await query(
      "INSERT INTO bagan_struktur (periode_kepengurusan_id, gambar_path, judul, is_aktif) VALUES (1, '/uploads/file-hantu.png', 'File Tidak Ada', 0)"
    );
    const orphanId = orphanInsert.insertId;
    const deleteOrphanRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: `/api/admin/cms/struktur/${orphanId}`,
      method: 'DELETE',
      headers: authHeaders
    });
    if (deleteOrphanRes.status !== 200) {
      throw new Error('Penghapusan bagan yang file fisiknya hilang seharusnya tidak error 500!');
    }
    console.log('   [2G] Verifikasi: Penghapusan record yang file fisiknya sudah hilang tetap berhasil tanpa error.');

    // Kembalikan struktur default aktif
    await query("UPDATE bagan_struktur SET is_aktif = 1 WHERE periode_kepengurusan_id = 1 LIMIT 1");
    console.log('   [OK] Test 2 Selesai & Lulus 100%.\n');

    // -------------------------------------------------------------------------
    // TEST 3: KEAMANAN & SANITASI TEMPLATE CETAK BIODATA (XSS & Image Path)
    // -------------------------------------------------------------------------
    console.log('[TEST 3] Keamanan Template Cetak Biodata (pdfService):');

    // A. Uji escapeHtml
    const xssPayload = '<script>alert("XSS")</script>&"\'';
    const escaped = escapeHtml(xssPayload);
    if (escaped.includes('<script>') || escaped.includes('"') || escaped.includes("'")) {
      throw new Error('escapeHtml gagal membersihkan karakter berbahaya: ' + escaped);
    }
    if (escaped !== '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;&amp;&quot;&#039;') {
      throw new Error('Hasil escapeHtml tidak sesuai: ' + escaped);
    }
    console.log('   [3A] escapeHtml berhasil mengamankan tag HTML dan atribut berbahaya.');

    // B. Uji getSafeImageSrc
    if (getSafeImageSrc('/uploads/foto-anggota.jpg') !== '/uploads/foto-anggota.jpg') {
      throw new Error('getSafeImageSrc seharusnya mengizinkan path di /uploads/');
    }
    if (getSafeImageSrc('/images/default-avatar.png') !== '/images/default-avatar.png') {
      throw new Error('getSafeImageSrc seharusnya mengizinkan path di /images/');
    }
    if (getSafeImageSrc('../../etc/passwd') !== null) {
      throw new Error('getSafeImageSrc harus memblokir path traversal!');
    }
    if (getSafeImageSrc('http://attacker.com/malicious.jpg') !== null) {
      throw new Error('getSafeImageSrc harus memblokir URL eksternal!');
    }
    if (getSafeImageSrc('javascript:alert(1)') !== null) {
      throw new Error('getSafeImageSrc harus memblokir javascript scheme!');
    }
    console.log('   [3B] getSafeImageSrc berhasil memvalidasi path lokal (/uploads, /images) dan memblokir traversal/eksternal.');

    // C. Uji generateBiodataHTML: tidak boleh memuat 'Alamat Orang Tua' dan harus aman dari XSS
    const mockMember = {
      no_register: 'MU 999 Tst.',
      nama_lengkap: '<script>alert(1)</script> Anggota Uji',
      nama_lapangan: 'Elang <b>Sakti</b>',
      status_keanggotaan: 'penuh',
      angkatan: 'XXV',
      tahun_masuk: 2020,
      jurusan: 'Sistem Informasi',
      fakultas: 'Teknologi Informasi',
      tempat_lahir: 'Padang',
      tanggal_lahir: '2001-05-15',
      jenis_kelamin: 'L',
      golongan_darah: 'O',
      riwayat_penyakit: 'Tidak Ada',
      alamat_asal: 'Padang Barat',
      alamat_sekarang: 'Limau Manis',
      alamat_orang_tua: 'Jl. Orang Tua No. 123 (TIDAK BOLEH MUNCUL)'
    };
    const mockRegData = {
      pekerjaan: 'Pegawai',
      instansi_organisasi: 'Kemenpora',
      jabatan: 'Staf',
      no_telepon_wa: '08123456789',
      kontak_darurat_nama: 'Budi',
      kontak_darurat_hubungan: 'Ayah',
      kontak_darurat_nomor: '081299998888',
      kontak_darurat_alamat: 'Padang',
      foto_terbaru: '/uploads/foto-test.jpg',
      status_kelengkapan: 'lengkap'
    };
    const mockAtribut = [
      { atribut_nama: 'Syal', status: 1 },
      { atribut_nama: 'Badge', status: 1 },
      { atribut_nama: 'KTA', status: 0 }
    ];

    const htmlOutput = generatePrintableBiodataHTML(mockMember, mockRegData, mockAtribut);

    if (htmlOutput.includes('Alamat Orang Tua') || htmlOutput.includes('TIDAK BOLEH MUNCUL')) {
      throw new Error('Template cetak masih memuat field "Alamat Orang Tua"!');
    }
    if (htmlOutput.includes('<script>alert(1)</script>') || htmlOutput.includes('<b>Sakti</b>')) {
      throw new Error('Template cetak rentan XSS! Input pengguna tidak di-escape.');
    }
    if (!htmlOutput.includes('&lt;script&gt;alert(1)&lt;/script&gt;')) {
      throw new Error('Nama dengan tag HTML harus ter-escape.');
    }
    if (!htmlOutput.includes('MU 325 Ltn.')) {
      throw new Error('Template cetak harus menyertakan kop format formulir MU 325 Ltn.');
    }
    console.log('   [3C] generatePrintableBiodataHTML terverifikasi bersih dari "Alamat Orang Tua", aman dari XSS, dan sesuai format MU 325 Ltn.');
    console.log('   [OK] Test 3 Selesai & Lulus 100%.\n');

    console.log('========================================================================');
    console.log('  SEMUA ATURAN REVISI MODUL ADMIN BERHASIL DIVERIFIKASI DENGAN SUKSES! ');
    console.log('========================================================================\n');

  } catch (err) {
    console.error('\n[GAGAL PENGUJIAN REVISI ADMIN]:', err.message);
    process.exitCode = 1;
  } finally {
    if (server) server.close();
    await pool.end();
  }
}

runRevisiTests();
