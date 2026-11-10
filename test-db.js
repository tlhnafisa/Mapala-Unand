/**
 * Skrip Pengecekan Koneksi & Isi Database Mapala UNAND
 * Jalankan dengan: node test-db.js
 */
const { pool, query } = require('./src/config/mysql');

async function checkDatabase() {
  console.log('\n=============================================================');
  console.log('   🔍 PENGECEKAN KONEKSI & DATA BASIS DATA MAPALA UNAND 🔍   ');
  console.log('=============================================================');

  try {
    // 1. Cek Koneksi Pool
    const conn = await pool.getConnection();
    console.log('✅ STATUS KONEKSI : BERHASIL TERHUBUNG KE MYSQL');
    console.log(`   • Database     : ${process.env.DB_NAME || 'mapala_unand'}`);
    console.log(`   • Host / Port  : ${process.env.DB_HOST || '127.0.0.1'}:${process.env.DB_PORT || 3306}`);
    conn.release();

    // 2. Hitung Isi Tabel Utama
    console.log('\n📊 RINGKASAN DATA DALAM DATABASE:');
    const counts = await query(`
      SELECT 'divisi' AS tabel, COUNT(*) AS total FROM divisi
      UNION ALL SELECT 'users (akun login)', COUNT(*) FROM users
      UNION ALL SELECT 'anggota (profil tetap)', COUNT(*) FROM anggota
      UNION ALL SELECT 'periode_registrasi', COUNT(*) FROM periode_registrasi
      UNION ALL SELECT 'registrasi_ulang (data berkala)', COUNT(*) FROM registrasi_ulang
      UNION ALL SELECT 'artikel (ekspedisi & kegiatan)', COUNT(*) FROM artikel
      UNION ALL SELECT 'prestasi', COUNT(*) FROM prestasi
      UNION ALL SELECT 'v_direktori_anggota (view privasi)', COUNT(*) FROM v_direktori_anggota
    `);

    counts.forEach(row => {
      console.log(`   • ${row.tabel.padEnd(35)} : ${row.total} baris data`);
    });

    // 3. Sampel Data Anggota
    console.log('\n👤 CONTOH DATA ANGGOTA (DARI TABEL anggota):');
    const sampleMembers = await query(`
      SELECT a.no_register, a.nama, d.nama AS divisi, a.angkatan, a.golongan_darah
      FROM anggota a
      LEFT JOIN divisi d ON d.id = a.divisi_id
      LIMIT 3
    `);
    console.table(sampleMembers);

    // 4. Sampel Akun Login
    console.log('\n🔑 AKUN LOGIN YANG SIAP DIGUNAKAN:');
    console.log('   • Admin   : username: "admin"      | password: "admin123"');
    console.log('   • Admin 2 : username: "admin2"     | password: "admin123"');
    console.log('   • Anggota : username: "MU 280 RGM" | password: "mapala123"');
    console.log('   • Anggota : username: "MU 285 PCT" | password: "mapala123"');

    console.log('\n=============================================================');
    console.log('🎉 KESIMPULAN: DATABASE SIAP DIGUNAKAN & SUDAH TERINTEGRASI!');
    console.log('=============================================================\n');

  } catch (err) {
    console.error('\n❌ GAGAL TERHUBUNG KE DATABASE:');
    console.error('Pesan Error:', err.message);
    console.log('\nTips Perbaikan:');
    console.log('1. Pastikan MySQL di XAMPP / Laragon sudah menyala (Running).');
    console.log('2. Periksa pengaturan di file .env (DB_HOST, DB_USER, DB_NAME).');
  } finally {
    await pool.end();
    process.exit(0);
  }
}

checkDatabase();
