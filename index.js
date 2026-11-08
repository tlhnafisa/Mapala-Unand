const express = require('express');
const path = require('path');
const cors = require('cors');
const apiRoutes = require('./src/routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static assets
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Mount API routes
app.use('/api', apiRoutes);

// Admin dashboard route
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/admin/index.html'));
});

// Root route
app.get('/', (req, res) => {
  res.redirect('/admin');
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Terjadi kesalahan pada internal server.'
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`===================================================`);
    console.log(`  SISTEM INFORMASI MANAJEMEN KEANGGOTAAN MAPALA UNAND`);
    console.log(`  Server aktif di http://localhost:${PORT}`);
    console.log(`  Dashboard Admin: http://localhost:${PORT}/admin`);
    console.log(`===================================================`);
  });
}

module.exports = app;
