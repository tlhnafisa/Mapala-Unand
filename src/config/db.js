const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DATA_DIR = path.join(__dirname, '../../data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial Seed Data Generator
function generateInitialData() {
  const salt = bcrypt.genSaltSync(10);
  const adminPasswordHash = bcrypt.hashSync('admin123', salt);
  const defaultMemberPasswordHash = bcrypt.hashSync('mapala123', salt);

  // 4 Divisi Resmi Mapala UNAND (Dapat dikelola/ditambah di menu Kelola Divisi)
  const divisions = [
    { id: 'DIV-001', nama_divisi: 'Rimba Gunung', kode: 'RGM', deskripsi: 'Spesialisasi penjelajahan rimba belantara dan pendakian gunung' },
    { id: 'DIV-002', nama_divisi: 'Panjat Tebing', kode: 'PCT', deskripsi: 'Spesialisasi panjat tebing alam dan panjat dinding (rock climbing)' },
    { id: 'DIV-003', nama_divisi: 'Olahraga Air', kode: 'OLA', deskripsi: 'Spesialisasi arung jeram (rafting), kayak, dan navigasi sungai deras' },
    { id: 'DIV-004', nama_divisi: 'Caving', kode: 'CAV', deskripsi: 'Spesialisasi susur gua alam dan eksplorasi speleologi' }
  ];

  // Atribut Resmi Tetap (Hanya Topi Rimba & Baju Lapangan - Tidak ada penambahan jenis)
  const atributs = [
    { id: 'ATR-001', nama_atribut: 'Topi Rimba', wajib: true, keterangan: 'Topi rimba resmi lapangan Mapala UNAND' },
    { id: 'ATR-002', nama_atribut: 'Baju Lapangan', wajib: true, keterangan: 'Baju dinas lapangan (PDL) resmi Mapala UNAND' }
  ];

  const bloodTypes = ['A', 'B', 'AB', 'O'];
  const cities = [
    { kota: 'Kota Padang', provinsi: 'Sumatera Barat' },
    { kota: 'Kota Bukittinggi', provinsi: 'Sumatera Barat' },
    { kota: 'Kota Solok', provinsi: 'Sumatera Barat' },
    { kota: 'Kota Payakumbuh', provinsi: 'Sumatera Barat' },
    { kota: 'Kabupaten Pesisir Selatan', provinsi: 'Sumatera Barat' },
    { kota: 'Kota Pekanbaru', provinsi: 'Riau' },
    { kota: 'Jakarta Selatan', provinsi: 'DKI Jakarta' },
    { kota: 'Kota Bandung', provinsi: 'Jawa Barat' },
    { kota: 'Kota Medan', provinsi: 'Sumatera Utara' }
  ];

  // 2 Akun Admin Resmi (P-06: Akun admin cukup 2)
  const users = [
    {
      id: 'USR-001',
      username: 'admin',
      nama: 'Administrator Mapala UNAND',
      password_hash: adminPasswordHash,
      role: 'admin',
      status_aktif: true,
      must_change_password: false,
      last_login: new Date().toISOString()
    },
    {
      id: 'USR-002',
      username: 'admin2',
      nama: 'Ketua Umum (Admin 2)',
      password_hash: adminPasswordHash,
      role: 'admin',
      status_aktif: true,
      must_change_password: false,
      last_login: null
    }
  ];

  // Members profile and regular accounts
  // Format: MU XXX(digit angka) XXX(3 huruf)
  const members = [];
  const reRegistrations = [];

  const sampleNames = [
    { nama: 'Rahmat Hidayat', no_reg: 'MU 280 RGM', angkatan: 2018, div: 0, goldar: 'O', hp: '081267890123' },
    { nama: 'Fajar Nugraha', no_reg: 'MU 285 PCT', angkatan: 2018, div: 1, goldar: 'A', hp: '081378901234' },
    { nama: 'Dian Permata Sari', no_reg: 'MU 292 CAV', angkatan: 2019, div: 3, goldar: 'B', hp: '085267123456' },
    { nama: 'Ilham Syahputra', no_reg: 'MU 301 OLA', angkatan: 2019, div: 2, goldar: 'AB', hp: '082189012345' },
    { nama: 'Budi Santoso', no_reg: 'MU 310 RGM', angkatan: 2020, div: 0, goldar: 'O', hp: '081234567890' },
    { nama: 'Reza Pratama', no_reg: 'MU 315 RGM', angkatan: 2020, div: 0, goldar: 'A', hp: '085378901234' },
    { nama: 'Siti Nurhaliza', no_reg: 'MU 320 CAV', angkatan: 2021, div: 3, goldar: 'B', hp: '087789012345' },
    { nama: 'Arif Gunawan', no_reg: 'MU 325 PCT', angkatan: 2021, div: 1, goldar: 'O', hp: '081987654321' },
    { nama: 'Taufik Hidayat', no_reg: 'MU 330 OLA', angkatan: 2022, div: 2, goldar: 'A', hp: '081345678912' },
    { nama: 'Aulia Rahman', no_reg: 'MU 335 CAV', angkatan: 2022, div: 3, goldar: 'AB', hp: '082267890123' },
    { nama: 'Indra Wijaya', no_reg: 'MU 120 RGM', angkatan: 1995, div: 0, goldar: 'O', hp: '081122334455' },
    { nama: 'Yusuf Mansur', no_reg: 'MU 145 PCT', angkatan: 1998, div: 1, goldar: 'B', hp: '081299887766' },
    { nama: 'Zulham Efendi', no_reg: 'MU 180 CAV', angkatan: 2003, div: 3, goldar: 'A', hp: '085211223344' },
    { nama: 'Hendri Marlis', no_reg: 'MU 215 OLA', angkatan: 2008, div: 2, goldar: 'O', hp: '081377889900' },
    { nama: 'Doni Arman', no_reg: 'MU 250 RGM', angkatan: 2014, div: 0, goldar: 'B', hp: '087811223344' }
  ];

  sampleNames.forEach((item, index) => {
    const city = cities[index % cities.length];
    const isRegistered = index % 3 !== 0;

    // User account
    users.push({
      id: `USR-${100 + index}`,
      username: item.no_reg,
      nama: item.nama,
      password_hash: defaultMemberPasswordHash,
      role: 'anggota',
      status_aktif: true,
      must_change_password: true,
      last_login: isRegistered ? new Date(Date.now() - index * 86400000).toISOString() : null
    });

    // Member profile
    members.push({
      id: `MBR-${100 + index}`,
      no_register: item.no_reg,
      nama: item.nama,
      divisi: divisions[item.div % divisions.length].nama_divisi,
      angkatan: item.angkatan,
      tempat_lahir: city.kota,
      tanggal_lahir: `199${(index % 9) + 1}-0${(index % 9) + 1}-15`,
      golongan_darah: item.goldar,
      nama_ayah: `Ayahanda ${item.nama.split(' ')[0]}`,
      nama_ibu: `Ibunda ${item.nama.split(' ')[0]}`,
      status_aktif: true,
      created_at: new Date('2026-01-10').toISOString(),
      updated_at: new Date().toISOString()
    });

    // Re-registration record for 2026 (Atribut: Topi Rimba & Baju Lapangan)
    if (isRegistered) {
      reRegistrations.push({
        id: `REG-${2026}-${100 + index}`,
        no_register: item.no_reg,
        periode_tahun: 2026,
        foto_terbaru: `/uploads/default-avatar.png`,
        alamat_rumah: `Jl. Melati No. ${index + 10}, Kel. Anduring`,
        kota_kabupaten: city.kota,
        provinsi: city.provinsi,
        pekerjaan: index > 9 ? 'Wiraswasta / Pegawai' : 'Mahasiswa',
        no_hp: item.hp,
        email: `${item.nama.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
        media_sosial: `@${item.nama.toLowerCase().replace(/\s+/g, '')}`,
        alamat_ortu: `Komp. Griya Indah Blok C/${index + 1}, ${city.kota}`,
        status_registrasi: 'Sudah Registrasi Ulang',
        sumber_input: index % 4 === 0 ? 'admin' : 'mandiri',
        input_by: index % 4 === 0 ? 'admin (override)' : item.nama,
        submitted_at: new Date(Date.now() - (index + 1) * 3600000 * 24).toISOString(),
        updated_at: new Date(Date.now() - (index + 1) * 3600000 * 24).toISOString(),
        atribut: [
          { atribut_id: 'ATR-001', nama: 'Topi Rimba', status: 'Ada', foto: null },
          { atribut_id: 'ATR-002', nama: 'Baju Lapangan', status: 'Ada', foto: null }
        ]
      });
    }
  });

  const periodes = [
    {
      id: 'PRD-2026',
      tahun: 2026,
      nama_periode: 'Registrasi Ulang Tahunan 2026',
      tanggal_buka: '2026-01-01',
      tanggal_tutup: '2026-12-31',
      is_active: true,
      deskripsi: 'Periode aktif pendataan berkala dan pembaruan domisili anggota seumur hidup Mapala UNAND.'
    },
    {
      id: 'PRD-2025',
      tahun: 2025,
      nama_periode: 'Registrasi Ulang Tahunan 2025',
      tanggal_buka: '2025-01-01',
      tanggal_tutup: '2025-12-31',
      is_active: false,
      deskripsi: 'Periode registrasi ulang tahun 2025 (Arsip).'
    }
  ];

  const articles = [
    {
      id: 'ART-001',
      judul: 'Ekspedisi Tiga Puncak: Penjelajahan Alam Pegunungan Bukit Barisan',
      kategori: 'ekspedisi',
      foto: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
      tanggal: '2026-10-15',
      status: 'terbit',
      penulis: 'Bidang Humas & Publikasi',
      isi: 'Kegiatan ekspedisi tahunan penjelajahan gugusan Bukit Barisan sukses dilaksanakan oleh anggota muda dan senior Mapala UNAND dengan memetakan titik keanekaragaman hayati dan konservasi sumber air.'
    },
    {
      id: 'ART-002',
      judul: 'Aksi Bersih Goa Ngalau Indah & Edukasi Karst Ramah Lingkungan',
      kategori: 'caving',
      foto: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80',
      tanggal: '2026-09-22',
      status: 'terbit',
      penulis: 'Divisi Caving',
      isi: 'Divisi Susur Gua Mapala UNAND mengadakan aksi bersih gua dan pemetaan lorong karst untuk menjaga ekosistem endemik serta biota gua dari ancaman sampah plastik.'
    },
    {
      id: 'ART-003',
      judul: 'Pelatihan Navigasi Darat dan Survival Anggota Muda 2026',
      kategori: 'kegiatan lapangan',
      foto: 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=1200&q=80',
      tanggal: '2026-11-01',
      status: 'draf',
      penulis: 'Bidang Operasional',
      isi: 'Draf dokumentasi persiapan materi orientasi medan, kompas bidik, peta resection, dan penanganan darurat di hutan hujan tropis.'
    }
  ];

  const pengurus = [
    { id: 'PGR-001', nama: 'Fajar Nugraha (MU 285 PCT)', jabatan: 'Ketua Umum', bidang: 'Badan Pengurus Harian', foto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80', periode: '2025/2026' },
    { id: 'PGR-002', nama: 'Dian Permata Sari (MU 292 CAV)', jabatan: 'Sekretaris Umum', bidang: 'Kesekretariatan', foto: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80', periode: '2025/2026' },
    { id: 'PGR-003', nama: 'Ilham Syahputra (MU 301 OLA)', jabatan: 'Bendahara Umum', bidang: 'Kebendaharaan', foto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80', periode: '2025/2026' },
    { id: 'PGR-004', nama: 'Reza Pratama (MU 315 RGM)', jabatan: 'Ketua Bidang Organisasi', bidang: 'Organisasi & Keanggotaan', foto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80', periode: '2025/2026' }
  ];

  const prestasi = [
    { id: 'PRS-001', judul: 'Juara 1 Kejuaraan Nasional Panjat Dinding Mahasiswa se-Indonesia', tahun: '2025', deskripsi: 'Pencapaian medali emas kategori Lead Climbing Putra tingkat universitas nasional.', foto: 'https://images.unsplash.com/photo-1522163182402-834f871fd851?auto=format&fit=crop&w=600&q=80' },
    { id: 'PRS-002', judul: 'Penghargaan Kalpataru Lingkungan Hidup Tingkat Provinsi', tahun: '2024', deskripsi: 'Atas dedikasi konservasi mata air dan penghijauan lereng Gunung Singgalang.', foto: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=600&q=80' }
  ];

  const kontenStatis = {
    tentang_kami: {
      sejarah: 'Mapala UNAND didirikan pada era 1980-an oleh para mahasiswa Universitas Andalas yang memiliki dedikasi tinggi terhadap pelestarian alam, penjelajahan alam bebas, kemanusiaan, dan kecintaan pada tanah air.',
      visi: 'Menjadi wadah pembinaan karakter generasi muda yang tangguh, berwawasan lingkungan, berintegritas, dan berkontribusi nyata bagi pelestarian alam serta masyarakat.',
      misi: '1. Mengembangkan potensi kepeloporan dan keahlian di alam bebas.\n2. Melaksanakan riset dan advokasi konservasi sumber daya alam.\n3. Mempererat persaudaraan seumur hidup antar-anggota lintas generasi.'
    },
    kontak: {
      email: 'sekretariat@mapalaunand.org',
      whatsapp: '6281234567890',
      alamat: 'Gedung Pusat Kegiatan Mahasiswa (PKM) Lt. 1, Universitas Andalas, Limau Manis, Padang, Sumatera Barat 25163',
      instagram: '@mapalaunand',
      youtube: 'Mapala UNAND Official',
      facebook: 'https://facebook.com/mapalaunand',
      tiktok: 'https://tiktok.com/@mapalaunand'
    },
    struktur_organisasi: {
      foto: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=1200&q=80',
      periode: '2025/2026',
      keterangan: 'Bagan Struktur Organisasi Resmi Mapala UNAND Periode 2025/2026'
    },
    beranda: {
      headline: 'Menjelajah Rimba, Menjaga Lestari, Mengabdi Sepanjang Hayat',
      subheadline: 'Sistem Informasi Manajemen Keanggotaan & Portal Resmi Mahasiswa Pecinta Alam Universitas Andalas.',
      hero_image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1920&q=80'
    }
  };

  const logs = [
    {
      id: 'LOG-001',
      waktu: new Date(Date.now() - 3600000 * 2).toISOString(),
      admin: 'admin',
      aksi: 'UPDATE_PERIODE',
      detail: 'Membuka periode Registrasi Ulang Tahunan 2026'
    },
    {
      id: 'LOG-002',
      waktu: new Date(Date.now() - 3600000 * 5).toISOString(),
      admin: 'admin',
      aksi: 'INPUT_RE_REGISTRATION',
      detail: 'Admin override: Input data registrasi ulang atas nama Arif Gunawan (MU 325 PCT)'
    },
    {
      id: 'LOG-003',
      waktu: new Date(Date.now() - 86400000).toISOString(),
      admin: 'admin',
      aksi: 'CREATE_ARTICLE',
      detail: 'Menerbitkan artikel baru: Ekspedisi Tiga Puncak Bukit Barisan'
    }
  ];

  return {
    users,
    members,
    reRegistrations,
    periodes,
    divisions,
    atributs,
    articles,
    pengurus,
    prestasi,
    kontenStatis,
    logs
  };
}

// Database helper
class JsonDatabase {
  constructor() {
    this.data = null;
    this.init();
  }

  init() {
    if (!fs.existsSync(DB_FILE)) {
      this.data = generateInitialData();
      this.save();
    } else {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        // Ensure divisions table exists
        if (!this.data.divisions) {
          this.data.divisions = [
            { id: 'DIV-001', nama_divisi: 'Rimba Gunung', kode: 'RGM', deskripsi: 'Spesialisasi penjelajahan rimba belantara dan pendakian gunung' },
            { id: 'DIV-002', nama_divisi: 'Panjat Tebing', kode: 'PCT', deskripsi: 'Spesialisasi panjat tebing alam dan panjat dinding (rock climbing)' },
            { id: 'DIV-003', nama_divisi: 'Olahraga Air', kode: 'OLA', deskripsi: 'Spesialisasi arung jeram (rafting), kayak, dan navigasi sungai deras' },
            { id: 'DIV-004', nama_divisi: 'Caving', kode: 'CAV', deskripsi: 'Spesialisasi susur gua alam dan eksplorasi speleologi' }
          ];
          this.save();
        }
      } catch (err) {
        console.error('Error reading database file, recreating from seed...', err);
        this.data = generateInitialData();
        this.save();
      }
    }
  }

  save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving database:', err);
    }
  }

  get(table) {
    return this.data[table] || [];
  }

  set(table, values) {
    this.data[table] = values;
    this.save();
  }

  reseed() {
    this.data = generateInitialData();
    this.save();
  }
}

const db = new JsonDatabase();

module.exports = db;
