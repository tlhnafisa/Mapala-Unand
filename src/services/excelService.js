const xlsx = require('xlsx');
const db = require('../config/db');
const bcrypt = require('bcryptjs');

/**
 * Generate Excel Template for bulk importing members
 */
function generateTemplateWorkbook() {
  const headers = [
    'No_Register',
    'Nama_Lengkap',
    'Divisi',
    'Angkatan',
    'Tempat_Lahir',
    'Tanggal_Lahir_YYYY_MM_DD',
    'Golongan_Darah',
    'Nama_Ayah',
    'Nama_Ibu'
  ];

  const sampleRows = [
    {
      No_Register: 'MU 340 Rgm.',
      Nama_Lengkap: 'Gilang Ramadhan',
      Divisi: 'Rimba Gunung',
      Angkatan: 2023,
      Tempat_Lahir: 'Kota Padang',
      Tanggal_Lahir_YYYY_MM_DD: '2004-05-12',
      Golongan_Darah: 'O',
      Nama_Ayah: 'Hasan Basri',
      Nama_Ibu: 'Rosmawati'
    },
    {
      No_Register: 'MU 341 Pct.',
      Nama_Lengkap: 'Nadia Safitri',
      Divisi: 'Panjat Tebing',
      Angkatan: 2023,
      Tempat_Lahir: 'Kota Bukittinggi',
      Tanggal_Lahir_YYYY_MM_DD: '2003-11-20',
      Golongan_Darah: 'B',
      Nama_Ayah: 'Syahril',
      Nama_Ibu: 'Nuraini'
    }
  ];

  const ws = xlsx.utils.json_to_sheet(sampleRows, { header: headers });
  const wb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb, ws, 'Template_Anggota');

  return xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

/**
 * Parse and Preview Excel or CSV file
 * Identifies errors, empty mandatory fields, and duplicates (FR-31)
 */
function previewExcelFile(filePath) {
  const wb = xlsx.readFile(filePath);
  const sheetName = wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];
  const rows = xlsx.utils.sheet_to_json(sheet, { defval: '' });

  const existingMembers = db.get('members');
  const existingRegs = new Set(existingMembers.map(m => (m.no_register || '').trim().toUpperCase()));
  const seenInFile = new Set();

  const previewResults = [];
  let validCount = 0;
  let errorCount = 0;
  let duplicateCount = 0;

  rows.forEach((row, index) => {
    const rowNum = index + 2; // header is row 1
    let raw_no_reg = (row['No_Register'] || row['no_register'] || '').toString().trim();
    const nama = (row['Nama_Lengkap'] || row['nama_lengkap'] || row['Nama'] || '').toString().trim();
    const divisi = (row['Divisi'] || row['divisi'] || '').toString().trim();
    const angkatan = parseInt(row['Angkatan'] || row['angkatan'] || 0, 10);
    const tempat_lahir = (row['Tempat_Lahir'] || row['tempat_lahir'] || '').toString().trim();
    const tanggal_lahir = (row['Tanggal_Lahir_YYYY_MM_DD'] || row['tanggal_lahir'] || '').toString().trim();
    const golongan_darah = (row['Golongan_Darah'] || row['golongan_darah'] || '').toString().trim().toUpperCase();
    const nama_ayah = (row['Nama_Ayah'] || row['nama_ayah'] || '').toString().trim();
    const nama_ibu = (row['Nama_Ibu'] || row['nama_ibu'] || '').toString().trim();

    const errors = [];
    let no_reg = raw_no_reg;

    // Validasi Format No Register: MU XXX(digit angka) Xxx.(Huruf pertama besar, sisanya kecil diikuti titik)
    const regPattern = /^MU[\s-]?(\d{3})[\s-]?([A-Za-z]{3})\.?$/i;
    const match = raw_no_reg.match(regPattern);

    if (!raw_no_reg) {
      errors.push('No Register tidak boleh kosong');
    } else if (!match) {
      errors.push("Format No. Register harus 'MU XXX Xxx.' (contoh: MU 325 Ltn.)");
    } else {
      const code = match[2];
      const formattedCode = code[0].toUpperCase() + code.slice(1, 3).toLowerCase() + '.';
      no_reg = `MU ${match[1]} ${formattedCode}`;
      if (seenInFile.has(no_reg)) {
        errors.push(`Duplikat di dalam file pada No Register: ${no_reg}`);
      } else if (existingRegs.has(no_reg)) {
        errors.push(`No Register ${no_reg} sudah terdaftar di database`);
      }
    }

    if (!nama) {
      errors.push('Nama Lengkap tidak boleh kosong');
    }

    if (!divisi) {
      errors.push('Divisi wajib diisi');
    }

    if (!angkatan || isNaN(angkatan) || angkatan < 1980 || angkatan > 2030) {
      errors.push('Angkatan harus berupa tahun valid (1980 - 2030)');
    }

    const isValid = errors.length === 0;

    if (!isValid) {
      if (errors.some(e => e.includes('Duplikat') || e.includes('sudah terdaftar'))) {
        duplicateCount++;
      } else {
        errorCount++;
      }
    } else {
      validCount++;
      seenInFile.add(no_reg);
    }

    previewResults.push({
      rowNum,
      no_reg,
      nama,
      divisi,
      angkatan: angkatan || '',
      tempat_lahir,
      tanggal_lahir,
      golongan_darah,
      nama_ayah,
      nama_ibu,
      isValid,
      errors
    });
  });

  return {
    totalRows: rows.length,
    validCount,
    errorCount,
    duplicateCount,
    rows: previewResults
  };
}

/**
 * Commit validated rows into database
 */
function commitImportedMembers(validRows) {
  const members = db.get('members');
  const users = db.get('users');

  const salt = bcrypt.genSaltSync(10);
  const defaultPasswordHash = bcrypt.hashSync('mapala123', salt);

  const importedList = [];

  validRows.forEach(row => {
    const newMemberId = `MBR-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const memberRecord = {
      id: newMemberId,
      no_register: row.no_reg,
      nama: row.nama,
      divisi: row.divisi,
      angkatan: parseInt(row.angkatan, 10),
      tempat_lahir: row.tempat_lahir || '-',
      tanggal_lahir: row.tanggal_lahir || '',
      golongan_darah: row.golongan_darah || '-',
      nama_ayah: row.nama_ayah || '-',
      nama_ibu: row.nama_ibu || '-',
      status_aktif: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const userRecord = {
      id: `USR-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      username: row.no_reg,
      nama: row.nama,
      password_hash: defaultPasswordHash,
      role: 'anggota',
      status_aktif: true,
      must_change_password: true,
      last_login: null
    };

    members.push(memberRecord);
    users.push(userRecord);
    importedList.push(memberRecord);
  });

  db.set('members', members);
  db.set('users', users);

  return importedList;
}

/**
 * Export member data to Excel Buffer with filters
 */
function exportMembersToExcel(membersList, periodYear = 2026) {
  const reRegistrations = db.get('reRegistrations');
  const regMap = new Map();
  reRegistrations
    .filter(r => r.periode_tahun === periodYear)
    .forEach(r => regMap.set(r.no_register, r));

  const exportData = membersList.map((m, idx) => {
    const reg = regMap.get(m.no_register);
    return {
      No: idx + 1,
      'No. Register': m.no_register,
      'Nama Lengkap': m.nama,
      Divisi: m.divisi,
      Angkatan: m.angkatan,
      'Golongan Darah': m.golongan_darah || '-',
      'Tempat Lahir': m.tempat_lahir || '-',
      'Tanggal Lahir': m.tanggal_lahir || '-',
      'Status Keanggotaan': m.status_aktif ? 'Aktif' : 'Nonaktif',
      'Status Registrasi Ulang': reg ? 'Sudah Registrasi' : 'Belum Registrasi',
      'Nomor HP / WhatsApp': reg ? reg.no_hp : '-',
      Email: reg ? reg.email : '-',
      'Kota/Kab Domisili': reg ? reg.kota_kabupaten : '-',
      'Provinsi Domisili': reg ? reg.provinsi : '-',
      Pekerjaan: reg ? reg.pekerjaan : '-',
      'Sumber Input': reg ? (reg.sumber_input === 'admin' ? 'Diinput Admin' : 'Mandiri') : '-',
      'Waktu Registrasi': reg ? reg.submitted_at : '-'
    };
  });

  const ws = xlsx.utils.json_to_sheet(exportData);
  const wb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb, ws, `Data_Anggota_${periodYear}`);

  return xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

module.exports = {
  generateTemplateWorkbook,
  previewExcelFile,
  commitImportedMembers,
  exportMembersToExcel
};

