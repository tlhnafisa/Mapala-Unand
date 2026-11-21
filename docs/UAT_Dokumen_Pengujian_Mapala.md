# DOKUMEN PENGUJIAN PENERIMAAN PENGGUNA
# USER ACCEPTANCE TESTING (UAT)

## SISTEM INFORMASI MANAJEMEN KEANGGOTAAN DAN WEBSITE RESMI MAHASISWA PECINTA ALAM UNIVERSITAS ANDALAS (MAPALA UNAND)

---

### INFORMASI DOKUMEN

| Parameter | Keterangan |
| :--- | :--- |
| **Nama Dokumen** | Dokumen Pengujian Penerimaan Pengguna (*User Acceptance Testing* - UAT) |
| **Nama Perangkat Lunak** | Sistem Informasi Manajemen Keanggotaan dan Website Resmi Mapala UNAND |
| **Kode Proyek** | MAPALA-UNAND-2026 |
| **Mata Kuliah** | Manajemen Proyek Sistem Informasi (MPSI) |
| **Kelompok Pengembang** | Kelompok 3 |
| **Anggota Tim Pengembang** | 1. Arifah Huwaina Azre (NIM: 2411521003)<br>2. Farrel Ghufran Rahman (NIM: 2411521009)<br>3. Talitha Nafisa Khairul (NIM: 2411522007)<br>4. Rafa Gian Atthari (NIM: 2411522014)<br>5. Muhammad Racha Ardiwinata (NIM: 2411522020)<br>6. Muhammad Arrasyid (NIM: 2411522027)<br>7. Syifa Khalishah Nugroho (NIM: 2411522028) |
| **Instansi Mitra / Klien** | Mahasiswa Pecinta Alam Universitas Andalas (Mapala UNAND) |
| **Model Evaluasi Pengujian** | Penguji Tunggal Komprehensif (*Single Evaluator - End-to-End Operational Testing*) |
| **Versi Dokumen** | 3.0 (Dokumen Resmi Terpadu & Terverifikasi Fitur Nyata) |
| **Tanggal Pengesahan** | 20 November 2026 |
| **Tautan Kuesioner Daring** | https://docs.google.com/forms/d/e/1FAIpQLScnFHXng0h54HDoeLfxC6pEnkPhNIQdXTkMVxXOVBEbwx0kiQ/viewform |

---

## DAFTAR ISI

* **BAGIAN I: RENCANA PENGUJIAN PENERIMAAN (UAT PLAN)**
  * 1.1 Latar Belakang dan Tujuan Pengujian UAT
  * 1.2 Profil dan Karakteristik Responden Penguji
  * 1.3 Lingkungan Teknis Pengujian (*Test Environment*)
  * 1.4 Kriteria Keberhasilan Penerimaan (*Acceptance Threshold*)
* **BAGIAN II: PANDUAN SKENARIO TUGAS PENGGUNA (UAT TEST SCRIPTS)**
  * 2.1 Skenario Peran A: Pengunjung Publik (*Tanpa Login*)
  * 2.2 Skenario Peran B: Anggota Organisasi (*Member Portal & Aktivasi*)
  * 2.3 Skenario Peran C: Admin Kesekretariatan & Pengelola Konten (*CMS*)
* **BAGIAN III: LEMBAR EVALUASI & CHECKLIST HASIL UAT**
  * 3.1 Identitas Penguji dan Verifikasi Perangkat
  * 3.2 Tabel Checklist Evaluasi Fungsional Sistem
    * 3.2.1 Modul Portal Publik Website
    * 3.2.2 Modul Autentikasi dan Aktivasi Anggota
    * 3.2.3 Modul Registrasi Ulang dan Direktori Anggota
    * 3.2.4 Modul Administrasi, Tata Kelola Data, dan Monitoring
    * 3.2.5 Modul Manajemen Konten (CMS) dan Audit Trail
  * 3.3 Rekapitulasi Catatan Kendala dan Masukan Perbaikan
* **BAGIAN IV: KUESIONER EVALUASI PENERIMAAN DAN KEGUNAAN SISTEM**
  * 4.1 Identitas Responden dan Perangkat Uji
  * 4.2 Penilaian Pengujian Sisi Anggota (Hasil & Kemudahan Tugas A1 s.d. A11)
  * 4.3 Penilaian Pengujian Sisi Admin (Hasil & Kemudahan Tugas B1 s.d. B14)
  * 4.4 Penilaian Pengujian Portal Publik (Hasil Tugas C1 s.d. C4)
  * 4.5 Penilaian Umum dan Evaluasi Kelayakan Sistem (Indikator D1 s.d. D8)
  * 4.6 Metode Pengolahan dan Interpretasi Hasil Evaluasi
* **BAGIAN V: BERITA ACARA PENERIMAAN SISTEM (UAT SIGN-OFF FORM)**

---

## BAGIAN I: RENCANA PENGUJIAN PENERIMAAN (UAT PLAN)

### 1.1 Latar Belakang dan Tujuan Pengujian UAT
Dokumen Pengujian Penerimaan Pengguna (*User Acceptance Testing* - UAT) ini merupakan instrumen formal untuk menguji, memverifikasi, dan memastikan bahwa Sistem Informasi Manajemen Keanggotaan dan Website Resmi Mapala UNAND telah memenuhi kebutuhan fungsional dan non-fungsional organisasi secara akurat sebelum sistem diserahterimakan untuk operasional resmi.

Tujuan khusus pelaksanaan pengujian UAT ini meliputi:
1. **Validasi Kesesuaian Proses Bisnis:** Memastikan sistem mengakomodasi tata kelola keanggotaan unik Mapala UNAND, meliputi penomoran register seumur hidup, registrasi ulang tahunan berkala, kepatuhan Pelindungan Data Pribadi (UU No. 27 Tahun 2022), pencatatan kontak darurat keluarga, dan inventarisasi atribut resmi organisasi (Topi Rimba dan Baju Lapangan).
2. **Pengujian Fungsionalitas Kunci Mutakhir:** Memverifikasi fungsionalitas lanjutan yang telah dibangun, seperti mesin impor massal berkas Excel dengan konversi otomatis tanggal serial menjadi tanggal standar (`YYYY-MM-DD`), pencegahan duplikasi data, pembatasan ketat ukuran unggahan foto ($\le 5\text{ MB}$), bagan struktur organisasi berasio wajib 16:9, formulir cetak biodata resmi ber-kop surat ukuran A4, serta sakelar tema (*light/dark mode*).
3. **Evaluasi Penerimaan dan Usabilitas:** Mengukur tingkat kemudahan tugas, kenyamanan antarmuka, kejelasan label formulir, dan stabilitas respons sistem melalui instrumen kuesioner baku daring.
4. **Pengesahan Formal Legalitas Serah Terima:** Memperoleh Berita Acara Penerimaan Sistem (*UAT Sign-Off*) yang ditandatangani secara sah oleh perwakilan pengurus organisasi, tim pengembang mahasiswa, dan dosen pengampu mata kuliah.

### 1.2 Profil dan Karakteristik Responden Penguji
Pengujian ini menerapkan metode **Penguji Tunggal Komprehensif (*Single Evaluator - End-to-End Operational Testing*)**. Dalam metode ini, 1 (satu) orang perwakilan resmi organisasi pengurus Mapala UNAND bertindak sebagai penguji utama yang merangkap seluruh peran pengguna sistem secara runut dari hulu ke hilir.

Pendekatan penguji tunggal komprehensif ini dipilih berdasarkan pertimbangan metodologis:
1. Memastikan konsistensi pemahaman konteks organisasi secara menyeluruh dari perspektif pengunjung publik, anggota aktif, hingga administrator kesekretariatan.
2. Meminimalkan bias fragmentasi data uji, sehingga integritas data dari penambahan anggota, impor Excel, aktivasi, registrasi ulang, hingga audit log dapat dilacak dalam satu rantai uji operasional yang terpadu.

Karakteristik penguji yang ditunjuk:
* **Perwakilan Organisasi:** Pengurus Aktif Harian atau Bidang Kesekretariatan/Organisasi Mapala UNAND.
* **Tanggung Jawab Uji:** Melaksanakan 29 skenario tugas operasional (4 tugas publik, 11 tugas anggota, 14 tugas admin), mengisi lembar checklist hasil, melengkapi kuesioner evaluasi, serta menetapkan keputusan akhir kelayakan sistem.

### 1.3 Lingkungan Teknis Pengujian (*Test Environment*)
Pengujian dilaksanakan pada lingkungan kerja teknis terkontrol dengan spesifikasi sebagai berikut:

| Komponen Lingkungan | Spesifikasi Teknis yang Digunakan |
| :--- | :--- |
| **Sistem Perangkat Lunak** | Sistem Informasi Manajemen Keanggotaan dan Website Resmi Mapala UNAND (Versi 2.0 Stable Academic Release) |
| **Teknologi Backend & Server** | Node.js (Express.js Framework), RESTful Architecture, JWT Authentication, Multer Engine |
| **Teknologi Frontend** | Semantic HTML5, Modular Modern CSS (Light & Dark Theme System), Vanilla JavaScript (SPA Architecture) |
| **Sistem Basis Data** | MySQL Server Versi 8.0+ dengan 23 Tabel Relasional dan 1 View Terintegrasi |
| **Peramban (*Web Browser*)** | Google Chrome (v115+), Microsoft Edge (v115+), Mozilla Firefox (v115+), atau Safari |
| **Perangkat Keras Penguji** | Komputer Laptop/PC (resolusi layar $\ge 1366 \times 768$ piksel) dan *Smartphone* Android/iOS |
| **Jaringan & Akses Server** | Jaringan Lokal Staging / Server Web Port `3000` / `5000` |

### 1.4 Kriteria Keberhasilan Penerimaan (*Acceptance Threshold*)
Sistem dinyatakan **DITERIMA** secara resmi oleh pihak organisasi apabila memenuhi 3 (tiga) ambang batas penerimaan berikut:
1. **Tingkat Keterlaksanaan Skenario Kritis ($100\%$):** Seluruh tugas operasional pada Sisi Publik (C1–C4), Sisi Anggota (A1–A11), dan Sisi Admin (B1–B14) berstatus **Berhasil**. Tidak ditemukan kendala kritis (*blocking error*) yang menghentikan alur proses bisnis utama.
2. **Ambang Skor Kuesioner Evaluasi ($\ge 4{,}00$):** Rata-rata skor pada evaluasi penilaian umum (Indikator D1 s.d. D8) mencapai nilai minimal **4,00 dari rentang skala 5,00** (kategori Baik/Tinggi).
3. **Keputusan Kelayakan Sistem:** Penguji menyatakan sistem berada pada predikat **"Layak Digunakan Tanpa Perbaikan"** atau **"Layak Digunakan dengan Perbaikan Kecil"**, serta menandatangani Berita Acara Penerimaan Sistem (UAT Sign-Off Form).

---

## BAGIAN II: PANDUAN SKENARIO TUGAS PENGGUNA (UAT TEST SCRIPTS)

Penguji menjalankan skenario tugas operasional secara mandiri sesuai petunjuk langkah kerja berikut. Setiap butir tugas wajib diverifikasi keterlaksanaannya dengan mencentang kotak status di samping keterangan.

### 2.1 Skenario Peran A: Pengunjung Publik (*Tanpa Login*)
*Tujuan: Menguji kemudahan akses masyarakat umum, keterbacaan profil organisasi, galeri kegiatan, struktur kepengurusan 16:9, piagam prestasi, serta kenyamanan sakelar mode gelap/terang.*

| No | Butir Tugas | Langkah-Langkah Operasional Pengujian | Status Hasil |
| :---: | :---: | :--- | :---: |
| 1 | **C1** | 1. Buka peramban dan akses alamat portal publik (`/publik`).<br>2. Periksa tampilan halaman Beranda (*Hero section*, kartu ringkasan, dan navigasi menu).<br>3. Buka halaman Tentang Kami (`/tentang-kami.html`), uji tombol *"Baca Selengkapnya"* pada sejarah pendirian dan Kode Etik Pencinta Alam.<br>4. Akses halaman Struktur Organisasi (`/struktur-organisasi.html`), pastikan bagan organisasi tampil utuh proporsional dengan aspek rasio 16:9 (tidak terpotong). | [ ] Berhasil<br>[ ] Gagal |
| 2 | **C2** | 1. Buka halaman Kegiatan & Artikel (`/kegiatan-artikel.html`).<br>2. Coba kotak pencarian kata kunci dan penyaring kategori divisi spesialisasi.<br>3. Klik salah satu kartu kegiatan untuk membuka halaman rincian (`/detail-artikel.html`), periksa naskah artikel dan galeri dokumentasi foto. | [ ] Berhasil<br>[ ] Gagal |
| 3 | **C3** | 1. Buka halaman Prestasi (`/prestasi.html`) untuk memeriksa arsip penghargaan dan pencapaian ekspedisi.<br>2. Gulir ke bagian footer halaman untuk memverifikasi alamat sekretariat, nomor kontak WhatsApp, dan tautan media sosial resmi. | [ ] Berhasil<br>[ ] Gagal |
| 4 | **C4** | 1. Gulir halaman ke atas dan ke bawah untuk memastikan bilah navigasi utama (*sticky navbar*) tetap melayang rapi dan mudah dijangkau.<br>2. Klik tombol sakelar tema (*light/dark mode toggle*) di sudut kanan atas. Pastikan kontras teks, ikon SVG, dan warna latar belakang terbaca jelas tanpa ada tabrakan warna. | [ ] Berhasil<br>[ ] Gagal |

---

### 2.2 Skenario Peran B: Anggota Organisasi (*Member Portal & Aktivasi*)
*Tujuan: Menjalankan alur aktivasi anggota baru (ganti kata sandi, persetujuan privasi UU PDP, verifikasi data tetap), dashboard anggota, formulir registrasi ulang berkala (unggah foto $\le 5\text{ MB}$, domisili, kontak darurat, foto atribut), serta direktori anggota.*

| No | Butir Tugas | Langkah-Langkah Operasional Pengujian | Status Hasil |
| :---: | :---: | :--- | :---: |
| 1 | **A1** | 1. Akses halaman login (`/login.html`).<br>2. Masukkan kredensial akun anggota pertama kali (Username: No. Register misalnya `MU 341 Pct.` dan Kata Sandi awal default: `mapala123`).<br>3. Uji tombol ikon mata (*toggle eye icon*) untuk menampilkan dan menyembunyikan karakter kata sandi.<br>4. Klik tombol *"Masuk ke Portal"*. | [ ] Berhasil<br>[ ] Gagal |
| 2 | **A2** | 1. Sistem secara otomatis mendeteksi status aktivasi dan mengarahkan ke halaman Aktivasi Akun (`/anggota/aktivasi.html`).<br>2. Pada Langkah 1 (Ganti Password), masukkan kata sandi lama dan buat kata sandi baru yang memenuhi standar keamanan.<br>3. Uji ikon mata pada ketiga kolom isian kata sandi.<br>4. Klik tombol *"Simpan Password Baru & Lanjutkan"*. | [ ] Berhasil<br>[ ] Gagal |
| 3 | **A3** | 1. Pada Langkah 2 (Persetujuan Kebijakan Privasi), baca naskah transparansi pelindungan data pribadi sesuai UU No. 27 Tahun 2022.<br>2. Centang kotak persetujuan pemrosesan dan pembagian data terbatas pada direktori internal.<br>3. Klik tombol *"Setujui Kebijakan & Lanjutkan"*. | [ ] Berhasil<br>[ ] Gagal |
| 4 | **A4** | 1. Pada Langkah 3 (Verifikasi Data Tetap), periksa kelengkapan data permanen (No. Register, Nama Lengkap, Divisi, Angkatan, Tempat Lahir, Tanggal Lahir, Golongan Darah, Nama Orang Tua).<br>2. Pastikan komponen pemilih tanggal (*date picker*) bekerja presisi.<br>3. Klik tombol *"Selesaikan Aktivasi Akun"*. | [ ] Berhasil<br>[ ] Gagal |
| 5 | **A5** | 1. Sistem mengalihkan pengguna ke Dashboard Anggota (`/anggota/index.html`).<br>2. Amati kartu selamat datang, indikator status registrasi ulang tahun berjalan (*"Belum Registrasi Ulang"*), dan kartu pengingat kelengkapan data. | [ ] Berhasil<br>[ ] Gagal |
| 6 | **A6** | 1. Buka menu Registrasi Ulang.<br>2. Pastikan data tetap anggota terkunci (*read-only*) dan tidak dapat dimanipulasi.<br>3. Unggah pas foto terbaru (verifikasi bahwa berkas $\le 5\text{ MB}$ diterima dan berkas $> 5\text{ MB}$ ditolak otomatis dengan peringatan).<br>4. Isi alamat domisili lengkap (Jalan/Alamat, Kota/Kabupaten, Provinsi), pekerjaan, nomor WhatsApp aktif, dan email.<br>5. Isi kolom Nomor Kontak Darurat keluarga/orang tua.<br>6. Pilih status kepemilikan atribut resmi (Topi Rimba dan Baju Lapangan) serta unggah foto bukti fisiknya.<br>7. Klik *"Simpan Formulir Registrasi Ulang"*. Verifikasi bahwa status berubah menjadi *"Sudah Registrasi Ulang"*. | [ ] Berhasil<br>[ ] Gagal |
| 7 | **A7** | 1. Saat periode registrasi masih berstatus buka, buka kembali formulir registrasi ulang.<br>2. Lakukan pengubahan pada salah satu data (misalnya alamat domisili atau nomor telepon).<br>3. Klik simpan kembali dan pastikan data mutakhir tersimpan dengan aman. | [ ] Berhasil<br>[ ] Gagal |
| 8 | **A8** | 1. Buka menu Biodata Saya.<br>2. Periksa ringkasan biodata profil dan tabel arsip riwayat registrasi ulang periode sebelumnya. | [ ] Berhasil<br>[ ] Gagal |
| 9 | **A9** | 1. Buka menu Direktori Anggota.<br>2. Gunakan bilah pencarian nama atau filter berdasarkan Kota/Provinsi domisili dan Golongan Darah.<br>3. Pastikan hanya data terbatas yang diizinkan UU PDP yang tampil.<br>4. Uji tombol tautan cepat *"Hubungi via WhatsApp"* dan pastikan aplikasi perpesanan terbuka dengan nomor yang sesuai. | [ ] Berhasil<br>[ ] Gagal |
| 10 | **A10** | 1. Buka menu Pengaturan Akun.<br>2. Coba fitur pembaruan kata sandi mandiri dengan memasukkan kata sandi saat ini dan kata sandi baru. | [ ] Berhasil<br>[ ] Gagal |
| 11 | **A11** | 1. Klik tombol *"Keluar"* / Logout pada bilah navigasi profil.<br>2. Pastikan sesi otentikasi JWT terhapus tuntas dan pengguna diarahkan kembali ke halaman login. | [ ] Berhasil<br>[ ] Gagal |

*Catatan Waktu:* Penguji menyelesaikan alur login pertama hingga status registrasi ulang dalam: ............ Menit.

---

### 2.3 Skenario Peran C: Admin Kesekretariatan & Pengelola Konten (*CMS*)
*Tujuan: Menguji tata kelola keanggotaan master, dashboard statistik, penyaringan multi-parameter, CRUD data anggota, impor massal Excel (konversi tanggal serial otomatis), cetak biodata A4, input registrasi manual (override), reset kata sandi, log audit, dan CMS publikasi.*

| No | Butir Tugas | Langkah-Langkah Operasional Pengujian | Status Hasil |
| :---: | :---: | :--- | :---: |
| 1 | **B1** | 1. Akses halaman login (`/login.html`).<br>2. Masukkan kredensial akun admin kesekretariatan.<br>3. Pastikan otentikasi berhasil dan sistem mengarahkan ke Dashboard Admin (`/admin/index.html`). | [ ] Berhasil<br>[ ] Gagal |
| 2 | **B2** | 1. Amati ringkasan statistik Dashboard Admin: total anggota seumur hidup, rasio registrasi ulang tahun aktif, grafik sebaran divisi spesialisasi, sebaran angkatan, dan umpan log audit terkini. | [ ] Berhasil<br>[ ] Gagal |
| 3 | **B3** | 1. Buka menu Data Anggota.<br>2. Lakukan pencarian anggota berdasarkan nama atau No. Register.<br>3. Uji kombinasi filter: filter Angkatan, Divisi, Status Registrasi (Sudah/Belum), dan filter Domisili Kota/Provinsi. | [ ] Berhasil<br>[ ] Gagal |
| 4 | **B4** | 1. Klik tombol *"Tambah Anggota"* manual, lengkapi formulir biodata master, simpan ke database.<br>2. Klik tombol sunting data pada salah satu anggota dan simpan pembaruan.<br>3. Uji tombol aktifkan / nonaktifkan akun anggota (`is_active`). | [ ] Berhasil<br>[ ] Gagal |
| 5 | **B5** | 1. Klik tombol *"Unduh Templat Excel"* untuk mendapatkan berkas spreadsheet standar.<br>2. Klik tombol *"Impor Data Anggota (Excel/CSV)"* dan unggah berkas data anggota.<br>3. Periksa tabel pratinjau: pastikan format angka serial tanggal lahir Excel otomatis terkonversi menjadi format `YYYY-MM-DD`, serta baris duplikat terdeteksi dengan transparan.<br>4. Klik *"Simpan & Terapkan Data"*. Verifikasi bahwa anggota baru berhasil masuk ke MySQL dan akun login-nya terbentuk otomatis. | [ ] Berhasil<br>[ ] Gagal |
| 6 | **B6** | 1. Buka menu Monitoring Registrasi.<br>2. Uji fitur input registrasi manual atas nama anggota (*override*) bagi anggota senior yang menyerahkan data fisik/offline.<br>3. Simpan dan pastikan sistem menandai sumber data *"diinput oleh admin kesekretariatan"*. | [ ] Berhasil<br>[ ] Gagal |
| 7 | **B7** | 1. Buka menu Periode & Divisi.<br>2. Periksa status buka/tutup periode registrasi ulang tahunan dan daftar master divisi organisasi. | [ ] Berhasil<br>[ ] Gagal |
| 8 | **B8** | 1. Buka menu Monitoring Registrasi untuk memantau rekapitulasi kepatuhan registrasi ulang per angkatan dan divisi. | [ ] Berhasil<br>[ ] Gagal |
| 9 | **B9** | 1. Pada menu Data Anggota, pilih anggota yang membutuhkan pemulihan akses.<br>2. Klik tombol *"Reset Password"*. Pastikan kata sandi kembali ke default sementara (`mapala123`) dan akun diwajibkan ganti password saat login berikutnya. | [ ] Berhasil<br>[ ] Gagal |
| 10 | **B10** | 1. Klik tombol *"Ekspor Data Anggota"* ke dalam format berkas spreadsheet (.xlsx / .csv).<br>2. Buka berkas unduhan dan pastikan seluruh kolom data keanggotaan terisi lengkap dan rapi. | [ ] Berhasil<br>[ ] Gagal |
| 11 | **B11** | 1. Buka menu Log Audit & Akun.<br>2. Verifikasi bahwa setiap tindakan admin (tambah anggota, impor berkas, reset password, override) tercatat secara kronologis beserta waktu dan user pelaksana. | [ ] Berhasil<br>[ ] Gagal |
| 12 | **B12** | 1. Buka menu Manajemen Konten (CMS) pada sub-tab Artikel & Kegiatan.<br>2. Buat draf artikel baru, unggah foto sampul dan dokumentasi, pilih kategori divisi, lalu klik *"Terbitkan"*. Periksa penayangan artikel di portal publik. | [ ] Berhasil<br>[ ] Gagal |
| 13 | **B13** | 1. Pada CMS sub-tab Struktur Organisasi, periksa instruksi rasio wajib 16:9.<br>2. Unggah berkas gambar bagan struktur organisasi yang baru, simpan, dan verifikasi bahwa gambar pada website publik langsung diperbarui secara proporsional. | [ ] Berhasil<br>[ ] Gagal |
| 14 | **B14** | 1. Buka CMS sub-tab Konten Statis / Prestasi.<br>2. Lakukan pembaruan pada sorotan teks Beranda, naskah Tentang Kami, atau tautan media sosial sekretariat, lalu simpan. | [ ] Berhasil<br>[ ] Gagal |

*Catatan Waktu:* Penguji menyelesaikan penulisan dan penerbitan satu artikel kegiatan dalam: ............ Menit.

---

## BAGIAN III: LEMBAR EVALUASI & CHECKLIST HASIL UAT

### 3.1 Identitas Penguji dan Verifikasi Perangkat
Lembar evaluasi ini diisi dan diverifikasi langsung oleh penguji pada saat pengujian sistem:

| Parameter Evaluasi | Catatan Data Verifikasi Penguji |
| :--- | :--- |
| **Nama Lengkap Penguji** | ............................................................................................................ |
| **Nomor Register Anggota** | ............................................................................................................ |
| **Angkatan / Jabatan Organisasi** | ............................................................................................................ |
| **Tanggal Pelaksanaan UAT** | ............................................................................................................ |
| **Perangkat yang Digunakan** | [  ] Laptop / PC Komputer &nbsp;&nbsp;&nbsp;&nbsp; [  ] Ponsel Pintar (*Smartphone*) &nbsp;&nbsp;&nbsp;&nbsp; [  ] Tablet |
| **Peramban (*Web Browser*)** | [  ] Google Chrome &nbsp;&nbsp;&nbsp;&nbsp; [  ] Microsoft Edge &nbsp;&nbsp;&nbsp;&nbsp; [  ] Mozilla Firefox &nbsp;&nbsp;&nbsp;&nbsp; [  ] Safari |

---

### 3.2 Tabel Checklist Evaluasi Fungsional Sistem
*Petunjuk:* Berikan tanda centang ($\checkmark$) pada kotak di samping keterangan hasil (**[ ] Berhasil** atau **[ ] Gagal**) sesuai fakta eksekusi pada setiap butir pengujian.

#### 3.2.1 Modul Portal Publik Website

| Kode Uji | Fitur / Skenario yang Diuji | Kriteria Hasil yang Diharapkan | Status Evaluasi | Catatan Khusus Penguji |
| :---: | :--- | :--- | :---: | :--- |
| **UAT-PUB-01** | Navigasi Portal & Responsivitas | Seluruh menu publik (Beranda, Kegiatan, Struktur, Prestasi, Profil) dapat diakses dengan stabil dan responsif pada komputer maupun ponsel. | [ ] Berhasil<br>[ ] Gagal | |
| **UAT-PUB-02** | Sakelar Mode Gelap & Terang | Pergantian tema berjalan mulus; kontras teks, ikon kalender, dan ikon SVG terbaca jelas tanpa adanya degradasi warna. | [ ] Berhasil<br>[ ] Gagal | |
| **UAT-PUB-03** | Bagan Struktur Organisasi 16:9 | Bagan kepengurusan tampil utuh proporsional dengan rasio 16:9 (tidak terpotong atau terdistorsi) dan dapat diperbesar (*lightbox*). | [ ] Berhasil<br>[ ] Gagal | |
| **UAT-PUB-04** | Pencarian dan Filter Kegiatan | Pengunjung umum dapat menyaring arsip kegiatan berdasarkan kata kunci dan kategori divisi spesialisasi secara instan. | [ ] Berhasil<br>[ ] Gagal | |

---

#### 3.2.2 Modul Autentikasi dan Aktivasi Anggota

| Kode Uji | Fitur / Skenario yang Diuji | Kriteria Hasil yang Diharapkan | Status Evaluasi | Catatan Khusus Penguji |
| :---: | :--- | :--- | :---: | :--- |
| **UAT-AUTH-01** | Visibilitas Kata Sandi (*Toggle Eye*) | Karakter kata sandi dapat disembunyikan dan ditampilkan secara jelas melalui ikon mata pada seluruh formulir autentikasi. | [ ] Berhasil<br>[ ] Gagal | |
| **UAT-AUTH-02** | Pemisahan Hak Akses Login (*RBAC*) | Akun dialihkan secara tepat sesuai perannya: admin ke panel `/admin` dan anggota ke panel `/anggota`. | [ ] Berhasil<br>[ ] Gagal | |
| **UAT-AKT-01** | Alur Aktivasi Anggota 3 Langkah | Anggota baru diarahkan secara wajib melewati tahap: (1) Ganti kata sandi, (2) Persetujuan privasi, (3) Verifikasi data profil tetap. | [ ] Berhasil<br>[ ] Gagal | |
| **UAT-AKT-02** | Kepatuhan UU Privasi Data (UU PDP) | Naskah persetujuan memuat prinsip transparansi data pribadi, dan bukti persetujuan tercatat dengan waktu sah di database MySQL. | [ ] Berhasil<br>[ ] Gagal | |

---

#### 3.2.3 Modul Registrasi Ulang dan Direktori Anggota

| Kode Uji | Fitur / Skenario yang Diuji | Kriteria Hasil yang Diharapkan | Status Evaluasi | Catatan Khusus Penguji |
| :---: | :--- | :--- | :---: | :--- |
| **UAT-REG-01** | Perlindungan Data Tetap Anggota | Data master tetap terkunci (*read-only*) pada formulir registrasi ulang sehingga tidak terjadi manipulasi data historis. | [ ] Berhasil<br>[ ] Gagal | |
| **UAT-REG-02** | Validasi Ukuran Berkas Foto ($\le 5\text{ MB}$) | Sistem menerima unggahan foto di bawah 5 MB dan secara ketat menolak berkas di atas 5 MB dengan pesan peringatan yang ramah. | [ ] Berhasil<br>[ ] Gagal | |
| **UAT-REG-03** | Pencatatan Kontak Darurat Keluarga | Kolom kontak darurat orang tua/keluarga wajib diisi dan tersimpan valid untuk kepentingan keselamatan kegiatan lapangan. | [ ] Berhasil<br>[ ] Gagal | |
| **UAT-REG-04** | Inventarisasi Atribut Resmi | Checklist status kepemilikan Topi Rimba dan Baju Lapangan tersimpan lengkap beserta foto bukti fisik kepemilikan. | [ ] Berhasil<br>[ ] Gagal | |
| **UAT-DIR-01** | Direktori Anggota Terfilter | Anggota dapat mencari rekan berdasarkan filter kota/provinsi domisili dan golongan darah dengan penyaringan data aman. | [ ] Berhasil<br>[ ] Gagal | |
| **UAT-DIR-02** | Tautan Komunikasi WhatsApp Instan | Tombol WhatsApp menghubungkan pengguna secara langsung ke percakapan nomor resmi anggota tanpa galat sintaksis URL. | [ ] Berhasil<br>[ ] Gagal | |

---

#### 3.2.4 Modul Administrasi, Tata Kelola Data, dan Monitoring

| Kode Uji | Fitur / Skenario yang Diuji | Kriteria Hasil yang Diharapkan | Status Evaluasi | Catatan Khusus Penguji |
| :---: | :--- | :--- | :---: | :--- |
| **UAT-ADM-01** | Dashboard Analitik & Statistik Admin | Menampilkan metrik total anggota seumur hidup, rasio registrasi, grafik komposisi divisi, dan distribusi angkatan secara presisi. | [ ] Berhasil<br>[ ] Gagal | |
| **UAT-ADM-02** | Impor Massal Excel & Konversi Tanggal | Berkas template Excel berhasil dibaca; angka serial tanggal lahir Excel otomatis terkonversi menjadi format standar `YYYY-MM-DD`. | [ ] Berhasil<br>[ ] Gagal | |
| **UAT-ADM-03** | Deteksi Duplikasi & Validasi Impor | Tabel pratinjau impor secara transparan memisahkan baris data valid, baris salah format, dan baris duplikat sebelum komit ke database. | [ ] Berhasil<br>[ ] Gagal | |
| **UAT-ADM-04** | Cetak Formulir Biodata Resmi A4 | Menghasilkan dokumen cetak biodata anggota ber-kop surat resmi Mapala UNAND secara rapi dan proporsional dalam 1 halaman lembar A4. | [ ] Berhasil<br>[ ] Gagal | |
| **UAT-ADM-05** | Reset Kata Sandi Akun Anggota | Admin dapat mereset kata sandi akun anggota ke sandi sementara default (`mapala123`) dengan kewajiban ganti sandi pada login berikutnya. | [ ] Berhasil<br>[ ] Gagal | |
| **UAT-ADM-06** | Registrasi Manual Atas Nama Anggota | Admin dapat menginputkan data registrasi bagi anggota senior (*override*), dan sistem mencatat audit `"diinput oleh admin"`. | [ ] Berhasil<br>[ ] Gagal | |
| **UAT-ADM-07** | Ekspor Database Anggota ke Spreadsheet | Seluruh data keanggotaan master dan riwayat registrasi ulang dapat diunduh dalam format berkas Excel/CSV yang terstruktur rapi. | [ ] Berhasil<br>[ ] Gagal | |

---

#### 3.2.5 Modul Manajemen Konten (CMS) dan Audit Trail

| Kode Uji | Fitur / Skenario yang Diuji | Kriteria Hasil yang Diharapkan | Status Evaluasi | Catatan Khusus Penguji |
| :---: | :--- | :--- | :---: | :--- |
| **UAT-CMS-01** | Pengelolaan Struktur Organisasi 16:9 | Formulir CMS memuat petunjuk wajib rasio 16:9, dan gambar bagan yang disimpan langsung memutakhirkan tampilan pada portal publik. | [ ] Berhasil<br>[ ] Gagal | |
| **UAT-CMS-02** | Publikasi Artikel Kegiatan & Dokumentasi | Admin dapat membuat draf, mengunggah multi-foto galeri kegiatan lapangan, dan menerbitkan artikel berita organisasi. | [ ] Berhasil<br>[ ] Gagal | |
| **UAT-LOG-01** | Rekam Jejak Audit (*Audit Trail*) | Setiap aktivitas perubahan data anggota, impor, reset password, dan registrasi manual tercatat secara kronologis (waktu, aksi, objek, user). | [ ] Berhasil<br>[ ] Gagal | |

---

### 3.3 Rekapitulasi Catatan Kendala dan Masukan Perbaikan

| No | Kode / Modul Terkait | Deskripsi Kendala / Temuan Operasional | Tingkat Prioritas (*Tinggi / Sedang / Rendah*) | Rekomendasi Solusi / Tindak Lanjut |
| :---: | :--- | :--- | :---: | :--- |
| 1 | ........................................ | ............................................................................................................ | ................................... | ............................................................................................................ |
| 2 | ........................................ | ............................................................................................................ | ................................... | ............................................................................................................ |
| 3 | ........................................ | ............................................................................................................ | ................................... | ............................................................................................................ |
| 4 | ........................................ | ............................................................................................................ | ................................... | ............................................................................................................ |

---

## BAGIAN IV: KUESIONER EVALUASI PENERIMAAN DAN KEGUNAAN SISTEM

Kuesioner evaluasi ini disusun secara terpadu dan diselaraskan secara penuh dengan instrumen kuesioner daring resmi. Penguji dapat mengakses formulir daring melalui tautan resmi:  
**https://docs.google.com/forms/d/e/1FAIpQLScnFHXng0h54HDoeLfxC6pEnkPhNIQdXTkMVxXOVBEbwx0kiQ/viewform**

---

### 4.1 Identitas Responden dan Perangkat Uji

| Parameter Responden | Pilihan / Format Isian Data |
| :--- | :--- |
| **Nama Lengkap Responden** | ............................................................................................................ |
| **Angkatan di Mapala UNAND** | ............................................................................................................ |
| **Jabatan / Peran di Organisasi** | ............................................................................................................ |
| **Perangkat yang Digunakan** | [  ] Ponsel Pintar (*Smartphone*) &nbsp;&nbsp;&nbsp;&nbsp; [  ] Laptop / PC Komputer &nbsp;&nbsp;&nbsp;&nbsp; [  ] Tablet |
| **Peramban (*Web Browser*)** | [  ] Google Chrome &nbsp;&nbsp;&nbsp;&nbsp; [  ] Microsoft Edge &nbsp;&nbsp;&nbsp;&nbsp; [  ] Mozilla Firefox &nbsp;&nbsp;&nbsp;&nbsp; [  ] Safari &nbsp;&nbsp;&nbsp;&nbsp; [  ] Lainnya |
| **Tingkat Kenyamanan Menggunakan Aplikasi Web** | 1 [  ] Sangat Tidak Nyaman &nbsp;&nbsp; 2 [  ] Kurang Nyaman &nbsp;&nbsp; 3 [  ] Cukup &nbsp;&nbsp; 4 [  ] Nyaman &nbsp;&nbsp; 5 [  ] Sangat Nyaman |

---

### 4.2 Penilaian Pengujian Sisi Anggota

#### A. Keterlaksanaan Tugas Sisi Anggota (A1 s.d. A11)

| Kode | Butir Tugas yang Dijalankan | Berhasil Tanpa Bantuan | Berhasil Dengan Bantuan | Tidak Berhasil |
| :---: | :--- | :---: | :---: | :---: |
| **A1** | Login dengan No. Register dan kata sandi awal | [ ] | [ ] | [ ] |
| **A2** | Mengganti kata sandi pada login pertama (Aktivasi) | [ ] | [ ] | [ ] |
| **A3** | Menyetujui Kebijakan Penggunaan Data Pribadi (UU PDP) | [ ] | [ ] | [ ] |
| **A4** | Melengkapi verifikasi profil data tetap anggota | [ ] | [ ] | [ ] |
| **A5** | Memeriksa Dashboard Anggota (notifikasi status registrasi) | [ ] | [ ] | [ ] |
| **A6** | Mengisi dan menyimpan Registrasi Ulang (foto, domisili, kontak, atribut) | [ ] | [ ] | [ ] |
| **A7** | Mengubah isian Registrasi Ulang yang telah tersimpan | [ ] | [ ] | [ ] |
| **A8** | Melihat arsip riwayat registrasi ulang periode sebelumnya | [ ] | [ ] | [ ] |
| **A9** | Mencari rekan anggota di Direktori (nama, domisili, golongan darah) | [ ] | [ ] | [ ] |
| **A10** | Mengganti kata sandi mandiri melalui Pengaturan Akun | [ ] | [ ] | [ ] |
| **A11** | Melakukan Logout dari portal anggota | [ ] | [ ] | [ ] |

#### B. Tingkat Kemudahan Tugas Sisi Anggota (Skala 1 = Sangat Sulit s.d. 5 = Sangat Mudah)

| Kode | Butir Tugas yang Dinilai | 1 (Sangat Sulit) | 2 (Sulit) | 3 (Cukup) | 4 (Mudah) | 5 (Sangat Mudah) |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: |
| **A1** | Login dengan No. Register dan kata sandi awal | [ ] | [ ] | [ ] | [ ] | [ ] |
| **A2** | Mengganti kata sandi pada login pertama (Aktivasi) | [ ] | [ ] | [ ] | [ ] | [ ] |
| **A3** | Menyetujui Kebijakan Penggunaan Data Pribadi (UU PDP) | [ ] | [ ] | [ ] | [ ] | [ ] |
| **A4** | Melengkapi verifikasi profil data tetap anggota | [ ] | [ ] | [ ] | [ ] | [ ] |
| **A5** | Memeriksa Dashboard Anggota (notifikasi status registrasi) | [ ] | [ ] | [ ] | [ ] | [ ] |
| **A6** | Mengisi dan menyimpan Registrasi Ulang (foto, domisili, kontak, atribut) | [ ] | [ ] | [ ] | [ ] | [ ] |
| **A7** | Mengubah isian Registrasi Ulang yang telah tersimpan | [ ] | [ ] | [ ] | [ ] | [ ] |
| **A8** | Melihat arsip riwayat registrasi ulang periode sebelumnya | [ ] | [ ] | [ ] | [ ] | [ ] |
| **A9** | Mencari rekan anggota di Direktori (nama, domisili, golongan darah) | [ ] | [ ] | [ ] | [ ] | [ ] |
| **A10** | Mengganti kata sandi mandiri melalui Pengaturan Akun | [ ] | [ ] | [ ] | [ ] | [ ] |
| **A11** | Melakukan Logout dari portal anggota | [ ] | [ ] | [ ] | [ ] | [ ] |

*Waktu Penyelesaian Alur Registrasi Anggota:*  
[  ] $\le$ 10 Menit &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; [  ] 11 - 15 Menit &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; [  ] $>$ 15 Menit

*Bagian yang membingungkan atau mengalami kendala pada alur anggota:*  
....................................................................................................................................................................................

---

### 4.3 Penilaian Pengujian Sisi Admin

#### A. Keterlaksanaan Tugas Sisi Admin (B1 s.d. B14)

| Kode | Butir Tugas yang Dijalankan | Berhasil Tanpa Bantuan | Berhasil Dengan Bantuan | Tidak Berhasil |
| :---: | :--- | :---: | :---: | :---: |
| **B1** | Login sebagai admin kesekretariatan | [ ] | [ ] | [ ] |
| **B2** | Melihat ringkasan Dashboard (total anggota, rasio, statistik) | [ ] | [ ] | [ ] |
| **B3** | Mencari dan memfilter anggota (nama, No. Reg, angkatan, divisi, domisili) | [ ] | [ ] | [ ] |
| **B4** | Menambah, mengubah, dan menonaktifkan data anggota | [ ] | [ ] | [ ] |
| **B5** | Mengimpor data anggota dari Excel/CSV (konversi tanggal serial) | [ ] | [ ] | [ ] |
| **B6** | Mengisi registrasi ulang atas nama anggota (override) | [ ] | [ ] | [ ] |
| **B7** | Mengatur periode registrasi ulang (buka dan tutup) | [ ] | [ ] | [ ] |
| **B8** | Memantau status kepatuhan registrasi pada menu Monitoring | [ ] | [ ] | [ ] |
| **B9** | Mereset kata sandi akun anggota ke sandi sementara | [ ] | [ ] | [ ] |
| **B10** | Mengekspor data keanggotaan ke berkas Excel/CSV | [ ] | [ ] | [ ] |
| **B11** | Melihat rekam catatan log aktivitas admin (audit trail) | [ ] | [ ] | [ ] |
| **B12** | Membuat draf dan menerbitkan artikel kegiatan dengan foto | [ ] | [ ] | [ ] |
| **B13** | Mengunggah gambar bagan Struktur Organisasi (rasio wajib 16:9) | [ ] | [ ] | [ ] |
| **B14** | Mengubah konten Tentang Kami, sorotan, dan kontak di CMS | [ ] | [ ] | [ ] |

#### B. Tingkat Kemudahan Tugas Sisi Admin (Skala 1 = Sangat Sulit s.d. 5 = Sangat Mudah)

| Kode | Butir Tugas yang Dinilai | 1 (Sangat Sulit) | 2 (Sulit) | 3 (Cukup) | 4 (Mudah) | 5 (Sangat Mudah) |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: |
| **B1** | Login sebagai admin kesekretariatan | [ ] | [ ] | [ ] | [ ] | [ ] |
| **B2** | Melihat ringkasan Dashboard (total anggota, rasio, statistik) | [ ] | [ ] | [ ] | [ ] | [ ] |
| **B3** | Mencari dan memfilter anggota (nama, No. Reg, angkatan, divisi, domisili) | [ ] | [ ] | [ ] | [ ] | [ ] |
| **B4** | Menambah, mengubah, dan menonaktifkan data anggota | [ ] | [ ] | [ ] | [ ] | [ ] |
| **B5** | Mengimpor data anggota dari Excel/CSV (konversi tanggal serial) | [ ] | [ ] | [ ] | [ ] | [ ] |
| **B6** | Mengisi registrasi ulang atas nama anggota (override) | [ ] | [ ] | [ ] | [ ] | [ ] |
| **B7** | Mengatur periode registrasi ulang (buka dan tutup) | [ ] | [ ] | [ ] | [ ] | [ ] |
| **B8** | Memantau status kepatuhan registrasi pada menu Monitoring | [ ] | [ ] | [ ] | [ ] | [ ] |
| **B9** | Mereset kata sandi akun anggota ke sandi sementara | [ ] | [ ] | [ ] | [ ] | [ ] |
| **B10** | Mengekspor data keanggotaan ke berkas Excel/CSV | [ ] | [ ] | [ ] | [ ] | [ ] |
| **B11** | Melihat rekam catatan log aktivitas admin (audit trail) | [ ] | [ ] | [ ] | [ ] | [ ] |
| **B12** | Membuat draf dan menerbitkan artikel kegiatan dengan foto | [ ] | [ ] | [ ] | [ ] | [ ] |
| **B13** | Mengunggah gambar bagan Struktur Organisasi (rasio wajib 16:9) | [ ] | [ ] | [ ] | [ ] | [ ] |
| **B14** | Mengubah konten Tentang Kami, sorotan, dan kontak di CMS | [ ] | [ ] | [ ] | [ ] | [ ] |

*Waktu Penyelesaian Pembuatan dan Penerbitan Artikel:*  
[  ] $\le$ 10 Menit &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; [  ] 11 - 15 Menit &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; [  ] $>$ 15 Menit

*Bagian yang membingungkan atau mengalami kendala pada alur admin:*  
....................................................................................................................................................................................

---

### 4.4 Penilaian Pengujian Portal Publik

| Kode | Butir Tugas yang Dijalankan | Berhasil | Tidak Berhasil |
| :---: | :--- | :---: | :---: |
| **C1** | Membuka Beranda, Tentang Kami (tombol selengkapnya), dan Struktur Organisasi | [ ] | [ ] |
| **C2** | Membuka kartu Kegiatan & Artikel dan melihat detail naskah/foto | [ ] | [ ] |
| **C3** | Membuka halaman Prestasi dan informasi Kontak sekretariat | [ ] | [ ] |
| **C4** | Memeriksa navigasi menu (sticky navbar) saat halaman digulir | [ ] | [ ] |

*Tingkat Kejelasan Informasi Organisasi Mapala UNAND pada Website Publik:*  
1 [  ] Sangat Tidak Jelas &nbsp;&nbsp;&nbsp;&nbsp; 2 [  ] Kurang Jelas &nbsp;&nbsp;&nbsp;&nbsp; 3 [  ] Cukup Jelas &nbsp;&nbsp;&nbsp;&nbsp; 4 [  ] Jelas &nbsp;&nbsp;&nbsp;&nbsp; 5 [  ] Sangat Jelas

---

### 4.5 Penilaian Umum dan Evaluasi Kelayakan Sistem

Penguji memberikan penilaian terhadap 8 (delapan) indikator kelayakan sistem informasi:  
*Skala Penilaian:* **1** = Sangat Tidak Setuju (STS) | **2** = Tidak Setuju (TS) | **3** = Ragu-Ragu (R) | **4** = Setuju (S) | **5** = Sangat Setuju (SS)

| No | Pernyataan Indikator Evaluasi Sistem | STS (1) | TS (2) | R (3) | S (4) | SS (5) |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: |
| **D1** | Tampilan antarmuka website mudah dipahami dan tertata secara intuitif. | [ ] | [ ] | [ ] | [ ] | [ ] |
| **D2** | Tulisan, label formulir, dan pilihan bahasa pada sistem jelas serta mudah dibaca. | [ ] | [ ] | [ ] | [ ] | [ ] |
| **D3** | Alur penggunaan sistem runut, logis, dan tidak membingungkan pengguna. | [ ] | [ ] | [ ] | [ ] | [ ] |
| **D4** | Website berjalan dengan cepat, ringan, dan memiliki responsivitas yang baik. | [ ] | [ ] | [ ] | [ ] | [ ] |
| **D5** | Tampilan antarmuka nyaman dilihat pada tema terang maupun tema gelap. | [ ] | [ ] | [ ] | [ ] | [ ] |
| **D6** | Saya merasa informasi dan data pribadi terlindungi secara aman saat menggunakan sistem ini. | [ ] | [ ] | [ ] | [ ] | [ ] |
| **D7** | Isi informasi dan fitur operasional sistem sesuai dengan kebutuhan nyata organisasi. | [ ] | [ ] | [ ] | [ ] | [ ] |
| **D8** | Saya bersedia menggunakan dan merekomendasikan sistem ini untuk operasional Mapala UNAND. | [ ] | [ ] | [ ] | [ ] | [ ] |

*Kendala atau Galat (Error) yang Ditemukan saat Pengujian:*  
....................................................................................................................................................................................  
....................................................................................................................................................................................

*Fitur atau Informasi yang Menurut Anda Masih Kurang / Perlu Ditambahkan:*  
....................................................................................................................................................................................  
....................................................................................................................................................................................

*Saran Tambahan untuk Penyempurnaan Sistem Selanjutnya:*  
....................................................................................................................................................................................  
....................................................................................................................................................................................

**Keputusan Akhir Penguji terhadap Kelayakan Sistem:**  
[  ] **LAYAK DIGUNAKAN TANPA PERBAIKAN**  
[  ] **LAYAK DIGUNAKAN DENGAN PERBAIKAN KECIL**  
[  ] **BELUM LAYAK (MEMERLUKAN PERBAIKAN BESAR)**

---

### 4.6 Metode Pengolahan dan Interpretasi Hasil Evaluasi

Data hasil pengujian dan kuesioner diolah dengan metodologi evaluasi sistem informasi kuantitatif terstandar:

| Jenis Data Evaluasi | Rumus dan Metode Pengolahan Data | Tolok Ukur Keberhasilan (*Threshold*) |
| :--- | :--- | :--- |
| **Tingkat Keterlaksanaan Tugas (A1–A11, B1–B14, C1–C4)** | $$\text{Tingkat Keberhasilan} = \frac{\sum \text{Tugas Berhasil}}{\text{Total Tugas Diuji}} \times 100\%$$ | Wajib mencapai $100\%$ berhasil tanpa adanya kendala kritis yang menghambat alur operasional. |
| **Tingkat Kemudahan Tugas (Skala 1 s.d. 5)** | $$\bar{X}_{\text{kemudahan}} = \frac{\sum \text{Skor Kemudahan}}{\text{Jumlah Butir Tugas}}$$ | Rata-rata skor $\bar{X} \ge 3{,}50$ (kategori Mudah). Tugas dengan skor $< 3{,}00$ diprioritaskan untuk penyempurnaan. |
| **Efisiensi Waktu Penyelesaian** | Persentase pencapaian durasi registrasi ulang anggota dan publikasi artikel admin. | Minimal $80\%$ tugas diselesaikan dalam durasi $\le 10$ menit sesuai target spesifikasi kebutuhan. |
| **Penilaian Umum Indikator D1–D8** | $$\bar{X}_{\text{umum}} = \frac{\sum_{i=1}^{8} \text{Skor } D_i}{8}$$ | Rata-rata keseluruhan $\bar{X} \ge 4{,}00$ (kategori Baik/Sangat Baik). |
| **Rekomendasi Kelayakan Sistem** | Penetapan proporsi keputusan kelayakan operasional. | Minimal menyatakan *"Layak Digunakan dengan Perbaikan Kecil"* atau *"Layak Digunakan Tanpa Perbaikan"*. |

**Tabel Konversi dan Interpretasi Nilai Rata-Rata (Skala 1 s.d. 5):**

| Rentang Nilai Rata-Rata | Kategori Kualitatif | Interpretasi Keputusan Penerimaan |
| :---: | :---: | :--- |
| **4,21 - 5,00** | Sangat Baik | Sistem sangat memuaskan, siap dioperasikan penuh tanpa catatan perbaikan signifikan. |
| **3,41 - 4,20** | Baik | Sistem memenuhi spesifikasi dengan baik; catatan perbaikan minor dapat dijadwalkan bertahap. |
| **2,61 - 3,40** | Cukup | Sistem berfungsi sebagian; perbaikan pada modul berkinerja rendah diperlukan sebelum rilis. |
| **1,81 - 2,60** | Kurang | Sistem mengalami banyak kendala antarmuka/fungsional; memerlukan perbaikan substansial. |
| **1,00 - 1,80** | Sangat Kurang | Sistem belum memenuhi standar kelayakan; ditolak untuk operasional organisasi. |

---

## BAGIAN V: BERITA ACARA PENERIMAAN SISTEM (UAT SIGN-OFF FORM)

### BERITA ACARA PENGUJIAN PENERIMAAN PENGGUNA
### USER ACCEPTANCE TESTING (UAT) SIGN-OFF FORM

Pada hari ini, ......................................... tanggal ............ bulan ......................................... tahun 2026, bertempat di Sekretariat Mahasiswa Pecinta Alam Universitas Andalas (Mapala UNAND), telah dilaksanakan pengujian penerimaan pengguna (*User Acceptance Testing*) terhadap sistem perangkat lunak dengan rincian identitas:

* **Nama Perangkat Lunak:** Sistem Informasi Manajemen Keanggotaan dan Website Resmi Mapala UNAND
* **Kode Rilis Sistem:** Versi 2.0 (Stable Academic Release)
* **Pelaksana / Pengembang:** Tim Mahasiswa Manajemen Proyek Sistem Informasi (Kelompok 3)
* **Pemberi Kebutuhan / Klien:** Pengurus Mahasiswa Pecinta Alam Universitas Andalas (Mapala UNAND)

Berdasarkan hasil uji coba seluruh skenario tugas pengguna (Peran Publik C1–C4, Peran Anggota A1–A11, dan Peran Admin B1–B14) serta rekapitulasi penilaian kuesioner evaluasi penerimaan sistem, para pihak secara resmi menetapkan bahwa sistem perangkat lunak ini:

```
[   ] DITERIMA PENUH (Accepted without conditions)
      Seluruh fitur fungsional berjalan stabil, bebas dari kendala kritis, dan memenuhi kebutuhan operasional organisasi.

[   ] DITERIMA DENGAN CATATAN (Accepted with minor notes)
      Sistem dapat digunakan secara operasional dengan catatan penyempurnaan kecil terlampir.

[   ] DITOLAK (Rejected)
      Sistem belum memenuhi spesifikasi dasar yang disepakati dan memerlukan perbaikan menyeluruh.
```

**Catatan Akhir Pengesahan:**  
....................................................................................................................................................................................  
....................................................................................................................................................................................  
....................................................................................................................................................................................  

Demikian Berita Acara ini dibuat dalam 2 (dua) rangkap asli bermaterai cukup dan memiliki kekuatan hukum serta administratif yang sama untuk dipergunakan sebagaimana mestinya sebagai syarat sah kelengkapan Laporan Tugas Besar MPSI dan serah terima sistem.

<br><br>

Padang, .................................................... 2026

<br>

| Pihak Penguji / Klien<br>**Pengurus Mapala Universitas Andalas** | Pihak Pengembang<br>**Tim Proyek MPSI Kelompok 3** |
| :---: | :---: |
| <br><br><br><br>_________________________________________<br>**Nama:** ........................................................<br>Jabatan: Ketua Umum / Sekretaris Umum<br>No. Register: ........................................... | <br><br><br><br>_________________________________________<br>**Nama:** ........................................................<br>Jabatan: Manajer Proyek / Ketua Tim Pengembang<br>NIM: .................................................... |

<br>

Mengetahui,<br>
**Dosen Pengampu Mata Kuliah Manajemen Proyek Sistem Informasi**

<br><br><br>
_________________________________________<br>
**Nama Lengkap:** ........................................................<br>
**NIP:** ....................................................
