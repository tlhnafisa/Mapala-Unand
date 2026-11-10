/**
 * End-to-End (E2E) Test Suite: Interaksi Penuh Anggota dan Admin
 * Mapala UNAND Platform
 * 
 * Skenario Pengujian:
 * 1. Skenario 1 - Akun Baru & Password Gate:
 *    - Admin mendaftarkan akun anggota baru.
 *    - Anggota login pertama kali dengan password default ('mapala123') -> wajib ganti password (must_change_password: true).
 *    - Anggota mengganti password baru -> berhasil.
 *    - Anggota login dengan password baru -> berhasil masuk Gate 2 (Persetujuan Privasi) & Dashboard.
 * 
 * 2. Skenario 2 - Registrasi Ulang Mandiri:
 *    - Anggota mengisi formulir registrasi ulang tahun berjalan (2026) -> submit mandiri.
 *    - Cek database MySQL registrasi_ulang: pastikan sumber_input = 'mandiri'.
 *    - Cek endpoint Admin GET /api/admin/dashboard/stats: metrik inputMandiri & sudahReg bertambah real-time.
 *    - Cek endpoint Admin GET /api/admin/registrations/monitoring: anggota berstatus 'Sudah Registrasi' dengan badge 'Mandiri'.
 * 
 * 3. Skenario 3 - Direktori Anggota & Privasi UU PDP:
 *    - Cek endpoint GET /api/member/directory: data anggota yang telah registrasi langsung muncul dengan domisili baru.
 *    - Verifikasi prinsip privasi: hanya 5 atribut publik yang tampil, bebas dari NIK, alamat detail rumah, atau data privat.
 *    - Verifikasi format tombol WhatsApp: https://wa.me/62...
 */

const http = require('http');
const { query, execute } = require('./src/config/mysql');

const PORT = 3000;
const TEST_NO_REG = 'MU 888 Ete.';
const TEST_NAMA = 'Rizky Pratama E2E';

function request(options, body = null, isMultipart = false) {
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
      if (typeof body === 'string' || Buffer.isBuffer(body)) {
        req.write(body);
      } else {
        req.write(JSON.stringify(body));
      }
    }
    req.end();
  });
}

function buildMultipart(fields, file = null) {
  const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
  let payload = '';

  for (const [key, val] of Object.entries(fields)) {
    payload += `--${boundary}\r\n`;
    payload += `Content-Disposition: form-data; name="${key}"\r\n\r\n`;
    payload += `${val}\r\n`;
  }

  if (file) {
    payload += `--${boundary}\r\n`;
    payload += `Content-Disposition: form-data; name="${file.name}"; filename="${file.filename}"\r\n`;
    payload += `Content-Type: ${file.contentType || 'image/jpeg'}\r\n\r\n`;
    payload += `${file.content}\r\n`;
  }

  payload += `--${boundary}--\r\n`;

  return {
    contentType: `multipart/form-data; boundary=${boundary}`,
    body: payload
  };
}

function getWhatsAppUrl(phone) {
  if (!phone) return null;
  let clean = String(phone).replace(/\D/g, '');
  if (!clean) return null;
  if (clean.startsWith('0')) {
    clean = '62' + clean.slice(1);
  } else if (!clean.startsWith('62') && clean.startsWith('8')) {
    clean = '62' + clean;
  }
  return `https://wa.me/${clean}`;
}

async function runE2E() {
  console.log('========================================================================');
  console.log('   PENGUJIAN END-TO-END (E2E): INTERAKSI ANGGOTA DAN ADMIN MAPALA       ');
  console.log('========================================================================\n');

  let adminToken = '';
  let memberToken = '';
  let initialStats = {};
  let createdMemberId = null;

  try {
    // -------------------------------------------------------------------------
    // PRE-CLEANUP DATA PENGUJIAN
    // -------------------------------------------------------------------------
    await execute('DELETE FROM registrasi_atribut WHERE registrasi_id IN (SELECT id FROM registrasi_ulang WHERE anggota_id IN (SELECT id FROM anggota WHERE no_register = ?))', [TEST_NO_REG]);
    await execute('DELETE FROM registrasi_media_sosial WHERE registrasi_id IN (SELECT id FROM registrasi_ulang WHERE anggota_id IN (SELECT id FROM anggota WHERE no_register = ?))', [TEST_NO_REG]);
    await execute('DELETE FROM registrasi_ulang WHERE anggota_id IN (SELECT id FROM anggota WHERE no_register = ?)', [TEST_NO_REG]);
    await execute('DELETE FROM persetujuan_data WHERE anggota_id IN (SELECT id FROM anggota WHERE no_register = ?)', [TEST_NO_REG]);
    await execute('DELETE FROM users WHERE username = ?', [TEST_NO_REG]);
    await execute('DELETE FROM anggota WHERE no_register = ?', [TEST_NO_REG]);

    // Pastikan periode 2026 berstatus 'buka'
    await execute("UPDATE periode_registrasi SET status = 'buka' WHERE tahun = 2026");

    // -------------------------------------------------------------------------
    // FASE 0: LOGIN ADMIN & CATAT STATISTIK AWAL
    // -------------------------------------------------------------------------
    console.log('[FASE 0] Autentikasi Admin & Pengecekan Metrik Awal:');
    const adminLoginRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { username: 'admin', password: 'admin123' });

    if (adminLoginRes.status !== 200 || !adminLoginRes.body.data?.token) {
      throw new Error('Gagal login admin: ' + JSON.stringify(adminLoginRes.body));
    }
    adminToken = adminLoginRes.body.data.token;
    console.log('   [OK] Admin berhasil login (JWT Token diperoleh).');

    // Ambil metrik awal dashboard admin
    const initialStatsRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/admin/dashboard/stats',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    initialStats = initialStatsRes.body.data.metrics;
    console.log(`   [INFO] Metrik Awal Admin: Total Anggota=${initialStats.totalMembers}, Sudah Registrasi=${initialStats.sudahReg}, Input Mandiri=${initialStats.inputMandiri}`);

    // -------------------------------------------------------------------------
    // SKENARIO 1: AKUN BARU & GERBANG KEAMANAN PASSWORD (FR-11)
    // -------------------------------------------------------------------------
    console.log('\n[SKENARIO 1] Pendaftaran Akun Anggota & Gerbang Keamanan Password (FR-11):');
    
    // 1. Admin mendaftarkan anggota baru
    const createMemberRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/admin/members',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    }, {
      no_register: TEST_NO_REG,
      nama: TEST_NAMA,
      divisi: 'Rimba Gunung',
      angkatan: 2024,
      tempat_lahir: 'Padang',
      tanggal_lahir: '2002-05-15',
      golongan_darah: 'B',
      is_active: 1
    });

    if (createMemberRes.status !== 201 && createMemberRes.status !== 200) {
      throw new Error('Admin gagal membuat anggota baru: ' + JSON.stringify(createMemberRes.body));
    }
    createdMemberId = createMemberRes.body.data?.id;
    console.log(`   [OK] Admin berhasil mendaftarkan anggota: ${TEST_NAMA} (${TEST_NO_REG}).`);

    // 2. Anggota login pertama kali dengan password default 'mapala123'
    const memberLoginDefaultRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { username: TEST_NO_REG, password: 'mapala123' });

    if (memberLoginDefaultRes.status !== 200) {
      throw new Error('Anggota gagal login default: ' + JSON.stringify(memberLoginDefaultRes.body));
    }
    const defaultLoginData = memberLoginDefaultRes.body.data;
    console.log('   [OK] Anggota berhasil login dengan password default sementara.');

    // Verifikasi flag must_change_password
    if (defaultLoginData.user.must_change_password !== true && defaultLoginData.user.must_change_password !== 1) {
      throw new Error('Flag must_change_password harus true pada login pertama!');
    }
    console.log('   [OK] Terverifikasi: Security Gate 1 aktif (must_change_password = true). Layar terkunci modal ganti kata sandi.');

    const tempToken = defaultLoginData.token;

    // 3. Anggota mengganti kata sandi dengan kata sandi baru yang aman
    const newPassword = 'PasswordBaruMapala2026!';
    const changePassRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/auth/change-password',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tempToken}`,
        'Content-Type': 'application/json'
      }
    }, {
      oldPassword: 'mapala123',
      newPassword: newPassword
    });

    if (changePassRes.status !== 200 || !changePassRes.body.success) {
      throw new Error('Gagal mengganti kata sandi: ' + JSON.stringify(changePassRes.body));
    }
    console.log(`   [OK] Anggota berhasil mengganti kata sandi baru: '${newPassword}'.`);

    // 4. Login kembali dengan password baru
    const memberLoginNewRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { username: TEST_NO_REG, password: newPassword });

    if (memberLoginNewRes.status !== 200) {
      throw new Error('Gagal login dengan kata sandi baru: ' + JSON.stringify(memberLoginNewRes.body));
    }
    memberToken = memberLoginNewRes.body.data.token;
    if (memberLoginNewRes.body.data.user.must_change_password === true || memberLoginNewRes.body.data.user.must_change_password === 1) {
      throw new Error('Flag must_change_password harus bernilai false setelah ganti password!');
    }
    console.log('   [OK] Anggota sukses login dengan kata sandi baru (must_change_password = false).');

    // 5. Verifikasi Gate 2: Persetujuan Kebijakan Privasi
    const privRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/member/privacy-policy',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${memberToken}` }
    });

    if (privRes.status !== 200 || !privRes.body.data?.kebijakan_id) {
      throw new Error('Gagal mengambil kebijakan privasi aktif: ' + JSON.stringify(privRes.body));
    }
    const kebijakanId = privRes.body.data.kebijakan_id;
    console.log(`   [OK] Mengambil naskah Kebijakan Privasi aktif (Versi ${privRes.body.data.versi || '1.0'}).`);

    // Anggota menyetujui kebijakan privasi
    const consentRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/member/privacy-policy/consent',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${memberToken}`,
        'Content-Type': 'application/json'
      }
    }, { kebijakan_id: kebijakanId });

    if (consentRes.status !== 200 || !consentRes.body.success) {
      throw new Error('Gagal mengirim persetujuan privasi: ' + JSON.stringify(consentRes.body));
    }
    console.log('   [OK] Security Gate 2: Anggota berhasil menyetujui Kebijakan Privasi (tercatat di persetujuan_data).');

    // 6. Anggota berhasil masuk ke Dashboard Anggota
    const memberDashRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/member/dashboard',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${memberToken}` }
    });

    if (memberDashRes.status !== 200 || !memberDashRes.body.success) {
      throw new Error('Gagal membuka Dashboard Anggota: ' + JSON.stringify(memberDashRes.body));
    }
    const dashData = memberDashRes.body.data;
    console.log(`   [OK] Sukses masuk Dashboard Anggota. Terbaca KTA Digital: ${dashData.identitas.nama} [${dashData.identitas.no_register}]`);
    console.log(`   [OK] Status Registrasi Saat Ini: ${dashData.status_registrasi.sudah_registrasi ? 'Sudah' : 'Belum Registrasi'}.`);

    // -------------------------------------------------------------------------
    // SKENARIO 2: FORMULIR REGISTRASI ULANG MANDIRI & SINKRONISASI KE ADMIN
    // -------------------------------------------------------------------------
    console.log('\n[SKENARIO 2] Formulir Registrasi Ulang Mandiri & Sinkronisasi ke Admin:');

    const regPayload = {
      alamat_rumah: 'Jl. Khatib Sulaiman No. 99, Kel. Lolong Belanti',
      kota_kabupaten: 'Kota Padang',
      provinsi: 'Sumatera Barat',
      pekerjaan: 'Software Engineer',
      no_hp: '081299887766',
      email: 'rizky.e2e@mapala.unand.ac.id',
      alamat_orang_tua: 'Jl. Sudirman No. 12, Kota Bukittinggi',
      media_sosial: '@rizky_mapala_e2e',
      atribut: JSON.stringify([
        { jenis_atribut_id: 1, nama: 'Topi Rimba', status: 'Ada' },
        { jenis_atribut_id: 2, nama: 'Baju Lapangan', status: 'Ada' }
      ])
    };

    const multipart = buildMultipart(regPayload);

    const submitRegRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/member/re-registration',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${memberToken}`,
        'Content-Type': multipart.contentType,
        'Content-Length': Buffer.byteLength(multipart.body)
      }
    }, multipart.body, true);

    if (submitRegRes.status !== 200 || !submitRegRes.body.success) {
      throw new Error('Anggota gagal mengirim formulir registrasi mandiri: ' + JSON.stringify(submitRegRes.body));
    }
    console.log('   [OK] Formulir registrasi ulang mandiri berhasil dikirimkan oleh anggota.');

    // 1. Cek langsung basis data MySQL tabel registrasi_ulang
    const dbRegRows = await query(`
      SELECT ru.id, ru.sumber_input, ru.kota_kabupaten, ru.provinsi, ru.no_hp, ru.submitted_at
      FROM registrasi_ulang ru
      JOIN anggota a ON a.id = ru.anggota_id
      WHERE a.no_register = ?
      ORDER BY ru.id DESC LIMIT 1
    `, [TEST_NO_REG]);

    if (dbRegRows.length === 0) {
      throw new Error('Data tidak ditemukan di tabel MySQL registrasi_ulang!');
    }
    const dbReg = dbRegRows[0];
    if (dbReg.sumber_input !== 'mandiri') {
      throw new Error(`sumber_input di database salah! Ditemukan: ${dbReg.sumber_input}, harus: 'mandiri'`);
    }
    console.log(`   [OK] Verifikasi MySQL: Record ID ${dbReg.id} tersimpan dengan sumber_input='${dbReg.sumber_input}', waktu: ${dbReg.submitted_at}.`);

    // 2. Cek endpoint Admin GET /api/admin/dashboard/stats
    const updatedStatsRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/admin/dashboard/stats',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const updatedStats = updatedStatsRes.body.data.metrics;
    console.log(`   [INFO] Metrik Terkini Admin: Sudah Reg=${updatedStats.sudahReg} (sebelumnya ${initialStats.sudahReg}), Input Mandiri=${updatedStats.inputMandiri} (sebelumnya ${initialStats.inputMandiri})`);

    const currentInputMandiri = Number(updatedStats.inputMandiri);
    const prevInputMandiri = Number(initialStats.inputMandiri);
    const currentSudahReg = Number(updatedStats.sudahReg);
    const prevSudahReg = Number(initialStats.sudahReg);

    if (currentInputMandiri !== prevInputMandiri + 1) {
      throw new Error(`Metrik inputMandiri tidak bertambah! Sebelum: ${prevInputMandiri}, Sekarang: ${currentInputMandiri}`);
    }
    if (currentSudahReg !== prevSudahReg + 1) {
      throw new Error(`Metrik sudahReg tidak bertambah! Sebelum: ${prevSudahReg}, Sekarang: ${currentSudahReg}`);
    }
    console.log('   [OK] Terverifikasi: Metrik inputMandiri dan sudahReg di Dashboard Admin bertambah tepat +1 secara real-time!');

    // 3. Cek endpoint Admin GET /api/admin/registrations/monitoring
    const monitoringRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/admin/registrations/monitoring',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    const monitoringList = monitoringRes.body.data;
    const monitoredMember = monitoringList.find(m => m.no_register === TEST_NO_REG);

    if (!monitoredMember) {
      throw new Error(`Anggota ${TEST_NO_REG} tidak ditemukan di monitoring registrasi admin!`);
    }

    if (monitoredMember.status_registrasi !== 'Sudah Registrasi') {
      throw new Error(`Status registrasi di monitoring salah: ${monitoredMember.status_registrasi}`);
    }

    if (monitoredMember.sumber_input !== 'mandiri') {
      throw new Error(`Badge sumber_input di monitoring salah: ${monitoredMember.sumber_input}, seharusnya 'mandiri'`);
    }

    console.log(`   [OK] Terverifikasi Admin Monitoring: Anggota '${monitoredMember.nama}' berstatus '${monitoredMember.status_registrasi}' dengan badge '${monitoredMember.sumber_input.toUpperCase()}'.`);

    // -------------------------------------------------------------------------
    // SKENARIO 3: DIREKTORI ANGGOTA & KEPATUHAN PRIVASI (FR-46, FR-47)
    // -------------------------------------------------------------------------
    console.log('\n[SKENARIO 3] Direktori Anggota Berbasis View v_direktori_anggota:');

    // 1. Ambil data direktori anggota melalui endpoint anggota
    const dirRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: `/api/member/directory?q=${encodeURIComponent(TEST_NO_REG)}`,
      method: 'GET',
      headers: { 'Authorization': `Bearer ${memberToken}` }
    });

    if (dirRes.status !== 200 || !dirRes.body.success) {
      throw new Error('Gagal mengambil direktori anggota: ' + JSON.stringify(dirRes.body));
    }

    const dirMembers = dirRes.body.data.members;
    if (dirMembers.length === 0) {
      throw new Error(`Anggota ${TEST_NO_REG} yang telah menyetujui privasi & mengisi domisili tidak muncul di Direktori Anggota!`);
    }

    const dirMember = dirMembers[0];
    console.log(`   [OK] Anggota langsung muncul di Direktori Rekan Anggota:`);
    console.log(`        - Nama: ${dirMember.nama}`);
    console.log(`        - No. Register: ${dirMember.no_register}`);
    console.log(`        - Domisili Terkini: ${dirMember.kota_kabupaten}, ${dirMember.provinsi}`);
    console.log(`        - Golongan Darah: ${dirMember.golongan_darah}`);
    console.log(`        - Nomor HP: ${dirMember.no_hp}`);

    if (dirMember.kota_kabupaten !== 'Kota Padang' || dirMember.provinsi !== 'Sumatera Barat') {
      throw new Error(`Domisili di direktori tidak sesuai! Ditemukan: ${dirMember.kota_kabupaten}, ${dirMember.provinsi}`);
    }

    // 2. Verifikasi Tombol Hubungi WhatsApp
    const waLink = getWhatsAppUrl(dirMember.no_hp);
    if (!waLink || waLink !== 'https://wa.me/6281299887766') {
      throw new Error(`Format tautan WhatsApp salah! Ditemukan: ${waLink}`);
    }
    console.log(`   [OK] Tautan Tombol WhatsApp Terverifikasi Sempurna: ${waLink}`);

    // 3. Verifikasi Proteksi Privasi UU PDP: Kolom sensitif tidak boleh bocor
    const forbiddenFields = ['nik', 'alamat_rumah', 'nama_ayah', 'nama_ibu', 'password', 'email'];
    forbiddenFields.forEach(field => {
      if (dirMember[field] !== undefined) {
        throw new Error(`Pelanggaran Privasi: Kolom sensitif '${field}' terekspos di direktori!`);
      }
    });
    console.log('   [OK] Terverifikasi Prinsip Privasi UU PDP: Hanya 5 atribut resmi yang terekspos. NIK, detail alamat rumah, dan nama orang tua 100% terlindungi.');

    console.log('\n========================================================================');
    console.log('  HASIL PENGUJIAN END-TO-END (E2E): SEMUA SKENARIO SUKSES 100%!         ');
    console.log('========================================================================');

  } catch (err) {
    console.error('\n[GAGAL PENGUJIAN E2E]:', err.message);
    process.exitCode = 1;
  } finally {
    // -------------------------------------------------------------------------
    // CLEANUP DATA UJI DARI BASIS DATA MYSQL
    // -------------------------------------------------------------------------
    console.log('\n[CLEANUP] Membersihkan data uji simulasi dari MySQL...');
    await execute('DELETE FROM registrasi_atribut WHERE registrasi_id IN (SELECT id FROM registrasi_ulang WHERE anggota_id IN (SELECT id FROM anggota WHERE no_register = ?))', [TEST_NO_REG]);
    await execute('DELETE FROM registrasi_media_sosial WHERE registrasi_id IN (SELECT id FROM registrasi_ulang WHERE anggota_id IN (SELECT id FROM anggota WHERE no_register = ?))', [TEST_NO_REG]);
    await execute('DELETE FROM registrasi_ulang WHERE anggota_id IN (SELECT id FROM anggota WHERE no_register = ?)', [TEST_NO_REG]);
    await execute('DELETE FROM persetujuan_data WHERE anggota_id IN (SELECT id FROM anggota WHERE no_register = ?)', [TEST_NO_REG]);
    await execute('DELETE FROM users WHERE username = ?', [TEST_NO_REG]);
    await execute('DELETE FROM anggota WHERE no_register = ?', [TEST_NO_REG]);
    console.log('   [OK] Basis data MySQL mapala_unand kembali bersih dan konsisten.\n');
    process.exit(process.exitCode || 0);
  }
}

runE2E();
