-- =====================================================================
-- SQL DATA DUMMY & SEED RESMI SISTEM MAPALA UNAND
-- Basis Data: mapala_unand (MySQL 8.0+ / MariaDB 10.5+)
-- Menghubungkan seluruh 23 tabel dan 1 view dengan data realistis
-- =====================================================================

USE mapala_unand;
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. DIVISI RESMI MAPALA UNAND (4 Divisi Spesialisasi)
TRUNCATE TABLE divisi;
INSERT INTO divisi (id, nama, slug, ikon, deskripsi, urutan, aktif) VALUES
  (1, 'Rimba Gunung', 'rimba-gunung', 'mountain', 'Spesialisasi penjelajahan rimba belantara, navigasi darat, dan pendakian gunung hutan tropis.', 1, 1),
  (2, 'Panjat Tebing', 'panjat-tebing', 'climbing', 'Spesialisasi panjat tebing alam (rock climbing), panjat dinding artifisial, dan vertical rescue.', 2, 1),
  (3, 'Olahraga Air', 'olahraga-air', 'compass', 'Spesialisasi arung jeram (white water rafting), kayak arus deras, dan navigasi sungai.', 3, 1),
  (4, 'Caving', 'caving', 'flashlight', 'Spesialisasi susur gua alam (speleologi), pemetaan lorong bawah tanah, dan biospeleologi karst.', 4, 1);

-- 2. KATEGORI ARTIKEL / KEGIATAN
TRUNCATE TABLE kategori_artikel;
INSERT INTO kategori_artikel (id, nama, slug, urutan) VALUES
  (1, 'Ekspedisi', 'ekspedisi', 1),
  (2, 'Pendakian & Rimba', 'pendakian-rimba', 2),
  (3, 'Kegiatan Lapangan', 'kegiatan-lapangan', 3),
  (4, 'Program Divisi', 'program-divisi', 4),
  (5, 'Berita & Edukasi', 'berita-edukasi', 5);

-- 3. MASTER LOKASI KEGIATAN
TRUNCATE TABLE lokasi;
INSERT INTO lokasi (id, nama, slug) VALUES
  (1, 'Gunung Kerinci • 3.805 MDPL', 'gunung-kerinci-3805-mdpl'),
  (2, 'Ngalau Karst Halaban • Lima Puluh Kota', 'ngalau-karst-halaban'),
  (3, 'Tebing Lembah Harau • Cagar Alam', 'tebing-lembah-harau'),
  (4, 'Sungai Batang Tarusan • Pesisir Selatan', 'sungai-batang-tarusan'),
  (5, 'Gugusan Bukit Barisan • Sumatera Barat', 'gugusan-bukit-barisan');

-- 4. MASTER JADWAL OPERASIONAL
TRUNCATE TABLE jadwal_operasional;
INSERT INTO jadwal_operasional (id, nama, slug) VALUES
  (1, 'Musim Kemarau (Juli - Oktober)', 'musim-kemarau'),
  (2, 'Semester Ganjil 2025/2026', 'semester-ganjil-2025-2026'),
  (3, 'Semester Genap 2025/2026', 'semester-genap-2025-2026');

-- 5. PERIODE REGISTRASI ULANG TAHUNAN
TRUNCATE TABLE periode_registrasi;
INSERT INTO periode_registrasi (id, nama, tahun, tanggal_buka, tanggal_tutup, status) VALUES
  (1, 'Registrasi Ulang Tahunan 2026', 2026, '2026-01-01', '2026-12-31', 'buka'),
  (2, 'Registrasi Ulang Tahunan 2025', 2025, '2025-01-01', '2025-12-31', 'tutup');

-- 6. JENIS ATRIBUT RESMI
TRUNCATE TABLE jenis_atribut;
INSERT INTO jenis_atribut (id, nama, aktif, urutan) VALUES
  (1, 'Topi Rimba', 1, 1),
  (2, 'Baju Lapangan', 1, 2);

-- 7. KEBIJAKAN PRIVASI AKTIF (UU PDP No. 27/2022)
TRUNCATE TABLE kebijakan_privasi;
INSERT INTO kebijakan_privasi (id, versi, judul, isi, berlaku_sejak, aktif) VALUES
  (1, '1.0', 'Kebijakan Privasi dan Persetujuan Penggunaan Data Anggota',
   'Mapala Universitas Andalas berkomitmen penuh melindungi hak privasi dan kerahasiaan data pribadi anggota sesuai dengan Undang-Undang No. 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP).\n\n1. Pengumpulan Data: Data dikumpulkan semata-mata untuk verifikasi keanggotaan seumur hidup, pendataan berkala tahunan, pemetaan sebaran domisili anggota, dan koordinasi operasional keorganisasian.\n2. Pembagian Data Terbatas (Direktori Anggota): Anggota yang menyetujui kebijakan ini akan terdaftar dalam Direktori Anggota yang hanya dapat diakses oleh sesama anggota penuh yang telah login dan telah menyetujui kebijakan yang sama. Data yang ditampilkan dibatasi secara ketat hanya pada: Nama Lengkap, Nomor Register, Nomor Handphone (WhatsApp), Golongan Darah, dan Alamat Rumah/Domisili Saat Ini.\n3. Kerahasiaan Data Sensitif: Informasi sensitif seperti tempat dan tanggal lahir, nama orang tua, alamat email pribadi, dan arsip riwayat registrasi tidak akan pernah dibagikan kepada anggota lain dan hanya dapat diakses oleh Administrator Bidang Kesekretariatan.\n4. Hak Pengguna: Anggota berhak memperbarui data domisili dan kontak secara mandiri sewaktu-waktu melalui menu Biodata Saya dan Registrasi Ulang.',
   '2026-01-01 00:00:00', 1);

-- 8. PERIODE KEPENGURUSAN ORGANISASI
TRUNCATE TABLE periode_kepengurusan;
INSERT INTO periode_kepengurusan (id, nama, tahun_mulai, tahun_selesai, is_current) VALUES
  (1, '2025/2026', 2025, 2026, 1),
  (2, '2024/2025', 2024, 2025, 0);

-- 9. BAGAN STRUKTUR ORGANISASI (FR-04, FR-40)
TRUNCATE TABLE bagan_struktur;
INSERT INTO bagan_struktur (id, periode_kepengurusan_id, judul, gambar_path, is_aktif, uploaded_at) VALUES
  (1, 1, 'Bagan Organigram Kepengurusan Mapala UNAND Periode 2025/2026', '/images/struktur-organisasi.svg', 1, '2026-01-10 10:00:00');

-- 10. PROFIL ANGGOTA (DATA TETAP)
TRUNCATE TABLE anggota;
INSERT INTO anggota (id, no_register, nama, divisi_id, angkatan, tempat_lahir, tanggal_lahir, golongan_darah, nama_ayah, nama_ibu, is_active, profil_lengkap, created_at) VALUES
  (1, 'MU 280 RGM', 'Rahmat Hidayat', 1, 2018, 'Kota Padang', '1998-05-12', 'O', 'Hidayatullah', 'Rahmawati', 1, 1, '2026-01-10 08:00:00'),
  (2, 'MU 285 PCT', 'Fajar Nugraha', 2, 2018, 'Kota Bukittinggi', '1998-08-20', 'A', 'Nugraha Sanjaya', 'Farida Ariani', 1, 1, '2026-01-10 08:00:00'),
  (3, 'MU 292 CAV', 'Dian Permata Sari', 4, 2019, 'Kota Solok', '1999-03-15', 'B', 'Permata Ilham', 'Sari Melati', 1, 1, '2026-01-10 08:00:00'),
  (4, 'MU 301 OLA', 'Ilham Syahputra', 3, 2019, 'Kota Payakumbuh', '1999-11-28', 'AB', 'Syahputra Utama', 'Nurhasanah', 1, 1, '2026-01-10 08:00:00'),
  (5, 'MU 310 RGM', 'Budi Santoso', 1, 2020, 'Kota Padang', '2000-01-10', 'O', 'Santoso Wardoyo', 'Sri Rejeki', 1, 1, '2026-01-10 08:00:00'),
  (6, 'MU 315 RGM', 'Reza Pratama', 1, 2020, 'Kota Pekanbaru', '2000-06-25', 'A', 'Pratama Jaya', 'Endang Lestari', 1, 1, '2026-01-10 08:00:00'),
  (7, 'MU 320 CAV', 'Siti Nurhaliza', 4, 2021, 'Kota Padang', '2001-09-14', 'B', 'Zulkifli', 'Halimah', 1, 1, '2026-01-10 08:00:00'),
  (8, 'MU 325 PCT', 'Arif Gunawan', 2, 2021, 'Jakarta Selatan', '2001-12-05', 'O', 'Gunawan Sudirman', 'Kartika Putri', 1, 1, '2026-01-10 08:00:00'),
  (9, 'MU 330 OLA', 'Taufik Hidayat', 3, 2022, 'Kota Bandung', '2002-04-18', 'A', 'Hidayat Rustam', 'Nani Wijaya', 1, 1, '2026-01-10 08:00:00'),
  (10, 'MU 335 CAV', 'Aulia Rahman', 4, 2022, 'Kota Solok', '2002-10-30', 'AB', 'Rahman Hakim', 'Dewi Susanti', 1, 1, '2026-01-10 08:00:00'),
  (11, 'MU 120 RGM', 'Indra Wijaya', 1, 1995, 'Kota Padang', '1976-02-14', 'O', 'Wijaya Kusuma', 'Rostina', 1, 1, '2026-01-10 08:00:00'),
  (12, 'MU 145 PCT', 'Yusuf Mansur', 2, 1998, 'Kota Bukittinggi', '1979-07-22', 'B', 'Mansur Bahar', 'Nurhayati', 1, 1, '2026-01-10 08:00:00'),
  (13, 'MU 180 CAV', 'Zulham Efendi', 4, 2003, 'Kota Pekanbaru', '1984-11-09', 'A', 'Efendi Sutan', 'Amina', 1, 1, '2026-01-10 08:00:00'),
  (14, 'MU 215 OLA', 'Hendri Marlis', 3, 2008, 'Kabupaten Pesisir Selatan', '1989-05-03', 'O', 'Marlis Rais', 'Fatmawati', 1, 1, '2026-01-10 08:00:00'),
  (15, 'MU 250 RGM', 'Doni Arman', 1, 2014, 'Kota Padang', '1995-12-19', 'B', 'Arman Chaniago', 'Zubaidah', 1, 1, '2026-01-10 08:00:00');

-- 11. AKUN USERS (ADMIN & ANGGOTA)
-- Password 'admin123': $2b$10$ODWJ1L2mnpZMno/gW5VtEOQUU5r2sRfHmSAvSZ/1Q3WOrlaRfjJJK
-- Password 'mapala123': $2b$10$YPAvIdrTKIWeTK92e.PR9OTHHffqjNaW/j4MRHJCWEO4r2Fvnm5zi
TRUNCATE TABLE users;
-- Akun Administrator
INSERT INTO users (id, username, password_hash, role, anggota_id, is_active, must_change_password) VALUES
  (1, 'admin', '$2b$10$ODWJ1L2mnpZMno/gW5VtEOQUU5r2sRfHmSAvSZ/1Q3WOrlaRfjJJK', 'admin', NULL, 1, 0),
  (2, 'admin2', '$2b$10$ODWJ1L2mnpZMno/gW5VtEOQUU5r2sRfHmSAvSZ/1Q3WOrlaRfjJJK', 'admin', NULL, 1, 0);

-- Akun Anggota (Tertaut ke anggota.id masing-masing)
INSERT INTO users (id, username, password_hash, role, anggota_id, is_active, must_change_password) VALUES
  (3, 'MU 280 RGM', '$2b$10$YPAvIdrTKIWeTK92e.PR9OTHHffqjNaW/j4MRHJCWEO4r2Fvnm5zi', 'anggota', 1, 1, 1),
  (4, 'MU 285 PCT', '$2b$10$YPAvIdrTKIWeTK92e.PR9OTHHffqjNaW/j4MRHJCWEO4r2Fvnm5zi', 'anggota', 2, 1, 1),
  (5, 'MU 292 CAV', '$2b$10$YPAvIdrTKIWeTK92e.PR9OTHHffqjNaW/j4MRHJCWEO4r2Fvnm5zi', 'anggota', 3, 1, 1),
  (6, 'MU 301 OLA', '$2b$10$YPAvIdrTKIWeTK92e.PR9OTHHffqjNaW/j4MRHJCWEO4r2Fvnm5zi', 'anggota', 4, 1, 1),
  (7, 'MU 310 RGM', '$2b$10$YPAvIdrTKIWeTK92e.PR9OTHHffqjNaW/j4MRHJCWEO4r2Fvnm5zi', 'anggota', 5, 1, 1),
  (8, 'MU 315 RGM', '$2b$10$YPAvIdrTKIWeTK92e.PR9OTHHffqjNaW/j4MRHJCWEO4r2Fvnm5zi', 'anggota', 6, 1, 1),
  (9, 'MU 320 CAV', '$2b$10$YPAvIdrTKIWeTK92e.PR9OTHHffqjNaW/j4MRHJCWEO4r2Fvnm5zi', 'anggota', 7, 1, 1),
  (10, 'MU 325 PCT', '$2b$10$YPAvIdrTKIWeTK92e.PR9OTHHffqjNaW/j4MRHJCWEO4r2Fvnm5zi', 'anggota', 8, 1, 1),
  (11, 'MU 330 OLA', '$2b$10$YPAvIdrTKIWeTK92e.PR9OTHHffqjNaW/j4MRHJCWEO4r2Fvnm5zi', 'anggota', 9, 1, 1),
  (12, 'MU 335 CAV', '$2b$10$YPAvIdrTKIWeTK92e.PR9OTHHffqjNaW/j4MRHJCWEO4r2Fvnm5zi', 'anggota', 10, 1, 1),
  (13, 'MU 120 RGM', '$2b$10$YPAvIdrTKIWeTK92e.PR9OTHHffqjNaW/j4MRHJCWEO4r2Fvnm5zi', 'anggota', 11, 1, 1),
  (14, 'MU 145 PCT', '$2b$10$YPAvIdrTKIWeTK92e.PR9OTHHffqjNaW/j4MRHJCWEO4r2Fvnm5zi', 'anggota', 12, 1, 1),
  (15, 'MU 180 CAV', '$2b$10$YPAvIdrTKIWeTK92e.PR9OTHHffqjNaW/j4MRHJCWEO4r2Fvnm5zi', 'anggota', 13, 1, 1),
  (16, 'MU 215 OLA', '$2b$10$YPAvIdrTKIWeTK92e.PR9OTHHffqjNaW/j4MRHJCWEO4r2Fvnm5zi', 'anggota', 14, 1, 1),
  (17, 'MU 250 RGM', '$2b$10$YPAvIdrTKIWeTK92e.PR9OTHHffqjNaW/j4MRHJCWEO4r2Fvnm5zi', 'anggota', 15, 1, 1);

-- 12. PERSETUJUAN PENGGUNAAN DATA (FR-44, FR-45)
TRUNCATE TABLE persetujuan_data;
INSERT INTO persetujuan_data (anggota_id, kebijakan_id, disetujui_at) VALUES
  (1, 1, '2026-01-15 09:30:00'),
  (2, 1, '2026-01-16 11:20:00'),
  (3, 1, '2026-01-18 14:15:00'),
  (4, 1, '2026-01-20 10:45:00'),
  (5, 1, '2026-01-22 16:30:00'),
  (6, 1, '2026-01-25 13:10:00'),
  (7, 1, '2026-01-28 15:50:00'),
  (8, 1, '2026-02-01 08:40:00'),
  (9, 1, '2026-02-02 09:15:00'),
  (10, 1, '2026-02-05 17:00:00'),
  (11, 1, '2026-02-06 14:20:00');

-- 13. DATA REGISTRASI ULANG TAHUNAN (DATA BERKALA)
TRUNCATE TABLE registrasi_ulang;
INSERT INTO registrasi_ulang (id, anggota_id, periode_id, foto_path, alamat_rumah, kota_kabupaten, provinsi, pekerjaan, no_hp, email, alamat_orang_tua, sumber_input, diinput_oleh, submitted_at) VALUES
  (1, 1, 1, '/uploads/default-avatar.png', 'Jl. Gajah Mada No. 42, Kel. Gunung Pangilun', 'Kota Padang', 'Sumatera Barat', 'Software Engineer', '081267890123', 'rahmat@gmail.com', 'Jl. Gajah Mada No. 42, Kota Padang', 'mandiri', NULL, '2026-01-15 09:35:00'),
  (2, 2, 1, '/uploads/default-avatar.png', 'Jl. Panorama No. 18, Kel. Kayu Kubu', 'Kota Bukittinggi', 'Sumatera Barat', 'Wiraswasta Outdoor Gear', '081378901234', 'fajar.nugraha@gmail.com', 'Jl. Panorama No. 18, Bukittinggi', 'mandiri', NULL, '2026-01-16 11:25:00'),
  (3, 3, 1, '/uploads/default-avatar.png', 'Jl. Ahmad Yani No. 15, Kel. Simpang Rumbio', 'Kota Solok', 'Sumatera Barat', 'Staf Konservasi BKSDA', '085267123456', 'dian.permata@gmail.com', 'Jl. Ahmad Yani No. 15, Kota Solok', 'mandiri', NULL, '2026-01-18 14:20:00'),
  (4, 4, 1, '/uploads/default-avatar.png', 'Jl. Veteran No. 8, Kel. Tiakar', 'Kota Payakumbuh', 'Sumatera Barat', 'Instruktur Arung Jeram', '082189012345', 'ilham.syahputra@gmail.com', 'Jl. Veteran No. 8, Payakumbuh', 'mandiri', NULL, '2026-01-20 10:50:00'),
  (5, 5, 1, '/uploads/default-avatar.png', 'Jl. Diponegoro No. 3, Kel. Sukajadi', 'Kota Pekanbaru', 'Riau', 'Pegawai BUMN', '081234567890', 'budi.santoso@gmail.com', 'Jl. Melati No. 5, Kota Padang', 'mandiri', NULL, '2026-01-22 16:35:00'),
  (6, 6, 1, '/uploads/default-avatar.png', 'Jl. Melati Blok C No. 12', 'Kota Pekanbaru', 'Riau', 'Konsultan Pemetaan GIS', '085378901234', 'reza.pratama@gmail.com', 'Jl. Melati Blok C No. 12, Pekanbaru', 'mandiri', NULL, '2026-01-25 13:15:00'),
  (7, 8, 1, '/uploads/default-avatar.png', 'Komp. Griya Indah Blok C/8, Cilandak', 'Jakarta Selatan', 'DKI Jakarta', 'Geologis Perusahaan Energi', '081987654321', 'arif.gunawan@gmail.com', 'Jl. Sudirman No. 100, Padang', 'admin', 1, '2026-02-01 08:45:00'),
  (8, 10, 1, '/uploads/default-avatar.png', 'Jl. Dago Asri No. 55', 'Kota Bandung', 'Jawa Barat', 'Mahasiswa Pascasarjana ITB', '082267890123', 'aulia.rahman@gmail.com', 'Jl. Koto Baru No. 12, Solok', 'mandiri', NULL, '2026-02-05 17:05:00'),
  (9, 11, 1, '/uploads/default-avatar.png', 'Komp. Unand Blok B/4, Limau Manis', 'Kota Padang', 'Sumatera Barat', 'Dosen Fakultas Pertanian UNAND', '081122334455', 'indra.wijaya@unand.ac.id', 'Komp. Unand Blok B/4, Padang', 'admin', 1, '2026-02-06 14:25:00');

-- 14. MEDIA SOSIAL ANGGOTA PER REGISTRASI
TRUNCATE TABLE registrasi_media_sosial;
INSERT INTO registrasi_media_sosial (registrasi_id, platform, akun) VALUES
  (1, 'Instagram', '@rahmathidayat'),
  (1, 'LinkedIn', 'linkedin.com/in/rahmathidayat'),
  (2, 'Instagram', '@fajarnugraha.pct'),
  (3, 'Instagram', '@dianpermatasari'),
  (4, 'Instagram', '@ilham.rafting'),
  (7, 'Instagram', '@arifgunawan_geology');

-- 15. ATRIBUT REGISTRASI ANGGOTA (FR-22, FR-23)
TRUNCATE TABLE registrasi_atribut;
INSERT INTO registrasi_atribut (registrasi_id, jenis_atribut_id, memiliki, foto_path) VALUES
  (1, 1, 1, '/uploads/topi-mu280.jpg'),
  (1, 2, 1, '/uploads/pdl-mu280.jpg'),
  (2, 1, 1, '/uploads/topi-mu285.jpg'),
  (2, 2, 1, '/uploads/pdl-mu285.jpg'),
  (3, 1, 1, '/uploads/topi-mu292.jpg'),
  (3, 2, 1, '/uploads/pdl-mu292.jpg'),
  (4, 1, 1, NULL),
  (4, 2, 1, NULL),
  (7, 1, 1, NULL),
  (7, 2, 1, NULL);

-- 16. ARTIKEL & KEGIATAN PUBLIK
TRUNCATE TABLE artikel;
INSERT INTO artikel (id, kategori_id, divisi_id, lokasi_id, jadwal_id, penulis_id, judul, slug, ringkasan, isi, status_kegiatan, tim_capaian, tanggal_kegiatan, status_publikasi, published_at) VALUES
  (1, 1, 1, 1, 1, 1, 
   'Ekspedisi Gunung Kerinci 3.805 MDPL', 
   'ekspedisi-gunung-kerinci-3805-mdpl', 
   'Pendakian riset vegetasi di batas tinggi, pemetaan jalur evakuasi, dan pendataan keanekaragaman flora endemik batas vegetasi.', 
   '<p>Gunung Kerinci, sebagai atap tertinggi Pulau Sumatera dengan elevasi 3.805 meter di atas permukaan laut, menjadi laboratorium alam terbuka bagi tim ekspedisi Mapala Universitas Andalas. Ekspedisi yang berlangsung selama tujuh hari ini difokuskan pada riset zonasi vegetasi sub-alpin serta pemetaan titik-titik krusial mitigasi bencana erupsi dan jalur evakuasi darurat.</p><h2>Fokus Riset & Metodologi</h2><p>Tim riset membagi kelompok kerja menjadi tiga gugus: tim navigasi & pemetaan digital topografi, tim botani hutan hujan dataran tinggi, dan tim survival operasional. Sepanjang jalur Kersik Tuo menuju Shelter 3 dan batas vegetasi (Plawangan), tim berhasil menginventarisasi 42 spesies tumbuhan lumut dan anggrek epifit endemik Sumatera.</p><blockquote>"Ekspedisi rimba bukan sekadar perlombaan menapakkan kaki di titik puncak, melainkan bagaimana seorang pencinta alam membawa pulang data saintifik yang berguna bagi perlindungan ekosistem jangka panjang."</blockquote><h2>Temuan Lapangan & Rekomendasi Mitigasi</h2><p>Berdasarkan hasil pemetaan menggunakan GPS frekuensi ganda dan observasi kestabilan lereng, ditemukan abrasi jalur setapak aktif di lintasan Shelter 2 ke Shelter 3 akibat intensitas pendaki publik yang tinggi. Tim Mapala UNAND telah menyusun dokumen rekomendasi konservasi jalur dan revitalisasi rambu peringatan dini erupsi untuk diserahkan ke Balai Besar Taman Nasional Kerinci Seblat (BBTNKS).</p>', 
   'Rampung', '18 Anggota Tim Riset', '2024-10-14', 'terbit', '2024-10-16 09:00:00'),

  (2, 3, 4, 2, 2, 1, 
   'Eksplorasi Karst & Pemetaan Ngalau Halaban', 
   'eksplorasi-karst-pemetaan-ngalau-halaban', 
   'Pemetaan 3D koridor bawah tanah, riset biospeleologi fauna gua troglobit, serta konservasi tandon air karst alami.', 
   '<p>Kawasan karst Halaban di Kabupaten Lima Puluh Kota menyimpan jaringan lorong gua bawah tanah yang belum terpetakan secara komprehensif. Divisi Speleologi Mapala UNAND menerjunkan tim spesialis susur gua (caving) tingkat mahir untuk melakukan pemetaan lorong vertikal dan horizontal dengan standar UIS (Union Internationale de Spéléologie) Grade 5.</p><h2>Riset Biospeleologi Gua Gelap Abadi</h2><p>Dalam zona kegelapan total (deep zone) yang berjarak lebih dari 450 meter dari mulut gua, tim berhasil mengidentifikasi populasi fauna troglobit yang telah teradaptasi secara evolusioner tanpa pigmen mata. Pengukuran kualitas air tanah karst menunjukkan tingkat kemurnian kalsium karbonat alami yang sangat vital sebagai sumber air minum bagi tiga nagari sekitar.</p>', 
   'Publikasi Riset', '12 Anggota Caver', '2024-09-28', 'terbit', '2024-09-30 11:30:00'),

  (3, 4, 2, 3, 1, 1, 
   'Reboisasi & Konservasi Dinding Tebing Harau', 
   'reboisasi-konservasi-dinding-tebing-harau', 
   'Aksi penanaman pohon endemik, pembersihan jalur panjat tebing alami dari residu, dan sosialisasi ekowisata lestari.', 
   '<p>Dinding tebing granit Lembah Harau yang menjulang hingga ratusan meter menjadi saksi konsistensi Mapala UNAND dalam menjaga kelestarian kawasan suaka alam. Bersama masyarakat lokal dan komunitas pemanjat tebing Sumatera Barat, tim melaksanakan aksi bersih dinding tebing dan penanaman 200 bibit pohon endemik di kaki tebing guna mencegah longsoran batuan.</p>', 
   'Selesai Terverifikasi', '25 Anggota & Relawan', '2024-08-12', 'terbit', '2024-08-15 14:00:00'),

  (4, 3, 3, 4, 3, 1, 
   'Arung Jeram & Navigasi Batang Tarusan', 
   'arung-jeram-navigasi-batang-tarusan', 
   'Pengarungan jeram grade IV+, pemetaan titik bahaya hidrologi, serta edukasi kesiapsiagaan banjir bandang nagari.', 
   '<p>Divisi Olahraga Air Mapala UNAND sukses menuntaskan ekspedisi pengarungan Sungai Batang Tarusan di Kabupaten Pesisir Selatan. Pengarungan sejauh 28 kilometer ini menembus jeram-jeram teknis kelas IV+ sekaligus melakukan pemetaan profil hidrologi dan titik penumpukan sedimentasi kayu untuk peringatan dini mitigasi banjir luapan.</p>', 
   'Sukses Lapangan', '14 Skipper & Rescue', '2024-07-05', 'terbit', '2024-07-08 10:00:00'),

  (5, 5, 1, 5, 2, 1, 
   'Pelatihan Navigasi Darat dan Survival Anggota Muda 2026', 
   'pelatihan-navigasi-darat-survival-2026', 
   'Dokumentasi materi orientasi medan, kompas bidik, peta resection, dan penanganan darurat rimba tropis.', 
   '<p>Draf kurikulum pembekalan dasar operasional hutan gunung mencakup penguasaan peta topografi skala 1:25.000, penggunaan klinometer, pemahaman navigasi bintang, dan teknik bivak darurat di bawah kanopi basah.</p>', 
   'Tahap Persiapan', 'Instruktur Senior', '2026-02-15', 'draf', NULL);

-- 17. GAMBAR ARTIKEL (SAMPUL & GALERI)
TRUNCATE TABLE artikel_gambar;
INSERT INTO artikel_gambar (artikel_id, path, caption, is_sampul, urutan) VALUES
  (1, '/images/kerinci-expedition.jpg', 'Tim Riset Mapala UNAND di batas vegetasi Gunung Kerinci 3.805 MDPL', 1, 1),
  (2, '/images/caving-expedition.jpg', 'Eksplorasi lorong vertikal Ngalau Karst Halaban', 1, 1),
  (3, '/images/harau-cliff.jpg', 'Konservasi jalur panjat tebing alami Lembah Harau', 1, 1),
  (4, '/images/rafting.jpg', 'Navigasi arus deras arung jeram Batang Tarusan', 1, 1),
  (5, '/images/hero-mountain.jpg', 'Orientasi medan di kaki Gunung Singgalang', 1, 1);

-- 18. PRESTASI ORGANISASI (FR-06, FR-41)
TRUNCATE TABLE prestasi;
INSERT INTO prestasi (id, tahun, kategori, judul, deskripsi, info_label_1, info_label_2, gambar_path, gambar_caption, is_sorotan, sorotan_judul, sorotan_subjudul, sorotan_detail, urutan) VALUES
  (1, 2025, 'Kejuaraan Nasional Panjat Tebing', 
   'Juara 1 Lead Climbing Mahasiswa Nasional', 
   'Meraih medali emas pada Kejuaraan Panjat Dinding Mahasiswa se-Indonesia kategori Lead Putra di Jakarta.', 
   'Tingkat: Nasional Mahasiswa', 'Kategori: Lead Climbing', 
   '/images/trophy-achievement.jpg', 'Pemberian piala medali emas oleh PB FASI', 
   1, 'Juara 1 Lead Climbing Nasional', 'Pekan Olahraga Mahasiswa Nasional 2025', 'Kategori Lead Perorangan Mahasiswa Putra se-Indonesia', 1),

  (2, 2024, 'Konservasi Lingkungan Hidup', 
   'Penghargaan Kalpataru Tingkat Provinsi Sumatera Barat', 
   'Diberikan oleh Gubernur Sumatera Barat atas dedikasi pelestarian sumber air karst dan penghijauan hutan lereng gunung.', 
   'Tingkat: Provinsi Sumbar', 'Kategori: Penyelamat Lingkungan', 
   '/images/conservation.jpg', 'Penyerahan piagam penghargaan di Kantor Gubernur Sumbar', 
   1, 'Penghargaan Kalpataru Lingkungan', 'Dinas Lingkungan Hidup Sumbar 2024', 'Dedikasi konservasi sumber mata air dan perlindungan karst', 2),

  (3, 2023, 'Ekspedisi Speleologi Ilmiah', 
   'Rekor Pemetaan Sistem Gua Vertikal Terdalam Sumatera', 
   'Berhasil memetakan sistem lorong vertikal bertingkat kedalaman -180 meter di kawasan Karst Payakumbuh.', 
   'Tingkat: Riset Eksplorasi', 'Standar: UIS Grade 5', 
   '/images/caving-expedition.jpg', 'Tim ekspedisi di mulut gua vertikal', 
   1, 'Rekor Pemetaan Gua Vertikal', 'Ekspedisi Speleologi Nasional 2023', 'Pemetaan sistem lorong vertikal -180 meter berstandar UIS Grade 5', 3),

  (4, 2022, 'Navigasi Rimba Darat', 
   'Juara Umum Lomba Lintas Alam Nusantara', 
   'Menjuarai navigasi darat ketahanan fisik beregu 45 km melintasi Taman Nasional Kerinci Seblat.', 
   'Tingkat: Nasional', 'Peserta: 64 Tim Mapala se-Indonesia', 
   '/images/about-unand.jpg', 'Tim navigasi di garis finis Kersik Tuo', 
   0, NULL, NULL, NULL, 4);

-- 19. KONTEN STATIS (FR-02, FR-03, FR-07, FR-42)
INSERT INTO konten_statis (kunci, nilai, kelompok) VALUES
  ('hero_judul', 'MAPALA UNAND', 'beranda'),
  ('hero_tagline', 'Menjelajahi dan Menelusuri Alam dengan Cinta.', 'beranda'),
  ('hero_deskripsi', 'Wadah penempaan karakter, kecintaan konservasi keanekaragaman hayati, dan dedikasi petualangan ilmiah rimba Nusantara sejak 1984.', 'beranda'),
  ('hero_foto', '/images/hero-mountain.jpg', 'beranda'),
  ('sejarah', 'Mahasiswa Pecinta Alam Universitas Andalas (MAPALA UNAND) didirikan pada era 1980-an oleh para mahasiswa pecinta kelestarian alam yang memiliki tekad kuat untuk membangun wadah penempaan watak kesatria, kesadaran konservasi sumber daya alam, serta persaudaraan seumur hidup lintas generasi.', 'tentang'),
  ('sejarah_foto', '/images/about-unand.jpg', 'tentang'),
  ('sejarah_foto_caption', 'Dokumentasi kegiatan lapangan perintis Mapala UNAND', 'tentang'),
  ('visi', 'Menjadi organisasi kepemudaan dan kepencintaalaman yang unggul, berintegritas, berwawasan ilmiah, berdedikasi tinggi terhadap pelestarian keanekaragaman hayati nusantara, dan berjiwa sosial kemanusiaan sepanjang hayat.', 'tentang'),
  ('kode_etik', 'Pencinta Alam Indonesia sadar bahwa alam beserta isinya adalah ciptaan Tuhan Yang Maha Esa. Pencinta Alam Indonesia sebagai bagian dari masyarakat Indonesia sadar akan tanggung jawabnya kepada Tuhan, bangsa, dan tanah air. Pencinta Alam Indonesia sadar bahwa segenap pecinta alam adalah saudara sebagai makhluk yang mencintai alam sebagai ciptaan yang Maha Kuasa.', 'tentang'),
  ('kode_etik_keterangan', 'Ditetapkan pada Gladian IV Ujung Pandang, 1974.', 'tentang'),
  ('kontak_email', 'sekretariat@mapalaunand.org', 'kontak'),
  ('kontak_whatsapp', '6281267890123', 'kontak'),
  ('kontak_alamat', 'Gedung Pusat Kegiatan Mahasiswa (PKM) Lantai 1, Universitas Andalas, Kampus Limau Manis, Pauh, Kota Padang, Sumatera Barat 25163', 'kontak'),
  ('footer_deskripsi', 'Organisasi kemahasiswaan pecinta alam pelopor konservasi, ekspedisi ilmiah, dan persaudaraan seumur hidup sejak 1984.', 'footer')
ON DUPLICATE KEY UPDATE nilai = VALUES(nilai), kelompok = VALUES(kelompok);

-- 20. MISI POIN
TRUNCATE TABLE misi_poin;
INSERT INTO misi_poin (id, teks, urutan) VALUES
  (1, 'Mengembangkan potensi kepeloporan, kecakapan navigasi, ketahanan fisik, dan keahlian eksplorasi alam bebas bagi mahasiswa Universitas Andalas.', 1),
  (2, 'Menyelenggarakan riset biosains, inventarisasi keanekaragaman hayati, dan advokasi konservasi sumber daya alam secara berkelanjutan.', 2),
  (3, 'Membangun kepekaan sosial kemanusiaan melalui aksi mitigasi bencana dan operasi SAR (Search and Rescue) di tingkat daerah maupun nasional.', 3),
  (4, 'Mempererat tali silaturahmi dan persaudaraan seumur hidup antar-anggota penuh lintas angkatan sejak pendirian.', 4);

-- 21. STATISTIK BERANDA (FR-02)
TRUNCATE TABLE statistik_beranda;
INSERT INTO statistik_beranda (id, ikon, angka, satuan, label, urutan) VALUES
  (1, 'users', '355', '+', 'Anggota Seumur Hidup', 1),
  (2, 'mountain', '48', 'Puncak', 'Ekspedisi Rimba Terjelajahi', 2),
  (3, 'trophy', '25', 'Piala', 'Prestasi Nasional & Daerah', 3),
  (4, 'leaf', 'Konsisten', '', 'Advokasi & Konservasi Karst', 4);

-- 22. TAUTAN MEDIA SOSIAL
TRUNCATE TABLE tautan_sosial;
INSERT INTO tautan_sosial (id, platform, url, urutan) VALUES
  (1, 'Instagram', 'https://instagram.com/mapalaunand', 1),
  (2, 'YouTube', 'https://youtube.com/@mapalaunandofficial', 2),
  (3, 'X-Twitter', 'https://x.com/mapalaunand', 3),
  (4, 'Facebook', 'https://facebook.com/mapalaunand', 4),
  (5, 'TikTok', 'https://tiktok.com/@mapalaunand', 5);

-- 23. LOG AKTIVITAS AWAL
TRUNCATE TABLE log_aktivitas;
INSERT INTO log_aktivitas (id, user_id, aksi, entitas, entitas_id, data_lama, data_baru, ip_address, created_at) VALUES
  (1, 1, 'SEED_DATABASE', 'system', 'mapala_unand', NULL, '{"keterangan": "Inisialisasi data seed awal sistem Mapala UNAND"}', '127.0.0.1', '2026-02-10 10:00:00'),
  (2, 1, 'UPDATE_PERIODE', 'periode_registrasi', '1', NULL, '{"status": "buka", "tahun": 2026}', '127.0.0.1', '2026-02-10 10:05:00');

SET FOREIGN_KEY_CHECKS = 1;
