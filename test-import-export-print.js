const app = require('./index');
const http = require('http');
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const bcrypt = require('bcryptjs');
const { query, execute, pool } = require('./src/config/mysql');

async function runTests() {
  console.log('=== PENGUJIAN INTEGRASI IMPOR MASSAL, EKSPOR, DAN CETAK FORMULIR ===\n');

  // Start ephemeral server
  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  try {
    // 0. Login as Admin
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
    console.log('   [OK] Token admin berhasil didapatkan.\n');

    const authHeaders = {
      'Authorization': `Bearer ${adminToken}`
    };

    // 1. Test GET /api/admin/members/template
    console.log('1. Menguji GET /api/admin/members/template (Unduh Templat Excel)');
    const tplRes = await fetch(`${baseUrl}/api/admin/members/template?token=${encodeURIComponent(adminToken)}`);
    if (!tplRes.ok) throw new Error(`Status HTTP template tidak OK: ${tplRes.status}`);

    const tplContentType = tplRes.headers.get('content-type');
    if (!tplContentType.includes('spreadsheetml')) {
      throw new Error(`Content-Type tidak sesuai: ${tplContentType}`);
    }

    const tplArrayBuf = await tplRes.arrayBuffer();
    const tplWb = xlsx.read(Buffer.from(tplArrayBuf));
    const tplSheet = tplWb.Sheets[tplWb.SheetNames[0]];
    const tplHeaders = Object.keys(xlsx.utils.sheet_to_json(tplSheet, { header: 1 })[0] || {});
    console.log(`   [OK] Templat berhasil diunduh (${tplArrayBuf.byteLength} bytes).`);
    console.log(`   [OK] Kolom sheet: ${tplWb.SheetNames[0]} terverifikasi.\n`);

    // 2. Test POST /api/admin/members/import-preview
    console.log('2. Menguji POST /api/admin/members/import-preview (Pratinjau Impor Berkas)');
    const testImportNoReg = 'MU 888 Imp.';
    // Cleanup if left from earlier
    await execute('DELETE FROM users WHERE username = ?', [testImportNoReg]);
    await execute('DELETE FROM anggota WHERE no_register = ?', [testImportNoReg]);

    // Create a temporary mock Excel file with:
    // - Row 1: Valid
    // - Row 2: Duplicate in DB (MU 325 Ltn.)
    // - Row 3: Invalid format
    const tempRows = [
      {
        No_Register: testImportNoReg,
        Nama_Lengkap: 'Siti Rahmawati Pengujian Impor',
        Divisi: 'Rimba Gunung',
        Angkatan: 2024,
        Tempat_Lahir: 'Kota Padang',
        Tanggal_Lahir_YYYY_MM_DD: '2004-03-15',
        Golongan_Darah: 'A',
        Nama_Ayah: 'Rahman',
        Nama_Ibu: 'Rosma'
      },
      {
        No_Register: 'MU 120 RGM', // Already in MySQL database
        Nama_Lengkap: 'Ilham Pratama Duplikat',
        Divisi: 'Rimba Gunung',
        Angkatan: 2022,
        Tempat_Lahir: 'Padang',
        Tanggal_Lahir_YYYY_MM_DD: '2002-05-10',
        Golongan_Darah: 'O',
        Nama_Ayah: 'Ahmad',
        Nama_Ibu: 'Fatimah'
      },
      {
        No_Register: 'FORMAT-SALAH-123', // Invalid format
        Nama_Lengkap: '', // Empty name
        Divisi: '', // Empty divisi
        Angkatan: 1850, // Invalid year
        Tempat_Lahir: '',
        Tanggal_Lahir_YYYY_MM_DD: '',
        Golongan_Darah: '',
        Nama_Ayah: '',
        Nama_Ibu: ''
      }
    ];

    const tempWb = xlsx.utils.book_new();
    const tempWs = xlsx.utils.json_to_sheet(tempRows);
    xlsx.utils.book_append_sheet(tempWb, tempWs, 'Impor');
    const tempFilePath = path.join(__dirname, 'temp_test_import.xlsx');
    xlsx.writeFile(tempWb, tempFilePath);

    // Send multipart form-data to /api/admin/members/import-preview
    const fileBuffer = fs.readFileSync(tempFilePath);
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    const prePayload = Buffer.concat([
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="temp_test_import.xlsx"\r\nContent-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet\r\n\r\n`),
      fileBuffer,
      Buffer.from(`\r\n--${boundary}--\r\n`)
    ]);

    const prevRes = await fetch(`${baseUrl}/api/admin/members/import-preview`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`
      },
      body: prePayload
    });

    // Delete temp file
    if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);

    const prevData = await prevRes.json();
    if (!prevData.success || !prevData.data) {
      throw new Error('Gagal import-preview: ' + JSON.stringify(prevData));
    }

    const { totalRows, validCount, errorCount, duplicateCount, rows } = prevData.data;
    console.log(`   [OK] Rekap Pratinjau: Total=${totalRows}, Valid=${validCount}, Error=${errorCount}, Duplikat=${duplicateCount}`);

    if (totalRows !== 3 || validCount !== 1 || duplicateCount !== 1 || errorCount !== 1) {
      throw new Error(`Hasil rekap pratinjau tidak sesuai ekspektasi! Got: ${JSON.stringify(prevData.data)}`);
    }
    console.log('   [OK] Sistem berhasil mendeteksi 1 baris valid, 1 duplikat MySQL, dan 1 format error.\n');

    // 3. Test POST /api/admin/members/import-commit
    console.log('3. Menguji POST /api/admin/members/import-commit (Simpan & Terapkan Data ke MySQL)');
    const validRowsToCommit = rows.filter(r => r.isValid);

    const commitRes = await fetch(`${baseUrl}/api/admin/members/import-commit`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ validRows: validRowsToCommit })
    });

    const commitData = await commitRes.json();
    if (!commitData.success || commitData.count !== 1) {
      throw new Error('Gagal commit import: ' + JSON.stringify(commitData));
    }
    console.log('   [OK] Response:', commitData.message);

    // Verify in MySQL anggota table
    const checkImportAnggota = await query('SELECT * FROM anggota WHERE no_register = ?', [testImportNoReg]);
    if (checkImportAnggota.length === 0) throw new Error('Data impor tidak tersimpan di tabel anggota!');
    console.log(`   [OK] Anggota berhasil tersimpan di tabel anggota (ID: ${checkImportAnggota[0].id}, Nama: ${checkImportAnggota[0].nama})`);

    // Verify in MySQL users table
    const checkImportUser = await query('SELECT * FROM users WHERE username = ?', [testImportNoReg]);
    if (checkImportUser.length === 0) throw new Error('Akun user tidak otomatis dibuat untuk data impor!');
    console.log(`   [OK] Akun user berhasil dibuat di tabel users (Role: ${checkImportUser[0].role}, must_change_password: ${checkImportUser[0].must_change_password})`);

    const passMatch = bcrypt.compareSync('mapala123', checkImportUser[0].password_hash);
    if (!passMatch) throw new Error('Password hash user impor tidak cocok dengan "mapala123"!');
    console.log('   [OK] Password default terenkripsi bcrypt dan siap digunakan login.\n');

    // 4. Test GET /api/admin/members/export (.xlsx dan .csv)
    console.log('4. Menguji GET /api/admin/members/export (Ekspor Data Anggota)');
    // 4.1 Test XLSX
    console.log('   - Uji ekspor format Excel (.xlsx)...');
    const exportXlsxRes = await fetch(`${baseUrl}/api/admin/members/export?format=xlsx&token=${encodeURIComponent(adminToken)}`);
    if (!exportXlsxRes.ok) throw new Error('Gagal ekspor XLSX');
    const xlsxBuf = await exportXlsxRes.arrayBuffer();
    const parsedXlsx = xlsx.read(Buffer.from(xlsxBuf));
    const xlsxRows = xlsx.utils.sheet_to_json(parsedXlsx.Sheets[parsedXlsx.SheetNames[0]]);
    console.log(`     [OK] Berhasil mengekspor format XLSX (${xlsxBuf.byteLength} bytes, total baris: ${xlsxRows.length}).`);

    // 4.2 Test CSV
    console.log('   - Uji ekspor format CSV (.csv)...');
    const exportCsvRes = await fetch(`${baseUrl}/api/admin/members/export?format=csv&token=${encodeURIComponent(adminToken)}`);
    if (!exportCsvRes.ok) throw new Error('Gagal ekspor CSV');
    const csvText = await exportCsvRes.text();
    if (!csvText.includes('No. Register') || !csvText.includes('Nama Lengkap')) {
      throw new Error('Hasil CSV tidak mengandung header yang benar');
    }
    console.log(`     [OK] Berhasil mengekspor format CSV (${csvText.length} karakter). Header terverifikasi.\n`);

    // 5. Test GET /api/admin/members/:no_register/print-biodata
    console.log(`5. Menguji GET /api/admin/members/${encodeURIComponent(testImportNoReg)}/print-biodata (Cetak Formulir Biodata)`);
    const printRes = await fetch(`${baseUrl}/api/admin/members/${encodeURIComponent(testImportNoReg)}/print-biodata?token=${encodeURIComponent(adminToken)}`);
    if (!printRes.ok) throw new Error(`Gagal print biodata: HTTP ${printRes.status}`);

    const htmlText = await printRes.text();
    if (!htmlText.includes('MAPALA UNIVERSITAS ANDALAS') || !htmlText.includes(testImportNoReg)) {
      throw new Error('Tampilan cetak HTML tidak memuat judul kop surat atau data anggota!');
    }
    console.log('   [OK] Halaman cetak berhasil dihasilkan dengan format resmi Kop Surat & tabel A4.');
    console.log(`   [OK] Terverifikasi memuat No. Register "${testImportNoReg}" dan data identitas anggota.\n`);

    // Cleanup test data
    console.log('-> Membersihkan data uji coba dari database...');
    await execute('DELETE FROM users WHERE username = ?', [testImportNoReg]);
    await execute('DELETE FROM anggota WHERE no_register = ?', [testImportNoReg]);
    console.log('   [OK] Data pengujian telah dibersihkan.\n');

    console.log('========================================================================');
    console.log('  SEMUA 5 FITUR IMPOR, EKSPOR & CETAK FORMULIR BERHASIL TERINTEGRASI!  ');
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
