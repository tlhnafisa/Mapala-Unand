const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'mapala-unand-secret-key-2026';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Akses ditolak: Token autentikasi tidak ditemukan.'
    });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Sesi tidak valid atau telah kedaluwarsa. Silakan login kembali.'
      });
    }

    req.user = decoded;
    next();
  });
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Akses ditolak: Anda tidak memiliki izin Admin untuk mengakses fitur ini.'
    });
  }
  next();
}

module.exports = {
  authenticateToken,
  requireAdmin,
  JWT_SECRET
};

