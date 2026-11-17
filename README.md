# Sistem Informasi Manajemen Keanggotaan & Profil Organisasi
## Mapala Universitas Andalas (MAPALA UNAND)

Sistem Informasi Manajemen Keanggotaan dan Profil Organisasi **Mapala Universitas Andalas** adalah platform berbasis web terintegrasi yang dirancang untuk mengelola data anggota seumur hidup, kepatuhan registrasi ulang berkala tahunan, inventarisasi atribut resmi organisasi, pengelolaan konten publik (*Content Management System* / CMS), serta pelaporan administrasi kesekretariatan secara digital.

Sistem ini dikembangkan untuk memenuhi kebutuhan operasional Bidang Kesekretariatan dan Badan Pengurus Harian (BPH) Mapala UNAND serta sebagai implementasi Tugas Besar mata kuliah **Manajemen Proyek Sistem Informasi (MPSI)**.

---

## 🚀 Fitur-Fitur Utama Sistem

Sistem terbagi ke dalam 3 modul antarmuka utama dengan hak akses terpisah (*Role-Based Access Control*):

### 1. Website Publik (`/`)
* **Profil & Identitas Organisasi**: Sejarah, visi, misi, dan nilai dasar Mapala UNAND.
* **Divisi Spesialisasi**: Informasi divisi teknis kepetualangan (Panjat Tebing, Rimba Gunung, Caving, Arung Jeram/Olahraga Air, Lingkungan Hidup).
* **Prestasi Sorotan Terkini**: Menampilkan prestasi unggulan organisasi yang tersinkronisasi langsung dengan CMS Admin (dengan aturan sorotan tunggal).
* **Bagan Struktur Organisasi**: Visualisasi bagan kepengurusan periode aktif dengan fitur pratinjau gambar resolusi tinggi (*lightbox zoom*).
* **Informasi Kontak & Sekretariat**: Alamat resmi Gedung PKM Unand, nomor layanan WhatsApp, email, dan akun media sosial resmi.

### 2. Portal Anggota Mandiri (`/anggota`)
* **Onboarding Wizard 3-Langkah (Aktivasi Akun Baru)**:
  * *Langkah 1*: Penggantian kata sandi bawaan secara wajib.
  * *Langkah 2*: Pengisian nomor WhatsApp aktif dan nomor kontak darurat keluarga.
  * *Langkah 3*: Pernyataan persetujuan penanganan dan privasi data anggota.
* **Kartu Anggota Digital (KTA)**:
  * Menampilkan Nomor Register unik, nama lengkap, divisi spesialisasi, tahun angkatan, golongan darah, dan status keanggotaan aktif seumur hidup.
  * **Meteran Kelengkapan Profil Dinamis**: Penilaian kelengkapan profil secara riil (Identitas Pokok 50%, Pasfoto Profil 25%, dan Registrasi Ulang Tahunan 25% $\rightarrow$ Total 100% Lengkap).
* **Formulir Registrasi Ulang Tahunan Mandiri**:
  * Pengkinian data domisili terkini (alamat, kota/kabupaten, provinsi), pekerjaan/instansi, dan nomor kontak darurat.
  * Kewajiban unggah pasfoto profil terbaru periode berjalan (bisa melalui berkas atau jepret langsung via kamera webcam).
  * Inventarisasi kepemilikan atribut resmi (*Topi Rimba* & *Baju Lapangan*) dengan kewajiban unggah foto fisik bukti kepemilikan untuk status "Memiliki".
* **Direktori Rekan Anggota**:
  * Pencarian instan anggota Mapala UNAND berstatus aktif.
  * Filter berdasarkan angkatan, divisi, kota/kabupaten domisili, dan golongan darah (memudahkan pencarian donor darah darurat).

### 3. Dashboard Administrator Kesekretariatan (`/admin`)
* **Manajemen Anggota**:
  * Tambah anggota baru, ubah biodata tetap, aktivasi/blokir status akun, reset kata sandi ke bawaan (`mapala123`), dan hapus data anggota secara permanen.
* **Impor Massal Excel (.xlsx)**:
  * Unduh templat resmi Excel (`Template_Anggota.xlsx`).
  * Unggah berkas data anggota dengan validasi format kolom otomatis, deteksi duplikasi No. Register, serta tabel pratinjau (*preview*) sebelum disimpan ke database.
* **Ekspor Data Rekapitulasi**:
  * Ekspor seluruh data anggota ke format **Excel (.xlsx)** dan **CSV (.csv)** dengan sekali klik.
* **Cetak Formulir Biodata Resmi (Standar A4)**:
  * Mencetak formulir *Biodata Anggota Penuh* dengan Kop Surat resmi Mapala UNAND, foto profil anggota, data tetap, data kontak berkala, foto fisik bukti atribut organisasi berukuran jelas, dan kolom tanda tangan pengurus serta anggota yang sejajar sempurna pas dalam **1 lembar kertas A4**.
* **Monitoring Registrasi Ulang & Admin Override**:
  * Memantau persentase kepatuhan anggota yang sudah vs belum melakukan registrasi ulang tahunan.
  * Fasilitas *Admin Override* untuk membantu mengisikan registrasi anggota senior atau anggota di lapangan yang terkendala akses internet/gawai.
* **CMS Landing Page Publik**:
  * Kelola prestasi organisasi dengan validasi bentrok sorotan (*single featured achievement*).
  * Unggah dan hapus bagan struktur organisasi periode berjalan.
  * Pembaruan nomor kontak, email, dan alamat sekretariat.
* **Audit Log Aktivitas Keamanan**:
  * Rekaman jejak audit otomatis (*Audit Trail*) untuk setiap tindakan krusial admin (tambah anggota, ubah data, reset password, impor massal, override registrasi) lengkap dengan User ID, IP Address, dan timestamp.

---

## 🛠️ Teknologi yang Digunakan (Tech Stack)

* **Runtime Environment**: [Node.js](https://nodejs.org/) (v18 ke atas)
* **Web Framework**: [Express.js](https://expressjs.com/) (v5.x)
* **Basis Data**: [MySQL](https://www.mysql.com/) menggunakan connection pool via library `mysql2/promise`
* **Keamanan & Autentikasi**: 
  * JSON Web Token ([jsonwebtoken](https://github.com/auth0/node-jsonwebtoken)) untuk manajemen sesi RBAC (Role-Based Access Control)
  * [bcryptjs](https://github.com/dcodeIO/bcrypt.js) untuk enkripsi kata sandi satu arah
* **Frontend**:
  * HTML5 Semantik & Vanilla JavaScript murni (*Clean Architecture*, tanpa dependensi framework frontend yang berat)
  * [Tailwind CSS](https://tailwindcss.com/) untuk antarmuka modern yang responsif
  * [Lucide Icons](https://lucide.dev/) untuk visualisasi ikon antarmuka
* **Pengolahan Berkas & Dokumen**:
  * [Multer](https://github.com/expressjs/multer) untuk manajemen pengunggahan berkas (foto profil, bukti atribut, bagan struktur)
  * [SheetJS (xlsx)](https://sheetjs.com/) untuk pembacaan dan pembuatan berkas lembar kerja Excel

---

## 📋 Prasyarat Sistem (Prerequisites)

Sebelum menjalankan aplikasi, pastikan perangkat Anda telah terpasang:
1. **Node.js** (versi 18.0.0 atau yang lebih baru) $\rightarrow$ Cek via terminal: `node -v`
2. **NPM** (versi 9.0.0 atau yang lebih baru) $\rightarrow$ Cek via terminal: `npm -v`
3. **MySQL Server** (bisa menggunakan **XAMPP**, MariaDB, WampServer, atau MySQL Community Server di port default `3306`)
4. **Peramban Web Modern** (Google Chrome, Microsoft Edge, atau Mozilla Firefox)

---

## ⚙️ Panduan Instalasi & Konfigurasi

Ikuti langkah-langkah berikut untuk memasang proyek di komputer lokal:

### 1. Kloning Repositori
Buka terminal / PowerShell dan arahkan ke direktori kerja Anda:
```bash
git clone https://github.com/tlhnafisa/Mapala-Unand.git
cd Mapala-Unand
```

### 2. Pasang Paket Dependensi
Jalankan perintah instalasi pustaka Node.js:
```bash
npm install
```

### 3. Konfigurasi Variabel Lingkungan (`.env`)
Salin berkas contoh konfigurasi `.env.example` menjadi `.env`:
* **Windows (PowerShell)**:
  ```powershell
  Copy-Item .env.example .env
  ```
* **Linux / macOS**:
  ```bash
  cp .env.example .env
  ```

Buka file `.env` dan sesuaikan konfigurasinya dengan lingkungan MySQL Anda:
```env
PORT=3000
NODE_ENV=development

# Rahasia Token JWT
JWT_SECRET=mapala-unand-secret-key-2026
JWT_EXPIRES_IN=12h

# Konfigurasi Koneksi Database MySQL
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=mapala_unand
```
*(Catatan: Jika MySQL Anda menggunakan kata sandi, isikan pada bagian `DB_PASSWORD`)*.

### 4. Setup Basis Data MySQL
1. Buka MySQL client favorit Anda (misalnya **phpMyAdmin** di `http://localhost/phpmyadmin` atau MySQL Workbench).
2. Buat database baru bernama `mapala_unand` dengan collation `utf8mb4_general_ci`:
   ```sql
   CREATE DATABASE mapala_unand CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
   ```
3. Impor secara berurutan berkas-berkas SQL berikut ke dalam database `mapala_unand`:
   * **Langkah A**: `schema_mapala_unand..sql` *(Membuat tabel-tabel utama, relasi, dan view direktori)*
   * **Langkah B**: `seed_dummy_mapala.sql` *(Mengisi data awal divisi, atribut, periode, akun admin, dan contoh data anggota)*
   * **Langkah C**: `migrations/002_revisi_anggota.sql` *(Menerapkan pembaruan kolom kontak darurat dan integritas tabel revisi)*

---

## 🏃 Cara Menjalankan Aplikasi

Jalankan perintah berikut di terminal:

* **Mode Standar (Produksi / Eksekusi Langsung)**:
  ```bash
  npm start
  ```
* **Mode Pengembangan (dengan auto-reload nodemon)**:
  ```bash
  npm run dev
  ```

Setelah server aktif, terminal akan menampilkan pesan:
```text
=============================================================
   🌲 SISTEM INFORMASI MANAJEMEN KEANGGOTAAN MAPALA UNAND 🌲   
=============================================================
 • Website Publik    : http://localhost:3000/
 • Portal Anggota    : http://localhost:3000/anggota
 • Dashboard Admin   : http://localhost:3000/admin
 • API Base URL      : http://localhost:3000/api
=============================================================
```

---

## 🌐 Rute & URL Akses Sistem

| Halaman | URL Akses | Deskripsi |
| :--- | :--- | :--- |
| **Website Publik** | `http://localhost:3000/` | Beranda umum profil organisasi, divisi, prestasi, dan struktur. |
| **Halaman Masuk (Login)** | `http://localhost:3000/login` | Pintu masuk terpadu baik untuk Administrator maupun Anggota. |
| **Portal Anggota** | `http://localhost:3000/anggota` | KTA digital, status kelengkapan profil, registrasi ulang, dan direktori. |
| **Aktivasi Akun Baru** | `http://localhost:3000/aktivasi-anggota` | Wizard orientasi 3 langkah untuk anggota yang baru pertama kali login. |
| **Dashboard Admin** | `http://localhost:3000/admin` | Pusat kendali data keanggotaan, CMS, ekspor-impor, dan audit log. |

---

## 🔑 Kredensial Akun Pengujian (Demo Accounts)

Untuk kebutuhan pengujian, demonstrasi, maupun evaluasi fungsional (*Black Box Testing*), gunakan akun-akun bawaan berikut:

### 1. Akun Administrator
| Peran (*Role*) | Username | Password | Keterangan |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin` | `admin123` | Hak akses penuh seluruh modul sistem & CMS |
| **Admin Kesekretariatan** | `admin2` | `mapala123` | Akun pengurus bidang kesekretariatan |

### 2. Akun Anggota
| Skenario Pengujian | No. Register (*Username*) | Password | Keterangan Alur |
| :--- | :--- | :--- | :--- |
| **Akun Baru (Uji Wizard Aktivasi)** | `MU 280 RGM` | `mapala123` | Otomatis diarahkan ke Wizard Aktivasi 3-Langkah saat login |
| **Akun Baru Lainnya** | `MU 285 PCT` | `mapala123` | Contoh akun anggota baru yang belum ganti password |
| **Akun yang Sudah Registrasi Mandiri** | `MU 111 Bbb.` | *(Password saat aktivasi)* | Akun yang sudah 100% lengkap registrasi dan memiliki foto profil |

> **Catatan Keamanan**: Setiap akun anggota baru yang dibuat oleh admin akan memiliki kata sandi bawaan `mapala123` dan status `must_change_password = 1`, sehingga wajib mengganti sandi sebelum bisa masuk ke menu utama.

---

## 📁 Struktur Direktori Proyek

```text
Mapala-Unand/
├── data/                      # Direktori penyimpanan data cadangan
├── docs/                      # Dokumentasi teknis & spesifikasi perangkat lunak
│   ├── api_specification.md   # Dokumentasi endpoint API lengkap
│   ├── PRD_Sistem_Mapala.md   # Product Requirement Document
│   └── software_requirement_specification.md # SRS lengkap standar MPSI
├── migrations/                # Berkas skrip SQL migrasi database berkala
│   └── 002_revisi_anggota.sql
├── public/                    # Seluruh aset statis frontend
│   ├── admin/                 # Antarmuka Dashboard Administrator (HTML, JS, CSS)
│   ├── anggota/               # Antarmuka Portal Anggota & Wizard Aktivasi
│   ├── publik/                # Antarmuka Beranda Publik & Halaman Login Terpadu
│   └── uploads/               # Direktori penyimpanan berkas foto & bagan yang diunggah
├── src/                       # Logika backend server (Clean Layered Architecture)
│   ├── config/                # Konfigurasi koneksi MySQL pool & basis data
│   ├── controllers/           # Pengendali logika bisnis (Auth, Member, Admin, CMS)
│   ├── middlewares/           # Middleware autentikasi JWT, RBAC, dan upload Multer
│   ├── routes/                # Definisi routing endpoint API Express
│   └── services/              # Layanan ekspor/impor Excel (xlsx) & cetak dokumen A4
├── .env.example               # Contoh cetak biru variabel lingkungan
├── .gitignore                 # Daftar berkas/folder yang diabaikan oleh Git
├── index.js                   # Entry point utama aplikasi
├── package.json               # Konfigurasi dependensi dan skrip proyek
├── README.md                  # Panduan penggunaan proyek ini
├── schema_mapala_unand..sql   # Skrip DDL skema tabel basis data MySQL
├── seed_dummy_mapala.sql      # Skrip data awal (seeder) bawaan sistem
└── server.js                  # Konfigurasi aplikasi Express, middleware, & error handler
```

---

## 📄 Lisensi & Kontribusi

Proyek ini dikembangkan untuk kebutuhan internal organisasi **Mahasiswa Pecinta Alam Universitas Andalas (MAPALA UNAND)** dan luaran akademik Tugas Besar **Manajemen Proyek Sistem Informasi (MPSI)**. Hak cipta dilindungi undang-undang organisasi dan institusi terkait.
