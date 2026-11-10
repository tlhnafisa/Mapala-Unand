# Rekap Bagian dan Menu Website Mapala UNAND

Disusun dari file proyek *Mapala-Unand.zip*. Bagian anggota bersumber dari file 2.docx dan bagian admin dari file Rekap-Menu-Mapala-Unand.xlsx. Dokumen ini menggabungkan ketiga bagian website (publik, anggota, admin): daftar menu dan isi tiap menu, tanpa data contoh, sebagai bahan perancangan database. Versi ini sudah disesuaikan dengan ERD (23 tabel) dan PRD v1.1. Nama tabel ERD ditulis dalam tanda kurung atau pada kolom "Tabel ERD".

## Ringkasan Tiga Bagian

Website Mapala UNAND terdiri dari tiga bagian dengan pengguna dan menu yang berbeda.

| Bagian | Pengguna | Akses | Navigasi | Jumlah menu |
| --- | --- | --- | --- | --- |
| A. Website Publik | Pengunjung umum | Tanpa login | Navbar di atas halaman | 5 menu, tombol Login, dan 1 halaman turunan (Detail Artikel) |
| B. Anggota | Anggota Mapala UNAND | Login dengan No. Register. Login pertama wajib ganti password, menyetujui kebijakan penggunaan data, dan melengkapi profil | Sidebar | 5 menu |
| C. Admin | Admin kesekretariatan | Login admin dengan token, dashboard di /admin | Sidebar | 6 menu (menu CMS memiliki 4 sub-tab) dan 40 endpoint |

Hubungan antarbagian: admin mengelola konten Bagian A lewat menu CMS dan mengelola data anggota yang dipakai di Bagian B. Anggota memperbarui data dirinya sendiri lewat Bagian B.

## Bagian A: Website Publik (Tanpa Login)

Bagian A dapat dibuka siapa saja tanpa login. Isinya 5 menu, tombol Login, dan 1 halaman turunan, dengan navbar dan footer yang sama di semua halaman.

### Daftar Menu Publik

Bagian publik memiliki 5 menu utama, 1 tombol Login, dan 1 halaman turunan (Detail Artikel).

| Menu | Alamat | Fungsi halaman |
| --- | --- | --- |
| Beranda | / | Landing page: ringkasan semua menu lain dan pintu masuk ke setiap halaman |
| Kegiatan & Artikel | /kegiatan-artikel | Daftar kegiatan dan artikel dengan filter kategori dan pencarian |
| Detail Artikel | /kegiatan-artikel/detail?id=... | Halaman turunan: isi lengkap satu kegiatan atau artikel |
| Struktur Organisasi | /struktur-organisasi | Gambar bagan struktur kepengurusan periode berjalan |
| Prestasi | /prestasi | Daftar penghargaan dan pencapaian organisasi |
| Tentang Kami | /tentang-kami | Sejarah, visi dan misi, serta kode etik |
| Login | /login | Portal masuk untuk anggota |

### Komponen Global (Navbar dan Footer)

Navbar dan footer tampil di semua halaman, kecuali footer Login yang berbentuk versi mini.

| Bagian | Komponen | Sifat isi |
| --- | --- | --- |
| Navbar | Logo dan nama organisasi, 5 menu, tombol Login, tombol menu untuk tampilan mobile | Statis |
| Footer: profil | Logo, deskripsi singkat organisasi, tautan sosial media | Statis (tautan sosial disimpan di tabel tautan_sosial) |
| Footer: Divisi Operasional | Daftar tautan divisi menuju halaman Kegiatan & Artikel | Dinamis (mengikuti tabel divisi) |
| Footer: Eksplorasi | Daftar tautan pintasan ke konten (jurnal, peta, database gua, dokumentasi, pendaftaran anggota) | Statis |
| Footer: Sekretariat | Alamat sekretariat dan email kontak | Statis (tabel konten_statis, kunci kontak_email dan kontak_alamat) |
| Footer: baris bawah | Teks hak cipta, tautan Syarat & Ketentuan, Kebijakan Privasi, dan situs Universitas Andalas | Statis |

### 1. Beranda (/)

Beranda terdiri dari 7 bagian yang menyajikan ringkasan menu lain.

| Bagian | Komponen | Jenis data | Sumber |
| --- | --- | --- | --- |
| Hero | Judul organisasi, tagline, deskripsi singkat | Teks | Statis (tabel konten_statis) |
| Filter cepat | 3 dropdown (divisi kegiatan, lokasi/jalur, jadwal operasional) dan tombol "Cari Kegiatan" menuju halaman Kegiatan & Artikel | Daftar divisi, lokasi, dan periode | Dinamis (tabel divisi, lokasi, jadwal_operasional) |
| Statistik | 4 kartu: ikon, angka, dan label (3 kartu berangka dengan animasi hitung, 1 kartu berupa teks) | Angka, satuan, label | Tabel statistik_beranda |
| Kegiatan terkini | Carousel kartu, tombol panah, indikator halaman, tombol "Lihat Semua Kegiatan". Tiap kartu: gambar, badge divisi, lokasi, judul, ringkasan, status, tim atau capaian | Data kegiatan terbaru | Dinamis (tabel artikel berstatus terbit, gambar sampul dari artikel_gambar) |
| Struktur organisasi ringkas | Kartu tiap divisi (ikon, nama divisi, deskripsi) dan gambar bagan struktur periode berjalan | Data divisi dan gambar bagan | Dinamis (tabel divisi dan bagan_struktur) |
| Prestasi | Teks pengantar, 4 kotak sorotan prestasi, gambar dengan caption yang berganti lewat tombol berikutnya, tombol "Arsip Semua Penghargaan" | Data prestasi (judul sorotan, subjudul, detail, gambar, caption) | Dinamis (tabel prestasi, kolom is_sorotan) |
| Tentang Kami & Kode Etik | Label, judul, dua paragraf sejarah, tombol "Baca Selengkapnya", kartu kutipan kode etik, tag bidang keahlian | Teks | Statis (tabel konten_statis dan misi_poin) |

### 2. Kegiatan & Artikel (/kegiatan-artikel)

Halaman ini menampilkan semua kegiatan dan artikel, lengkap dengan filter dan pencarian.

| Bagian | Komponen | Jenis data |
| --- | --- | --- |
| Hero halaman | Breadcrumb, judul, subjudul | Teks statis |
| Filter kategori | Tab kategori: Semua, Ekspedisi, Pendakian & Rimba, Kegiatan Lapangan, Program Divisi, Berita & Edukasi | Master kategori (tabel kategori_artikel) |
| Pencarian | Kolom input teks yang mencari pada judul, lokasi, dan ringkasan | Teks bebas |
| Grid kartu | Gambar, badge divisi, lokasi, judul, ringkasan, tanggal, tim atau capaian, tautan ke halaman detail | Data kegiatan (tabel artikel dan artikel_gambar) |
| Keadaan kosong | Pesan saat tidak ada kegiatan yang cocok dengan filter atau pencarian | Teks statis |

#### Detail Artikel (/kegiatan-artikel/detail?id=...)

| Bagian | Komponen | Jenis data |
| --- | --- | --- |
| Penunjuk lokasi | Breadcrumb Beranda, Kegiatan & Artikel, kategori | Data kegiatan |
| Kepala artikel | Judul, tanggal, lokasi, penulis atau divisi | Data kegiatan |
| Gambar utama | Satu foto sampul | Gambar sampul (tabel artikel_gambar, is_sampul) |
| Isi artikel | Paragraf, subjudul, dan kutipan | Teks panjang (rich text) |
| Aksi | Tombol "Kembali ke Semua Kegiatan" dan "Bagikan Artikel" (menyalin tautan) | Interaksi |
| Kegiatan terkait | 3 kartu kegiatan lain | Data kegiatan |

### 3. Struktur Organisasi (/struktur-organisasi)

Halaman ini hanya menampilkan gambar bagan struktur kepengurusan periode berjalan yang diunggah admin lewat CMS, lengkap dengan judul bagan dan label periode. Tidak ada kartu pengurus per orang maupun kartu badan pertimbangan; bila diperlukan, keduanya cukup dimasukkan ke dalam gambar bagan.

| Bagian | Komponen | Jenis data |
| --- | --- | --- |
| Hero halaman | Breadcrumb, judul, subjudul (menyebut periode kepengurusan) | Teks, periode (tabel periode_kepengurusan) |
| Bagan struktur | Gambar bagan/organigram resmi periode berjalan beserta judul bagan dan label periode. Diunggah admin lewat CMS | Gambar dan teks (tabel bagan_struktur, baris dengan is_aktif = 1) |

### 4. Prestasi (/prestasi)

Halaman ini berisi daftar kartu prestasi yang disusun berurutan, dengan struktur kartu yang sama.

| Bagian | Komponen | Jenis data |
| --- | --- | --- |
| Hero halaman | Breadcrumb, judul, subjudul | Teks statis |
| Kartu prestasi (berulang) | Label tahun dan kategori, judul prestasi, deskripsi, dua label info (misalnya penyelenggara, tingkat, lokasi, durasi, atau standar), gambar, caption gambar | Data prestasi (tabel prestasi) |

### 5. Tentang Kami (/tentang-kami)

Halaman ini bersifat naratif dan hampir seluruhnya berisi teks yang jarang berubah.

| Bagian | Komponen | Jenis data |
| --- | --- | --- |
| Hero halaman | Breadcrumb, judul, subjudul | Teks statis |
| Sejarah organisasi | Label, judul, dua paragraf sejarah, foto dokumentasi dengan caption | Teks panjang, gambar (tabel konten_statis) |
| Visi | Kartu berisi satu paragraf visi | Teks (tabel konten_statis) |
| Misi | Kartu berisi daftar poin misi | Daftar teks (tabel misi_poin) |
| Kode Etik Pencinta Alam | Judul, label, kutipan kode etik, keterangan penetapan | Teks (tabel konten_statis) |

### 6. Login (/login)

Login adalah portal masuk anggota yang memakai No. Register sebagai username. Pada versi zip yang dibaca, form belum terhubung ke backend, sedangkan rekap admin menunjukkan endpoint POST /auth/login sudah tersedia.

| Bagian | Komponen | Jenis data |
| --- | --- | --- |
| Kepala portal | Logo, judul "Portal Anggota", subjudul sistem keanggotaan | Teks statis |
| Catatan akun | Penjelasan username, kewajiban ganti password dan persetujuan Kebijakan Privasi pada login pertama | Teks statis |
| Form login | Kolom username (No. Register), kolom password dengan tombol lihat atau sembunyikan, tautan "Lupa Password" (email ke sekretariat), tombol masuk | Kredensial anggota (tabel users) |
| Bantuan | Ajakan menghubungi admin kesekretariatan untuk akun baru atau reset password | Teks statis |
| Footer mini | Teks hak cipta singkat | Teks statis |

**Alur yang perlu didukung database:** verifikasi No. Register dan password, penanda login pertama, penggantian password default, dan pencatatan persetujuan Kebijakan Privasi. Setelah berhasil masuk, anggota memakai menu pada Bagian B. Data yang dipakai: tabel users (password_hash, must_change_password, failed_login_count, locked_until) serta kebijakan_privasi dan persetujuan_data untuk catatan persetujuan per versi kebijakan.

## Bagian B: Anggota (Setelah Login)

Menu ditampilkan di sidebar dan sengaja lebih ringkas daripada menu publik, karena fungsi utamanya adalah memperbarui data dan menemukan sesama anggota.

**Gerbang login pertama:** anggota wajib mengganti password, membaca dan menyetujui kebijakan penggunaan data, lalu melengkapi profil sebelum dapat mengakses menu di bawah (FR-11, FR-44, FR-17).

| No. | Menu | Isi dan fungsi | FR terkait |
| --- | --- | --- | --- |
| 1 | Dashboard Anggota | Ringkasan identitas anggota, status registrasi ulang periode berjalan (belum atau sudah, beserta waktunya), dan pemberitahuan bila biodata atau registrasi ulang perlu dilengkapi | FR-16 |
| 2 | Biodata Saya | Menampilkan data tetap dan data registrasi ulang terbaru. Data tetap dapat diubah anggota, kecuali No. Register. Riwayat registrasi ulang periode sebelumnya dapat dilihat (hanya baca) | FR-17, FR-18, FR-26 |
| 3 | Registrasi Ulang | Formulir untuk memeriksa dan memperbarui data berkala serta status kepemilikan atribut. Hanya dapat diisi saat periode dibuka admin. Setelah disimpan, sistem mencatat status "Sudah Registrasi Ulang" beserta waktunya | FR-21 s.d. FR-25, FR-27 |
| 4 | Direktori Anggota | Mencari anggota lain berdasarkan nama atau No. Register, dengan filter domisili dan golongan darah. Hanya anggota yang telah memberikan persetujuan yang ditampilkan | FR-46, FR-47 |
| 5 | Pengaturan Akun | Mengganti password (memasukkan password lama), membaca kembali Kebijakan Privasi dan Persetujuan Penggunaan Data, serta logout | FR-12, FR-45, FR-14 |

### Data pada Biodata, Registrasi Ulang, dan Direktori

| Jenis data | Isi | Aturan |
| --- | --- | --- |
| Data tetap | No. Register, nama, divisi, angkatan, tempat dan tanggal lahir, golongan darah, nama ayah dan ibu | Dapat diubah anggota, kecuali No. Register Tabel anggota. |
| Data registrasi ulang | Alamat rumah (beserta kota/kabupaten dan provinsi), alamat orang tua, pekerjaan, No. HP, email, media sosial (boleh lebih dari satu), foto, status kepemilikan atribut, foto atribut | Diisi tiap periode. Data periode sebelumnya terisi otomatis, kecuali Foto Atribut yang hanya terisi otomatis dalam tahun yang sama Tabel registrasi_ulang, registrasi_media_sosial, registrasi_atribut. |
| Status registrasi ulang | Belum atau sudah registrasi ulang, beserta waktunya | Tidak disimpan sebagai kolom: belum ada baris registrasi pada periode itu berarti belum registrasi. Waktu = submitted_at, sumber input = mandiri atau admin (tabel registrasi_ulang). |
| Data yang tampil di direktori | Nama, No. Register, No. HP, golongan darah, alamat tempat tinggal saat ini (alamat rumah, kota/kabupaten, provinsi) | Hanya dari anggota aktif yang telah menyetujui kebijakan versi aktif (view v_direktori_anggota). |

## Bagian C: Admin (Dashboard Pengelola)

Dashboard admin disajikan di /admin. Semua rute /api/admin/\* hanya untuk admin yang sudah login (memakai token). Sidebar berisi 6 menu.

| No. | Menu (sidebar) | Kode FR | Isi dan fitur | Endpoint utama (/api/admin) |
| --- | --- | --- | --- | --- |
| 1 | Ringkasan Dashboard | FR-28 | Statistik total anggota, jumlah sudah dan belum registrasi ulang beserta persentasenya, grafik distribusi anggota per divisi, sebaran angkatan teratas, dan aktivitas terkini | GET /dashboard/stats |
| 2 | Data Anggota | FR-29 s.d. FR-33, FR-35, FR-38 | Daftar dan detail anggota, tambah dan edit biodata, aktifkan atau nonaktifkan anggota, reset password, cetak biodata (PDF), unduh template, impor massal (preview lalu simpan), ekspor Excel | /members, /members/:no_register, /members/import-preview, /members/import-commit, /members/export, /members/template |
| 3 | Monitoring Registrasi | FR-34, FR-32 | Memantau status registrasi ulang tahunan. Admin dapat menginput registrasi ulang atas nama anggota (override) Daftar menampilkan juga waktu pembaruan terakhir dan sumber input (mandiri atau admin). Tabel registrasi_ulang dan periode_registrasi. | GET /registrations/monitoring, POST /registrations/override |
| 4 | Periode & Divisi | FR-33 | Periode registrasi ulang: lihat, tambah, buka atau tutup. Divisi: tambah, edit, hapus. Atribut tetap (Topi Rimba dan Baju Lapangan) hanya dilihat Tabel periode_registrasi, divisi, jenis_atribut. PRD FR-33 mengizinkan admin mengatur jenis atribut (lihat Catatan Perbaikan). | /periodes, /divisions, /attributes |
| 5 | Manajemen Konten (CMS) | FR-39 s.d. FR-42 | Pengelolaan konten website, terdiri dari 4 sub-tab (tabel di bawah) | /cms/... |
| 6 | Log Audit & Akun | FR-36, FR-12 | Jejak aktivitas admin (audit trail) dan form ganti kata sandi admin Tabel log_aktivitas. | GET /logs, POST /auth/change-password |

### Sub-tab Manajemen Konten (CMS)

| Sub-tab | Kode FR | Fitur | Tampil di Bagian A | Endpoint (/api/admin) |
| --- | --- | --- | --- | --- |
| Artikel & Kegiatan | FR-39 | CRUD artikel dengan multi-gambar (satu gambar sampul ditandai is_sampul, sisanya galeri), kategori, divisi, lokasi, jadwal, dan status draf atau terbit. Tabel artikel dan artikel_gambar | Kegiatan & Artikel, Detail Artikel, kartu kegiatan di Beranda | /cms/articles, /cms/articles/:id |
| Struktur Organisasi | FR-40 | Unggah bagan lewat form: periode kepengurusan, keterangan/judul bagan, berkas gambar (JPG, PNG, WEBP, maks 5 MB), tombol "Simpan & Publikasikan Bagan", dan pratinjau gambar struktur aktif (tabel bagan_struktur dan periode_kepengurusan) | Struktur Organisasi, bagian struktur di Beranda | /cms/struktur |
| Prestasi | FR-41 | Tambah dan hapus catatan prestasi (tabel prestasi) | Prestasi, bagian prestasi di Beranda | /cms/prestasi, /cms/prestasi/:id |
| Tentang Kami & Kontak | FR-42 | Konten statis: baca dan ubah (tabel konten_statis, misi_poin, statistik_beranda, tautan_sosial) | Tentang Kami, kontak sekretariat di footer | GET/PUT /cms/static-content |

### Autentikasi (/api/auth)

| Fungsi | Endpoint |
| --- | --- |
| Login | POST /auth/login |
| Ganti kata sandi | POST /auth/change-password |
| Profil pengguna | GET /auth/me |

Total ada 40 endpoint: 37 di /api/admin dan 3 di /api/auth. Isi form dan kolom tabel di tiap menu belum ditelusuri sampai ke admin-app.js dan controller. Halaman masuk khusus admin juga tidak disebut di sumber, jadi belum jelas apakah admin memakai halaman Login yang sama dengan anggota.

## Kebutuhan Data Gabungan untuk Database

Tabel ini menyatukan kebutuhan data dari ketiga bagian dan memetakannya ke 23 tabel pada ERD. Satu entitas bisa dipakai di beberapa bagian, misalnya divisi dan bagan struktur dibaca di Bagian A tetapi dikelola di Bagian C. Kolom Tabel ERD menunjuk nama tabel pada ERD.

| Entitas | Tabel ERD | Dipakai di | Atribut utama |
| --- | --- | --- | --- |
| Akun pengguna | users | A: Login. B: seluruh menu. C: Autentikasi | username (No. Register), password_hash, role (anggota atau admin), anggota_id, is_active, must_change_password, failed_login_count, locked_until, last_login_at |
| Anggota (data tetap) | anggota | B: Biodata, Direktori. C: Data Anggota, Dashboard | no_register, nama, divisi_id, angkatan, tempat dan tanggal lahir, golongan_darah, nama_ayah, nama_ibu, is_active, profil_lengkap, updated_at |
| Divisi | divisi | A: Beranda, Struktur Organisasi, Footer, filter hero. B: Biodata. C: Periode & Divisi, Dashboard | nama, slug, ikon, deskripsi, urutan, aktif. |
| Periode registrasi | periode_registrasi | B: Registrasi Ulang. C: Periode & Divisi | nama, tahun (unik), tanggal_buka, tanggal_tutup, status (buka atau tutup) |
| Registrasi ulang | registrasi_ulang | B: Registrasi Ulang, Biodata (riwayat), Dashboard. C: Monitoring Registrasi, Data Anggota | anggota_id dan periode_id (unik berpasangan), foto, alamat_rumah, kota_kabupaten, provinsi, pekerjaan, no_hp, email, alamat_orang_tua, sumber_input, diinput_oleh, submitted_at, updated_at |
| Media sosial registrasi | registrasi_media_sosial | B: Registrasi Ulang | registrasi_id, platform, akun |
| Jenis atribut | jenis_atribut | B: Registrasi Ulang. C: Periode & Divisi | nama (Topi Rimba, Baju Lapangan), aktif, urutan |
| Atribut per registrasi | registrasi_atribut | B: Registrasi Ulang | registrasi_id, jenis_atribut_id, memiliki, foto_path |
| Kebijakan privasi | kebijakan_privasi | B: gerbang login pertama, Pengaturan Akun | versi (unik), judul, isi, berlaku_sejak, aktif |
| Persetujuan penggunaan data | persetujuan_data | B: gerbang login pertama, Direktori, Pengaturan Akun | anggota_id, kebijakan_id (unik berpasangan), disetujui_at |
| Artikel/kegiatan | artikel | A: Beranda, Kegiatan & Artikel, Detail Artikel. C: CMS Artikel & Kegiatan | kategori_id, divisi_id, lokasi_id, jadwal_id, penulis_id, judul, slug, ringkasan, isi, status_kegiatan, tim_capaian, tanggal_kegiatan, status_publikasi (draf atau terbit), published_at |
| Gambar artikel | artikel_gambar | A: kartu kegiatan, Detail Artikel. C: CMS Artikel & Kegiatan | artikel_id, path, caption, is_sampul, urutan |
| Kategori kegiatan | kategori_artikel | A: filter di Kegiatan & Artikel. C: CMS Artikel & Kegiatan | nama, slug, urutan |
| Lokasi/jalur dan jadwal operasional | lokasi, jadwal_operasional | A: filter hero Beranda | nama, slug (masing-masing tabel) |
| Periode kepengurusan | periode_kepengurusan | A: Struktur Organisasi, Beranda. C: CMS Struktur Organisasi | nama (mis. 2025/2026), tahun_mulai, tahun_selesai, is_current |
| Gambar bagan struktur | bagan_struktur | A: Struktur Organisasi, Beranda. C: CMS Struktur Organisasi | periode_kepengurusan_id, judul, gambar_path, is_aktif, uploaded_at |
| Prestasi | prestasi | A: Beranda, Prestasi. C: CMS Prestasi | tahun, kategori, judul, deskripsi, info_label_1, info_label_2, gambar_path, gambar_caption, is_sorotan, sorotan_judul, sorotan_subjudul, sorotan_detail, urutan |
| Konten statis | konten_statis | A: Beranda, Tentang Kami, Footer. C: CMS Tentang Kami & Kontak | kunci (sejarah, visi, kode_etik, kontak_email, kontak_alamat, hero_foto, ...), nilai, kelompok, updated_at |
| Misi organisasi | misi_poin | A: Tentang Kami. C: CMS Tentang Kami & Kontak | teks, urutan |
| Statistik Beranda | statistik_beranda | A: Beranda. C: CMS Tentang Kami & Kontak | ikon, angka, satuan, label, urutan |
| Tautan sosial media | tautan_sosial | A: Footer. C: CMS Tentang Kami & Kontak | platform, url, urutan |
| Log audit | log_aktivitas | C: Log Audit & Akun | user_id, aksi, entitas, entitas_id, data_lama, data_baru, ip_address, created_at |

## Catatan Perbaikan Antarbagian

Setelah ERD disusun, dua belas hal berikut perlu dicatat. Tiap butir diberi status: "Tertangani di ERD" berarti rancangan tabelnya sudah mengakomodasi, "Perlu diputuskan" berarti butuh keputusan Anda, dan "Pekerjaan kode" berarti perlu dikerjakan di aplikasi.

1.  Tertangani di ERD: satu tabel divisi dipakai Beranda, footer, filter hero, dan biodata anggota. Pastikan semua halaman membaca tabel ini, bukan teks yang ditulis langsung di HTML.

2.  Tertangani di ERD: halaman publik hanya menampilkan gambar bagan (tabel bagan_struktur), sehingga tabel pengurus tidak diperlukan. Pekerjaan kode: kartu Ketua Umum, Sekjen, Bendum, dan ketua divisi di Beranda serta endpoint /cms/pengurus perlu dihapus atau diganti gambar bagan.

3.  Tertangani di ERD: tidak ada tabel tersendiri. Jika ingin tampil, cukup dimasukkan ke dalam gambar bagan yang diunggah admin.

4.  Tertangani di ERD: tabel artikel_gambar memiliki penanda is_sampul. Kartu memakai gambar sampul, halaman detail dapat menampilkan galerinya. Halaman publik tetap perlu disesuaikan.

5.  Perlu diputuskan: CMS Prestasi masih hanya tambah dan hapus, padahal PRD FR-41 meminta prestasi dapat diubah. Tabel prestasi sudah mendukung perubahan data, sehingga fitur edit perlu ditambahkan.

6.  Tertangani di ERD: master kategori_artikel dipakai CMS artikel dan tab filter, dengan lima kategori awal sesuai PRD FR-05 pada skrip SQL.

7.  Pekerjaan kode: filter hero memakai divisi, lokasi, dan jadwal_operasional yang terhubung ke artikel. Pencarian harus dihubungkan ke data, dan halaman Prestasi perlu membaca tabel prestasi.

8.  Tertangani di ERD: satu tabel users dengan kolom role, sehingga cocok untuk satu halaman login dengan pengalihan berdasarkan peran. Perlu dipastikan di kode. Rekap sebelumnya menyebut token, PRD FR-09 menyebut username dan password.

9.  Perlu diputuskan: halaman Kontak ada di PRD (FR-01 dan FR-07), tetapi tidak ada di lima menu publik pada rekap ini; kontak hanya muncul di footer. Data kontak sudah tertampung di konten_statis dan tautan_sosial, tinggal diputuskan apakah dibuat halaman sendiri.

10. Perlu diputuskan: PRD FR-33 mengizinkan admin mengatur jenis atribut yang didata, sedangkan menu Periode & Divisi saat ini hanya menampilkan atribut. ERD mengikuti PRD (jenis_atribut punya kolom aktif dan urutan).

11. Pekerjaan kode: konten statis dipecah menjadi empat tabel (konten_statis, misi_poin, statistik_beranda, tautan_sosial). Endpoint GET/PUT /cms/static-content perlu mencakup keempatnya, atau ditambah endpoint terpisah.

12. Pekerjaan kode: PRD FR-22 dan FR-47 meminta kota/kabupaten, provinsi, dan alamat orang tua pada registrasi ulang untuk filter domisili. Data ini sebelumnya belum tercantum pada rekap, sehingga formulir registrasi ulang, biodata, direktori, dan filter admin perlu memuatnya.
