-- =====================================================================
-- Skema database Sistem Mapala UNAND  (MySQL 8.0+ / MariaDB 10.5+)
-- Versi 2 (hasil audit terhadap PRD v1.1 dan Rekap Menu) - 23 tabel + 1 view
--
-- CARA IMPOR
--   Command line : mysql -u root -p < schema_mapala_unand.sql
--   phpMyAdmin   : Import -> pilih file ini (tanpa memilih database dulu)
--   Skrip ini membuat database `mapala_unand` sendiri, lalu langsung memakainya.
--   Jika sebelumnya sudah mengimpor versi lama, hapus dulu databasenya
--   (hilangkan tanda komentar pada baris DROP DATABASE di bawah) agar bersih.
--
-- RINGKASAN PERUBAHAN DARI VERSI SEBELUMNYA
--   1. Ditambah CREATE DATABASE + USE, charset utf8mb4 / utf8mb4_unicode_ci
--      (collation ini ada di MySQL maupun MariaDB), ENGINE=InnoDB eksplisit.
--   2. "Hanya satu yang aktif" kini DIPAKSA oleh database (sebelumnya hanya komentar):
--      kebijakan_privasi.aktif, periode_kepengurusan.is_current,
--      bagan_struktur.is_aktif (per periode), artikel_gambar.is_sampul (per artikel).
--   3. registrasi_ulang.anggota_id dan persetujuan_data.anggota_id: CASCADE -> RESTRICT,
--      supaya riwayat registrasi (NFR-08) tidak terhapus tak sengaja. PRD hanya
--      meminta "menonaktifkan" anggota (FR-30), bukan menghapus.
--   4. Index ditambah sesuai kebutuhan layar: pencarian artikel (FULLTEXT),
--      filter kategori+status, filter kota saja, prestasi, log per entitas.
--   5. Constraint data: CHECK tanggal periode, UNIQUE akun media sosial per registrasi.
--   6. View v_direktori_anggota: hanya memilih 8 kolom yang dibutuhkan
--      (sebelumnya ru.* ikut membawa foto, email, pekerjaan, dsb. ke subquery).
--   7. Data awal ditambah: kunci konten_statis (termasuk kontak_whatsapp untuk FR-07)
--      dan satu kebijakan privasi placeholder agar gerbang login pertama dapat berjalan.
-- =====================================================================

-- DROP DATABASE IF EXISTS mapala_unand;   -- aktifkan HANYA bila ingin mengulang dari nol

CREATE DATABASE IF NOT EXISTS mapala_unand
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE mapala_unand;

SET NAMES utf8mb4;

-- ========== AKUN & ANGGOTA ==========
CREATE TABLE divisi (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nama VARCHAR(100) NOT NULL,
  slug VARCHAR(120) NOT NULL UNIQUE,
  ikon VARCHAR(50),
  deskripsi TEXT,
  urutan SMALLINT NOT NULL DEFAULT 0,
  aktif TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB;

CREATE TABLE anggota (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  no_register VARCHAR(30) NOT NULL UNIQUE,
  nama VARCHAR(150) NOT NULL,
  divisi_id INT UNSIGNED NULL,
  angkatan SMALLINT NULL,                              -- perlu dikonfirmasi pengurus (PRD 2.5)
  tempat_lahir VARCHAR(100),
  tanggal_lahir DATE,
  golongan_darah ENUM('A','B','AB','O') NULL,          -- impor: sel kosong harus jadi NULL, bukan ''
  nama_ayah VARCHAR(150),
  nama_ibu VARCHAR(150),
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  profil_lengkap TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (divisi_id) REFERENCES divisi(id) ON DELETE SET NULL,
  INDEX idx_anggota_nama (nama),
  INDEX idx_anggota_angkatan (angkatan)
) ENGINE=InnoDB;

CREATE TABLE users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(30) NOT NULL UNIQUE,            -- = No. Register (admin boleh username bebas)
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('anggota','admin') NOT NULL DEFAULT 'anggota',
  anggota_id INT UNSIGNED NULL UNIQUE,             -- wajib terisi untuk role anggota (dicek di aplikasi)
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  must_change_password TINYINT(1) NOT NULL DEFAULT 1,  -- login pertama / setelah reset
  failed_login_count SMALLINT NOT NULL DEFAULT 0,      -- NFR-06
  locked_until DATETIME NULL,
  last_login_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (anggota_id) REFERENCES anggota(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ========== REGISTRASI ULANG ==========
CREATE TABLE periode_registrasi (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nama VARCHAR(100) NOT NULL,
  tahun SMALLINT NOT NULL UNIQUE,
  tanggal_buka DATE,
  tanggal_tutup DATE,
  status ENUM('buka','tutup') NOT NULL DEFAULT 'tutup',   -- dibuka/ditutup manual oleh admin (FR-33)
  CONSTRAINT chk_periode_reg_tanggal
    CHECK (tanggal_buka IS NULL OR tanggal_tutup IS NULL OR tanggal_tutup >= tanggal_buka)
) ENGINE=InnoDB;

CREATE TABLE jenis_atribut (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nama VARCHAR(100) NOT NULL UNIQUE,               -- Topi Rimba, Baju Lapangan
  aktif TINYINT(1) NOT NULL DEFAULT 1,
  urutan SMALLINT NOT NULL DEFAULT 0
) ENGINE=InnoDB;

CREATE TABLE registrasi_ulang (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  anggota_id INT UNSIGNED NOT NULL,
  periode_id INT UNSIGNED NOT NULL,
  foto_path VARCHAR(255),
  alamat_rumah TEXT,
  kota_kabupaten VARCHAR(100),
  provinsi VARCHAR(100),
  pekerjaan VARCHAR(150),
  no_hp VARCHAR(20),
  email VARCHAR(150),
  alamat_orang_tua TEXT,
  sumber_input ENUM('mandiri','admin') NOT NULL DEFAULT 'mandiri',
  diinput_oleh INT UNSIGNED NULL,                  -- users.id admin bila sumber = admin
  submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_anggota_periode (anggota_id, periode_id),   -- NFR-08
  FOREIGN KEY (anggota_id) REFERENCES anggota(id) ON DELETE RESTRICT,
  FOREIGN KEY (periode_id) REFERENCES periode_registrasi(id) ON DELETE RESTRICT,
  FOREIGN KEY (diinput_oleh) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_reg_domisili (provinsi, kota_kabupaten),
  INDEX idx_reg_kota (kota_kabupaten)              -- filter kota/kabupaten tanpa provinsi (FR-29, FR-47)
) ENGINE=InnoDB;

CREATE TABLE registrasi_media_sosial (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  registrasi_id INT UNSIGNED NOT NULL,
  platform VARCHAR(50) NOT NULL,
  akun VARCHAR(150) NOT NULL,
  UNIQUE KEY uq_reg_medsos (registrasi_id, platform, akun),
  FOREIGN KEY (registrasi_id) REFERENCES registrasi_ulang(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE registrasi_atribut (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  registrasi_id INT UNSIGNED NOT NULL,
  jenis_atribut_id INT UNSIGNED NOT NULL,
  memiliki TINYINT(1) NOT NULL DEFAULT 0,
  foto_path VARCHAR(255),
  UNIQUE KEY uq_reg_atribut (registrasi_id, jenis_atribut_id),
  FOREIGN KEY (registrasi_id) REFERENCES registrasi_ulang(id) ON DELETE CASCADE,
  FOREIGN KEY (jenis_atribut_id) REFERENCES jenis_atribut(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ========== PERSETUJUAN DATA ==========
CREATE TABLE kebijakan_privasi (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  versi VARCHAR(20) NOT NULL UNIQUE,
  judul VARCHAR(200) NOT NULL,
  isi LONGTEXT NOT NULL,
  berlaku_sejak DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  aktif TINYINT(1) NOT NULL DEFAULT 0,
  -- Pemaksa "hanya satu versi aktif": kolom ini bernilai 1 bila aktif, NULL bila tidak;
  -- UNIQUE mengizinkan banyak NULL tetapi hanya satu angka 1.
  aktif_unik TINYINT GENERATED ALWAYS AS (IF(aktif = 1, 1, NULL)) VIRTUAL,
  UNIQUE KEY uq_kebijakan_aktif (aktif_unik)
) ENGINE=InnoDB;

CREATE TABLE persetujuan_data (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  anggota_id INT UNSIGNED NOT NULL,
  kebijakan_id INT UNSIGNED NOT NULL,
  disetujui_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_persetujuan (anggota_id, kebijakan_id),
  FOREIGN KEY (anggota_id) REFERENCES anggota(id) ON DELETE RESTRICT,
  FOREIGN KEY (kebijakan_id) REFERENCES kebijakan_privasi(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ========== KONTEN PUBLIK ==========
CREATE TABLE kategori_artikel (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nama VARCHAR(100) NOT NULL,
  slug VARCHAR(120) NOT NULL UNIQUE,
  urutan SMALLINT NOT NULL DEFAULT 0
) ENGINE=InnoDB;

CREATE TABLE lokasi (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nama VARCHAR(150) NOT NULL,
  slug VARCHAR(160) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE jadwal_operasional (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nama VARCHAR(100) NOT NULL,
  slug VARCHAR(120) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE artikel (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  kategori_id INT UNSIGNED NOT NULL,
  divisi_id INT UNSIGNED NULL,
  lokasi_id INT UNSIGNED NULL,
  jadwal_id INT UNSIGNED NULL,
  penulis_id INT UNSIGNED NULL,
  judul VARCHAR(255) NOT NULL,
  slug VARCHAR(280) NOT NULL UNIQUE,
  ringkasan TEXT,
  isi LONGTEXT,
  status_kegiatan VARCHAR(50),
  tim_capaian VARCHAR(255),
  tanggal_kegiatan DATE,
  status_publikasi ENUM('draf','terbit') NOT NULL DEFAULT 'draf',
  published_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (kategori_id) REFERENCES kategori_artikel(id) ON DELETE RESTRICT,
  FOREIGN KEY (divisi_id) REFERENCES divisi(id) ON DELETE SET NULL,
  FOREIGN KEY (lokasi_id) REFERENCES lokasi(id) ON DELETE SET NULL,
  FOREIGN KEY (jadwal_id) REFERENCES jadwal_operasional(id) ON DELETE SET NULL,
  FOREIGN KEY (penulis_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_artikel_list (status_publikasi, tanggal_kegiatan),
  INDEX idx_artikel_kategori (kategori_id, status_publikasi, tanggal_kegiatan),
  FULLTEXT KEY ft_artikel_cari (judul, ringkasan)   -- kolom pencarian di halaman Kegiatan & Artikel
) ENGINE=InnoDB;

CREATE TABLE artikel_gambar (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  artikel_id INT UNSIGNED NOT NULL,
  path VARCHAR(255) NOT NULL,
  caption VARCHAR(255),
  is_sampul TINYINT(1) NOT NULL DEFAULT 0,
  urutan SMALLINT NOT NULL DEFAULT 0,
  -- maksimal satu gambar sampul per artikel
  sampul_unik INT UNSIGNED GENERATED ALWAYS AS (IF(is_sampul = 1, artikel_id, NULL)) VIRTUAL,
  UNIQUE KEY uq_artikel_sampul (sampul_unik),
  FOREIGN KEY (artikel_id) REFERENCES artikel(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE periode_kepengurusan (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nama VARCHAR(50) NOT NULL,                       -- mis. 2025/2026
  tahun_mulai SMALLINT NOT NULL,
  tahun_selesai SMALLINT NOT NULL,
  is_current TINYINT(1) NOT NULL DEFAULT 0,
  -- hanya satu periode kepengurusan berjalan
  current_unik TINYINT GENERATED ALWAYS AS (IF(is_current = 1, 1, NULL)) VIRTUAL,
  UNIQUE KEY uq_periode_current (current_unik),
  UNIQUE KEY uq_periode_tahun (tahun_mulai, tahun_selesai),
  CONSTRAINT chk_periode_pengurus_tahun CHECK (tahun_selesai >= tahun_mulai)
) ENGINE=InnoDB;

-- Gambar bagan struktur yang diunggah admin lewat CMS (satu periode bisa punya beberapa unggahan,
-- is_aktif = 1 untuk yang tampil di halaman publik; maksimal satu aktif per periode)
CREATE TABLE bagan_struktur (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  periode_kepengurusan_id INT UNSIGNED NOT NULL,
  judul VARCHAR(255) NOT NULL,         -- kolom "Keterangan / Judul Bagan"
  gambar_path VARCHAR(255) NOT NULL,   -- JPG/PNG/WEBP, maks 5 MB (divalidasi aplikasi)
  is_aktif TINYINT(1) NOT NULL DEFAULT 1,
  uploaded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  aktif_unik INT UNSIGNED GENERATED ALWAYS AS (IF(is_aktif = 1, periode_kepengurusan_id, NULL)) VIRTUAL,
  UNIQUE KEY uq_bagan_aktif (aktif_unik),
  FOREIGN KEY (periode_kepengurusan_id) REFERENCES periode_kepengurusan(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE prestasi (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tahun SMALLINT NOT NULL,
  kategori VARCHAR(100),
  judul VARCHAR(255) NOT NULL,
  deskripsi TEXT,
  info_label_1 VARCHAR(150),
  info_label_2 VARCHAR(150),
  gambar_path VARCHAR(255),
  gambar_caption VARCHAR(255),
  is_sorotan TINYINT(1) NOT NULL DEFAULT 0,
  sorotan_judul VARCHAR(150),
  sorotan_subjudul VARCHAR(150),
  sorotan_detail VARCHAR(255),
  urutan SMALLINT NOT NULL DEFAULT 0,
  INDEX idx_prestasi_tahun (tahun, urutan),
  INDEX idx_prestasi_sorotan (is_sorotan, urutan)
) ENGINE=InnoDB;

CREATE TABLE konten_statis (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  kunci VARCHAR(80) NOT NULL UNIQUE,   -- sejarah, visi, kode_etik, kontak_email, kontak_alamat, hero_foto, ...
  nilai LONGTEXT,
  kelompok VARCHAR(50),
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE misi_poin (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  teks TEXT NOT NULL,
  urutan SMALLINT NOT NULL DEFAULT 0
) ENGINE=InnoDB;

CREATE TABLE statistik_beranda (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  ikon VARCHAR(50),
  angka VARCHAR(30) NOT NULL,          -- varchar karena satu kartu berupa teks
  satuan VARCHAR(30),
  label VARCHAR(100) NOT NULL,
  urutan SMALLINT NOT NULL DEFAULT 0
) ENGINE=InnoDB;

CREATE TABLE tautan_sosial (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  platform VARCHAR(50) NOT NULL,
  url VARCHAR(255) NOT NULL,
  urutan SMALLINT NOT NULL DEFAULT 0
) ENGINE=InnoDB;

-- ========== AUDIT ==========
CREATE TABLE log_aktivitas (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NULL,
  aksi VARCHAR(50) NOT NULL,           -- create, update, deactivate, reset_password, import, ...
  entitas VARCHAR(50),
  entitas_id VARCHAR(50),
  data_lama JSON NULL,
  data_baru JSON NULL,
  ip_address VARCHAR(45),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_log_waktu (created_at),
  INDEX idx_log_entitas (entitas, entitas_id)
) ENGINE=InnoDB;

-- ========== VIEW DIREKTORI ANGGOTA (FR-46, FR-47) ==========
-- Hanya 5 data: nama, No. Register, No. HP, golongan darah, alamat tinggal saat ini.
-- Hanya anggota aktif yang sudah menyetujui kebijakan versi aktif,
-- memakai registrasi ulang dari periode terbaru.
-- Aplikasi sebaiknya membaca direktori HANYA lewat view ini (bukan tabel anggota langsung).
CREATE OR REPLACE VIEW v_direktori_anggota AS
SELECT a.id AS anggota_id, a.nama, a.no_register, r.no_hp, a.golongan_darah,
       r.alamat_rumah, r.kota_kabupaten, r.provinsi
FROM anggota a
JOIN persetujuan_data pd ON pd.anggota_id = a.id
JOIN kebijakan_privasi kp ON kp.id = pd.kebijakan_id AND kp.aktif = 1
LEFT JOIN (
  SELECT ru.anggota_id, ru.no_hp, ru.alamat_rumah, ru.kota_kabupaten, ru.provinsi,
         ROW_NUMBER() OVER (PARTITION BY ru.anggota_id ORDER BY pr.tahun DESC) AS rn
  FROM registrasi_ulang ru
  JOIN periode_registrasi pr ON pr.id = ru.periode_id
) r ON r.anggota_id = a.id AND r.rn = 1
WHERE a.is_active = 1;

-- ========== DATA AWAL ==========
INSERT IGNORE INTO jenis_atribut (nama, urutan) VALUES ('Topi Rimba', 1), ('Baju Lapangan', 2);

INSERT IGNORE INTO kategori_artikel (nama, slug, urutan) VALUES
  ('Ekspedisi','ekspedisi',1), ('Pendakian & Rimba','pendakian-rimba',2),
  ('Kegiatan Lapangan','kegiatan-lapangan',3), ('Program Divisi','program-divisi',4),
  ('Berita & Edukasi','berita-edukasi',5);

-- Kunci konten statis (nilai diisi admin lewat CMS "Tentang Kami & Kontak").
-- kontak_whatsapp ditambahkan karena FR-07 menyebut WhatsApp sebagai kontak resmi.
INSERT IGNORE INTO konten_statis (kunci, nilai, kelompok) VALUES
  ('hero_judul', NULL, 'beranda'),
  ('hero_tagline', NULL, 'beranda'),
  ('hero_deskripsi', NULL, 'beranda'),
  ('hero_foto', NULL, 'beranda'),
  ('sejarah', NULL, 'tentang'),
  ('sejarah_foto', NULL, 'tentang'),
  ('sejarah_foto_caption', NULL, 'tentang'),
  ('visi', NULL, 'tentang'),
  ('kode_etik', NULL, 'tentang'),
  ('kode_etik_keterangan', NULL, 'tentang'),
  ('kontak_email', NULL, 'kontak'),
  ('kontak_whatsapp', NULL, 'kontak'),
  ('kontak_alamat', NULL, 'kontak'),
  ('footer_deskripsi', NULL, 'footer');

-- Kebijakan privasi PLACEHOLDER: wajib diganti dengan naskah resmi (FR-44, NFR-07).
-- Tanpa satu versi aktif, tidak ada anggota yang bisa lolos gerbang login pertama
-- dan direktori anggota akan kosong.
-- Saat menerbitkan versi baru: set aktif = 0 pada versi lama LEBIH DULU, baru insert/aktifkan versi baru
-- (database menolak dua versi aktif sekaligus).
INSERT IGNORE INTO kebijakan_privasi (versi, judul, isi, aktif) VALUES
  ('1.0', 'Kebijakan Privasi dan Persetujuan Penggunaan Data',
   '[GANTI DENGAN NASKAH RESMI: data yang dikumpulkan, tujuan, pihak yang dapat mengakses, dan pembagian data terbatas ke anggota lain pada Direktori Anggota.]',
   1);

-- ---------------------------------------------------------------------
-- AKUN ADMIN PERTAMA (tidak bisa disediakan di sini karena butuh password hash dari aplikasi).
-- Buat lewat skrip seed aplikasi, atau isi hash bcrypt/argon2 sendiri lalu aktifkan baris ini:
--
-- INSERT INTO users (username, password_hash, role, anggota_id, must_change_password)
-- VALUES ('admin', '<HASH_PASSWORD_AWAL>', 'admin', NULL, 1);
-- ---------------------------------------------------------------------
