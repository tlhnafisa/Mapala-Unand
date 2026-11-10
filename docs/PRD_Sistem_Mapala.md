**PROJECT PRD**

*Product Requirements Document*

| --- | --- |
| --- | --- |
| **Project Name** | Sistem Informasi Manajemen Keanggotaan dan Website Resmi Mapala Unand |
| **Team** | Kelompok 3<br>Arifah Huwaina Azre (2411521003)<br>Farrel Ghufran Rahman (2411521009)<br>Talitha Nafisa Khairul (2411522007)<br>Rafa Gian Atthari (2411522014)<br>Muhammad Racha Ardiwinata (2411522020)<br>Muhammad Arrasyid (2411522027)<br>Syifa Khalishah Nugroho (2411522028) |
| **Course** | Manajemen Proyek Sistem Informasi |
| **Version** | 1.1 |
| **Date** | 10 November 2026 |

**Tujuan dokumen**

PRD ini digunakan untuk menjelaskan apa yang akan dibangun, untuk siapa, mengapa produk dibutuhkan, dan kebutuhan utama produk. PRD tidak menjelaskan detail implementasi kode. Dokumen disusun berdasarkan hasil wawancara dengan Ketua Umum Mapala UNAND (21 Oktober 2026), Laporan Tugas Besar Bab 1, contoh formulir Biodata Anggota Penuh (MU 325 Ltn.), serta masukan anggota tim.

**Catatan perubahan versi 1.1 (10 November 2026)**

Versi ini menyesuaikan PRD dengan keputusan perancangan basis data (ERD) dan rekap menu website:

- Halaman Struktur Organisasi hanya menampilkan gambar bagan yang diunggah admin, tidak lagi kartu pengurus per orang (FR-04, FR-40, bagian 2.3, 2.4, 2.5, dan 3.1).
- Kebutuhan data pada bagian 2.5 diperluas dan dirinci mengikuti ERD: master divisi, akun media sosial dan atribut per registrasi, kebijakan privasi beserta persetujuan per versi, kategori/lokasi/jadwal, periode dan bagan kepengurusan, serta rincian prestasi dan konten statis.
- Perbaikan penulisan pada FR-02 dan FR-22.
- Daftar kebutuhan fungsional memakai butir bertanda (bukan nomor urut), karena penomoran otomatis berulang di tiap kelompok dan membingungkan terhadap kode FR.

# 1. Problem & Users
## 1.1 Problem Statement
Data keanggotaan Mapala UNAND yang bersifat seumur hidup (± 355 anggota lintas angkatan sejak 1980-an) sulit dilacak dan diperbarui karena pendataan masih semi-manual (Google Form di grup WhatsApp, rekap Excel, cetak buku anggota), sehingga banyak anggota senior tidak terjangkau. Di sisi lain, Mapala UNAND belum memiliki website profil resmi yang aktif untuk menampilkan organisasi, kegiatan, dan prestasinya kepada publik.

## 1.2 Target Users
| **Pengguna** | **Karakteristik** | **Kebutuhan utama** |
| --- | --- | --- |
| **Pengunjung publik** (mahasiswa calon anggota, masyarakat, mitra) | Tanpa akun; mengakses dari ponsel atau komputer. | Mengenal Mapala UNAND, melihat kegiatan dan prestasi, menemukan kontak resmi. |
| **Anggota / alumni** (± 355 orang, angkatan 1980-an hingga sekarang) | Usia dan kemampuan teknologi beragam; sebagian senior kurang aktif di grup WhatsApp, kurang familier dengan teknologi, dan merasa pembaruan data adalah tugas pengurus. | Login sederhana, melengkapi profil, dan registrasi ulang tahunan dengan cepat; tetap tercatat dan diakui sebagai anggota, serta dapat menemukan kontak sesama anggota di suatu daerah ketika membutuhkan bantuan. |
| **Admin / pengurus** (Bidang Organisasi dan Bidang Kesekretariatan; Ketua Umum) | Pengurus mahasiswa yang berganti tiap periode, fleksibel, belum punya aturan kerja khusus, dan bukan programmer. | Mengelola data anggota dan registrasi ulang, memantau kelengkapan data, serta memublikasikan konten tanpa bantuan programmer. |

## 1.3 User Needs / Pain Points
- Anggota senior/alumni sulit dijangkau dan data domisili serta nomor HP-nya tidak mutakhir, padahal dibutuhkan saat pengurus berkegiatan atau berkunjung ke suatu daerah.

- Pendataan ulang tahunan harus membuat Google Form baru, merekap manual ke Excel, lalu mencetak ulang buku anggota; metode pengarsipan berbeda-beda di tiap kepengurusan.

- Sebagian anggota enggan atau tidak mampu mengisi form daring, sehingga pengurus membutuhkan jalur pembaruan data secara manual.

- Biodata anggota bersifat sensitif sehingga harus terpisah dari halaman publik dan hanya dapat diakses pihak berwenang (admin); anggota lain hanya dapat melihat data terbatas (nama, No. Register, No. HP, golongan darah, dan alamat tempat tinggal saat ini) dari anggota yang telah memberikan persetujuan.

- Anggota sulit mengetahui siapa sesama anggota yang berada di suatu daerah, padahal informasi tersebut dibutuhkan untuk saling menghubungi, mencari bantuan (misalnya donor darah), atau bertemu ketika berada di daerah tersebut.

- Belum ada media informasi resmi yang aktif (website lama dari UKM Neo Telemetri sudah tidak dapat diakses) untuk membangun citra positif dan menarik minat mahasiswa baru.

- Pengurus ingin dapat mengunggah artikel/dokumentasi kegiatan sendiri dan sistem dapat dipakai berkelanjutan oleh kepengurusan berikutnya.

## 1.4 Project Goal
Membangun website resmi Mapala UNAND yang berfungsi sebagai portal profil publik sekaligus sistem registrasi ulang dan database keanggotaan terpusat, sehingga data anggota lintas angkatan mudah diperbarui dan diakses oleh pengurus, sesama anggota dapat saling menghubungi berdasarkan domisili melalui direktori anggota, serta kegiatan dan prestasi organisasi dapat dipublikasikan secara mandiri.

# 2. Product Requirements
## 2.1 Functional Requirements
Prioritas: **[M]** Must have, **[S]** Should have, **[C]** Could have (dikerjakan bila waktu memungkinkan).

***A. Portal Publik***

- **FR-01:** Pengunjung dapat mengakses halaman Beranda, Tentang Kami, Struktur Organisasi, Kegiatan dan Artikel, Prestasi, dan Kontak tanpa login. [M]

- **FR-02:** Beranda menampilkan pengenalan singkat Mapala UNAND, foto kegiatan, informasi/artikel terbaru, serta tombol menuju login anggota. [M]

- **FR-03:** Halaman Tentang Kami menampilkan sejarah, visi dan misi, identitas organisasi, serta informasi umum. [M]

- **FR-04:** Halaman Struktur Organisasi menampilkan gambar bagan struktur kepengurusan periode berjalan beserta judul bagan dan periodenya, sesuai gambar yang diunggah admin. [M]

- **FR-05:** Pengunjung dapat melihat daftar artikel/kegiatan yang telah dipublikasikan, memfilter berdasarkan kategori (berita, ekspedisi, pendakian, kegiatan lapangan, program divisi), dan membuka detail artikel. [M]

- **FR-06:** Halaman Prestasi menampilkan daftar pencapaian dan penghargaan beserta tahun dan deskripsinya. [M]

- **FR-07:** Halaman Kontak menampilkan kontak resmi organisasi/pengurus (misalnya email, WhatsApp, alamat sekretariat, media sosial). [M]

- **FR-08:** Sistem tidak menampilkan data biodata anggota pada halaman publik mana pun. [M]

***B. Akun dan Autentikasi***

- **FR-09:** Anggota dan admin dapat login menggunakan username (No. Register) dan password. [M]

- **FR-10:** Akun anggota dibuat oleh admin (melalui impor atau penambahan manual) dengan password awal; username bersifat unik per anggota. [M]

- **FR-11:** Pada login pertama dengan password awal, sistem mewajibkan pengguna mengganti password sebelum dapat mengakses menu lain. [M]

- **FR-12:** Pengguna dapat mengganti password melalui menu Pengaturan Akun dengan memasukkan password lama. [M]

- **FR-13:** Admin dapat mereset password anggota yang lupa ke password awal sementara; sistem mewajibkan ganti password pada login berikutnya. Admin tidak dapat melihat password yang dipakai pengguna. [M]

- **FR-14:** Pengguna dapat logout, dan sesi berakhir otomatis setelah tidak aktif dalam batas waktu tertentu. [M]

- **FR-15:** Sistem menampilkan menu sesuai peran (anggota atau admin) dan menolak akses anggota ke halaman admin. [M]

***C. Dashboard dan Profil Anggota***

- **FR-16:** Dashboard Anggota menampilkan ringkasan identitas, status registrasi ulang periode berjalan (belum/sudah beserta waktunya), dan pemberitahuan bila profil atau registrasi ulang perlu dilengkapi. [M]

- **FR-17:** Setelah mengganti password dan menyetujui kebijakan penggunaan data pada login pertama , anggota diarahkan melengkapi Profil berisi data tetap: No. Register, Nama, Divisi, Tempat/Tanggal Lahir, Golongan Darah, Nama Ayah, dan Nama Ibu; data yang sudah diimpor admin tampil terisi. [M]

- **FR-18:** Menu Biodata Saya menampilkan data tetap dan data registrasi ulang terbaru, termasuk foto. Anggota dapat mengubah data tetap miliknya, kecuali No. Register yang hanya dapat diubah admin. [M]

- **FR-19:** Sistem memvalidasi isian (kolom wajib, format tanggal, nomor HP, dan email) dan menampilkan pesan kesalahan yang jelas. [M]

- **FR-20:** Sistem mencatat waktu perubahan terakhir pada profil anggota. [S]

***D. Registrasi Ulang Anggota***

- **FR-21:** Menu Registrasi Ulang hanya dapat diisi ketika periode registrasi dibuka oleh admin (umumnya per tahun). [M]

- **FR-22:** Formulir Registrasi Ulang menampilkan data profil tetap dalam kondisi terkunci (hanya baca) dan kolom data berkala: Foto Terbaru, Alamat Rumah (beserta kota/kabupaten dan provinsi), Pekerjaan, No. HP, Email Aktif, Akun Media Sosial, Alamat Orang Tua, dan Status Kepemilikan Atribut beserta Foto Atribut. [M]

- **FR-23:** Formulir terisi otomatis dengan data registrasi periode sebelumnya sehingga anggota hanya mengubah bagian yang berubah. Pengecualian: Foto Atribut tidak selalu terisi otomatis karena pendataan atribut dilakukan setiap tahun. Foto Atribut hanya terisi otomatis apabila datanya berasal dari tahun yang sama (periode berjalan); setelah berganti tahun, Foto Atribut tidak terisi otomatis dan anggota mengunggah foto atribut yang baru. [M]

- **FR-24:** Setelah anggota menyimpan formulir, sistem mencatat status "Sudah Registrasi Ulang" beserta waktunya. [M]

- **FR-25:** Anggota dapat memperbarui isian registrasi ulangnya selama periode masih dibuka; sistem memperbarui waktu pembaruan terakhir. [S]

- **FR-26:** Anggota dapat melihat riwayat registrasi ulang periode-periode sebelumnya (hanya baca). [S]

- **FR-27:** Anggota dapat mengunggah foto terbaru; sistem memvalidasi format dan ukuran file. [M]

***E. Dashboard Admin: Data Anggota dan Monitoring***

- **FR-28:** Ringkasan Dashboard Admin menampilkan total anggota, jumlah yang sudah dan belum registrasi ulang pada periode berjalan, persentase kelengkapan, dan statistik singkat keanggotaan (misalnya per angkatan dan per divisi). [M]

- **FR-29:** Admin dapat melihat daftar anggota, mencari berdasarkan nama atau No. Register, dan memfilter berdasarkan angkatan, divisi, status registrasi ulang, serta domisili (kota/kabupaten atau provinsi). [M]

- **FR-30:** Admin dapat menambahkan, melihat detail, mengubah, dan menonaktifkan data anggota. [M]

- **FR-31:** Admin dapat mengimpor data awal anggota dari file Excel/CSV (± 355 anggota) menggunakan templat yang disediakan; sistem menampilkan pratinjau dan melaporkan baris yang error atau duplikat sebelum data disimpan. [M]

- **FR-32:** Admin dapat mengisi atau mengubah data registrasi ulang atas nama anggota (misalnya anggota yang menyerahkan data lewat WhatsApp atau formulir kertas); sistem menandai sumber data sebagai "diinput admin" beserta nama admin dan waktunya. [M]

- **FR-33:** Admin dapat mengatur periode registrasi ulang (tahun, buka/tutup) dan daftar jenis atribut yang didata. [M]

- **FR-34:** Menu Monitoring Registrasi Ulang menampilkan daftar anggota yang sudah dan belum registrasi ulang per periode, waktu pembaruan terakhir, dan sumber input (mandiri atau admin), dengan fitur filter. [M]

- **FR-35:** Admin dapat mengekspor data anggota ke file CSV sesuai filter dan periode yang dipilih; hasil ekspor memuat data profil tetap dan data registrasi ulang. [M]

- **FR-36:** Sistem mencatat log aktivitas admin pada data anggota (siapa, apa yang diubah, dan kapan). [S]

- **FR-37:** Admin dapat membuka tautan cepat ke WhatsApp dari nomor HP anggota. [C]

- **FR-38:** Admin dapat mengunduh/mencetak biodata satu anggota dalam format PDF yang mengikuti formulir Biodata Anggota Penuh Mapala UNAND. [C]

12. **Tambahan:** admin dapat mencetak seluruh daftar data anggota dengan format csv/excel yang rapi

***F. Dashboard Admin: Manajemen Konten***

- **FR-39:** Admin dapat membuat, mengedit, menghapus, dan mempublikasikan artikel/dokumentasi kegiatan (judul, kategori, isi, foto, tanggal), termasuk menyimpannya sebagai draf. [M]

- **FR-40:** Admin dapat mengunggah dan memublikasikan gambar bagan struktur kepengurusan (periode kepengurusan, keterangan/judul bagan, berkas gambar JPG/PNG/WEBP maksimal 5 MB); bagan yang aktif tampil di halaman Struktur Organisasi. [M]

- **FR-41:** Admin dapat menambah, mengubah, dan menghapus data prestasi. [M]

- **FR-42:** Admin dapat memperbarui konten Tentang Kami, informasi Kontak, dan foto Beranda. [S]

- **FR-43:** Sistem meminta konfirmasi sebelum data atau konten dihapus dan menampilkan pesan ketika data tidak ditemukan. [S]

***G. Kebijakan Pengguna dan Direktori Anggota***

- **FR-44:** Pada login pertama setelah mengganti password, sistem menampilkan Kebijakan Privasi dan Persetujuan Penggunaan Data yang menjelaskan data yang dikumpulkan, tujuan penggunaan, pihak yang dapat mengakses, serta pembagian data terbatas kepada anggota lain (FR-46); anggota wajib menyetujui sebelum dapat mengakses menu lain. [M]

- **FR-45:** Sistem menyimpan catatan persetujuan setiap anggota (waktu dan versi kebijakan), anggota dapat membaca kembali kebijakan melalui Pengaturan Akun, dan persetujuan diminta ulang apabila kebijakan berubah. [S]

- **FR-46:** Anggota yang telah menyetujui kebijakan dapat membuka menu Direktori Anggota yang menampilkan daftar anggota lain yang juga telah menyetujui. Direktori hanya menampilkan nama, No. Register, No. HP, golongan darah, dan alamat tempat tinggal saat ini (Alamat Rumah beserta kota/kabupaten dan provinsi) berdasarkan data profil dan registrasi ulang terbaru; data lain (misalnya tempat/tanggal lahir, nama orang tua, email, media sosial, pekerjaan, dan foto) tidak ditampilkan. [M]

- **FR-47:** Anggota dapat mencari anggota lain pada Direktori Anggota berdasarkan nama atau No. Register, serta memfilter berdasarkan domisili (kota/kabupaten atau provinsi) dan golongan darah, sehingga anggota di suatu daerah mudah dihubungi ketika dibutuhkan (misalnya untuk bantuan atau donor darah). [M]

## 2.2 Non-functional Requirements
**NFR-01:** Halaman publik dapat ditampilkan dalam ≤ 3 detik pada jaringan seluler 4G normal.

**NFR-02:** Antarmuka responsif dan dapat digunakan pada layar ponsel hingga desktop, serta berjalan di versi terbaru browser Chrome, Edge, Firefox, dan Safari.

**NFR-03:** Antarmuka mudah digunakan oleh anggota senior: berbahasa Indonesia, huruf mudah dibaca, dan anggota uji dapat menyelesaikan registrasi ulang ≤ 10 menit tanpa bantuan.

**NFR-04:** Password disimpan dalam bentuk terenkripsi (hash) dan seluruh komunikasi menggunakan HTTPS.

**NFR-05:** Data biodata anggota tidak dapat diakses tanpa login. Anggota hanya dapat mengubah data miliknya dan hanya dapat melihat data anggota lain sebatas data Direktori Anggota (FR-46) dari anggota yang telah memberikan persetujuan, dan fitur admin hanya dapat diakses akun dengan peran admin.

**NFR-06:** Sistem membatasi percobaan login gagal berulang dan menutup sesi tidak aktif.

**NFR-07:** Data pribadi hanya digunakan untuk kepentingan organisasi, sesuai Kebijakan Privasi; anggota wajib memberikan persetujuan penggunaan data pada login pertama, termasuk persetujuan pembagian data terbatas kepada anggota lain , sesuai prinsip pelindungan data pribadi (UU No. 27 Tahun 2022).

**NFR-08:** No. Register bersifat unik, dan riwayat registrasi ulang setiap periode tersimpan tanpa tertimpa data periode lain.

**NFR-09:** Sistem mampu melayani minimal 500 akun anggota dan 50 pengguna bersamaan tanpa penurunan kinerja yang berarti.

**NFR-11:** Konten dapat dikelola melalui dashboard tanpa mengubah kode, dan tersedia panduan penggunaan admin agar sistem dapat diteruskan kepengurusan berikutnya.

**NFR-12:** Halaman publik memiliki judul dan deskripsi yang sesuai agar dapat ditemukan mesin pencari.

## 2.3 Core Features
| **No.** | **Core Feature** | **Purpose / Value** | **FR Terkait** |
| --- | --- | --- | --- |
| 1 | Portal Profil Publik | Menampilkan profil, bagan struktur kepengurusan, kegiatan, prestasi, dan kontak untuk promosi serta membangun citra positif Mapala UNAND. | FR-01 s.d. FR-08 |
| 2 | Akun, Autentikasi, dan Persetujuan Pengguna | Login dengan username (No. Register), ganti password wajib pada login pertama, dan reset oleh admin, serta persetujuan kebijakan penggunaan data ; menjaga biodata tetap privat. | FR-09 s.d. FR-15, FR-44, FR-45 |
| 3 | Profil Anggota (Data Tetap) | Menyimpan identitas permanen anggota sekali isi dan dapat dikoreksi bila perlu, serta menyediakan direktori agar sesama anggota dapat saling menghubungi berdasarkan domisili | FR-16 s.d. FR-20, FR-46, FR-47 |
| 4 | Registrasi Ulang Tahunan | Memperbarui data berkala (foto, domisili, kontak, atribut, foto atribut) per periode dengan riwayat tersimpan, sehingga data anggota lintas angkatan selalu mutakhir. | FR-21 s.d. FR-27 |
| 5 | Dashboard Admin: Data Anggota dan Monitoring | Impor Excel, pencarian/filter (termasuk domisili), input manual, monitoring status registrasi, dan ekspor CSV. | FR-28 s.d. FR-38 |
| 6 | Manajemen Konten Website | Memungkinkan pengurus mengelola artikel, bagan struktur kepengurusan, prestasi, dan informasi publik secara mandiri tanpa programmer. | FR-39 s.d. FR-43 |

## 2.4 User Flow
**Pengunjung:** Buka Website → Beranda → Pilih menu (Tentang Kami / Struktur Organisasi / Kegiatan dan Artikel / Prestasi / Kontak) → Baca Detail Artikel → (opsional) Login Anggota.

**Anggota (login pertama):** Buka Website → Login (No. Register + password awal) → Wajib Ganti Password → Baca dan Setujui Kebijakan Penggunaan Data → Lengkapi Profil (data tetap) → Dashboard Anggota → Registrasi Ulang (data profil terkunci, isi data terbaru dan status atribut) → Simpan → Status "Sudah Registrasi Ulang".

**Anggota (periode berikutnya):** Login → Dashboard Anggota (melihat pemberitahuan) → Registrasi Ulang (data periode lalu terisi, kecuali Foto Atribut yang harus diunggah ulang bila sudah berganti tahun; periksa/ubah) → Simpan → Status diperbarui.

**Anggota (mencari anggota lain):** Login → Direktori Anggota → Cari nama/No. Register atau filter domisili/golongan darah → Lihat nama, No. Register, No. HP, golongan darah, dan alamat tempat tinggal saat ini → Hubungi anggota yang bersangkutan.

**Anggota lupa password:** Hubungi admin → Admin reset password → Login dengan password awal sementara → Ganti password.

**Admin (data anggota):** Login → Ringkasan Dashboard → Data Anggota → Impor Excel (pratinjau, perbaiki error, simpan) → Atur Periode Registrasi → Monitoring Registrasi Ulang → Input Manual untuk anggota yang belum mengisi → Ekspor CSV.

**Admin (konten):** Login → Manajemen Konten → Buat/Edit Artikel (atau unggah bagan struktur, prestasi) → Simpan Draf / Publikasikan → Konten tampil di halaman publik.

## 2.5 Data Requirements

| Data / Entity | Key Information | Purpose |
| --- | --- | --- |
| Akun Pengguna | Username (No. Register), password (hash), peran (anggota/admin), status aktif, penanda wajib ganti password, jumlah login gagal dan waktu kunci akun, waktu login terakhir. | Autentikasi dan otorisasi akses, serta pembatasan percobaan login (NFR-06). |
| Divisi | Nama, ikon, deskripsi, urutan, status aktif. | Master divisi yang dipakai profil anggota, filter, dan tampilan publik. Dikelola admin. |
| Profil Anggota (data tetap) | No. Register, nama, divisi, tempat dan tanggal lahir, golongan darah, nama ayah, nama ibu, angkatan\*, status aktif, penanda profil lengkap, waktu perubahan terakhir. | Identitas permanen anggota yang dipakai sebagai dasar semua periode registrasi. |
| Periode Registrasi | Tahun/periode, tanggal buka dan tutup, status (buka/tutup). | Mengatur jadwal registrasi ulang per tahun. |
| Registrasi Ulang (data berkala) | Anggota, periode, foto terbaru, alamat rumah, kota/kabupaten, provinsi, pekerjaan, No. HP, email, alamat orang tua, waktu pembaruan, sumber input (mandiri/admin) beserta admin yang menginput. Satu anggota hanya punya satu registrasi per periode. Status "sudah registrasi" ditentukan dari ada atau tidaknya data registrasi pada periode tersebut. | Menyimpan data terbaru per tahun beserta riwayatnya dan sebagai bahan monitoring serta ekspor. |
| Akun Media Sosial Registrasi | Registrasi, platform, nama akun (satu registrasi dapat memiliki beberapa akun). | Menyimpan akun media sosial anggota per periode. |
| Jenis Atribut | Nama atribut (ditentukan admin, misalnya Topi Rimba dan Baju Lapangan), status aktif, urutan. | Daftar atribut yang didata pada registrasi ulang. |
| Atribut Registrasi | Registrasi, jenis atribut, status kepemilikan (ada/tidak), foto atribut; foto atribut hanya terisi otomatis dalam tahun yang sama. | Pendataan atribut anggota per periode. |
| Kebijakan Privasi | Versi, judul, isi, tanggal berlaku, status aktif. | Naskah kebijakan yang disetujui anggota; versi baru meminta persetujuan ulang (FR-45). |
| Persetujuan Penggunaan Data | Anggota, versi kebijakan, waktu persetujuan. | Syarat akses menu lain dan tampil di Direktori Anggota (FR-44 s.d. FR-47). |
| Kategori, Lokasi/Jalur, dan Jadwal Operasional | Nama dan urutan (kategori); nama (lokasi/jalur dan jadwal operasional). | Master untuk filter kategori pada Kegiatan dan Artikel serta filter cepat di Beranda. |
| Artikel / Kegiatan | Judul, kategori, divisi, lokasi/jalur, jadwal operasional, ringkasan, isi, tanggal kegiatan, status kegiatan, tim atau capaian, status publikasi (draf/terbit), penulis, serta beberapa foto dengan satu foto sampul. | Konten halaman Kegiatan dan Artikel serta Beranda. |
| Struktur Organisasi (periode dan bagan) | Periode kepengurusan (nama, tahun mulai dan selesai, penanda periode berjalan) dan gambar bagan (periode, judul, berkas gambar, status aktif, waktu unggah). | Halaman Struktur Organisasi menampilkan gambar bagan yang aktif. |
| Prestasi | Judul, tahun, kategori, deskripsi, dua label info, foto, keterangan foto, penanda sorotan (judul, subjudul, detail). | Halaman Prestasi dan sorotan prestasi di Beranda. |
| Konten Statis dan Kontak | Sejarah, visi, kode etik, foto Beranda, kontak resmi, daftar poin misi, statistik Beranda, tautan media sosial. | Halaman Tentang Kami, Beranda, Kontak, dan footer. |
| Log Aktivitas | Pengguna, aksi, data yang diubah (sebelum dan sesudah), alamat IP, waktu. | Audit perubahan data oleh admin. |

Rancangan tabel basis data (23 tabel) beserta relasinya dijabarkan pada dokumen ERD.

*\*Angkatan diusulkan sebagai atribut tambahan karena dibutuhkan untuk filter dan statistik; perlu dikonfirmasi dengan pengurus.*

## 2.6 Constraints & Assumptions
- **Platform:** aplikasi berbasis website (responsif, tidak berupa aplikasi mobile native) dan memerlukan koneksi internet.

- **Waktu:** sistem harus selesai pada November 2026, sebelum minggu ke-13 perkuliahan semester ganjil; tim terdiri dari 7 mahasiswa.

- **Hosting dan domain:** hosting belum ditentukan (pengurus bersedia membantu biaya); nama domain disesuaikan dengan nama Mapala UNAND dan akan dibahas saat penyerahan sistem.

- **Sumber data awal:** pengurus menyediakan data ± 355 anggota (minimal No. Register dan nama) dalam format Excel, serta materi konten (sejarah, pengurus, prestasi, foto kegiatan).

- **Akun dan keamanan:** username berupa No. Register; password awal dari pengurus wajib diganti pada login pertama. Password tidak disimpan sebagai teks biasa sehingga anggota yang lupa password dibantu lewat fitur reset oleh admin, bukan dengan melihat password lama. Selama password awal belum diganti, akun rentan dipakai pihak lain, sehingga password awal tidak boleh disebarluaskan di luar anggota.

- **Tanpa persetujuan:** tidak ada alur approval atau validasi khusus atas data registrasi, sesuai hasil wawancara.

- **Pembaruan data oleh admin:** anggota yang tidak mengisi mandiri datanya diinput oleh admin berdasarkan informasi yang diterima di luar sistem.

- **Peran admin:** dikelola pengurus inti (Bidang Organisasi dan Kesekretariatan); perubahan tata letak/desain halaman tetap memerlukan perubahan kode, sedangkan konten dikelola lewat dashboard.

- **Asumsi:** registrasi ulang dilakukan satu kali per tahun; anggota memiliki ponsel atau akses ke perangkat yang dapat membuka website; ukuran foto dibatasi (misalnya ≤ 2 MB).

- **Persetujuan pengguna dan direktori anggota:** anggota wajib menyetujui kebijakan penggunaan data pada login pertama; hanya anggota yang telah menyetujui yang dapat mengakses dan tampil di Direktori Anggota, yang hanya memuat nama, No. Register, No. HP, golongan darah, dan alamat tempat tinggal saat ini. Naskah Kebijakan Privasi disusun tim dan dikonfirmasi bersama pengurus.

- **Pencadangan data:** dilakukan oleh admin secara mandiri melalui fitur ekspor data (FR-35); sistem tidak menyediakan pencadangan otomatis.

- **Koordinasi:** pengurus bersedia mengonfirmasi rancangan secara berkala (melalui perantara tim atau WhatsApp).

## 2.7 Success Criteria
- Seluruh data ± 355 anggota berhasil diimpor ke sistem (≥ 95% baris valid pada percobaan pertama), dan akun anggota dapat digunakan untuk login.

- Anggota dapat menyelesaikan alur login pertama sampai status "Sudah Registrasi Ulang" dalam ≤ 10 menit pada uji coba dengan minimal 5 perwakilan anggota (termasuk anggota senior).

- Admin dapat mencari anggota berdasarkan domisili, melihat daftar yang belum registrasi ulang, dan mengekspor CSV berisi data profil dan registrasi ulang tanpa bantuan programmer.

- Pengurus dapat membuat dan memublikasikan satu artikel kegiatan secara mandiri dalam ≤ 10 menit.

- Pada periode registrasi pertama, ≥ 60% anggota tercatat registrasi ulang (target usulan, disepakati dengan pengurus), termasuk yang diinput manual oleh admin.

- Pengujian akses menunjukkan data biodata tidak dapat dibuka tanpa login, dan anggota tidak dapat membuka data anggota lain selain lima data Direktori Anggota dari anggota yang telah memberikan persetujuan.

- Persetujuan penggunaan data tercatat untuk setiap anggota yang login, dan anggota dapat mencari anggota lain berdasarkan domisili dan golongan darah pada Direktori Anggota.

- Sistem lolos uji penerimaan oleh pengurus, selesai sebelum minggu ke-13, dan dilengkapi Dokumen Penyerahan Sistem yang ditandatangani narasumber.

# 3. Scope
## 3.1 In Scope
- Portal publik: Beranda, Tentang Kami, Struktur Organisasi, Kegiatan dan Artikel, Prestasi, dan Kontak.

- Login anggota dan admin, ganti password dan persetujuan kebijakan penggunaan data wajib pada login pertama, pengaturan akun, serta reset password oleh admin.

- Profil anggota (data tetap) dan Registrasi Ulang (data berkala dan status atribut) dengan riwayat per periode.

- Kebijakan dan Persetujuan Pengguna atas penggunaan data, serta Direktori Anggota yang dapat diakses anggota yang telah menyetujui untuk melihat nama, No. Register, No. HP, golongan darah, dan alamat tempat tinggal saat ini anggota lain.

- Dashboard Admin: ringkasan, data anggota (cari, filter, tambah, ubah, nonaktifkan), impor Excel, input manual atas nama anggota, pengaturan periode, monitoring, dan ekspor CSV (termasuk untuk pencadangan data oleh admin).

- Manajemen konten oleh admin: artikel/kegiatan, gambar bagan struktur kepengurusan, prestasi, kontak, dan konten Tentang Kami.

- Pengujian bersama pengurus, panduan penggunaan admin, serta Dokumen Kontrak Kerja Sama dan Dokumen Penyerahan Sistem.

## 3.2 Out of Scope
- Pengelolaan Laporan Pertanggungjawaban (LPJ), keuangan, dan absensi kegiatan yang dilaporkan dalam bentuk hard copy kepada pihak kemahasiswaan dan Wakil Rektor.

- Alur persetujuan (approval) atau validasi berjenjang atas data registrasi.

- Pendaftaran/rekrutmen calon anggota baru dan pembayaran (iuran).

- Pengiriman notifikasi otomatis melalui WhatsApp atau email, serta pemulihan password melalui email (pemulihan dilakukan lewat admin).

- Aplikasi mobile native (Android/iOS), integrasi dengan sistem kampus, forum atau fitur chat antaranggota.

- Pencadangan otomatis oleh sistem (pencadangan dilakukan admin melalui fitur ekspor data).

- Pembelian dan pembiayaan hosting serta domain (ditangani pengurus), dan perombakan tata letak halaman oleh pengurus tanpa programmer.

# 4. AI Prompt Context
**Project:** Website resmi dan sistem informasi manajemen keanggotaan UKM Mapala Universitas Andalas (berbasis web, responsif). Tugas besar mata kuliah Manajemen Proyek Sistem Informasi, kelompok 3.

**Masalah:** Data ± 355 anggota seumur hidup lintas angkatan sulit dilacak dan diperbarui (Google Form, WhatsApp, Excel, buku cetak), dan belum ada website profil aktif.

**Target user:** (1) pengunjung publik; (2) anggota/alumni dengan literasi teknologi beragam; (3) admin pengurus Bidang Organisasi dan Kesekretariatan.

**Tujuan:** portal profil publik dan sistem registrasi ulang tahunan beserta database anggota terpusat yang mudah diperbarui dan dikelola mandiri oleh pengurus.

**Core features:** (1) portal profil publik; (2) akun, autentikasi, dan persetujuan pengguna (username = No. Register, password awal wajib diganti, persetujuan kebijakan penggunaan data pada login pertama, reset oleh admin); (3) profil anggota data tetap dan direktori anggota (hanya nama, No. Register, No. HP, golongan darah, alamat tempat tinggal saat ini, dari anggota yang menyetujui); (4) registrasi ulang tahunan dengan data profil terkunci, data berkala, status atribut, dan foto atribut (foto atribut hanya terisi otomatis dalam tahun yang sama); (5) dashboard admin (impor Excel, input manual, monitoring, filter domisili, ekspor CSV); (6) manajemen konten.

**Constraints:** web saja; selesai November 2026; hosting dan domain belum ditentukan; biodata bersifat privat dan hanya dapat diakses setelah login (anggota lain hanya melihat lima data direktori dari anggota yang menyetujui); pencadangan dilakukan manual oleh admin lewat ekspor data; tanpa approval; tidak mencakup LPJ/keuangan/absensi; teknologi belum diputuskan.

**Output yang diminta dari AI:** [tuliskan, misalnya rancangan basis data/ERD, use case diagram, wireframe halaman, atau test case berdasarkan requirement di atas]. Jangan menambah fitur di luar scope dan jangan mengubah keputusan yang tercantum di PRD.

# PRD Checklist
☑ Problem statement jelas dan berfokus pada pengguna.

☑ Target users spesifik.

☑ Project goal menjawab masalah yang diidentifikasi.

☑ Core features berjumlah sekitar 4–6 dan relevan.

☑ User flow utama sudah dituliskan.

☑ Data utama sudah diidentifikasi.

☑ Constraints dan assumptions sudah dicatat.

☑ Success criteria dapat digunakan untuk menilai hasil project.

☑ In Scope dan Out of Scope sudah jelas.

☑ Functional requirements menjelaskan perilaku/fungsi yang harus dilakukan aplikasi.

☑ Non-functional requirements menjelaskan kualitas atau batasan sistem dan, jika memungkinkan, dapat diukur.

☑ Functional requirements konsisten dengan core features.

☑ Non-functional requirements tidak ditulis sebagai fitur baru.
