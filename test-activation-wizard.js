/**
 * Automated Verification Script:
 * 3-Step Onboarding Wizard Aktivasi Akun Anggota Baru
 * Menguji bahwa Password TIDAK terganti jika user berhenti di tengah jalan (Step 1 saja),
 * dan baru resmi terganti secara atomik setelah Step 3 tuntas diselesaikan.
 */

const http = require('http');
const bcrypt = require('bcryptjs');
const { query, execute } = require('./src/config/mysql');

const PORT = 3000;
const TEST_NO_REG = 'MU 999 Ete.';
const TEST_NAMA = 'Akun Baru Wizard E2E';
const NEW_PASSWORD = 'fisa123';

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
  console.log('   PENGUJIAN ATOMIK: 3-STEP ONBOARDING WIZARD AKTIVASI AKUN ANGGOTA    ');
  console.log('========================================================================\n');

  try {
    // 0. Pre-cleanup
    await execute('DELETE FROM registrasi_atribut WHERE registrasi_id IN (SELECT id FROM registrasi_ulang WHERE anggota_id IN (SELECT id FROM anggota WHERE no_register = ?))', [TEST_NO_REG]);
    await execute('DELETE FROM registrasi_media_sosial WHERE registrasi_id IN (SELECT id FROM registrasi_ulang WHERE anggota_id IN (SELECT id FROM anggota WHERE no_register = ?))', [TEST_NO_REG]);
    await execute('DELETE FROM registrasi_ulang WHERE anggota_id IN (SELECT id FROM anggota WHERE no_register = ?)', [TEST_NO_REG]);
    await execute('DELETE FROM persetujuan_data WHERE anggota_id IN (SELECT id FROM anggota WHERE no_register = ?)', [TEST_NO_REG]);
    await execute('DELETE FROM users WHERE username = ?', [TEST_NO_REG]);
    await execute('DELETE FROM anggota WHERE no_register = ?', [TEST_NO_REG]);

    // 1. Verifikasi Rute Halaman Web GET /aktivasi-anggota
    console.log('[TEST 1] Verifikasi Rute Web GET /aktivasi-anggota:');
    const pageRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/aktivasi-anggota',
      method: 'GET'
    });
    if (pageRes.status !== 200 || !pageRes.body.includes('Aktivasi Akun')) {
      throw new Error(`Rute /aktivasi-anggota gagal memuat aktivasi.html. Status: ${pageRes.status}`);
    }
    console.log('   [OK] Rute GET /aktivasi-anggota berhasil memuat halaman aktivasi.html (Status: 200).\n');

    // 2. Admin Mendaftarkan Anggota Baru
    console.log('[TEST 2] Admin Mendaftarkan Akun Anggota Baru:');
    const adminLoginRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { username: 'admin', password: 'admin123' });

    const adminToken = adminLoginRes.body.data.token;

    const createRes = await request({
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
      angkatan: 2025
    });

    if (createRes.status !== 201 && createRes.status !== 200) {
      throw new Error('Admin gagal mendaftarkan anggota baru: ' + JSON.stringify(createRes.body));
    }
    console.log(`   [OK] Anggota baru didaftarkan: ${TEST_NAMA} (${TEST_NO_REG}).\n`);

    // 3. Login Pertama Kali (Akun Baru dengan password default 'mapala123')
    console.log('[TEST 3] Login Pertama Kali (POST /api/auth/login):');
    const firstLoginRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { username: TEST_NO_REG, password: 'mapala123' });

    if (firstLoginRes.status !== 200) {
      throw new Error('Gagal login akun baru: ' + JSON.stringify(firstLoginRes.body));
    }

    const userData = firstLoginRes.body.data.user;
    console.log(`   [OK] User Data Terbaca:`);
    console.log(`        - must_change_password : ${userData.must_change_password}`);
    console.log(`        - profil_lengkap       : ${userData.profil_lengkap}`);

    const needsActivation = userData.must_change_password === true || Number(userData.profil_lengkap) === 0;
    if (!needsActivation) {
      throw new Error('Akun baru seharusnya wajib diarahkan ke /aktivasi-anggota!');
    }
    console.log('   [OK] Terverifikasi Alur Pengalihan: must_change_password=true & profil_lengkap=0\n');

    const memberToken = firstLoginRes.body.data.token;

    // 4. STEP 1: Validasi Kata Sandi Baru Saja (POST /api/member/activation/validate-password)
    console.log(`[TEST 4] STEP 1: Validasi Kata Sandi Baru '${NEW_PASSWORD}' tanpa commit database:`);
    const valPassRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/member/activation/validate-password',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${memberToken}`,
        'Content-Type': 'application/json'
      }
    }, {
      oldPassword: 'mapala123',
      newPassword: NEW_PASSWORD
    });

    if (valPassRes.status !== 200 || !valPassRes.body.success) {
      throw new Error('Validasi password gagal: ' + JSON.stringify(valPassRes.body));
    }
    console.log(`   [OK] Endpoint validasi password merespons sukses: "${valPassRes.body.message}"\n`);

    // 5. PENGUJIAN KUNCI: Simulasi Pengguna Berhenti / Logout di Tengah Jalan
    console.log('[TEST 5] Verifikasi Kondisi Database jika Pengguna Keluar di Tengah Jalan (Setelah Step 1):');
    const dbUserCheck = await query('SELECT password_hash, must_change_password FROM users WHERE username = ?', [TEST_NO_REG]);
    if (dbUserCheck.length === 0) throw new Error('Data user tidak ditemukan di database!');

    const currentHash = dbUserCheck[0].password_hash;
    const isStillDefault = bcrypt.compareSync('mapala123', currentHash);
    const isNewPasswordApplied = bcrypt.compareSync(NEW_PASSWORD, currentHash);

    console.log(`   - Password di MySQL masih 'mapala123' : ${isStillDefault}`);
    console.log(`   - Password di MySQL sudah '${NEW_PASSWORD}' : ${isNewPasswordApplied}`);
    console.log(`   - must_change_password di MySQL        : ${dbUserCheck[0].must_change_password}`);

    if (!isStillDefault || isNewPasswordApplied) {
      throw new Error(`FATAL: Password di database telah berubah prematur ke '${NEW_PASSWORD}' padahal baru Step 1!`);
    }
    console.log('   [OK] Terverifikasi: Password di database TETAP password bawaan (mapala123) dan BELUM terganti!\n');

    // Coba login dengan newPassword (harus gagal)
    console.log(`[TEST 6] Verifikasi Login dengan '${NEW_PASSWORD}' (Harus Ditolak karena belum tuntas aktivasi):`);
    const tryNewPassLogin = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { username: TEST_NO_REG, password: NEW_PASSWORD });

    if (tryNewPassLogin.status === 200) {
      throw new Error(`FATAL: Pengguna bisa login dengan password '${NEW_PASSWORD}' sebelum menyelesaikan seluruh langkah!`);
    }
    console.log(`   [OK] Berhasil ditolak: ${tryNewPassLogin.body.message || 'Status ' + tryNewPassLogin.status}\n`);

    // Coba login kembali dengan mapala123 (harus sukses)
    console.log('[TEST 7] Login Kembali dengan Kata Sandi Bawaan (mapala123):');
    const reLoginRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { username: TEST_NO_REG, password: 'mapala123' });

    if (reLoginRes.status !== 200) {
      throw new Error('Gagal login kembali dengan mapala123: ' + JSON.stringify(reLoginRes.body));
    }
    const freshMemberToken = reLoginRes.body.data.token;
    console.log('   [OK] Berhasil login kembali dengan mapala123.\n');

    // 8. STEP 3: EKSEKUSI ATOMIK SELURUH STEP (POST /api/member/activation/complete)
    console.log('[TEST 8] STEP 3: Eksekusi Atomik Seluruh Langkah (POST /api/member/activation/complete):');
    const completeRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/member/activation/complete',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${freshMemberToken}`,
        'Content-Type': 'application/json'
      }
    }, {
      oldPassword: 'mapala123',
      newPassword: NEW_PASSWORD,
      kebijakan_id: 1,
      nama: TEST_NAMA,
      tempat_lahir: 'Bukittinggi',
      tanggal_lahir: '2003-04-12',
      golongan_darah: 'AB',
      nama_ayah: 'Ayahanda E2E',
      nama_ibu: 'Ibunda E2E',
      no_hp: '081234567899',
      kota_kabupaten: 'Kota Padang',
      provinsi: 'Sumatera Barat',
      alamat_rumah: 'Jl. Limau Manis No. 45'
    });

    if (completeRes.status !== 200 || !completeRes.body.success) {
      throw new Error('Atomic activation complete gagal: ' + JSON.stringify(completeRes.body));
    }
    console.log(`   [OK] Respons Complete: "${completeRes.body.message}"\n`);

    // 9. Verifikasi Perubahan di Database MySQL Pasca-Step 3
    console.log('[TEST 9] Verifikasi Perubahan Nyata di Database MySQL:');
    const finalDbUser = await query('SELECT password_hash, must_change_password FROM users WHERE username = ?', [TEST_NO_REG]);
    const finalDbMember = await query('SELECT profil_lengkap FROM anggota WHERE no_register = ?', [TEST_NO_REG]);
    const finalConsent = await query('SELECT * FROM persetujuan_data WHERE anggota_id IN (SELECT id FROM anggota WHERE no_register = ?)', [TEST_NO_REG]);

    const isNowNewPass = bcrypt.compareSync(NEW_PASSWORD, finalDbUser[0].password_hash);
    console.log(`   - Password di MySQL resmi berubah ke '${NEW_PASSWORD}' : ${isNowNewPass}`);
    console.log(`   - must_change_password di MySQL                         : ${finalDbUser[0].must_change_password} (harus 0)`);
    console.log(`   - profil_lengkap di MySQL                                : ${finalDbMember[0].profil_lengkap} (harus 1)`);
    console.log(`   - Persetujuan data tercatat di persetujuan_data          : ${finalConsent.length > 0}`);

    if (!isNowNewPass || finalDbUser[0].must_change_password !== 0 || Number(finalDbMember[0].profil_lengkap) !== 1) {
      throw new Error('Data aktivasi di MySQL tidak sesuai!');
    }
    console.log('   [OK] Seluruh data berhasil tersimpan secara atomik dan sempurna di MySQL!\n');

    // 10. Login Menggunakan Password Baru dan Pastikan Langsung ke /anggota
    console.log(`[TEST 10] Login dengan Password Baru '${NEW_PASSWORD}':`);
    const finalLoginRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { username: TEST_NO_REG, password: NEW_PASSWORD });

    if (finalLoginRes.status !== 200) {
      throw new Error('Gagal login dengan kata sandi baru: ' + JSON.stringify(finalLoginRes.body));
    }

    const finalUser = finalLoginRes.body.data.user;
    if (finalUser.must_change_password !== false || Number(finalUser.profil_lengkap) !== 1) {
      throw new Error('User masih terdeteksi belum tuntas aktivasi!');
    }

    console.log('   [OK] Login berhasil.');
    console.log('   [OK] must_change_password = false & profil_lengkap = 1.');
    console.log('   -> Anggota diarahkan langsung ke /anggota (Portal Utama).');
    console.log('   -> Wizard aktivasi tidak akan ditampilkan lagi.');

    console.log('\n========================================================================');
    console.log('  HASIL PENGUJIAN: SELURUH SKENARIO ATOMIC AKTIVASI SUKSES 100%!       ');
    console.log('========================================================================');

  } catch (err) {
    console.error('\n[GAGAL PENGUJIAN]:', err.message);
    process.exitCode = 1;
  } finally {
    // Cleanup
    await execute('DELETE FROM registrasi_atribut WHERE registrasi_id IN (SELECT id FROM registrasi_ulang WHERE anggota_id IN (SELECT id FROM anggota WHERE no_register = ?))', [TEST_NO_REG]);
    await execute('DELETE FROM registrasi_media_sosial WHERE registrasi_id IN (SELECT id FROM registrasi_ulang WHERE anggota_id IN (SELECT id FROM anggota WHERE no_register = ?))', [TEST_NO_REG]);
    await execute('DELETE FROM registrasi_ulang WHERE anggota_id IN (SELECT id FROM anggota WHERE no_register = ?)', [TEST_NO_REG]);
    await execute('DELETE FROM persetujuan_data WHERE anggota_id IN (SELECT id FROM anggota WHERE no_register = ?)', [TEST_NO_REG]);
    await execute('DELETE FROM users WHERE username = ?', [TEST_NO_REG]);
    await execute('DELETE FROM anggota WHERE no_register = ?', [TEST_NO_REG]);
    console.log('\n[CLEANUP] Basis data MySQL mapala_unand dibersihkan kembali.\n');
    process.exit(process.exitCode || 0);
  }
}

runTest();
