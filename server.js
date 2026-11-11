try { require('dotenv').config(); } catch (e) {}
const express = require('express');
const path = require('path');

let cors;
try {
  cors = require('cors');
} catch (e) {
  cors = () => (req, res, next) => next();
}

// Safely import API routes (with graceful fallback if packages are not yet installed)
let apiRoutes;
try {
  apiRoutes = require('./src/routes');
} catch (e) {
  console.warn('[SERVER NOTICE] API routes backend belum dapat dimuat (butuh npm install bcryptjs jsonwebtoken multer):', e.message);
  const router = express.Router();
  router.use((req, res) => {
    res.status(503).json({
      success: false,
      message: 'API backend sedang dalam persiapan integrasi database. Silakan jalankan `npm install` terlebih dahulu.'
    });
  });
  apiRoutes = router;
}

const app = express();
const PORT = process.env.PORT || 3000;

// ========================================================
// GLOBAL MIDDLEWARES
// ========================================================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ========================================================
// STATIC ASSETS MAPPING
// ========================================================
// Root public directory
app.use(express.static(path.join(__dirname, 'public')));

// Shared media & uploads
app.use('/images', express.static(path.join(__dirname, 'public/images')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Dedicated & backward-compatible asset paths
app.use('/publik/css', express.static(path.join(__dirname, 'public/publik/css')));
app.use('/publik/js', express.static(path.join(__dirname, 'public/publik/js')));
app.use('/css', express.static(path.join(__dirname, 'public/publik/css')));
app.use('/js', express.static(path.join(__dirname, 'public/publik/js')));

app.use('/admin/css', express.static(path.join(__dirname, 'public/admin/css')));
app.use('/admin/js', express.static(path.join(__dirname, 'public/admin/js')));

app.use('/anggota/css', express.static(path.join(__dirname, 'public/anggota/css')));
app.use('/anggota/js', express.static(path.join(__dirname, 'public/anggota/js')));

// ========================================================
// API ROUTES
// ========================================================
app.use('/api', apiRoutes);

// ========================================================
// WEB APPLICATION ROUTES (Express 5 Compatible)
// ========================================================

// 1. BAGIAN A: WEBSITE PUBLIK (Landing Page & Menu Publik)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/publik/index.html'));
});

app.get('/tentang-kami', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/publik/tentang-kami.html'));
});

app.get('/kegiatan-artikel', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/publik/kegiatan-artikel.html'));
});

app.get('/kegiatan-artikel/detail', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/publik/detail-artikel.html'));
});

app.get('/kegiatan-artikel/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/publik/detail-artikel.html'));
});

app.get('/struktur-organisasi', (req, res) => {
  res.redirect('/#struktur-organisasi');
});

app.get('/prestasi', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/publik/prestasi.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/publik/login.html'));
});

// 2. BAGIAN B: PORTAL ANGGOTA & ONBOARDING WIZARD (Member Area)
app.get('/aktivasi-anggota', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/anggota/aktivasi.html'));
});

app.get(/^\/anggota(\/.*)?$/, (req, res) => {
  res.sendFile(path.join(__dirname, 'public/anggota/index.html'));
});

// 3. BAGIAN C: DASHBOARD PENGELOLA (Admin Dashboard SPA)
app.get(/^\/admin(\/.*)?$/, (req, res) => {
  res.sendFile(path.join(__dirname, 'public/admin/index.html'));
});

// ========================================================
// 404 NOT FOUND & GLOBAL ERROR HANDLER
// ========================================================
app.use((req, res, next) => {
  if (req.accepts('html')) {
    return res.status(404).sendFile(path.join(__dirname, 'public/publik/index.html'));
  }
  res.status(404).json({
    success: false,
    message: `Rute '${req.originalUrl}' tidak ditemukan pada server Mapala UNAND.`
  });
});

app.use((err, req, res, next) => {
  console.error('[SERVER ERROR]:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Terjadi kesalahan internal pada server.'
  });
});

// ========================================================
// SERVER INITIALIZATION
// ========================================================
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\n=============================================================`);
    console.log(`   🌲 SISTEM INFORMASI MANAJEMEN KEANGGOTAAN MAPALA UNAND 🌲   `);
    console.log(`=============================================================`);
    console.log(` • Website Publik    : http://localhost:${PORT}/`);
    console.log(` • Portal Anggota    : http://localhost:${PORT}/anggota`);
    console.log(` • Dashboard Admin   : http://localhost:${PORT}/admin`);
    console.log(` • API Base URL      : http://localhost:${PORT}/api`);
    console.log(` • Port              : ${PORT}`);
    console.log(`=============================================================\n`);
  });
}

module.exports = app;
