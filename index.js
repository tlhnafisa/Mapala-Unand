/**
 * Entry point aplikasi Mapala UNAND
 * Menjalankan server terintegrasi dari server.js
 */
const app = require('./server');
const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\n=============================================================`);
    console.log(`   🌲 SISTEM INFORMASI MANAJEMEN KEANGGOTAAN MAPALA UNAND 🌲   `);
    console.log(`=============================================================`);
    console.log(` • Website Publik    : http://localhost:${PORT}/`);
    console.log(` • Portal Anggota    : http://localhost:${PORT}/anggota`);
    console.log(` • Dashboard Admin   : http://localhost:${PORT}/admin`);
    console.log(` • API Base URL      : http://localhost:${PORT}/api`);
    console.log(`=============================================================\n`);
  });
}

module.exports = app;