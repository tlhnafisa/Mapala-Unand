const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'mapala_unand',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
});

// Helper for promise-based query
async function query(sql, params = []) {
  const [rows] = await pool.query(sql, params);
  return rows;
}

// Helper for execute (insert, update, delete)
async function execute(sql, params = []) {
  const [result] = await pool.execute(sql, params);
  return result;
}

// Test connection on module load
pool.getConnection()
  .then(conn => {
    console.log(`[MYSQL CONNECTED] Terhubung ke basis data '${process.env.DB_NAME || 'mapala_unand'}' pada ${process.env.DB_HOST || '127.0.0.1'}:${process.env.DB_PORT || 3306}`);
    conn.release();
  })
  .catch(err => {
    console.error(`[MYSQL ERROR] Gagal terhubung ke basis data:`, err.message);
  });

module.exports = {
  pool,
  query,
  execute
};
