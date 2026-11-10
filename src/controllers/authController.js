const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query, execute } = require('../config/mysql');
const { JWT_SECRET } = require('../middlewares/authMiddleware');

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username (No. Register) dan Password wajib diisi.'
      });
    }

    // Query user directly from MySQL
    const users = await query(`
      SELECT u.id, u.username, u.password_hash, u.role, u.anggota_id,
             u.is_active, u.must_change_password,
             COALESCE(a.nama, u.username) AS nama,
             COALESCE(a.profil_lengkap, 0) AS profil_lengkap
      FROM users u
      LEFT JOIN anggota a ON a.id = u.anggota_id
      WHERE LOWER(TRIM(u.username)) = LOWER(TRIM(?))
      LIMIT 1
    `, [username]);

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Kombinasi No. Register dan Password tidak ditemukan di database.'
      });
    }

    const user = users[0];

    if (!user.is_active) {
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

    // Update last_login_at in MySQL
    await execute(`
      UPDATE users SET last_login_at = NOW() WHERE id = ?
    `, [user.id]);

    // Jika akun anggota masih menggunakan password default 'mapala123' atau flag must_change_password masih 1:
    let mustChangePassword = Boolean(user.must_change_password);
    if (user.role === 'anggota' && password === 'mapala123') {
      mustChangePassword = true;
      await execute(`UPDATE users SET must_change_password = 1 WHERE id = ?`, [user.id]);
    }

    // Check privacy consent for members
    let privacyConsentGiven = true;
    if (user.role === 'anggota' && user.anggota_id) {
      const consentRows = await query(`
        SELECT id FROM persetujuan_data WHERE anggota_id = ? LIMIT 1
      `, [user.anggota_id]);
      privacyConsentGiven = consentRows.length > 0;
    }

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        nama: user.nama,
        role: user.role,
        anggota_id: user.anggota_id,
        must_change_password: mustChangePassword,
        profil_lengkap: Number(user.profil_lengkap || 0),
        privacy_consent_given: privacyConsentGiven
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
          anggota_id: user.anggota_id,
          must_change_password: mustChangePassword,
          profil_lengkap: Number(user.profil_lengkap || 0),
          privacy_consent_given: privacyConsentGiven
        }
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan sistem saat otentikasi.' });
  }
};

exports.changePassword = async (req, res) => {
  try {
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

    const users = await query(`SELECT id, password_hash, username FROM users WHERE id = ?`, [userId]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'Akun pengguna tidak ditemukan.' });
    }

    const user = users[0];
    const isOldMatch = bcrypt.compareSync(oldPassword, user.password_hash);
    if (!isOldMatch) {
      return res.status(400).json({ success: false, message: 'Password lama yang Anda masukkan salah.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const newHash = bcrypt.hashSync(newPassword, salt);

    await execute(`
      UPDATE users SET password_hash = ?, must_change_password = 0 WHERE id = ?
    `, [newHash, userId]);

    // Log to log_aktivitas
    await execute(`
      INSERT INTO log_aktivitas (user_id, aksi, entitas, entitas_id, data_baru, ip_address, created_at)
      VALUES (?, 'GANTI_PASSWORD', 'users', ?, JSON_OBJECT('keterangan', 'Pengguna mengubah password akun'), ?, NOW())
    `, [userId, String(userId), req.ip || '127.0.0.1']);

    return res.json({
      success: true,
      message: 'Password berhasil diperbarui di database.'
    });
  } catch (err) {
    console.error('Change password error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan sistem.' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const users = await query(`
      SELECT u.id, u.username, u.role, u.anggota_id, u.last_login_at AS last_login,
             COALESCE(a.nama, u.username) AS nama
      FROM users u
      LEFT JOIN anggota a ON a.id = u.anggota_id
      WHERE u.id = ?
    `, [req.user.id]);

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });
    }

    return res.json({
      success: true,
      data: users[0]
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
