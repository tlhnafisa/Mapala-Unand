const app = require('./index');
const http = require('http');
const bcrypt = require('bcryptjs');
const { query, execute, pool } = require('./src/config/mysql');

async function runTests() {
  console.log('=== PENGUJIAN INTEGRASI MANAJEMEN ANGGOTA ADMIN DENGAN MYSQL ===\n');

  // Start ephemeral server
  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  try {
    // 0. Login as admin to get token
    console.log('-> Melakukan login sebagai Admin...');
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });
    const loginData = await loginRes.json();
    if (!loginData.success || !loginData.data.token) {
      throw new Error('Gagal login admin: ' + JSON.stringify(loginData));
    }
    const adminToken = loginData.data.token;
    console.log('   [OK] Token admin didapatkan.\n');

    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    };

    // 1. Test GET /api/admin/members
    console.log('1. Menguji GET /api/admin/members (Daftar Anggota dari MySQL)');
    const listRes = await fetch(`${baseUrl}/api/admin/members`, { headers: authHeaders });
    const listData = await listRes.json();
    if (!listData.success || !Array.isArray(listData.data)) {
      throw new Error('GET /members gagal: ' + JSON.stringify(listData));
    }
    console.log(`   [OK] Berhasil mengambil ${listData.total} anggota dari database.`);

    // 1.1 Test Real-Time Search
    console.log('   - Uji pencarian Nama / No. Register (search=Ilham)...');
    const searchRes = await fetch(`${baseUrl}/api/admin/members?search=Ilham`, { headers: authHeaders });
    const searchData = await searchRes.json();
    console.log(`     [OK] Hasil pencarian: ${searchData.total} anggota ditemukan.`);

    // 1.2 Test Filter Divisi
    console.log('   - Uji filter Divisi (divisi=Rimba Gunung)...');
    const divRes = await fetch(`${baseUrl}/api/admin/members?divisi=Rimba%20Gunung`, { headers: authHeaders });
    const divData = await divRes.json();
    console.log(`     [OK] Hasil filter divisi: ${divData.total} anggota.`);

    // 1.3 Test Filter Angkatan
    console.log('   - Uji filter Angkatan (angkatan=2023)...');
    const angkatanRes = await fetch(`${baseUrl}/api/admin/members?angkatan=2023`, { headers: authHeaders });
    const angData = await angkatanRes.json();
    console.log(`     [OK] Hasil filter angkatan: ${angData.total} anggota.`);

    // 1.4 Test Filter Status Registrasi Ulang
    console.log('   - Uji filter Status Registrasi Ulang (status_reg=sudah)...');
    const regRes = await fetch(`${baseUrl}/api/admin/members?status_reg=sudah`, { headers: authHeaders });
    const regData = await regRes.json();
    console.log(`     [OK] Hasil filter sudah registrasi: ${regData.total} anggota.`);

    // 1.5 Test Filter Domisili
    console.log('   - Uji filter Domisili (domisili=Padang)...');
    const domRes = await fetch(`${baseUrl}/api/admin/members?domisili=Padang`, { headers: authHeaders });
    const domData = await domRes.json();
    console.log(`     [OK] Hasil filter domisili: ${domData.total} anggota.\n`);

    // 2. Test POST /api/admin/members (Tambah Anggota Baru)
    const testNoReg = 'MU 999 Tst.';
    // Clean up if previous failed test left it
    await execute('DELETE FROM users WHERE username = ?', [testNoReg]);
    await execute('DELETE FROM anggota WHERE no_register = ?', [testNoReg]);

    console.log(`2. Menguji POST /api/admin/members (Tambah Anggota Baru: ${testNoReg})`);
    const newMemberPayload = {
      no_register: testNoReg,
      nama: 'Budi Santoso Pengujian',
      divisi: 'Panjat Tebing',
      angkatan: 2024,
      tempat_lahir: 'Kota Bukittinggi',
      tanggal_lahir: '2004-08-17',
      golongan_darah: 'O',
      nama_ayah: 'Santoso Senior',
      nama_ibu: 'Siti Aminah'
    };

    const createRes = await fetch(`${baseUrl}/api/admin/members`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(newMemberPayload)
    });
    const createData = await createRes.json();
    if (!createData.success) {
      throw new Error('Gagal createMember: ' + JSON.stringify(createData));
    }
    console.log('   [OK] Anggota berhasil didaftarkan:', createData.message);

    // Verify in MySQL anggota table
    const checkAnggota = await query('SELECT * FROM anggota WHERE no_register = ?', [testNoReg]);
    if (checkAnggota.length === 0) throw new Error('Data anggota tidak ditemukan di MySQL!');
    console.log(`   [OK] Data tersimpan di tabel anggota (ID: ${checkAnggota[0].id}, Nama: ${checkAnggota[0].nama})`);

    // Verify in MySQL users table
    const checkUser = await query('SELECT * FROM users WHERE username = ?', [testNoReg]);
    if (checkUser.length === 0) throw new Error('Akun user tidak otomatis dibuat di tabel users MySQL!');
    console.log(`   [OK] Akun user tersimpan di tabel users (Role: ${checkUser[0].role}, must_change_password: ${checkUser[0].must_change_password})`);

    const isPassMatch = bcrypt.compareSync('mapala123', checkUser[0].password_hash);
    if (!isPassMatch) throw new Error('Password hash tidak cocok dengan default "mapala123"!');
    console.log('   [OK] Password default akun terenkripsi dengan aman dan cocok dengan "mapala123".');

    // Test member login with default password
    console.log('   - Uji login anggota baru ke /api/auth/login dengan default password...');
    const memberLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: testNoReg, password: 'mapala123' })
    });
    const memberLoginData = await memberLoginRes.json();
    if (!memberLoginData.success || memberLoginData.data.user.role !== 'anggota') {
      throw new Error('Login anggota baru gagal: ' + JSON.stringify(memberLoginData));
    }
    console.log('     [OK] Anggota baru berhasil login, flag must_change_password:', memberLoginData.data.user.must_change_password, '\n');

    // 3. Test PUT /api/admin/members/:no_register (Edit Biodata)
    console.log(`3. Menguji PUT /api/admin/members/${encodeURIComponent(testNoReg)} (Edit Biodata Anggota)`);
    const updatePayload = {
      nama: 'Budi Santoso Pengujian (Updated)',
      divisi: 'Panjat Tebing',
      angkatan: 2024,
      tempat_lahir: 'Kota Padang',
      tanggal_lahir: '2004-08-17',
      golongan_darah: 'AB',
      nama_ayah: 'Santoso Senior',
      nama_ibu: 'Siti Aminah'
    };
    const updateRes = await fetch(`${baseUrl}/api/admin/members/${encodeURIComponent(testNoReg)}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify(updatePayload)
    });
    const updateData = await updateRes.json();
    if (!updateData.success) {
      throw new Error('Gagal updateMember: ' + JSON.stringify(updateData));
    }
    console.log('   [OK] Response:', updateData.message);

    const checkUpdated = await query('SELECT nama, golongan_darah, tempat_lahir FROM anggota WHERE no_register = ?', [testNoReg]);
    if (checkUpdated[0].nama !== updatePayload.nama || checkUpdated[0].golongan_darah !== 'AB') {
      throw new Error('Data di MySQL belum terupdate dengan benar!');
    }
    console.log(`   [OK] Verifikasi MySQL: Nama="${checkUpdated[0].nama}", Goldar="${checkUpdated[0].golongan_darah}"\n`);

    // 4. Test PATCH /api/admin/members/:no_register/toggle-status (Toggle Status)
    console.log(`4. Menguji PATCH /api/admin/members/${encodeURIComponent(testNoReg)}/toggle-status (Nonaktifkan & Aktifkan)`);
    // Nonaktifkan
    const toggle1Res = await fetch(`${baseUrl}/api/admin/members/${encodeURIComponent(testNoReg)}/toggle-status`, {
      method: 'PATCH',
      headers: authHeaders
    });
    const toggle1Data = await toggle1Res.json();
    console.log('   [OK] Toggle 1:', toggle1Data.message, '(status_aktif:', toggle1Data.status_aktif, ')');

    const checkDeactivated = await query('SELECT a.is_active AS a_active, u.is_active AS u_active FROM anggota a JOIN users u ON u.anggota_id = a.id WHERE a.no_register = ?', [testNoReg]);
    if (checkDeactivated[0].a_active !== 0 || checkDeactivated[0].u_active !== 0) {
      throw new Error('is_active di MySQL tidak berubah menjadi 0!');
    }
    console.log('   [OK] Verifikasi MySQL: anggota.is_active=0 dan users.is_active=0');

    // Coba login saat nonaktif -> harus 403 Forbidden
    const loginDeactivated = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: testNoReg, password: 'mapala123' })
    });
    if (loginDeactivated.status !== 403) {
      throw new Error('Seharusnya login ditolak (403) saat status nonaktif!');
    }
    console.log('   [OK] Percobaan login akun nonaktif berhasil ditolak dengan status 403.');

    // Aktifkan kembali
    const toggle2Res = await fetch(`${baseUrl}/api/admin/members/${encodeURIComponent(testNoReg)}/toggle-status`, {
      method: 'PATCH',
      headers: authHeaders
    });
    const toggle2Data = await toggle2Res.json();
    console.log('   [OK] Toggle 2:', toggle2Data.message, '(status_aktif:', toggle2Data.status_aktif, ')\n');

    // 5. Test POST /api/admin/members/:no_register/reset-password (Reset Password)
    console.log(`5. Menguji POST /api/admin/members/${encodeURIComponent(testNoReg)}/reset-password (Reset Kata Sandi)`);
    const resetRes = await fetch(`${baseUrl}/api/admin/members/${encodeURIComponent(testNoReg)}/reset-password`, {
      method: 'POST',
      headers: authHeaders
    });
    const resetData = await resetRes.json();
    if (!resetData.success || resetData.temporaryPassword !== 'mapala123') {
      throw new Error('Gagal reset-password: ' + JSON.stringify(resetData));
    }
    console.log('   [OK] Response:', resetData.message);

    const checkReset = await query('SELECT password_hash, must_change_password FROM users WHERE username = ?', [testNoReg]);
    if (!bcrypt.compareSync('mapala123', checkReset[0].password_hash) || checkReset[0].must_change_password !== 1) {
      throw new Error('Verifikasi reset password MySQL gagal!');
    }
    console.log('   [OK] Verifikasi MySQL: password_hash ter-reset ke "mapala123", must_change_password=1\n');

    // Cleanup test data
    console.log('-> Membersihkan data uji coba dari database...');
    await execute('DELETE FROM users WHERE username = ?', [testNoReg]);
    await execute('DELETE FROM anggota WHERE no_register = ?', [testNoReg]);
    console.log('   [OK] Data pengujian telah dibersihkan.\n');

    console.log('=============================================================');
    console.log('  SEMUA 5 FITUR MANAJEMEN ANGGOTA TERINTEGRASI PENUH KE MYSQL!  ');
    console.log('=============================================================');
  } finally {
    server.close();
    await pool.end();
  }
}

runTests().catch(err => {
  console.error('\n[ERROR PENGUJIAN]:', err.message);
  process.exit(1);
});
