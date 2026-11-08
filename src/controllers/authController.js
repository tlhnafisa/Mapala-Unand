const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { JWT_SECRET } = require('../middlewares/authMiddleware');
const { logActivity } = require('../services/loggerService');

exports.login = (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: 'Username (No. Register) dan Password wajib diisi.'
    });
  }

  const users = db.get('users');
  const user = users.find(u => u.username.toLowerCase() === username.trim().toLowerCase());

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Kombinasi No. Register dan Password tidak ditemukan.'
    });
  }

  if (!user.status_aktif) {
    return res.status(403).json({
      success: false,
      message: 'Akun Anda berstatus nonaktif. Silakan hubungi pengurus Mapala UNAND.'
    });
  }

  const isMatch = bcrypt.compareSync(password, user.password_hash);
  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: 'Kombinasi No. Register dan Password salah.'
    });
  }

  // Update last login
  user.last_login = new Date().toISOString();
  db.set('users', users);

  const token = jwt.sign(
    {
      id: user.id,
      username: user.username,
      nama: user.nama,
      role: user.role,
      must_change_password: user.must_change_password
    },
    JWT_SECRET,
    { expiresIn: '12h' }
  );

  return res.json({
    success: true,
    message: 'Login berhasil.',
    data: {
      token,
      user: {
        id: user.id,
        username: user.username,
        nama: user.nama,
        role: user.role,
        must_change_password: user.must_change_password
      }
    }
  });
};

exports.changePassword = (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const userId = req.user.id;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: 'Password lama dan password baru wajib diisi.'
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password baru minimal harus 6 karakter.'
    });
  }

  const users = db.get('users');
  const user = users.find(u => u.id === userId);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'Akun pengguna tidak ditemukan.'
    });
  }

  const isOldMatch = bcrypt.compareSync(oldPassword, user.password_hash);
  if (!isOldMatch) {
    return res.status(400).json({
      success: false,
      message: 'Password lama yang Anda masukkan salah.'
    });
  }

  const salt = bcrypt.genSaltSync(10);
  user.password_hash = bcrypt.hashSync(newPassword, salt);
  user.must_change_password = false;

  db.set('users', users);

  logActivity(user.username, 'GANTI_PASSWORD', `Pengguna ${user.username} mengubah password akun.`);

  return res.json({
    success: true,
    message: 'Password berhasil diperbarui.'
  });
};

exports.getProfile = (req, res) => {
  const users = db.get('users');
  const user = users.find(u => u.id === req.user.id);

  if (!user) {
    return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });
  }

  return res.json({
    success: true,
    data: {
      id: user.id,
      username: user.username,
      nama: user.nama,
      role: user.role,
      last_login: user.last_login
    }
  });
};

