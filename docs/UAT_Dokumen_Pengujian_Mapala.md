# DOKUMEN PENGUJIAN PENERIMAAN PENGGUNA
# USER ACCEPTANCE TESTING (UAT)

## SISTEM INFORMASI MANAJEMEN KEANGGOTAAN DAN WEBSITE RESMI MAPALA UNAND

---

### INFORMASI DOKUMEN

| Parameter | Keterangan |
| :--- | :--- |
| **Nama Sistem** | Sistem Informasi Manajemen Keanggotaan dan Website Resmi Mapala UNAND |
| **Kode Proyek** | MAPALA-UNAND-2026 |
| **Mata Kuliah** | Manajemen Proyek Sistem Informasi (MPSI) |
| **Kelompok Kerja** | Kelompok 3 |
| **Anggota Pengembang** | 1. Arifah Huwaina Azre (NIM: 2411521003)<br>2. Farrel Ghufran Rahman (NIM: 2411521009)<br>3. Talitha Nafisa Khairul (NIM: 2411522007)<br>4. Rafa Gian Atthari (NIM: 2411522014)<br>5. Muhammad Racha Ardiwinata (NIM: 2411522020)<br>6. Muhammad Arrasyid (NIM: 2411522027)<br>7. Syifa Khalishah Nugroho (NIM: 2411522028) |
| **Instansi / Klien** | Mahasiswa Pecinta Alam Universitas Andalas (Mapala UNAND) |
| **Model Evaluasi** | Penguji Tunggal Komprehensif (*Single Evaluator - End-to-End Evaluation*) |
| **Tautan Kuesioner Daring** | https://docs.google.com/forms/d/e/1FAIpQLScnFHXng0h54HDoeLfxC6pEnkPhNIQdXTkMVxXOVBEbwx0kiQ/viewform |
| **Versi Dokumen** | 2.2 (Format Baku Akademik MPSI) |
| **Tanggal Terbit** | 20 November 2026 |

---

## DAFTAR ISI

1. [BAB I: Pendahuluan dan Metodologi](#bab-i-pendahuluan-dan-metodologi)
   - 1.1 Latar Belakang dan Tujuan
   - 1.2 Metode Evaluasi Penguji Tunggal (Single Evaluator)
   - 1.3 Lingkungan Teknis Pengujian
   - 1.4 Kriteria Keberhasilan Penerimaan
2. [BAB II: Lembar Profil dan Identitas Penguji](#bab-ii-lembar-profil-dan-identitas-penguji)
3. [BAB III: Panduan Skenario Pelaksanaan UAT Komprehensif](#bab-iii-panduan-skenario-pelaksanaan-uat-komprehensif)
   - 3.1 Bagian A: Pengujian Sisi Anggota (Tugas A1 s.d. A11)
   - 3.2 Bagian B: Pengujian Sisi Admin Kesekretariatan (Tugas B1 s.d. B14)
   - 3.3 Bagian C: Pengujian Portal Publik Website (Tugas C1 s.d. C4)
4. [BAB IV: Lembar Checklist Evaluasi dan Hasil Tugas](#bab-iv-lembar-checklist-evaluasi-dan-hasil-tugas)
   - 4.1 Checklist Tugas Sisi Anggota
   - 4.2 Checklist Tugas Sisi Admin
   - 4.3 Checklist Tugas Portal Publik
5. [BAB V: Instrumen Kuesioner Evaluasi Pengguna](#bab-v-instrumen-kuesioner-evaluasi-pengguna)
   - 5.1 Informasi dan Tautan Kuesioner Daring
   - 5.2 Evaluasi Tingkat Kemudahan Tugas (Skala 1 - 5)
   - 5.3 Evaluasi Penilaian Umum dan Kesimpulan (Indikator D1 - D8)
   - 5.4 Catatan Kendala, Masukan, dan Keputusan Kelayakan
6. [BAB VI: Berita Acara Penerimaan Sistem (Sign-Off Form)](#bab-vi-berita-acara-penerimaan-sistem-sign-off-form)

---

## BAB I: Pendahuluan dan Metodologi

### 1.1 Latar Belakang dan Tujuan
Dokumen Pengujian Penerimaan Pengguna (*User Acceptance Testing* - UAT) ini disusun sebagai instrumen formal untuk mengukur, memverifikasi, dan mendokumentasikan penerimaan sistem informasi yang dibangun oleh Tim Pengembang Kelompok 3 terhadap kebutuhan operasional nyata organisasi Mahasiswa Pecinta Alam Universitas Andalas (Mapala UNAND).

Tujuan utama pelaksanaan UAT ini adalah:
1. Memverifikasi seluruh fungsionalitas sistem informasi dari hulu ke hilir (alur anggota, administrasi kesekretariatan admin, hingga portal publik) sesuai kebutuhan nyata organisasi.
2. Memastikan antarmuka sistem mudah dipahami, responsif, memiliki kontras yang baik pada mode terang dan gelap, serta memenuhi batasan teknis (misalnya batas unggah foto maksimal 5 MB dan bagan struktur 16:9).
3. Memperoleh umpan balik terstruktur melalui kuesioner evaluasi dan pengesahan Berita Acara Penerimaan Sistem (*UAT Sign-Off*) sebagai kelengkapan Tugas Besar MPSI.

### 1.2 Metode Evaluasi Penguji Tunggal (*Single Evaluator*)
Pengujian ini menerapkan metode **Penguji Tunggal Komprehensif (*Single Evaluator - End-to-End*)**. Dalam model ini, 1 (satu) orang penguji yang bertindak mewakili organisasi Mapala UNAND menguji seluruh modul sistem secara komprehensif, mencakup 3 (tiga) peran operasional:
1. **Sisi Anggota:** Menjalankan alur masuk pertama kali (aktivasi akun 3-tahap), perlindungan privasi data pribadi UU No. 27 Tahun 2022, pembaruan profil tetap, pengisian formulir registrasi ulang berkala (pas foto, domisili, kontak darurat, dan foto atribut), serta pencarian sesama anggota di Direktori Anggota.
2. **Sisi Admin:** Menjalankan tata kelola data anggota seumur hidup, monitoring registrasi ulang, penginputan registrasi atas nama anggota (*override*), impor massal dari berkas Excel dengan konversi tanggal serial otomatis, cetak formulir resmi A4, reset kata sandi, serta pembaruan konten website (CMS).
3. **Portal Publik:** Menjelajahi halaman Beranda, filter cepat kegiatan, artikel dokumentasi ekspedisi, prestasi, naskah sejarah/visi-misi, serta bagan struktur organisasi berasio 16:9.

### 1.3 Lingkungan Teknis Pengujian
* **Sistem Aplikasi:** Sistem Informasi Manajemen Keanggotaan Mapala UNAND Versi 2.0.
* **Basis Data:** MySQL Server Versi 8.0+.
* **Peramban (*Web Browser*):** Google Chrome / Mozilla Firefox / Microsoft Edge versi stabil terbaru.
* **Perangkat Keras:** Laptop / Komputer Desktop (resolusi minimal 1366 x 768) serta ponsel pintar (*smartphone*).

### 1.4 Kriteria Keberhasilan Penerimaan
Sistem dinyatakan memenuhi kriteria keberhasilan penerimaan apabila:
1. Seluruh tugas utama pada Sisi Anggota, Sisi Admin, dan Portal Publik dapat diselesaikan dengan status **Berhasil**.
2. Rata-rata penilaian kemudahan dan penilaian umum pada kuesioner berada pada kategori positif (skala $\ge$ 3.5 dari rentang 1 - 5).
3. Penguji menyatakan sistem **Layak Digunakan** dan menandatangani Berita Acara Penerimaan Sistem pada lembar pengesahan.

---

## BAB II: Lembar Profil dan Identitas Penguji

Pengujian UAT ini dilaksanakan oleh penguji resmi dengan data identitas sebagai berikut:

| Parameter Identitas | Data Penguji |
| :--- | :--- |
| **Nama Lengkap Penguji** | ............................................................................................................ |
| **Angkatan di Mapala UNAND** | ............................................................................................................ |
| **Nomor Register Anggota** | ............................................................................................................ |
| **Jabatan / Peran di Organisasi** | [  ] Pengurus Harian (Ketua Umum / Sekretaris Umum)<br>[  ] Pengurus Bidang Kesekretariatan / Organisasi<br>[  ] Anggota Penuh Mapala UNAND<br>[  ] Lainnya: ................................................................................ |
| **Perangkat yang Digunakan** | [  ] Laptop / PC Windows<br>[  ] Laptop MacOS / Linux<br>[  ] Smartphone (Android / iOS) |
| **Peramban (Browser)** | [  ] Google Chrome<br>[  ] Mozilla Firefox<br>[  ] Microsoft Edge<br>[  ] Safari |
| **Tingkat Kenyamanan Menggunakan Web** | [  ] 1 (Sangat Tidak Nyaman)<br>[  ] 2 (Kurang Nyaman)<br>[  ] 3 (Cukup Nyaman)<br>[  ] 4 (Nyaman)<br>[  ] 5 (Sangat Nyaman) |
| **Tanggal dan Lokasi Pengujian** | ............................................................................................................ |

---

## BAB III: Panduan Skenario Pelaksanaan UAT Komprehensif

Penguji menjalankan serangkaian tugas berikut sesuai alur operasional sistem:

### 3.1 Bagian A: Pengujian Sisi Anggota
* **Tugas A1:** Login ke portal anggota menggunakan Nomor Register dan kata sandi awal default (`mapala123`). Coba tombol ikon mata untuk melihat/menyembunyikan kata sandi.
* **Tugas A2:** Menjalankan penggantian kata sandi pada login pertama di halaman aktivasi (`/anggota/aktivasi.html`).
* **Tugas A3:** Membaca naskah Kebijakan Privasi & Persetujuan Penggunaan Data Pribadi (UU No. 27 Tahun 2022) dan memberikan persetujuan.
* **Tugas A4:** Memeriksa dan melengkapi biodata profil tetap (Nama, Divisi, Angkatan, Tanggal Lahir, Golongan Darah, Nama Orang Tua).
* **Tugas A5:** Masuk ke Dashboard Anggota, melihat kartu sambutan, status registrasi ulang periode berjalan, dan pengingat kelengkapan data.
* **Tugas A6:** Mengisi formulir Registrasi Ulang tahunan:
  - Mengunggah pas foto terbaru (uji batas maksimal 5 MB).
  - Mengisi alamat domisili lengkap (Alamat, Kota/Kabupaten, Provinsi), pekerjaan, nomor HP/WhatsApp, dan email.
  - Mengisi nomor Kontak Darurat keluarga/orang tua.
  - Memilih status kepemilikan atribut resmi (Topi Rimba dan Baju Lapangan) serta mengunggah foto bukti fisiknya.
  - Menyimpan formulir dan memastikan status berubah menjadi *"Sudah Registrasi Ulang"*.
* **Tugas A7:** Mengubah salah satu isian Registrasi Ulang yang telah disimpan selama periode registrasi masih berstatus buka.
* **Tugas A8:** Membuka menu Biodata Saya untuk melihat riwayat registrasi ulang periode sebelumnya.
* **Tugas A9:** Membuka menu Direktori Anggota, mencari rekan anggota berdasarkan nama, filter domisili kota/provinsi, atau filter golongan darah, serta menguji tombol kontak WhatsApp.
* **Tugas A10:** Mengganti kata sandi mandiri melalui menu Pengaturan Akun dengan memasukkan kata sandi lama.
* **Tugas A11:** Melakukan Logout dari portal anggota.

---

### 3.2 Bagian B: Pengujian Sisi Admin Kesekretariatan
* **Tugas B1:** Login ke portal admin (`/admin`) menggunakan kredensial admin kesekretariatan.
* **Tugas B2:** Memeriksa ringkasan statistik Dashboard Admin (total anggota seumur hidup, rasio registrasi ulang, grafik sebaran divisi, sebaran angkatan, dan rekam log aktivitas).
* **Tugas B3:** Membuka menu Data Anggota, melakukan pencarian dan penyaringan (*filter*) data berdasarkan nama, No. Register, angkatan, divisi, status registrasi, dan domisili.
* **Tugas B4:** Melakukan penambahan anggota manual, pengubahan data biodata, serta pengujian tombol aktif/nonaktifkan status anggota.
* **Tugas B5:** Mengunduh templat Excel resmi, mengunggah berkas Excel data anggota pada modal impor, memeriksa tabel pratinjau validasi (konversi otomatis tanggal serial Excel menjadi `YYYY-MM-DD` dan pemilahan baris duplikat), lalu menyimpan data ke MySQL.
* **Tugas B6:** Membuka menu Monitoring Registrasi dan mencoba fitur input registrasi ulang atas nama anggota (*override*) bagi anggota yang menitipkan data di luar sistem.
* **Tugas B7:** Membuka menu Periode & Divisi, memeriksa status buka/tutup periode registrasi ulang tahunan dan daftar divisi spesialisasi.
* **Tugas B8:** Memantau daftar kepatuhan registrasi ulang anggota pada menu Monitoring.
* **Tugas B9:** Melakukan reset kata sandi pada anggota yang lupa kata sandi ke kata sandi sementara default (`mapala123`).
* **Tugas B10:** Menguji tombol ekspor data seluruh anggota ke dalam format berkas Excel/CSV.
* **Tugas B11:** Membuka menu Log Audit & Akun untuk memeriksa rekam jejak aktivitas admin (*audit trail*).
* **Tugas B12:** Membuka CMS Artikel & Kegiatan, membuat draf artikel baru, mengunggah foto sampul, dan menerbitkan artikel tersebut.
* **Tugas B13:** Membuka CMS Struktur Organisasi, memeriksa petunjuk wajib rasio 16:9, mengunggah gambar bagan struktur baru, dan memeriksa keterbacaannya.
* **Tugas B14:** Mengubah konten statis Tentang Kami, sorotan Beranda, atau tautan media sosial sekretariat pada CMS Konten.

---

### 3.3 Bagian C: Pengujian Portal Publik Website
* **Tugas C1:** Mengakses halaman Beranda, Tentang Kami (termasuk tombol baca selengkapnya), dan Struktur Organisasi (memastikan bagan tampil utuh proporsional 16:9).
* **Tugas C2:** Membuka kartu kegiatan pada halaman Kegiatan & Artikel dan melihat tampilan detail artikel serta galeri dokumentasinya.
* **Tugas C3:** Membuka halaman Prestasi untuk melihat arsip pencapaian, serta memeriksa informasi kontak sekretariat di footer.
* **Tugas C4:** Menguji navigasi menu utama (navbar) saat halaman digulir (*scroll*), serta menguji sakelar mode terang dan gelap.

---

## BAB IV: Lembar Checklist Evaluasi dan Hasil Tugas

Lembar ini merekam hasil keterlaksanaan tugas pengujian oleh penguji:
* **Petunjuk Pengisian:** Berikan tanda centang pada kotak **[ ] Berhasil** atau **[ ] Gagal** sesuai hasil pengujian pada setiap butir tugas yang dijalankan.

### 4.1 Checklist Tugas Sisi Anggota

| Kode | Deskripsi Tugas yang Dijalankan | Hasil Pelaksanaan | Catatan / Kendala yang Ditemukan |
| :---: | :--- | :---: | :--- |
| **A1** | Login dengan No. Register dan kata sandi awal | [ ] Berhasil<br>[ ] Gagal | |
| **A2** | Mengganti kata sandi pada login pertama (Aktivasi) | [ ] Berhasil<br>[ ] Gagal | |
| **A3** | Menyetujui Kebijakan Privasi data pribadi UU PDP | [ ] Berhasil<br>[ ] Gagal | |
| **A4** | Melengkapi verifikasi profil data tetap anggota | [ ] Berhasil<br>[ ] Gagal | |
| **A5** | Memeriksa Dashboard Anggota dan notifikasi registrasi | [ ] Berhasil<br>[ ] Gagal | |
| **A6** | Mengisi dan menyimpan formulir Registrasi Ulang tahunan | [ ] Berhasil<br>[ ] Gagal | |
| **A7** | Mengubah isian Registrasi Ulang yang telah tersimpan | [ ] Berhasil<br>[ ] Gagal | |
| **A8** | Melihat arsip riwayat registrasi ulang periode lalu | [ ] Berhasil<br>[ ] Gagal | |
| **A9** | Mencari rekan anggota di Direktori (domisili/goldar) | [ ] Berhasil<br>[ ] Gagal | |
| **A10** | Mengganti kata sandi mandiri di Pengaturan Akun | [ ] Berhasil<br>[ ] Gagal | |
| **A11** | Melakukan Logout dari portal anggota | [ ] Berhasil<br>[ ] Gagal | |

*Waktu penyelesaian alur login pertama hingga status registrasi ulang:* ............ Menit.

---

### 4.2 Checklist Tugas Sisi Admin

| Kode | Deskripsi Tugas yang Dijalankan | Hasil Pelaksanaan | Catatan / Kendala yang Ditemukan |
| :---: | :--- | :---: | :--- |
| **B1** | Login sebagai admin kesekretariatan | [ ] Berhasil<br>[ ] Gagal | |
| **B2** | Melihat ringkasan Dashboard (total, rasio, statistik) | [ ] Berhasil<br>[ ] Gagal | |
| **B3** | Mencari dan memfilter anggota (nama, reg, angkatan, domisili) | [ ] Berhasil<br>[ ] Gagal | |
| **B4** | Menambah, mengubah, dan menonaktifkan data anggota | [ ] Berhasil<br>[ ] Gagal | |
| **B5** | Mengimpor data anggota dari Excel/CSV (konversi tanggal serial) | [ ] Berhasil<br>[ ] Gagal | |
| **B6** | Mengisi formulir registrasi ulang atas nama anggota (override) | [ ] Berhasil<br>[ ] Gagal | |
| **B7** | Mengatur periode registrasi ulang (buka dan tutup) | [ ] Berhasil<br>[ ] Gagal | |
| **B8** | Memantau kepatuhan registrasi melalui menu Monitoring | [ ] Berhasil<br>[ ] Gagal | |
| **B9** | Mereset kata sandi akun anggota ke kata sandi sementara | [ ] Berhasil<br>[ ] Gagal | |
| **B10** | Mengekspor data keanggotaan ke berkas Excel/CSV | [ ] Berhasil<br>[ ] Gagal | |
| **B11** | Memeriksa catatan log aktivitas admin (audit trail) | [ ] Berhasil<br>[ ] Gagal | |
| **B12** | Membuat dan menerbitkan artikel kegiatan dengan foto | [ ] Berhasil<br>[ ] Gagal | |
| **B13** | Mengunggah gambar bagan Struktur Organisasi (rasio 16:9) | [ ] Berhasil<br>[ ] Gagal | |
| **B14** | Mengubah konten Tentang Kami, sorotan, dan kontak di CMS | [ ] Berhasil<br>[ ] Gagal | |

*Waktu penyelesaian pembuatan dan penerbitan satu artikel:* ............ Menit.

---

### 4.3 Checklist Tugas Portal Publik

| Kode | Deskripsi Tugas yang Dijalankan | Hasil Pelaksanaan | Catatan / Kendala yang Ditemukan |
| :---: | :--- | :---: | :--- |
| **C1** | Membuka Beranda, Tentang Kami, dan Struktur Organisasi | [ ] Berhasil<br>[ ] Gagal | |
| **C2** | Membuka kartu artikel kegiatan dan melihat detail naskah/foto | [ ] Berhasil<br>[ ] Gagal | |
| **C3** | Membuka halaman Prestasi dan informasi kontak sekretariat | [ ] Berhasil<br>[ ] Gagal | |
| **C4** | Memeriksa navigasi menu (sticky navbar) dan sakelar tema | [ ] Berhasil<br>[ ] Gagal | |

*Tingkat kejelasan informasi Mapala UNAND pada website publik:*  
[  ] 1 (Sangat Tidak Jelas)  [  ] 2 (Kurang Jelas)  [  ] 3 (Cukup Jelas)  [  ] 4 (Jelas)  [  ] 5 (Sangat Jelas)

---

## BAB V: Instrumen Kuesioner Evaluasi Pengguna

### 5.1 Informasi dan Tautan Kuesioner Daring
Penguji dapat mengisi instrumen kuesioner evaluasi ini secara langsung pada dokumen fisik atau melalui formulir daring resmi pada tautan berikut:

```
Tautan Kuesioner Evaluasi Daring (Google Forms):
https://docs.google.com/forms/d/e/1FAIpQLScnFHXng0h54HDoeLfxC6pEnkPhNIQdXTkMVxXOVBEbwx0kiQ/viewform
```

---

### 5.2 Evaluasi Tingkat Kemudahan Tugas
Penguji memberikan penilaian tingkat kemudahan bagi masing-masing kelompok tugas:
* Skala Penilaian: **1** = Sangat Sulit | **2** = Sulit | **3** = Cukup | **4** = Mudah | **5** = Sangat Mudah

| Kelompok Tugas Pengujian | 1 (Sangat Sulit) | 2 (Sulit) | 3 (Cukup) | 4 (Mudah) | 5 (Sangat Mudah) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Kemudahan Tugas Sisi Anggota (A1 s.d. A11)** | [ ] | [ ] | [ ] | [ ] | [ ] |
| **Kemudahan Tugas Sisi Admin (B1 s.d. B14)** | [ ] | [ ] | [ ] | [ ] | [ ] |
| **Kemudahan Eksplorasi Portal Publik (C1 s.d. C4)** | [ ] | [ ] | [ ] | [ ] | [ ] |

---

### 5.3 Evaluasi Penilaian Umum dan Kesimpulan
Penguji memberikan penilaian terhadap 8 (delapan) indikator kelayakan sistem:
* Skala Penilaian: **1** = Sangat Tidak Setuju (STS) | **2** = Tidak Setuju (TS) | **3** = Ragu-Ragu (R) | **4** = Setuju (S) | **5** = Sangat Setuju (SS)

| No | Indikator Penilaian Umum | STS (1) | TS (2) | R (3) | S (4) | SS (5) |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: |
| **D1** | Tampilan website mudah dipahami dan tertata secara intuitif. | [ ] | [ ] | [ ] | [ ] | [ ] |
| **D2** | Tulisan, label formulir, dan bahasa pada sistem jelas serta mudah dibaca. | [ ] | [ ] | [ ] | [ ] | [ ] |
| **D3** | Alur penggunaan sistem runut dan tidak membingungkan pengguna. | [ ] | [ ] | [ ] | [ ] | [ ] |
| **D4** | Website berjalan dengan cepat, ringan, dan responsif. | [ ] | [ ] | [ ] | [ ] | [ ] |
| **D5** | Tampilan antarmuka nyaman dilihat pada perangkat yang saya gunakan (mode terang/gelap). | [ ] | [ ] | [ ] | [ ] | [ ] |
| **D6** | Saya merasa informasi dan data pribadi terlindungi aman saat menggunakan sistem ini. | [ ] | [ ] | [ ] | [ ] | [ ] |
| **D7** | Isi informasi dan fitur operasional sistem sesuai dengan kebutuhan nyata organisasi. | [ ] | [ ] | [ ] | [ ] | [ ] |
| **D8** | Saya bersedia menggunakan dan merekomendasikan sistem ini untuk operasional Mapala UNAND. | [ ] | [ ] | [ ] | [ ] | [ ] |

---

### 5.4 Catatan Kendala, Masukan, dan Keputusan Kelayakan

1. **Kendala atau Galat (*Error*) yang Ditemukan saat Pengujian:**  
   *(Sebutkan halaman dan langkah saat kendala terjadi)*  
   ....................................................................................................................................................................................  
   ....................................................................................................................................................................................  

2. **Fitur atau Informasi yang Menurut Anda Masih Kurang / Perlu Ditambahkan:**  
   ....................................................................................................................................................................................  
   ....................................................................................................................................................................................  

3. **Saran Perbaikan untuk Pengembangan Sistem Selanjutnya:**  
   ....................................................................................................................................................................................  
   ....................................................................................................................................................................................  

4. **Keputusan Akhir Penguji terhadap Kelayakan Sistem:**  
   [  ] **LAYAK DIGUNAKAN** untuk operasional organisasi Mapala UNAND.  
   [  ] **TIDAK LAYAK DIGUNAKAN** (memerlukan perbaikan menyeluruh).

---

## BAB VI: Berita Acara Penerimaan Sistem (Sign-Off Form)

### BERITA ACARA PENGUJIAN PENERIMAAN PENGGUNA
### USER ACCEPTANCE TESTING (UAT) SIGN-OFF

Pada hari ini, ......................................... tanggal ............ bulan ......................................... tahun 2026, bertempat di Sekretariat Mahasiswa Pecinta Alam Universitas Andalas (Mapala UNAND), telah dilaksanakan pengujian penerimaan pengguna (*User Acceptance Testing*) terhadap sistem perangkat lunak:

* **Nama Perangkat Lunak:** Sistem Informasi Manajemen Keanggotaan dan Website Resmi Mapala UNAND
* **Versi Rilis:** Versi 2.0 (Stable Academic Release)
* **Pelaksana / Pengembang:** Tim Mahasiswa Manajemen Proyek Sistem Informasi (Kelompok 3)
* **Pemberi Kebutuhan / Klien:** Pengurus Mahasiswa Pecinta Alam Universitas Andalas (Mapala UNAND)

Berdasarkan hasil uji coba skenario operasional Sisi Anggota (A1 - A11), Sisi Admin (B1 - B14), dan Portal Publik (C1 - C4), serta rekapitulasi penilaian kuesioner evaluasi, penguji menyatakan bahwa sistem perangkat lunak ini:

```
[   ] DITERIMA PENUH (Accepted without conditions)
      Sistem berfungsi stabil, bebas dari kendala kritis, dan memenuhi seluruh spesifikasi operasional.

[   ] DITERIMA DENGAN CATATAN (Accepted with minor notes)
      Sistem dapat digunakan secara operasional dengan rekomendasi penyempurnaan kecil terlampir.

[   ] DITOLAK (Rejected)
      Sistem belum memenuhi spesifikasi dasar yang disepakati dan memerlukan perbaikan menyeluruh.
```

**Catatan Akhir Pengesahan:**  
....................................................................................................................................................................................  
....................................................................................................................................................................................  

Demikian Berita Acara ini dibuat dan disahkan sebagai bukti formal penerimaan sistem informasi dan pemenuhan syarat Tugas Besar Manajemen Proyek Sistem Informasi.

<br><br>

Padang, .................................................... 2026

<br>

| Pihak Penguji / Klien<br>**Pengurus Mapala Universitas Andalas** | Pihak Pengembang<br>**Tim Proyek MPSI Kelompok 3** |
| :---: | :---: |
| <br><br><br><br>_________________________________________<br>**Nama:** ........................................................<br>No. Register: ........................................... | <br><br><br><br>_________________________________________<br>**Nama:** ........................................................<br>NIM: .................................................... |

<br>

Mengetahui,<br>
**Dosen Pengampu Mata Kuliah MPSI**

<br><br><br>
_________________________________________<br>
**NIP:** ....................................................
