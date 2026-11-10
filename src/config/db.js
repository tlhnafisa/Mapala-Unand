const fs = require('fs');
const path = require('path');
const { pool, query, execute } = require('./mysql');

const DATA_DIR = path.join(__dirname, '../../data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

class DatabaseManager {
  constructor() {
    this.data = {
      users: [],
      members: [],
      reRegistrations: [],
      periodes: [],
      divisions: [],
      atributs: [],
      articles: [],
      prestasi: [],
      kontenStatis: {},
      logs: []
    };
    this.mysqlPool = pool;
    this.query = query;
    this.execute = execute;

    this.init();
  }

  async init() {
    // Try to load state directly from MySQL first
    try {
      await this.syncFromMySQL();
      console.log('[DATABASE] Berhasil menyinkronkan data in-memory dari basis data MySQL mapala_unand.');
    } catch (err) {
      console.warn('[DATABASE] Sinkronisasi MySQL tertunda, membaca data lokal dari cache...', err.message);
      this.loadFromFile();
    }
  }

  loadFromFile() {
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
      } catch (err) {
        console.error('Error membaca database.json cache:', err);
      }
    }
  }

  async syncFromMySQL() {
    try {
      // 1. Users
      const usersRows = await query(`
        SELECT u.id, u.username, u.password_hash, u.role, u.is_active AS status_aktif,
               u.must_change_password, u.last_login_at AS last_login,
               COALESCE(a.nama, u.username) AS nama
        FROM users u
        LEFT JOIN anggota a ON a.id = u.anggota_id
      `);
      this.data.users = usersRows.map(u => ({
        ...u,
        status_aktif: Boolean(u.status_aktif),
        must_change_password: Boolean(u.must_change_password)
      }));

      // 2. Members (Data Tetap)
      const membersRows = await query(`
        SELECT a.id, a.no_register, a.nama, d.nama AS divisi, a.angkatan,
               a.tempat_lahir, DATE_FORMAT(a.tanggal_lahir, '%Y-%m-%d') AS tanggal_lahir,
               a.golongan_darah, a.nama_ayah, a.nama_ibu, a.is_active AS status_aktif,
               a.profil_lengkap, a.created_at, a.updated_at
        FROM anggota a
        LEFT JOIN divisi d ON d.id = a.divisi_id
        ORDER BY a.id ASC
      `);
      this.data.members = membersRows.map(m => ({
        ...m,
        status_aktif: Boolean(m.status_aktif),
        profil_lengkap: Boolean(m.profil_lengkap)
      }));

      // 3. Periodes
      const periodRows = await query(`
        SELECT id, tahun, nama AS nama_periode,
               DATE_FORMAT(tanggal_buka, '%Y-%m-%d') AS tanggal_buka,
               DATE_FORMAT(tanggal_tutup, '%Y-%m-%d') AS tanggal_tutup,
               (status = 'buka') AS is_active,
               status
        FROM periode_registrasi
      `);
      this.data.periodes = periodRows.map(p => ({
        ...p,
        is_active: Boolean(p.is_active)
      }));

      // 4. Re-registrations
      const regRows = await query(`
        SELECT ru.id, a.no_register, pr.tahun AS periode_tahun, ru.foto_path AS foto_terbaru,
               ru.alamat_rumah, ru.kota_kabupaten, ru.provinsi, ru.pekerjaan, ru.no_hp,
               ru.email, ru.alamat_orang_tua AS alamat_ortu, ru.sumber_input,
               COALESCE(u.username, 'mandiri') AS input_by,
               ru.submitted_at, ru.updated_at,
               'Sudah Registrasi Ulang' AS status_registrasi
        FROM registrasi_ulang ru
        JOIN anggota a ON a.id = ru.anggota_id
        JOIN periode_registrasi pr ON pr.id = ru.periode_id
        LEFT JOIN users u ON u.id = ru.diinput_oleh
      `);
      this.data.reRegistrations = regRows;

      // 5. Divisions
      const divRows = await query(`
        SELECT id, nama AS nama_divisi, slug AS kode, deskripsi, urutan, aktif
        FROM divisi WHERE aktif = 1 ORDER BY urutan ASC
      `);
      this.data.divisions = divRows;

      // 6. Atributs
      const atrRows = await query(`
        SELECT id, nama AS nama_atribut, aktif, urutan FROM jenis_atribut WHERE aktif = 1
      `);
      this.data.atributs = atrRows.map(a => ({
        ...a,
        wajib: true,
        keterangan: a.nama_atribut
      }));

      // 7. Articles
      const artRows = await query(`
        SELECT a.id, a.judul, a.slug, k.slug AS kategori, COALESCE(ag.path, '/images/hero-mountain.jpg') AS foto,
               DATE_FORMAT(a.tanggal_kegiatan, '%Y-%m-%d') AS tanggal,
               a.status_publikasi AS status,
               COALESCE(u.username, 'Humas & Publikasi') AS penulis,
               a.ringkasan, a.isi, a.status_kegiatan, a.tim_capaian
        FROM artikel a
        JOIN kategori_artikel k ON k.id = a.kategori_id
        LEFT JOIN artikel_gambar ag ON ag.artikel_id = a.id AND ag.is_sampul = 1
        LEFT JOIN users u ON u.id = a.penulis_id
        ORDER BY a.id DESC
      `);
      this.data.articles = artRows;

      // 8. Prestasi
      const prsRows = await query(`
        SELECT id, tahun, kategori, judul, deskripsi, info_label_1, info_label_2,
               gambar_path AS foto, is_sorotan, sorotan_judul, sorotan_subjudul, sorotan_detail
        FROM prestasi ORDER BY tahun DESC
      `);
      this.data.prestasi = prsRows;

      // 9. Konten Statis
      const statRows = await query(`SELECT kunci, nilai, kelompok FROM konten_statis`);
      const staticObj = {};
      statRows.forEach(r => {
        staticObj[r.kunci] = r.nilai;
      });
      this.data.kontenStatis = staticObj;

      // 10. Logs
      const logRows = await query(`
        SELECT l.id, l.aksi, l.entitas, l.created_at AS waktu,
               COALESCE(u.username, 'system') AS admin,
               COALESCE(JSON_UNQUOTE(JSON_EXTRACT(l.data_baru, '$.detail')), l.aksi) AS detail
        FROM log_aktivitas l
        LEFT JOIN users u ON u.id = l.user_id
        ORDER BY l.id DESC LIMIT 50
      `);
      this.data.logs = logRows;

      // Save cache file
      this.save();
    } catch (err) {
      console.error('[DATABASE SYNC ERROR]:', err);
    }
  }

  get(table) {
    return this.data[table] || [];
  }

  set(table, values) {
    this.data[table] = values;
    this.save();
  }

  save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving cache file:', err);
    }
  }
}

const db = new DatabaseManager();

module.exports = db;
