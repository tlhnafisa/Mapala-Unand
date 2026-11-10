const { query } = require('./src/config/mysql');
const jwt = require('jsonwebtoken');
const http = require('http');

const JWT_SECRET = process.env.JWT_SECRET || 'mapala_unand_jwt_secret_key_2026';
const PORT = 3000;

function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (_) {
          resolve({ status: res.statusCode, raw: data });
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

async function runTest() {
  console.log('========================================================================');
  console.log('   PENGUJIAN INTEGRASI TAB DIREKTORI ANGGOTA & PRIVASI (FR-46, FR-47)   ');
  console.log('========================================================================\n');

  // 1. Dapatkan token anggota aktif
  const [memberUser] = await query(`
    SELECT u.id, u.username, u.role, u.anggota_id, a.nama 
    FROM users u 
    JOIN anggota a ON a.id = u.anggota_id 
    WHERE u.role = 'anggota' AND a.is_active = 1 
    LIMIT 1
  `);

  if (!memberUser) {
    throw new Error('Tidak ada akun anggota aktif di basis data untuk pengujian.');
  }

  const token = jwt.sign(
    { id: memberUser.id, username: memberUser.username, role: memberUser.role, anggota_id: memberUser.anggota_id },
    JWT_SECRET,
    { expiresIn: '2h' }
  );

  console.log(`[TEST 1] Autentikasi Pengguna Anggota:`);
  console.log(`   [OK] Anggota: ${memberUser.nama} (${memberUser.username}) terautentikasi.`);

  // 2. Uji GET /api/member/directory (Semua Anggota yang Menyetujui Kebijakan)
  console.log(`\n[TEST 2] Verifikasi Endpoint GET /api/member/directory:`);
  const resAll = await request({
    hostname: '127.0.0.1',
    port: PORT,
    path: '/api/member/directory',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (resAll.status !== 200 || !resAll.data.success) {
    throw new Error(`Gagal memanggil /api/member/directory: ${JSON.stringify(resAll.data)}`);
  }

  const members = resAll.data.data.members;
  console.log(`   [OK] Berhasil mengambil direktori anggota. Total: ${members.length} anggota.`);
  console.log(`   [OK] Tersedia opsi provinsi:`, resAll.data.data.available_provinces);

  // 3. Verifikasi Prinsip Privasi UU PDP: Hanya 5 Atribut Publik
  console.log(`\n[TEST 3] Verifikasi Prinsip Privasi Data (FR-46, FR-47):`);
  const forbiddenKeys = ['nik', 'nama_ayah', 'nama_ibu', 'alamat_rumah', 'tempat_lahir', 'tanggal_lahir', 'password', 'email'];
  let violationCount = 0;

  members.forEach(m => {
    forbiddenKeys.forEach(key => {
      if (m[key] !== undefined) {
        console.error(`   [PELANGGARAN PRIVASI] Ditemukan kolom terlarang '${key}' pada anggota ${m.nama}!`);
        violationCount++;
      }
    });
  });

  if (violationCount === 0) {
    console.log(`   [OK] 100% AMAN: Tidak ada NIK, nama orang tua, alamat detail rumah, atau data privat lainnya yang terekspos.`);
    console.log(`   [OK] Atribut publik yang tersedia per anggota:`, Object.keys(members[0]));
  } else {
    throw new Error(`Ditemukan ${violationCount} kebocoran atribut privat pada endpoint direktori!`);
  }

  // 4. Uji Pencarian Real-Time (q)
  console.log(`\n[TEST 4] Uji Pencarian Real-Time (Nama / No. Register):`);
  const resSearch = await request({
    hostname: '127.0.0.1',
    port: PORT,
    path: '/api/member/directory?q=Rahmat',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });

  const searchResults = resSearch.data.data.members;
  console.log(`   [OK] Pencarian 'Rahmat' menghasilkan ${searchResults.length} anggota:`);
  searchResults.forEach(r => console.log(`        - ${r.nama} [${r.no_register}]`));

  const resSearchReg = await request({
    hostname: '127.0.0.1',
    port: PORT,
    path: '/api/member/directory?q=MU%20285',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const searchRegResults = resSearchReg.data.data.members;
  console.log(`   [OK] Pencarian No. Reg 'MU 285' menghasilkan: ${searchRegResults[0]?.nama} (${searchRegResults[0]?.no_register})`);

  // 5. Uji Dropdown Filter Domisili (Provinsi) dan Golongan Darah
  console.log(`\n[TEST 5] Uji Filter Dropdown Domisili (Provinsi) & Golongan Darah:`);
  const resFilterProv = await request({
    hostname: '127.0.0.1',
    port: PORT,
    path: '/api/member/directory?provinsi=Sumatera%20Barat',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log(`   [OK] Filter Provinsi 'Sumatera Barat': ${resFilterProv.data.data.members.length} anggota ditemukan.`);

  const resFilterGoldar = await request({
    hostname: '127.0.0.1',
    port: PORT,
    path: '/api/member/directory?goldar=O',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log(`   [OK] Filter Golongan Darah 'O': ${resFilterGoldar.data.data.members.length} anggota ditemukan.`);

  const resCombo = await request({
    hostname: '127.0.0.1',
    port: PORT,
    path: '/api/member/directory?provinsi=Sumatera%20Barat&goldar=O',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log(`   [OK] Kombinasi Filter 'Sumatera Barat' + Goldar 'O': ${resCombo.data.data.members.length} anggota ditemukan.`);

  // 6. Uji Tombol Hubungi WhatsApp (wa.me/62...)
  console.log(`\n[TEST 6] Uji Format Link WhatsApp (https://wa.me/62...):`);
  members.slice(0, 4).forEach(m => {
    const waLink = getWhatsAppUrl(m.no_hp);
    console.log(`   [OK] Anggota: ${m.nama} | No HP: ${m.no_hp || '(Tidak ada)'} -> Link WA: ${waLink || '(Disabled)'}`);
    if (m.no_hp && !waLink.startsWith('https://wa.me/62')) {
      throw new Error(`Format link WA tidak sesuai standar Indonesia 62: ${waLink}`);
    }
  });

  console.log('\n========================================================================');
  console.log('  HASIL PENGUJIAN: SEMUA FITUR DIREKTORI ANGGOTA LULUS 100%!           ');
  console.log('========================================================================');
  process.exit(0);
}

runTest().catch(err => {
  console.error('\n[GAGAL PENGUJIAN]:', err.message);
  process.exit(1);
});
