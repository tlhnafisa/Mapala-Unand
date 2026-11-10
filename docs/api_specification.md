# API SPECIFICATION
## Sistem Informasi Manajemen Keanggotaan dan Website Resmi Mapala UNAND

---

### Informasi Dokumen
| Atribut | Keterangan |
| :--- | :--- |
| **Judul Dokumen** | Dokumentasi Spesifikasi RESTful Application Programming Interface (API) |
| **Versi Dokumen** | 1.0 |
| **Tanggal Terbit** | 10 November 2026 |
| **Base URL (Lokal)** | `http://localhost:3000/api` |
| **Protokol** | HTTP/1.1 & HTTPS (JSON REST API) |
| **Target Integrasi** | Menghubungkan Frontend Landing Page (`public/`) & Admin SPA (`public/admin/`) ke Database MySQL (`schema_mapala_unand..sql`) |

---

## DAFTAR ISI
1. [Standar & Konvensi API](#1-standar--konvensi-api)
   - 1.1 Format Data & Header
   - 1.2 Skema Respon Standar (Envelope)
   - 1.3 Kode Status HTTP (HTTP Status Codes)
   - 1.4 Mekanisme Autentikasi & Otorisasi (JWT & RBAC)
2. [Ringkasan Rute Endpoint](#2-ringkasan-rute-endpoint)
3. [Kelompok I: API Publik (Tanpa Autentikasi)](#3-kelompok-i-api-publik-tanpa-autentikasi)
   - 3.1 Konten Halaman Beranda
   - 3.2 Konten Halaman Tentang Kami
   - 3.3 Konten Informasi Kontak & Footer
   - 3.4 Gambar Bagan Struktur Organisasi Aktif
   - 3.5 Daftar Master Divisi
   - 3.6 Daftar Opsi Filter Cepat Beranda
   - 3.7 Eksplorasi Kegiatan & Artikel Publik
   - 3.8 Detail Artikel & Galeri Dokumentasi
   - 3.9 Master Kategori Artikel
   - 3.10 Daftar Prestasi Organisasi
4. [Kelompok II: API Autentikasi & Sesi Akun](#4-kelompok-ii-api-autentikasi--sesi-akun)
   - 4.1 Login Akun (Anggota & Admin)
   - 4.2 Pembaruan Kata Sandi Mandiri (First Login / Rutin)
   - 4.3 Profil Sesi Pengguna Aktif (Me)
5. [Kelompok III: API Portal Anggota (Khusus Role Anggota)](#5-kelompok-iii-api-portal-anggota-khusus-role-anggota)
   - 5.1 Membaca Naskah Kebijakan Privasi Aktif
   - 5.2 Menyetujui Kebijakan Penggunaan Data (Consent)
   - 5.3 Ringkasan Dashboard Anggota
   - 5.4 Mengambil Profil & Biodata Anggota
   - 5.5 Memperbarui Biodata Tetap Anggota
   - 5.6 Memeriksa Status Periode Registrasi Aktif
   - 5.7 Mengambil Data Form Registrasi Ulang (Prefill Cerdas)
   - 5.8 Mengirimkan Formulir Registrasi Ulang Tahunan
   - 5.9 Riwayat Registrasi Ulang Tahunan
   - 5.10 Direktori Anggota Terbatas (Pencarian & Filter)
6. [Kelompok IV: API Dashboard Admin (Khusus Role Admin)](#6-kelompok-iv-api-dashboard-admin-khusus-role-admin)
   - 6.1 Statistik Ringkasan Dashboard Admin
   - 6.2 Daftar Anggota & Filter Komprehensif
   - 6.3 Mengunduh Template Impor Excel Anggota
   - 6.4 Pratinjau Berkas Impor Excel (Preview Import)
   - 6.5 Eksekusi Penyimpanan Impor Batch (Commit Import)
   - 6.6 Ekspor Data Anggota (Excel / CSV)
   - 6.7 Detail Lengkap Anggota
   - 6.8 Menambah Anggota Baru Manual
   - 6.9 Memperbarui Data Profil Anggota
   - 6.10 Mengubah Status Keaktifan Anggota (Toggle Status)
   - 6.11 Reset Kata Sandi Anggota
   - 6.12 Cetak Dokumen Formulir Biodata PDF
   - 6.13 Monitoring Registrasi Ulang Tahunan
   - 6.14 Admin Override / Input Registrasi Anggota
   - 6.15 Kelola Periode Registrasi Ulang
   - 6.16 Kelola Master Divisi Organisasi
   - 6.17 Kelola Master Jenis Atribut Lapangan
   - 6.18 CMS Artikel & Ekspedisi (CRUD + Multi-Images)
   - 6.19 CMS Bagan Struktur Organisasi (Upload Gambar)
   - 6.20 CMS Prestasi Organisasi (CRUD)
   - 6.21 CMS Konten Statis, Misi, Statistik & Sosmed
   - 6.22 Log Audit Aktivitas Admin

---

## 1. Standar & Konvensi API

### 1.1 Format Data & Header
- Seluruh endpoint menerima dan mengirimkan payload berformat **JSON** (`Content-Type: application/json; charset=utf-8`), kecuali untuk operasi pengunggahan berkas yang menggunakan `multipart/form-data`.
- Endpoint yang membutuhkan autentikasi wajib menyertakan token JWT pada HTTP Header:
  ```http
  Authorization: Bearer <JWT_TOKEN>
  ```

### 1.2 Skema Respon Standar (Envelope)
Setiap respon API mengimplementasikan format pembungkus (*envelope*) yang seragam:

#### Respon Sukses (HTTP 200 / 201)
```json
{
  "success": true,
  "message": "Operasi berhasil dieksekusi.",
  "data": { ... } // Berupa objek atau array, atau null
}
```

#### Respon Error (HTTP 4xx / 5xx)
```json
{
  "success": false,
  "message": "Deskripsi kesalahan yang mudah dipahami pengguna.",
  "errors": [
    {
      "field": "nama_kolom",
      "message": "Pesan validasi spesifik kolom terkait"
    }
  ]
}
```

### 1.3 Kode Status HTTP (HTTP Status Codes)
| Kode Status | Kategori | Arti & Penggunaan |
| :---: | :--- | :--- |
| **200 OK** | Sukses | Permintaan pembacaan atau pembaruan data berhasil dilakukan. |
| **201 Created** | Sukses | Sumber daya baru berhasil dibuat (misal: tambah anggota, submit registrasi). |
| **400 Bad Request** | Error Klien | Validasi input gagal, format JSON tidak valid, atau parameter wajib tidak ada. |
| **401 Unauthorized** | Error Klien | Token tidak disertakan, token kedaluwarsa, atau kredensial login salah. |
| **403 Forbidden** | Error Klien | Akun tidak memiliki hak akses (contoh: anggota mencoba membuka API admin). |
| **404 Not Found** | Error Klien | Rute API atau ID sumber daya data yang diminta tidak ditemukan di basis data. |
| **409 Conflict** | Error Klien | Terjadi bentrokan unik data (misal: duplikasi No. Register atau slug artikel). |
| **422 Unprocessable Entity** | Error Klien | Validasi bisnis gagal (misal: registrasi ditutup, atau ukuran file melebihi batas). |
| **500 Internal Server Error**| Error Server| Terjadi kegagalan fatal pada server/database query. |

### 1.4 Mekanisme Autentikasi & Otorisasi (JWT & RBAC)
- Token ditandatangani menggunakan algoritma `HS256` dengan kunci rahasia `JWT_SECRET` yang disimpan di `.env`.
- Payload JWT memuat data sesi ringkas:
  ```json
  {
    "id": 1,
    "username": "MU 280 RGM",
    "nama": "Rahmat Hidayat",
    "role": "anggota",
    "must_change_password": 0,
    "exp": 1794356000
  }
  ```

---

## 2. Ringkasan Rute Endpoint

| Kelompok | Method | Endpoint | Hak Akses | Keterangan Singkat |
| :--- | :---: | :--- | :---: | :--- |
| **Publik** | GET | `/api/public/content/beranda` | Publik | Data dinamis landing page |
| **Publik** | GET | `/api/public/content/tentang-kami` | Publik | Sejarah, visi, misi_poin, kode etik |
| **Publik** | GET | `/api/public/content/kontak` | Publik | Kontak sekretariat & medsos |
| **Publik** | GET | `/api/public/content/struktur-organisasi` | Publik | Bagan struktur aktif periode berjalan |
| **Publik** | GET | `/api/public/divisions` | Publik | Master divisi aktif |
| **Publik** | GET | `/api/public/filters` | Publik | Opsi divisi, lokasi, jadwal beranda |
| **Publik** | GET | `/api/public/articles` | Publik | Daftar artikel terbit & filter |
| **Publik** | GET | `/api/public/articles/:slug` | Publik | Detail lengkap artikel & galeri |
| **Publik** | GET | `/api/public/categories` | Publik | Master kategori artikel |
| **Publik** | GET | `/api/public/prestasi` | Publik | Daftar prestasi organisasi |
| **Autentikasi** | POST | `/api/auth/login` | Publik | Login No. Register & password |
| **Autentikasi** | POST | `/api/auth/change-password` | Auth (Semua) | Ganti password akun |
| **Autentikasi** | GET | `/api/auth/me` | Auth (Semua) | Data akun pengguna aktif |
| **Anggota** | GET | `/api/member/privacy-policy` | Anggota | Naskah kebijakan privasi aktif |
| **Anggota** | POST | `/api/member/privacy-policy/consent` | Anggota | Menyetujui kebijakan privasi |
| **Anggota** | GET | `/api/member/dashboard` | Anggota | Ringkasan dashboard anggota |
| **Anggota** | GET | `/api/member/profile` | Anggota | Biodata lengkap anggota |
| **Anggota** | PUT | `/api/member/profile` | Anggota | Ubah biodata tetap mandiri |
| **Anggota** | GET | `/api/member/re-registration/active-period` | Anggota | Cek jadwal periode registrasi |
| **Anggota** | GET | `/api/member/re-registration/form-data` | Anggota | Prefill data registrasi dari tahun lalu |
| **Anggota** | POST | `/api/member/re-registration` | Anggota | Submit formulir registrasi tahunan |
| **Anggota** | GET | `/api/member/re-registration/history` | Anggota | Riwayat registrasi masa lalu |
| **Anggota** | GET | `/api/member/directory` | Anggota | Direktori anggota via `v_direktori_anggota` |
| **Admin** | GET | `/api/admin/dashboard/stats` | Admin | Statistik dashboard & analitik |
| **Admin** | GET | `/api/admin/members` | Admin | Daftar anggota, cari & multi-filter |
| **Admin** | GET | `/api/admin/members/template` | Admin | Download template file Excel |
| **Admin** | POST | `/api/admin/members/import-preview` | Admin | Unggah & tinjau file Excel anggota |
| **Admin** | POST | `/api/admin/members/import-commit` | Admin | Eksekusi simpan batch data anggota |
| **Admin** | GET | `/api/admin/members/export` | Admin | Ekspor data anggota ke CSV/Excel |
| **Admin** | GET | `/api/admin/members/:no_register` | Admin | Detail lengkap data anggota |
| **Admin** | POST | `/api/admin/members` | Admin | Tambah satu anggota manual |
| **Admin** | PUT | `/api/admin/members/:no_register` | Admin | Perbarui data biodata anggota |
| **Admin** | PATCH | `/api/admin/members/:no_register/toggle-status` | Admin | Aktifkan/nonaktifkan anggota |
| **Admin** | POST | `/api/admin/members/:no_register/reset-password` | Admin | Reset kata sandi anggota |
| **Admin** | GET | `/api/admin/members/:no_register/print-biodata` | Admin | Unduh cetak PDF formulir biodata |
| **Admin** | GET | `/api/admin/registrations/monitoring` | Admin | Monitoring kepatuhan registrasi |
| **Admin** | POST | `/api/admin/registrations/override` | Admin | Input registrasi atas nama anggota |
| **Admin** | GET/POST | `/api/admin/periodes` | Admin | Kelola master periode registrasi |
| **Admin** | PATCH | `/api/admin/periodes/:id/toggle` | Admin | Buka/tutup periode registrasi |
| **Admin** | GET/POST/PUT/DELETE | `/api/admin/divisions` | Admin | Kelola master divisi |
| **Admin** | GET/POST/PUT | `/api/admin/attributes` | Admin | Kelola master jenis atribut |
| **Admin** | GET/POST/PUT/DELETE | `/api/admin/cms/articles` | Admin | CMS Artikel & galeri gambar |
| **Admin** | GET/POST | `/api/admin/cms/struktur` | Admin | CMS Bagan Struktur Organisasi |
| **Admin** | GET/POST/PUT/DELETE | `/api/admin/cms/prestasi` | Admin | CMS Data Prestasi |
| **Admin** | GET/PUT | `/api/admin/cms/static-content` | Admin | CMS Teks statis, visi, misi, kontak |
| **Admin** | GET | `/api/admin/logs` | Admin | Riwayat jejak audit aktivitas admin |

---

## 3. Kelompok I: API Publik (Tanpa Autentikasi)

### 3.1 Konten Halaman Beranda
Menyajikan data agregasi dinamis untuk landing page (`/` atau `index.html`) yang sebelumnya menggunakan `data.js`.
- **Method:** `GET`
- **Endpoint:** `/public/content/beranda`
- **Response 200 OK:**
```json
{
  "success": true,
  "message": "Data beranda berhasil dimuat.",
  "data": {
    "hero": {
      "judul": "Mahasiswa Pecinta Alam Universitas Andalas",
      "tagline": "Menjelajah Rimba, Menjaga Lestari, Mengabdi Sepanjang Hayat",
      "deskripsi": "Wadah pembinaan karakter, eksplorasi alam bebas, dan konservasi lingkungan hidup sejak era 1980-an.",
      "foto_url": "/uploads/hero-mountain.jpg"
    },
    "statistik": [
      { "id": 1, "ikon": "users", "angka": "355", "satuan": "+", "label": "Anggota Seumur Hidup" },
      { "id": 2, "ikon": "mountain", "angka": "48", "satuan": "Puncak", "label": "Ekspedisi Rimba Terjelajahi" },
      { "id": 3, "ikon": "trophy", "angka": "25", "satuan": "Penghargaan", "label": "Prestasi Nasional & Daerah" },
      { "id": 4, "ikon": "leaf", "angka": "Konsisten", "satuan": "", "label": "Advokasi & Konservasi Karst" }
    ],
    "kegiatan_terbaru": [
      {
        "id": 1,
        "judul": "Ekspedisi Gunung Kerinci 3.805 MDPL",
        "slug": "ekspedisi-gunung-kerinci-3805-mdpl",
        "kategori": "Ekspedisi",
        "divisi": "Rimba Gunung",
        "lokasi": "Atap Sumatera • 3.805 MDPL",
        "ringkasan": "Pendakian riset vegetasi di batas tinggi dan pemetaan jalur evakuasi.",
        "foto_sampul": "/uploads/kerinci-expedition.jpg",
        "status_kegiatan": "Rampung",
        "tim_capaian": "18 Anggota Tim Riset",
        "tanggal_kegiatan": "2024-10-14"
      }
    ],
    "divisi_list": [
      { "id": 1, "nama": "Rimba Gunung", "slug": "rimba-gunung", "ikon": "mountain", "deskripsi": "Spesialisasi penjelajahan rimba dan navigasi gunung hutan." }
    ],
    "struktur_ringkas": {
      "periode": "2025/2026",
      "judul_bagan": "Bagan Kepengurusan Resmi Mapala UNAND 2025/2026",
      "gambar_url": "/uploads/struktur-2025-2026.png"
    },
    "sorotan_prestasi": [
      {
        "id": 1,
        "judul": "Juara 1 Lead Climbing Nasional",
        "subjudul": "Pekan Olahraga Mahasiswa Nasional",
        "detail": "Kategori Lead Perorangan Mahasiswa Putra",
        "gambar_url": "/uploads/prestasi-panjat.jpg",
        "caption": "Penyerahan medali emas panjat tebing di Jakarta"
      }
    ]
  }
}
```

### 3.2 Konten Halaman Tentang Kami
- **Method:** `GET`
- **Endpoint:** `/public/content/tentang-kami`
- **Response 200 OK:**
```json
{
  "success": true,
  "message": "Konten Tentang Kami berhasil dimuat.",
  "data": {
    "sejarah": "Mapala UNAND didirikan pada era 1980-an oleh para mahasiswa Universitas Andalas...",
    "sejarah_foto": "/uploads/sejarah-dokumentasi.jpg",
    "sejarah_foto_caption": "Dokumentasi pendirian Mapala UNAND di kampus Limau Manis",
    "visi": "Menjadi wadah pembinaan karakter generasi muda yang tangguh, berwawasan lingkungan...",
    "misi": [
      { "urutan": 1, "teks": "Mengembangkan potensi kepeloporan dan keahlian di alam bebas." },
      { "urutan": 2, "teks": "Melaksanakan riset dan advokasi konservasi sumber daya alam." },
      { "urutan": 3, "teks": "Mempererat persaudaraan seumur hidup antar-anggota lintas generasi." }
    ],
    "kode_etik": "Pencinta Alam Indonesia sadar bahwa alam beserta isinya adalah ciptaan Tuhan Yang Maha Esa...",
    "kode_etik_keterangan": "Ditetapkan pada Gladian IV Ujung Pandang, 1974."
  }
}
```

### 3.3 Konten Informasi Kontak & Footer
- **Method:** `GET`
- **Endpoint:** `/public/content/kontak`
- **Response 200 OK:**
```json
{
  "success": true,
  "message": "Kontak organisasi berhasil dimuat.",
  "data": {
    "email": "sekretariat@mapalaunand.org",
    "whatsapp": "6281267890123",
    "alamat": "Gedung Pusat Kegiatan Mahasiswa (PKM) Lt. 1, Universitas Andalas, Limau Manis, Padang 25163",
    "footer_deskripsi": "Wadah kebersamaan, riset kealaman, dan pelestarian lingkungan seumur hidup.",
    "social_links": [
      { "platform": "Instagram", "url": "https://instagram.com/mapalaunand" },
      { "platform": "YouTube", "url": "https://youtube.com/@mapalaunandofficial" },
      { "platform": "X-Twitter", "url": "https://x.com/mapalaunand" }
    ]
  }
}
```

### 3.4 Gambar Bagan Struktur Organisasi Aktif
- **Method:** `GET`
- **Endpoint:** `/public/content/struktur-organisasi`
- **Response 200 OK:**
```json
{
  "success": true,
  "message": "Bagan struktur organisasi aktif berhasil diambil.",
  "data": {
    "periode": "2025/2026",
    "tahun_mulai": 2025,
    "tahun_selesai": 2026,
    "judul_bagan": "Bagan Organigram Kepengurusan Mapala UNAND Periode 2025/2026",
    "gambar_path": "/uploads/struktur-organisasi.svg",
    "uploaded_at": "2026-01-15T09:30:00Z"
  }
}
```

### 3.5 Daftar Master Divisi
- **Method:** `GET`
- **Endpoint:** `/public/divisions`
- **Response 200 OK:** Array divisi aktif terurut berdasarkan kolom `urutan`.

### 3.6 Daftar Opsi Filter Cepat Beranda
- **Method:** `GET`
- **Endpoint:** `/public/filters`
- **Response 200 OK:**
```json
{
  "success": true,
  "data": {
    "divisions": [{ "id": 1, "nama": "Rimba Gunung", "slug": "rimba-gunung" }],
    "locations": [{ "id": 1, "nama": "Gunung Kerinci", "slug": "gunung-kerinci" }],
    "schedules": [{ "id": 1, "nama": "Musim Kemarau (Juli-Okt)", "slug": "musim-kemarau" }]
  }
}
```

### 3.7 Eksplorasi Kegiatan & Artikel Publik
- **Method:** `GET`
- **Endpoint:** `/public/articles`
- **Query Parameters:**
  - `kategori` (string, opsional): slug kategori artikel.
  - `divisi` (string, opsional): slug divisi.
  - `q` (string, opsional): kata kunci pencarian judul/ringkasan.
  - `page` (integer, default: 1): nomor halaman.
  - `limit` (integer, default: 9): jumlah per halaman.
- **Response 200 OK:**
```json
{
  "success": true,
  "data": {
    "articles": [
      {
        "id": 1,
        "judul": "Ekspedisi Gunung Kerinci 3.805 MDPL",
        "slug": "ekspedisi-gunung-kerinci-3805-mdpl",
        "kategori": "Ekspedisi",
        "kategori_slug": "ekspedisi",
        "divisi": "Rimba Gunung",
        "lokasi": "Atap Sumatera • 3.805 MDPL",
        "ringkasan": "Pendakian riset vegetasi batas tinggi dan jalur evakuasi.",
        "foto_sampul": "/uploads/kerinci-expedition.jpg",
        "tanggal_kegiatan": "2024-10-14",
        "published_at": "2024-10-16T10:00:00Z"
      }
    ],
    "pagination": { "page": 1, "limit": 9, "total_records": 12, "total_pages": 2 }
  }
}
```

### 3.8 Detail Artikel & Galeri Dokumentasi
- **Method:** `GET`
- **Endpoint:** `/public/articles/:slug`
- **Response 200 OK:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "judul": "Ekspedisi Gunung Kerinci 3.805 MDPL",
    "slug": "ekspedisi-gunung-kerinci-3805-mdpl",
    "kategori": "Ekspedisi",
    "divisi": "Rimba Gunung",
    "lokasi": "Atap Sumatera • 3.805 MDPL",
    "penulis": "Bidang Operasional",
    "tanggal_kegiatan": "2024-10-14",
    "tim_capaian": "18 Anggota Tim Riset",
    "status_kegiatan": "Rampung",
    "ringkasan": "Pendakian riset vegetasi di batas tinggi...",
    "isi_html": "<p>Gunung Kerinci sebagai atap tertinggi Pulau Sumatera...</p>",
    "foto_sampul": "/uploads/kerinci-expedition.jpg",
    "galeri": [
      { "id": 1, "path": "/uploads/kerinci-expedition.jpg", "caption": "Tim di batas vegetasi", "is_sampul": 1 },
      { "id": 2, "path": "/uploads/kerinci-puncak.jpg", "caption": "Tugu Puncak Indrapura", "is_sampul": 0 }
    ],
    "artikel_terkait": [
      { "id": 2, "judul": "Eksplorasi Karst Halaban", "slug": "eksplorasi-karst-halaban", "foto_sampul": "/uploads/caving-expedition.jpg" }
    ]
  }
}
```

### 3.9 Master Kategori Artikel
- **Method:** `GET`
- **Endpoint:** `/public/categories`

### 3.10 Daftar Prestasi Organisasi
- **Method:** `GET`
- **Endpoint:** `/public/prestasi`
- **Response 200 OK:** Daftar prestasi yang dikelompokkan atau diurutkan berdasarkan tahun descending.

---

## 4. Kelompok II: API Autentikasi & Sesi Akun

### 4.1 Login Akun (Anggota & Admin)
Mendukung login terpadu menggunakan Nomor Register anggota atau Username admin.
- **Method:** `POST`
- **Endpoint:** `/auth/login`
- **Request Body:**
```json
{
  "username": "MU 280 RGM",
  "password": "password_awal123"
}
```
- **Response 200 OK (Sukses Login):**
```json
{
  "success": true,
  "message": "Login berhasil.",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 12,
      "username": "MU 280 RGM",
      "nama": "Rahmat Hidayat",
      "role": "anggota",
      "must_change_password": 1,
      "privacy_consent_given": 0
    }
  }
}
```
- **Response 401 Unauthorized:** Kombinasi username/password salah atau akun nonaktif.
- **Response 429 Too Many Requests / 403 Forbidden:** Akun terkunci sementara karena 5x percobaan gagal (`locked_until`).

### 4.2 Pembaruan Kata Sandi Mandiri (First Login / Rutin)
Wajib dipanggil jika `must_change_password = 1` atau pengguna ingin mengganti kata sandi.
- **Method:** `POST`
- **Endpoint:** `/auth/change-password`
- **Header:** `Authorization: Bearer <TOKEN>`
- **Request Body:**
```json
{
  "oldPassword": "password_awal123",
  "newPassword": "PasswordBaruRahmat#2026"
}
```
- **Response 200 OK:**
```json
{
  "success": true,
  "message": "Password berhasil diperbarui. Silakan lanjutkan verifikasi kebijakan privasi."
}
```

### 4.3 Profil Sesi Pengguna Aktif (Me)
- **Method:** `GET`
- **Endpoint:** `/auth/me`
- **Header:** `Authorization: Bearer <TOKEN>`
- **Response 200 OK:** Mengembalikan detail sesi, status `must_change_password`, status `privacy_consent_given`, dan role aktif.

---

## 5. Kelompok III: API Portal Anggota (Khusus Role Anggota)

Seluruh endpoint pada kelompok ini dilindungi oleh middleware:
`authenticateToken` dan otorisasi `role = 'anggota'`.

### 5.1 Membaca Naskah Kebijakan Privasi Aktif
Menampilkan naskah kebijakan privasi versi terbaru (`aktif = 1`) yang wajib disetujui (FR-44).
- **Method:** `GET`
- **Endpoint:** `/member/privacy-policy`
- **Response 200 OK:**
```json
{
  "success": true,
  "data": {
    "kebijakan_id": 1,
    "versi": "1.0",
    "judul": "Kebijakan Privasi dan Persetujuan Penggunaan Data Anggota",
    "isi": "Mapala UNAND berkomitmen menjaga kerahasiaan data pribadi...",
    "berlaku_sejak": "2026-01-01T00:00:00Z",
    "sudah_disetujui": false,
    "disetujui_at": null
  }
}
```

### 5.2 Menyetujui Kebijakan Penggunaan Data (Consent)
Mencatat persetujuan anggota ke tabel `persetujuan_data` (FR-45).
- **Method:** `POST`
- **Endpoint:** `/member/privacy-policy/consent`
- **Request Body:**
```json
{
  "kebijakan_id": 1,
  "setuju": true
}
```
- **Response 200 OK:**
```json
{
  "success": true,
  "message": "Persetujuan kebijakan privasi berhasil disimpan. Anda kini dapat mengakses seluruh fitur anggota."
}
```

### 5.3 Ringkasan Dashboard Anggota
Menyajikan status keanggotaan dan kepatuhan registrasi ulang periode berjalan (FR-16).
- **Method:** `GET`
- **Endpoint:** `/member/dashboard`
- **Response 200 OK:**
```json
{
  "success": true,
  "data": {
    "identitas": {
      "no_register": "MU 280 RGM",
      "nama": "Rahmat Hidayat",
      "divisi": "Rimba Gunung",
      "angkatan": 2018,
      "profil_lengkap": 1
    },
    "periode_berjalan": {
      "id": 1,
      "tahun": 2026,
      "nama": "Registrasi Ulang Tahunan 2026",
      "status_periode": "buka",
      "tanggal_buka": "2026-01-01",
      "tanggal_tutup": "2026-12-31"
    },
    "status_registrasi": {
      "sudah_registrasi": true,
      "submitted_at": "2026-02-10T14:30:00Z",
      "sumber_input": "mandiri"
    },
    "notifikasi": []
  }
}
```

### 5.4 Mengambil Profil & Biodata Anggota
Menampilkan data tetap anggota dan ringkasan registrasi terakhir (FR-18).
- **Method:** `GET`
- **Endpoint:** `/member/profile`
- **Response 200 OK:**
```json
{
  "success": true,
  "data": {
    "data_tetap": {
      "no_register": "MU 280 RGM",
      "nama": "Rahmat Hidayat",
      "divisi_id": 1,
      "divisi_nama": "Rimba Gunung",
      "angkatan": 2018,
      "tempat_lahir": "Kota Padang",
      "tanggal_lahir": "1998-05-12",
      "golongan_darah": "O",
      "nama_ayah": "Hidayatullah",
      "nama_ibu": "Rahmawati",
      "profil_lengkap": 1
    },
    "data_berkala_terbaru": {
      "foto_path": "/uploads/avatar-mu280.jpg",
      "alamat_rumah": "Jl. Gajah Mada No. 42",
      "kota_kabupaten": "Kota Padang",
      "provinsi": "Sumatera Barat",
      "pekerjaan": "Software Engineer",
      "no_hp": "081267890123",
      "email": "rahmat@example.com",
      "alamat_orang_tua": "Jl. Gajah Mada No. 42, Kota Padang",
      "tahun_registrasi": 2026
    }
  }
}
```

### 5.5 Memperbarui Biodata Tetap Anggota
Anggota dapat mengubah data tetap miliknya, **kecuali No. Register dan Angkatan** yang hanya boleh diubah admin (FR-18).
- **Method:** `PUT`
- **Endpoint:** `/member/profile`
- **Request Body:**
```json
{
  "nama": "Rahmat Hidayat, S.Kom.",
  "divisi_id": 1,
  "tempat_lahir": "Kota Padang",
  "tanggal_lahir": "1998-05-12",
  "golongan_darah": "O",
  "nama_ayah": "Hidayatullah",
  "nama_ibu": "Rahmawati"
}
```
- **Response 200 OK:**
```json
{
  "success": true,
  "message": "Data biodata berhasil diperbarui."
}
```

### 5.6 Memeriksa Status Periode Registrasi Aktif
- **Method:** `GET`
- **Endpoint:** `/member/re-registration/active-period`
- **Response 200 OK:** Menampilkan periode berjalan (`status = 'buka'`). Jika tidak ada periode yang buka, mengembalikan `status_periode: 'tutup'`.

### 5.7 Mengambil Data Form Registrasi Ulang (Prefill Cerdas)
Mengambil template form registrasi ulang tahun berjalan beserta data prapengisian otomatis (*prefilled*) dari tahun sebelumnya (FR-23).
- **Method:** `GET`
- **Endpoint:** `/member/re-registration/form-data`
- **Response 200 OK:**
```json
{
  "success": true,
  "data": {
    "periode_id": 1,
    "tahun": 2026,
    "profil_terkunci": {
      "no_register": "MU 280 RGM",
      "nama": "Rahmat Hidayat",
      "divisi": "Rimba Gunung",
      "angkatan": 2018
    },
    "prefill_data": {
      "alamat_rumah": "Jl. Gajah Mada No. 42",
      "kota_kabupaten": "Kota Padang",
      "provinsi": "Sumatera Barat",
      "pekerjaan": "Software Engineer",
      "no_hp": "081267890123",
      "email": "rahmat@example.com",
      "alamat_orang_tua": "Jl. Gajah Mada No. 42, Kota Padang",
      "media_sosial": [
        { "platform": "Instagram", "akun": "@rahmathidayat" },
        { "platform": "LinkedIn", "akun": "linkedin.com/in/rahmath" }
      ]
    },
    "atribut_master": [
      {
        "jenis_atribut_id": 1,
        "nama_atribut": "Topi Rimba",
        "memiliki_sebelumnya": true,
        "foto_path_terisi": null // Wajib upload ulang jika tahun berbeda
      },
      {
        "jenis_atribut_id": 2,
        "nama_atribut": "Baju Lapangan",
        "memiliki_sebelumnya": true,
        "foto_path_terisi": null
      }
    ]
  }
}
```

### 5.8 Mengirimkan Formulir Registrasi Ulang Tahunan
Mengunggah pembaruan data tahunan beserta bukti foto identitas dan atribut (FR-22, FR-24, FR-27).
- **Method:** `POST`
- **Endpoint:** `/member/re-registration`
- **Content-Type:** `multipart/form-data`
- **Form Fields:**
  - `periode_id` (integer, required)
  - `alamat_rumah` (text, required)
  - `kota_kabupaten` (string, required)
  - `provinsi` (string, required)
  - `pekerjaan` (string, required)
  - `no_hp` (string, required)
  - `email` (string, required)
  - `alamat_orang_tua` (text, required)
  - `media_sosial` (JSON string array platform & akun, opsional)
  - `foto_terbaru` (binary file JPG/PNG/WEBP maks 2 MB, opsional/wajib jika belum ada)
  - `atribut` (JSON string array objek):
    ```json
    [
      { "jenis_atribut_id": 1, "memiliki": 1 },
      { "jenis_atribut_id": 2, "memiliki": 1 }
    ]
    ```
  - `foto_atribut_1` (binary file, bukti foto atribut jenis 1)
  - `foto_atribut_2` (binary file, bukti foto atribut jenis 2)
- **Response 201 Created:**
```json
{
  "success": true,
  "message": "Registrasi ulang tahun 2026 berhasil disimpan."
}
```

### 5.9 Riwayat Registrasi Ulang Tahunan
- **Method:** `GET`
- **Endpoint:** `/member/re-registration/history`
- **Response 200 OK:** Array riwayat registrasi dari tahun-tahun terdahulu (*read-only*).

### 5.10 Direktori Anggota Terbatas (Pencarian & Filter)
Membaca data sesama rekan anggota seumur hidup dari database view `v_direktori_anggota` (FR-46, FR-47).
- **Method:** `GET`
- **Endpoint:** `/member/directory`
- **Query Parameters:**
  - `q` (string, opsional): pencarian pada nama atau No. Register.
  - `provinsi` (string, opsional): filter provinsi tempat tinggal.
  - `kota` (string, opsional): filter kota/kabupaten tempat tinggal.
  - `goldar` (string, opsional): filter golongan darah ('A','B','AB','O').
  - `page` (integer, default: 1)
  - `limit` (integer, default: 20)
- **Response 200 OK:**
```json
{
  "success": true,
  "message": "Data direktori anggota berhasil dimuat.",
  "data": {
    "members": [
      {
        "anggota_id": 4,
        "nama": "Ilham Syahputra",
        "no_register": "MU 301 OLA",
        "no_hp": "082189012345",
        "golongan_darah": "AB",
        "alamat_rumah": "Jl. Veteran No. 12",
        "kota_kabupaten": "Kota Padang",
        "provinsi": "Sumatera Barat"
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total_records": 1, "total_pages": 1 }
  }
}
```
*Catatan Keamanan PDP:* Endpoint ini dilarang keras mengembalikan tanggal lahir, nama orang tua, foto, atau email anggota.

---

## 6. Kelompok IV: API Dashboard Admin (Khusus Role Admin)

Semua endpoint `/api/admin/*` dilindungi middleware `authenticateToken` dan `requireAdmin`.

### 6.1 Statistik Ringkasan Dashboard Admin
- **Method:** `GET`
- **Endpoint:** `/admin/dashboard/stats`
- **Response 200 OK:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "total_anggota": 355,
      "anggota_aktif": 350,
      "sudah_registrasi_tahun_ini": 215,
      "belum_registrasi_tahun_ini": 140,
      "persentase_registrasi": "60.5%"
    },
    "periode_aktif": { "id": 1, "tahun": 2026, "status": "buka" },
    "distribusi_divisi": [
      { "divisi": "Rimba Gunung", "jumlah": 120 },
      { "divisi": "Panjat Tebing", "jumlah": 95 },
      { "divisi": "Olahraga Air", "jumlah": 70 },
      { "divisi": "Caving", "jumlah": 70 }
    ],
    "sebaran_angkatan": [
      { "angkatan": 2020, "jumlah": 25 },
      { "angkatan": 2019, "jumlah": 22 }
    ],
    "aktivitas_terkini": [
      { "id": 101, "admin": "admin", "aksi": "RESET_PASSWORD", "entitas": "users", "waktu": "2026-02-10T12:00:00Z" }
    ]
  }
}
```

### 6.2 Daftar Anggota & Filter Komprehensif
- **Method:** `GET`
- **Endpoint:** `/admin/members`
- **Query Parameters:**
  - `q` (string, cari nama / no_register)
  - `divisi_id` (integer)
  - `angkatan` (integer)
  - `status_reg` (string: `'sudah'` / `'belum'`)
  - `provinsi` (string)
  - `kota` (string)
  - `status_aktif` (boolean: 0 atau 1)
  - `page` (integer, default: 1), `limit` (integer, default: 15)

### 6.3 Mengunduh Template Impor Excel Anggota
- **Method:** `GET`
- **Endpoint:** `/admin/members/template`
- **Response 200 OK:** Berkas biner Excel (`.xlsx`) berisi baris contoh dan header kolom:
  `no_register`, `nama`, `divisi`, `angkatan`, `tempat_lahir`, `tanggal_lahir (YYYY-MM-DD)`, `golongan_darah`, `nama_ayah`, `nama_ibu`.

### 6.4 Pratinjau Berkas Impor Excel (Preview Import)
Mengunggah file Excel, memverifikasi kelayakan data, serta menampilkan baris valid vs duplikat sebelum dieksekusi (FR-31).
- **Method:** `POST`
- **Endpoint:** `/admin/members/import-preview`
- **Content-Type:** `multipart/form-data` (`file`)
- **Response 200 OK:**
```json
{
  "success": true,
  "data": {
    "total_rows": 100,
    "valid_count": 98,
    "error_count": 2,
    "errors": [
      { "row": 14, "no_register": "MU 280 RGM", "alasan": "No. Register sudah terdaftar di sistem." },
      { "row": 45, "no_register": "MU 999 XYZ", "alasan": "Format tanggal lahir salah." }
    ],
    "preview_data": [
      { "no_register": "MU 340 RGM", "nama": "Fajri Ramadhan", "divisi_id": 1, "angkatan": 2023 }
    ]
  }
}
```

### 6.5 Eksekusi Penyimpanan Impor Batch (Commit Import)
- **Method:** `POST`
- **Endpoint:** `/admin/members/import-commit`
- **Request Body:** Array baris valid hasil preview.
- **Response 201 Created:** Seluruh data anggota dan akun user terkait berhasil dibuat dengan kata sandi default `mapala123` dan `must_change_password = 1`.

### 6.6 Ekspor Data Anggota (Excel / CSV)
- **Method:** `GET`
- **Endpoint:** `/admin/members/export`
- **Query Parameters:** `format` (`xlsx` atau `csv`), `periode_id`, `divisi_id`, `status_reg`.
- **Response 200 OK:** Berkas lampiran *download* spreadsheet.

### 6.7 Detail Lengkap Anggota
- **Method:** `GET`
- **Endpoint:** `/admin/members/:no_register`
- **Response 200 OK:** Menyajikan seluruh atribut data tetap, akun user, dan riwayat seluruh registrasi ulang yang pernah dilakukan.

### 6.8 Menambah Anggota Baru Manual
- **Method:** `POST`
- **Endpoint:** `/admin/members`
- **Request Body:**
```json
{
  "no_register": "MU 360 PCT",
  "nama": "Bayu Segara",
  "divisi_id": 2,
  "angkatan": 2024,
  "tempat_lahir": "Bukittinggi",
  "tanggal_lahir": "2003-08-17",
  "golongan_darah": "B",
  "nama_ayah": "Amrizal",
  "nama_ibu": "Nurhasanah"
}
```
- **Response 201 Created:** Data tersimpan di tabel `anggota` dan tabel `users` terbuat otomatis.

### 6.9 Memperbarui Data Profil Anggota
- **Method:** `PUT`
- **Endpoint:** `/admin/members/:no_register`

### 6.10 Mengubah Status Keaktifan Anggota (Toggle Status)
- **Method:** `PATCH`
- **Endpoint:** `/admin/members/:no_register/toggle-status`
- **Response 200 OK:** Mengubah nilai `is_active` (1 menjadi 0 atau sebaliknya) pada tabel `anggota` dan `users`.

### 6.11 Reset Kata Sandi Anggota
- **Method:** `POST`
- **Endpoint:** `/admin/members/:no_register/reset-password`
- **Response 200 OK:**
```json
{
  "success": true,
  "message": "Kata sandi untuk MU 280 RGM berhasil direset ke sandi sementara: mapala123"
}
```

### 6.12 Cetak Dokumen Formulir Biodata PDF
- **Method:** `GET`
- **Endpoint:** `/admin/members/:no_register/print-biodata`
- **Response 200 OK:** Berkas biner PDF (`application/pdf`) dengan layout resmi Biodata Anggota Penuh Mapala UNAND.

### 6.13 Monitoring Registrasi Ulang Tahunan
- **Method:** `GET`
- **Endpoint:** `/admin/registrations/monitoring`
- **Query Parameters:** `periode_id` (wajib), `status` (`'sudah'` / `'belum'`), `sumber` (`'mandiri'` / `'admin'`).

### 6.14 Admin Override / Input Registrasi Anggota
Memasukkan registrasi berkala atas nama anggota yang menyerahkan biodata via offline/chat (FR-32).
- **Method:** `POST`
- **Endpoint:** `/admin/registrations/override`
- **Content-Type:** `multipart/form-data`
- **Form Fields:** `no_register`, `periode_id`, `alamat_rumah`, `kota_kabupaten`, `provinsi`, `pekerjaan`, `no_hp`, `email`, `alamat_orang_tua`, `atribut` (JSON), file foto.
- **Response 201 Created:** Data dicatat dengan `sumber_input = 'admin'` dan `diinput_oleh = req.user.id`.

### 6.15 Kelola Periode Registrasi Ulang
- `GET /admin/periodes`: Daftar seluruh periode tahunan.
- `POST /admin/periodes`: Membuat periode registrasi baru (`tahun`, `nama`, `tanggal_buka`, `tanggal_tutup`).
- `PATCH /admin/periodes/:id/toggle`: Membuka atau menutup status registrasi (`status = 'buka' | 'tutup'`).

### 6.16 Kelola Master Divisi Organisasi
- `GET /admin/divisions`: Daftar master divisi.
- `POST /admin/divisions`: Tambah divisi baru (`nama`, `slug`, `ikon`, `deskripsi`, `urutan`).
- `PUT /admin/divisions/:id`: Ubah data divisi.
- `DELETE /admin/divisions/:id`: Hapus divisi (hanya jika belum berelasi dengan data anggota).

### 6.17 Kelola Master Jenis Atribut Lapangan
- `GET /admin/attributes`: Menampilkan daftar jenis atribut (`Topi Rimba`, `Baju Lapangan`).
- `POST /admin/attributes`: Tambah jenis atribut baru jika sewaktu-waktu organisasi menetapkan atribut tambahan.
- `PUT /admin/attributes/:id`: Mengubah nama, urutan, atau mengaktifkan/menonaktifkan jenis atribut.

### 6.18 CMS Artikel & Ekspedisi (CRUD + Multi-Images)
- `GET /admin/cms/articles`: Mengambil daftar seluruh artikel (termasuk draf).
- `POST /admin/cms/articles`: Membuat artikel baru (`judul`, `slug`, `kategori_id`, `divisi_id`, `lokasi_id`, `jadwal_id`, `ringkasan`, `isi`, `status_publikasi`, `foto_sampul`, `galeri[]`).
- `PUT /admin/cms/articles/:id`: Memperbarui data artikel dan gambar galeri.
- `DELETE /admin/cms/articles/:id`: Menghapus artikel beserta berkas gambarnya.

### 6.19 CMS Bagan Struktur Organisasi (Upload Gambar)
- `GET /admin/cms/struktur`: Mengambil data bagan struktur kepengurusan saat ini.
- `POST /admin/cms/struktur`: Mengunggah bagan kepengurusan baru:
  - Form fields: `periode_kepengurusan_id` (integer), `judul` (string), `foto` (file image maks 5 MB).
  - Menyimpan ke tabel `bagan_struktur` dengan `is_aktif = 1`.

### 6.20 CMS Prestasi Organisasi (CRUD)
- `GET /admin/cms/prestasi`: Daftar prestasi.
- `POST /admin/cms/prestasi`: Menambah catatan prestasi (`tahun`, `kategori`, `judul`, `deskripsi`, `info_label_1`, `info_label_2`, `is_sorotan`, `sorotan_judul`, `sorotan_subjudul`, `sorotan_detail`, file `foto`).
- `PUT /admin/cms/prestasi/:id`: Memperbarui data prestasi.
- `DELETE /admin/cms/prestasi/:id`: Menghapus data prestasi.

### 6.21 CMS Konten Statis, Misi, Statistik & Sosmed
- **Method:** `GET`
- **Endpoint:** `/admin/cms/static-content`
- **Response 200 OK:** Mengembalikan objek konfigurasi konten beranda, tentang kami, visi, misi, statistik, dan kontak.
- **Method:** `PUT`
- **Endpoint:** `/admin/cms/static-content`
- **Request Body:**
```json
{
  "konten_statis": {
    "hero_judul": "Mahasiswa Pecinta Alam Universitas Andalas",
    "hero_tagline": "Menjelajah Rimba, Menjaga Lestari...",
    "sejarah": "Mapala UNAND didirikan...",
    "visi": "Menjadi wadah pembinaan...",
    "kontak_email": "sekretariat@mapalaunand.org",
    "kontak_whatsapp": "6281267890123",
    "kontak_alamat": "Gedung PKM Lt. 1 Universitas Andalas"
  },
  "misi_poin": [
    { "id": 1, "teks": "Mengembangkan kepeloporan alam bebas.", "urutan": 1 }
  ],
  "statistik_beranda": [
    { "id": 1, "ikon": "users", "angka": "355", "satuan": "+", "label": "Anggota" }
  ],
  "tautan_sosial": [
    { "id": 1, "platform": "Instagram", "url": "https://instagram.com/mapalaunand", "urutan": 1 }
  ]
}
```

### 6.22 Log Audit Aktivitas Admin
- **Method:** `GET`
- **Endpoint:** `/admin/logs`
- **Query Parameters:** `page`, `limit`, `aksi`, `entitas`, `user_id`.
- **Response 200 OK:**
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": 1,
        "username": "admin",
        "aksi": "RESET_PASSWORD",
        "entitas": "users",
        "entitas_id": "12",
        "data_lama": { "must_change_password": 0 },
        "data_baru": { "must_change_password": 1 },
        "ip_address": "127.0.0.1",
        "created_at": "2026-02-10T14:20:00Z"
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total_records": 1, "total_pages": 1 }
  }
}
```

---
*Dokumen Spesifikasi API ini siap dijadikan pedoman implementasi backend controller, middleware, dan integrasi frontend client.*
