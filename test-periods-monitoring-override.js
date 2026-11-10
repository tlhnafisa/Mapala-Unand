const app = require('./index');
const http = require('http');
const { query, execute, pool } = require('./src/config/mysql');

async function runTests() {
  console.log('=== PENGUJIAN INTEGRASI PERIODE, DIVISI, MONITORING & ADMIN OVERRIDE ===\n');

  // Start ephemeral server
  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  try {
    // 0. Login as admin
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

    // 1. PENGUJIAN PERIODE REGISTRASI
    console.log('1. Menguji Manajemen Periode Registrasi (tabel periode_registrasi)');
    // 1.1 GET /api/admin/periodes
    const getPeriodesRes = await fetch(`${baseUrl}/api/admin/periodes`, { headers: authHeaders });
    const periodesData = await getPeriodesRes.json();
    if (!periodesData.success || !Array.isArray(periodesData.data)) {
      throw new Error('Gagal GET /api/admin/periodes: ' + JSON.stringify(periodesData));
    }
    console.log(`   [OK] Berhasil mengambil ${periodesData.data.length} periode dari basis data.`);

    // 1.2 POST /api/admin/periodes (Tambah periode baru)
    const testYear = 2029;
    await execute('DELETE FROM periode_registrasi WHERE tahun = ?', [testYear]);

    const createPeriodPayload = {
      tahun: testYear,
      nama_periode: `Registrasi Ulang Tahunan ${testYear}`,
      tanggal_buka: `${testYear}-01-01`,
      tanggal_tutup: `${testYear}-12-31`
    };
    const createPeriodRes = await fetch(`${baseUrl}/api/admin/periodes`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(createPeriodPayload)
    });
    const createPeriodData = await createPeriodRes.json();
    if (!createPeriodData.success) {
      throw new Error('Gagal createPeriod: ' + JSON.stringify(createPeriodData));
    }
    const createdPeriodId = createPeriodData.data.id;
    console.log(`   [OK] Periode tahun ${testYear} berhasil dibuat di MySQL (ID: ${createdPeriodId}).`);

    // 1.3 PATCH /api/admin/periodes/:id/toggle (Buka periode)
    const toggleOpenRes = await fetch(`${baseUrl}/api/admin/periodes/${createdPeriodId}/toggle`, {
      method: 'PATCH',
      headers: authHeaders
    });
    const toggleOpenData = await toggleOpenRes.json();
    if (!toggleOpenData.success || toggleOpenData.data.status !== 'buka') {
      throw new Error('Gagal membuka periode: ' + JSON.stringify(toggleOpenData));
    }
    console.log(`   [OK] Periode berhasil dibuka (status: ${toggleOpenData.data.status}).`);

    // Verify other periods are closed
    const otherPeriods = await query('SELECT status FROM periode_registrasi WHERE id != ?', [createdPeriodId]);
    const anyOtherOpen = otherPeriods.some(p => p.status === 'buka');
    if (anyOtherOpen) throw new Error('Aturan sistem gagal: Hanya boleh ada 1 periode buka dalam satu waktu!');
    console.log('   [OK] Aturan PRD terverifikasi: seluruh periode lain otomatis ditutup.');

    // Kembalikan periode 2026 menjadi aktif buka
    const p2026 = await query('SELECT id FROM periode_registrasi WHERE tahun = 2026 LIMIT 1');
    if (p2026.length > 0) {
      await fetch(`${baseUrl}/api/admin/periodes/${p2026[0].id}/toggle`, {
        method: 'PATCH',
        headers: authHeaders
      });
      console.log('   [OK] Periode 2026 dikembalikan ke status buka aktif.\n');
    }

    // 2. PENGUJIAN MASTER DIVISI (tabel divisi)
    console.log('2. Menguji CRUD Master Divisi (tabel divisi)');
    // 2.1 GET /api/admin/divisions
    const getDivRes = await fetch(`${baseUrl}/api/admin/divisions`, { headers: authHeaders });
    const getDivData = await getDivRes.json();
    if (!getDivData.success || !Array.isArray(getDivData.data)) {
      throw new Error('Gagal GET /api/admin/divisions: ' + JSON.stringify(getDivData));
    }
    console.log(`   [OK] Berhasil mengambil ${getDivData.data.length} divisi aktif.`);

    // 2.2 POST /api/admin/divisions (Tambah divisi)
    const testDivName = 'Konservasi Alam Uji';
    const testDivKode = 'KNS';
    await execute('DELETE FROM divisi WHERE nama = ? OR slug = ?', [testDivName, testDivKode.toLowerCase()]);

    const createDivRes = await fetch(`${baseUrl}/api/admin/divisions`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ nama_divisi: testDivName, kode: testDivKode, deskripsi: 'Uji divisi konservasi' })
    });
    const createDivData = await createDivRes.json();
    if (!createDivData.success) {
      throw new Error('Gagal createDivision: ' + JSON.stringify(createDivData));
    }
    const createdDivId = createDivData.data.id;
    console.log(`   [OK] Divisi baru berhasil dibuat (ID: ${createdDivId}, Nama: ${createDivData.data.nama_divisi}).`);

    // 2.3 PUT /api/admin/divisions/:id (Update divisi)
    const updateDivRes = await fetch(`${baseUrl}/api/admin/divisions/${createdDivId}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({ nama_divisi: 'Konservasi Alam (Revisi)', kode: 'KNS', deskripsi: 'Deskripsi diperbarui' })
    });
    const updateDivData = await updateDivRes.json();
    if (!updateDivData.success) {
      throw new Error('Gagal updateDivision: ' + JSON.stringify(updateDivData));
    }
    console.log(`   [OK] Divisi berhasil diperbarui: "${updateDivData.data.nama_divisi}".`);

    // 2.4 DELETE /api/admin/divisions/:id (Hapus divisi yang belum digunakan anggota)
    const deleteDivRes = await fetch(`${baseUrl}/api/admin/divisions/${createdDivId}`, {
      method: 'DELETE',
      headers: authHeaders
    });
    const deleteDivData = await deleteDivRes.json();
    if (!deleteDivData.success) {
      throw new Error('Gagal deleteDivision: ' + JSON.stringify(deleteDivData));
    }
    console.log('   [OK] Divisi tanpa relasi anggota berhasil dihapus dari basis data.');

    // 2.5 Coba hapus divisi yang memiliki anggota (misal Rimba Gunung id 1) -> harus ditolak 403
    const deleteUsedDivRes = await fetch(`${baseUrl}/api/admin/divisions/1`, {
      method: 'DELETE',
      headers: authHeaders
    });
    if (deleteUsedDivRes.status !== 403) {
      throw new Error('Divisi yang memiliki anggota seharusnya ditolak (403)!');
    }
    console.log('   [OK] Proteksi data integritas terverifikasi: Divisi yang memiliki anggota berhasil dilindungi (HTTP 403).\n');

    // 3. PENGUJIAN MONITORING REGISTRASI ULANG
    console.log('3. Menguji GET /api/admin/registrations/monitoring (Monitoring Registrasi Ulang)');
    const monRes = await fetch(`${baseUrl}/api/admin/registrations/monitoring?periode_tahun=2026`, {
      headers: authHeaders
    });
    const monData = await monRes.json();
    if (!monData.success || !Array.isArray(monData.data)) {
      throw new Error('Gagal monitoring: ' + JSON.stringify(monData));
    }

    console.log(`   [OK] Total Anggota Terpantau: ${monData.total}`);
    console.log(`   [OK] Sudah Registrasi: ${monData.sudahCount}`);
    console.log(`   [OK] Belum Registrasi: ${monData.belumCount}`);
    console.log(`   [OK] Persentase Kepatuhan: ${monData.persentaseKepatuhan}%`);

    if (typeof monData.persentaseKepatuhan !== 'number' || isNaN(monData.persentaseKepatuhan)) {
      throw new Error('Persentase kepatuhan tidak valid!');
    }

    // Uji filter monitoring status
    const monSudahRes = await fetch(`${baseUrl}/api/admin/registrations/monitoring?periode_tahun=2026&status=sudah`, { headers: authHeaders });
    const monSudahData = await monSudahRes.json();
    console.log(`   - Filter 'status=sudah': ${monSudahData.total} anggota.`);

    const monBelumRes = await fetch(`${baseUrl}/api/admin/registrations/monitoring?periode_tahun=2026&status=belum`, { headers: authHeaders });
    const monBelumData = await monBelumRes.json();
    console.log(`   - Filter 'status=belum': ${monBelumData.total} anggota.\n`);

    // 4. PENGUJIAN ADMIN OVERRIDE INPUT REGISTRASI
    console.log('4. Menguji POST /api/admin/registrations/override (Input Registrasi via Admin)');
    // Ambil salah satu anggota yang belum registrasi (misal MU 145 PCT)
    const targetMemberNoReg = 'MU 145 PCT';
    const targetMemberRows = await query('SELECT id, nama FROM anggota WHERE no_register = ?', [targetMemberNoReg]);
    if (targetMemberRows.length === 0) throw new Error(`Anggota ${targetMemberNoReg} tidak ditemukan`);

    // Bersihkan data registrasi lama jika ada untuk uji coba bersih
    const pAktif = (await query("SELECT id FROM periode_registrasi WHERE tahun = 2026 LIMIT 1"))[0];
    await execute('DELETE FROM registrasi_ulang WHERE anggota_id = ? AND periode_id = ?', [targetMemberRows[0].id, pAktif.id]);

    const overridePayload = {
      no_register: targetMemberNoReg,
      periode_tahun: 2026,
      no_hp: '081299887766',
      email: 'anggota.override@gmail.com',
      alamat_rumah: 'Jl. Unand No. 45, Limau Manis',
      kota_kabupaten: 'Kota Padang',
      provinsi: 'Sumatera Barat',
      pekerjaan: 'Pegawai Swasta',
      media_sosial: '@override_mapala',
      alamat_ortu: 'Keluarga di Bukittinggi'
    };

    const overrideRes = await fetch(`${baseUrl}/api/admin/registrations/override`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(overridePayload)
    });
    const overrideData = await overrideRes.json();
    if (!overrideData.success) {
      throw new Error('Gagal override: ' + JSON.stringify(overrideData));
    }
    console.log('   [OK] Response:', overrideData.message);

    // Verifikasi di MySQL tabel registrasi_ulang
    const checkReg = await query(`
      SELECT ru.*, u.username as admin_username
      FROM registrasi_ulang ru
      LEFT JOIN users u ON u.id = ru.diinput_oleh
      WHERE ru.anggota_id = ? AND ru.periode_id = ?
    `, [targetMemberRows[0].id, pAktif.id]);

    if (checkReg.length === 0) throw new Error('Data registrasi ulang override tidak ditemukan di MySQL!');
    if (checkReg[0].sumber_input !== 'admin') throw new Error('sumber_input harus bernilai "admin"!');
    console.log(`   [OK] Tersimpan di MySQL: sumber_input="${checkReg[0].sumber_input}", diinput_oleh="${checkReg[0].admin_username}" (ID: ${checkReg[0].diinput_oleh})`);
    console.log(`   [OK] Domisili tersimpan: ${checkReg[0].kota_kabupaten}, ${checkReg[0].provinsi}, HP: ${checkReg[0].no_hp}`);

    // Verifikasi di monitoring list
    const verifyMonRes = await fetch(`${baseUrl}/api/admin/registrations/monitoring?periode_tahun=2026&search=145`, { headers: authHeaders });
    const verifyMonData = await verifyMonRes.json();
    const targetItem = verifyMonData.data.find(d => d.no_register === targetMemberNoReg);
    if (!targetItem || targetItem.status_registrasi !== 'Sudah Registrasi' || targetItem.sumber_input !== 'admin') {
      throw new Error('Data monitoring tidak mencerminkan hasil override!');
    }
    console.log('   [OK] Terverifikasi di tabel monitoring: status="Sudah Registrasi", sumber_input="admin".\n');

    // 5. Cleanup test period
    console.log('-> Membersihkan periode uji coba...');
    await execute('DELETE FROM periode_registrasi WHERE tahun = ?', [testYear]);
    console.log('   [OK] Basis data bersih.\n');

    console.log('========================================================================');
    console.log('  SEMUA 4 FITUR PERIODE, DIVISI, MONITORING & OVERRIDE BERHASIL TERUJI! ');
    console.log('========================================================================');
  } finally {
    server.close();
    await pool.end();
  }
}

runTests().catch(err => {
  console.error('\n[ERROR PENGUJIAN]:', err.message);
  process.exit(1);
});
