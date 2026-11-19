const xlsx = require('xlsx');
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const { query } = require('../config/mysql');

/**
 * Generate Excel Template for bulk importing members (FR-31)
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
 * Convert Excel date serial numbers (e.g. 38748), ISO dates (YYYY-MM-DD),
 * and Indonesian formatted dates (DD/MM/YYYY or DD-MM-YYYY) to standard YYYY-MM-DD string.
 */
function parseExcelDate(val) {
  if (val === null || val === undefined) return null;

  // If already a valid Date object
  if (val instanceof Date && !isNaN(val.getTime())) {
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const d = String(val.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // If numeric or numeric string (Excel serial date code, e.g. 38748 or 37945)
  const num = typeof val === 'number'
    ? val
    : (typeof val === 'string' && /^\d{4,6}(\.\d+)?$/.test(val.trim()) ? parseFloat(val.trim()) : NaN);

  if (!isNaN(num) && num > 1000 && num < 100000) {
    // 25569 is Jan 1 1970 UTC in Excel serial system
    const utcDays = Math.floor(num - 25569);
    const utcValue = utcDays * 86400 * 1000;
    const dateInfo = new Date(utcValue);
    const y = dateInfo.getUTCFullYear();
    const m = String(dateInfo.getUTCMonth() + 1).padStart(2, '0');
    const d = String(dateInfo.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  const str = String(val).trim();
  if (!str) return null;

  // Match ISO YYYY-MM-DD or YYYY/MM/DD
  const isoMatch = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (isoMatch) {
    const y = isoMatch[1];
    const m = isoMatch[2].padStart(2, '0');
    const d = isoMatch[3].padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // Match DD/MM/YYYY or DD-MM-YYYY (Indonesian format)
  const idMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  if (idMatch) {
    const d = idMatch[1].padStart(2, '0');
    const m = idMatch[2].padStart(2, '0');
    const y = idMatch[3];
    return `${y}-${m}-${d}`;
  }

  // Fallback native Date parse for standard string representation
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime()) && parsed.getFullYear() > 1900 && parsed.getFullYear() < 2100) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  return null;
}

/**
 * Helper to get a field value regardless of case or delimiter variations in header
 */
function getRowField(row, aliases) {
  const rowKeys = Object.keys(row);
  for (const alias of aliases) {
    const cleanAlias = alias.trim().toLowerCase().replace(/[\s_.-]+/g, '');
    for (const key of rowKeys) {
      const cleanKey = key.trim().toLowerCase().replace(/[\s_.-]+/g, '');
      if (cleanKey === cleanAlias) {
        return row[key];
      }
    }
  }
  return '';
}

/**
 * Parse and Preview Excel or CSV file
 * Identifies errors, empty mandatory fields, and duplicates against MySQL (FR-31)
 */
async function previewExcelFile(filePath) {
  const wb = xlsx.readFile(filePath);
  const sheetName = wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];
  const rows = xlsx.utils.sheet_to_json(sheet, { defval: '' });

  const normalizeKey = str => (str || '').replace(/[\s\.\-]+/g, '').toUpperCase();

  // Query existing members directly from MySQL
  let existingRegs = new Set();
  try {
    const existingRows = await query('SELECT no_register FROM anggota');
    existingRegs = new Set(existingRows.map(m => normalizeKey(m.no_register)));
  } catch {
    const existingMembers = db.get('members');
    existingRegs = new Set(existingMembers.map(m => normalizeKey(m.no_register)));
  }

  const seenInFile = new Set();
  const previewResults = [];
  let validCount = 0;
  let errorCount = 0;
  let duplicateCount = 0;

  rows.forEach((row, index) => {
    const rowNum = index + 2; // Header is row 1
    const raw_no_reg = String(getRowField(row, ['No_Register', 'no_register', 'No Register', 'No. Register', 'No Reg', 'NoReg', 'Register']) || '').trim();
    const nama = String(getRowField(row, ['Nama_Lengkap', 'nama_lengkap', 'Nama Lengkap', 'Nama', 'nama', 'Nama_Lengkap_Sesuai_KTP']) || '').trim();
    let divisi = String(getRowField(row, ['Divisi', 'divisi', 'Bidang', 'Spesialisasi']) || '').trim();
    const angkatan = parseInt(getRowField(row, ['Angkatan', 'angkatan', 'Tahun_Angkatan', 'Tahun Angkatan']) || 0, 10);
    const tempat_lahir = String(getRowField(row, ['Tempat_Lahir', 'tempat_lahir', 'Tempat Lahir', 'TempatLahir']) || '').trim();
    const raw_tanggal = getRowField(row, ['Tanggal_Lahir_YYYY_MM_DD', 'tanggal_lahir', 'Tanggal_Lahir', 'Tanggal Lahir', 'Tgl_Lahir', 'Tgl Lahir', 'TglLahir', 'BirthDate']);
    const golongan_darah = String(getRowField(row, ['Golongan_Darah', 'golongan_darah', 'Golongan Darah', 'Goldar', 'goldar', 'Gol Darah']) || '').trim().toUpperCase();
    const nama_ayah = String(getRowField(row, ['Nama_Ayah', 'nama_ayah', 'Nama Ayah', 'Ayah']) || '').trim();
    const nama_ibu = String(getRowField(row, ['Nama_Ibu', 'nama_ibu', 'Nama Ibu', 'Ibu']) || '').trim();

    const errors = [];
    let no_reg = raw_no_reg;

    // Validasi Format No Register: MU XXX(digit angka) Xxx.
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
      const key = normalizeKey(no_reg);

      if (seenInFile.has(key)) {
        errors.push(`Duplikat di dalam file pada No Register: ${no_reg}`);
      } else if (existingRegs.has(key)) {
        errors.push(`No Register ${no_reg} sudah terdaftar di database MySQL`);
      }
    }

    if (!nama) {
      errors.push('Nama Lengkap tidak boleh kosong');
    }

    if (!divisi) {
      errors.push('Divisi wajib diisi');
    } else {
      // Normalisasi nama divisi untuk display & matching
      const divLower = divisi.toLowerCase();
      if (divLower.includes('rimba') || divLower === 'rgm') {
        divisi = 'Rimba Gunung';
      } else if (divLower.includes('panjat') || divLower.includes('tebing') || divLower === 'pct') {
        divisi = 'Panjat Tebing';
      } else if (divLower.includes('air') || divLower.includes('arus') || divLower.includes('jeram') || divLower === 'ora') {
        divisi = 'Olahraga Air';
      } else if (divLower.includes('caving') || divLower.includes('gua') || divLower === 'cvg') {
        divisi = 'Caving';
      }
    }

    if (!angkatan || isNaN(angkatan) || angkatan < 1970 || angkatan > 2035) {
      errors.push('Angkatan harus berupa tahun valid (1970 - 2035)');
    }

    // Parse dan validasi Tanggal Lahir (mendukung format Excel serial, DD/MM/YYYY, YYYY-MM-DD)
    let tanggal_lahir = '';
    if (raw_tanggal !== '' && raw_tanggal !== undefined && raw_tanggal !== null) {
      const parsedDate = parseExcelDate(raw_tanggal);
      if (parsedDate) {
        tanggal_lahir = parsedDate;
      } else {
        errors.push(`Format tanggal lahir '${raw_tanggal}' tidak valid (gunakan YYYY-MM-DD atau DD/MM/YYYY)`);
      }
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
      seenInFile.add(normalizeKey(no_reg));
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
 * Commit validated rows into in-memory store as fallback
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
      tanggal_lahir: parseExcelDate(row.tanggal_lahir) || '',
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
 * Export member data to Excel / CSV Buffer with filters (FR-35)
 */
function exportMembersToExcel(membersList, periodYear = 2026, format = 'xlsx') {
  const exportData = membersList.map((m, idx) => {
    const isReg = m.reg_status === 'Sudah Registrasi';
    return {
      No: idx + 1,
      'No. Register': m.no_register,
      'Nama Lengkap': m.nama,
      Divisi: m.divisi || '-',
      Angkatan: m.angkatan || '-',
      'Golongan Darah': m.golongan_darah || '-',
      'Tempat Lahir': m.tempat_lahir || '-',
      'Tanggal Lahir': m.tanggal_lahir || '-',
      'Status Keanggotaan': (m.status_aktif || m.is_active) ? 'Aktif' : 'Nonaktif',
      'Status Registrasi Ulang': m.reg_status || (isReg ? 'Sudah Registrasi' : 'Belum Registrasi'),
      'Nomor HP / WhatsApp': m.no_hp || '-',
      Email: m.email || '-',
      'Kontak Darurat': m.kontak_darurat || '-',
      'Kota/Kab Domisili': m.domisili_kota || m.kota_kabupaten || '-',
      'Provinsi Domisili': m.domisili_provinsi || m.provinsi || '-',
      Pekerjaan: m.pekerjaan || '-',
      'Sumber Input': m.sumber_input ? (m.sumber_input === 'admin' ? 'Diinput Admin' : 'Mandiri') : '-',
      'Waktu Registrasi': m.submitted_at || '-'
    };
  });

  const ws = xlsx.utils.json_to_sheet(exportData);
  const wb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb, ws, `Data_Anggota_${periodYear}`);

  const bookType = format === 'csv' ? 'csv' : 'xlsx';
  return xlsx.write(wb, { type: 'buffer', bookType });
}

module.exports = {
  generateTemplateWorkbook,
  previewExcelFile,
  commitImportedMembers,
  exportMembersToExcel,
  parseExcelDate
};
