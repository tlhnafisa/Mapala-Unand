require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');

// Import Main Routes
const apiRoutes = require('./src/routes');

const app = express();
const PORT = process.env.PORT || 3000;

// ========================================================
// GLOBAL MIDDLEWARES
// ========================================================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ========================================================
// STATIC ASSETS & FILE UPLOADS
// ========================================================
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// ========================================================
// API ROUTES
// ========================================================
app.use('/api', apiRoutes);

// ========================================================
// ADMIN WEB ROUTES
// ========================================================
// Direct route to Admin Dashboard Single Page Application
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/admin/index.html'));
});

// Root fallback to Admin Dashboard
app.get('/', (req, res) => {
  res.redirect('/admin');
});

// ========================================================
// 404 NOT FOUND & GLOBAL ERROR HANDLER
// ========================================================
app.use((req, res, next) => {
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
let server;
if (require.main === module) {
  server = app.listen(PORT, () => {
    console.log(`\n=============================================================`);
    console.log(`   🌲 SISTEM INFORMASI MANAJEMEN KEANGGOTAAN MAPALA UNAND 🌲   `);
    console.log(`=============================================================`);
    console.log(` • Server aktif pada : http://localhost:${PORT}`);
    console.log(` • Dashboard Admin   : http://localhost:${PORT}/admin`);
    console.log(` • API Base URL      : http://localhost:${PORT}/api`);
    console.log(` • Environment       : ${process.env.NODE_ENV || 'development'}`);
    console.log(`=============================================================\n`);
  });
}

module.exports = app;

