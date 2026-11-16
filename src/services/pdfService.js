/**
 * Form Biodata Anggota Penuh Mapala UNAND (Format MU 325 Ltn.)
 * Menghasilkan dokumen resmi A4 cetak / simpan PDF dengan layout rapi dan aman dari XSS
 */

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getSafeImageSrc(src) {
  if (!src || typeof src !== 'string') return null;
  const trimmed = src.trim();
  // WAJIB: Atribut src gambar hanya boleh path di /uploads atau /images (cegah path traversal & XSS)
  if (/^\/(uploads|images)\/[a-zA-Z0-9_\-\.\/]+$/.test(trimmed) && !trimmed.includes('..')) {
    return trimmed;
  }
  return null;
}

function formatDateIndo(dateStr) {
  if (!dateStr || dateStr === '-') return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return escapeHtml(dateStr);
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

function generatePrintableBiodataHTML(member, regData, attributes = []) {
  const currentDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const memberName = (member && (member.nama || member.nama_lengkap)) || '-';
  const rawPhoto = regData ? (regData.foto_path || regData.foto_terbaru) : null;
  const safePhotoSrc = getSafeImageSrc(rawPhoto);

  // Format Akun Media Sosial
  let medsosFormatted = '-';
  if (regData) {
    if (Array.isArray(regData.media_sosial_list) && regData.media_sosial_list.length > 0) {
      medsosFormatted = regData.media_sosial_list
        .map(m => `${escapeHtml(m.platform)}: ${escapeHtml(m.akun)}`)
        .join(', ');
    } else if (regData.media_sosial) {
      medsosFormatted = escapeHtml(regData.media_sosial);
    }
  }

  // Format Domisili
  let domisiliFormatted = '-';
  if (regData) {
    const parts = [regData.alamat_rumah, regData.kota_kabupaten, regData.provinsi].filter(Boolean);
    domisiliFormatted = parts.length > 0 ? parts.map(escapeHtml).join(', ') : '-';
  }

  // Format Sumber & Waktu Input
  let inputInfo = '-';
  if (regData) {
    const sumberText = regData.sumber_input === 'admin'
      ? `Diinput oleh Administrator${regData.nama_admin_input || regData.input_by ? ' (' + escapeHtml(regData.nama_admin_input || regData.input_by) + ')' : ''}`
      : 'Mandiri oleh Anggota';
    const waktuText = regData.submitted_at
      ? new Date(regData.submitted_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
      : '-';
    inputInfo = `${sumberText} pada ${waktuText}`;
  }

  const attrList = (Array.isArray(attributes) && attributes.length > 0)
    ? attributes
    : [
        { nama: 'Topi Rimba', memiliki: false, status: 'Belum Terdata' },
        { nama: 'Baju Lapangan', memiliki: false, status: 'Belum Terdata' }
      ];

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Biodata Anggota Penuh - ${escapeHtml(member.no_register)} - ${escapeHtml(member.nama)}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 1.2cm 1.5cm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body {
      font-family: 'Times New Roman', Times, serif;
      color: #000;
      background: #fff;
      line-height: 1.35;
      font-size: 10.5pt;
      margin: 0;
      padding: 15px;
    }
    .print-bar {
      background: #11161B;
      color: #fff;
      padding: 10px 18px;
      border-radius: 8px;
      margin-bottom: 18px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-family: Arial, sans-serif;
      font-size: 13px;
    }
    .btn-print {
      background: #FF6B00;
      color: #fff;
      border: none;
      padding: 8px 18px;
      border-radius: 6px;
      font-weight: bold;
      cursor: pointer;
      font-size: 13px;
    }
    .btn-close {
      background: #475569;
      color: #fff;
      border: none;
      padding: 8px 14px;
      border-radius: 6px;
      cursor: pointer;
      margin-left: 8px;
      font-size: 13px;
    }
    .kop {
      text-align: center;
      border-bottom: 3px double #000;
      padding-bottom: 6px;
      margin-bottom: 12px;
    }
    .kop h2 {
      margin: 0;
      font-size: 13pt;
      letter-spacing: 1px;
      text-transform: uppercase;
      font-weight: bold;
    }
    .kop h1 {
      margin: 2px 0;
      font-size: 16pt;
      font-weight: bold;
      letter-spacing: 1px;
    }
    .kop p {
      margin: 0;
      font-size: 8.5pt;
      font-style: italic;
    }
    .doc-title-wrap {
      text-align: center;
      margin-bottom: 12px;
    }
    .title {
      font-weight: bold;
      font-size: 12pt;
      text-decoration: underline;
      letter-spacing: 0.5px;
      margin-bottom: 3px;
    }
    .sub-title {
      font-size: 10.5pt;
    }
    .section-title {
      font-size: 10pt;
      font-weight: bold;
      background: #f0f0f0;
      padding: 4px 8px;
      margin-top: 10px;
      margin-bottom: 6px;
      border-left: 4px solid #000;
      page-break-after: avoid;
    }
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 6px;
    }
    table.data-table td {
      padding: 3.5px 5px;
      vertical-align: top;
      font-size: 10pt;
    }
    .col-label {
      width: 28%;
      font-weight: 600;
      color: #111;
    }
    .col-sep {
      width: 2%;
      text-align: center;
    }
    .col-val {
      width: 70%;
      word-break: break-word;
    }
    .photo-box {
      float: right;
      width: 3cm;
      height: 4cm;
      border: 1px solid #444;
      text-align: center;
      margin-left: 14px;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #fafafa;
      overflow: hidden;
    }
    .photo-box img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .photo-placeholder {
      font-size: 8.5pt;
      color: #666;
      line-height: 1.4;
      text-align: center;
    }
    .attr-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 4px;
      margin-bottom: 8px;
      font-size: 9.5pt;
    }
    .attr-table th, .attr-table td {
      border: 1px solid #777;
      padding: 4.5px 8px;
    }
    .attr-table th {
      background: #f4f4f4;
      font-weight: bold;
      text-align: left;
    }
    .badge-status {
      display: inline-block;
      padding: 1.5px 7px;
      border: 1px solid #777;
      border-radius: 3px;
      font-size: 8.5pt;
      font-weight: 600;
    }
    .badge-owned {
      border-color: #166534;
      background-color: #f0fdf4;
      color: #166534;
    }
    .badge-not-owned {
      border-color: #991b1b;
      background-color: #fef2f2;
      color: #991b1b;
    }
    .sign-table {
      width: 100%;
      margin-top: 25px;
      page-break-inside: avoid;
    }
    .sign-table td {
      text-align: center;
      width: 50%;
      vertical-align: top;
      font-size: 10pt;
    }
    .sign-space {
      height: 60px;
    }
    @media print {
      body {
        padding: 0;
      }
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>

  <div class="print-bar no-print">
    <div><strong>Pratinjau Formulir Biodata Anggota Penuh:</strong> ${escapeHtml(member.no_register)} - ${escapeHtml(memberName)}</div>
    <div>
      <button onclick="window.print()" class="btn-print">Cetak / Simpan PDF</button>
      <button onclick="window.close()" class="btn-close">Tutup</button>
    </div>
  </div>

  <div class="kop">
    <h2>Mahasiswa Pecinta Alam</h2>
    <h1>MAPALA UNIVERSITAS ANDALAS</h1>
    <p>Sekretariat: Gedung PKM Lt. 1 Universitas Andalas, Limau Manis, Padang - Sumatera Barat 25163</p>
    <p>Laman: www.mapalaunand.org | Surel: sekretariat@mapalaunand.org</p>
  </div>

  <div class="doc-title-wrap">
    <div class="title">BIODATA ANGGOTA PENUH (MU 325 Ltn.)</div>
    <div class="sub-title">Nomor Register: <strong>${escapeHtml(member.no_register)}</strong></div>
  </div>

  <!-- Foto Pasfoto Resmi (Hanya path aman /uploads atau /images) -->
  <div class="photo-box">
    ${safePhotoSrc
      ? `<img src="${safePhotoSrc}" alt="Pasfoto ${escapeHtml(memberName)}">`
      : `<div class="photo-placeholder"><span>Pasfoto<br>3 x 4</span></div>`
    }
  </div>

  <!-- BAGIAN I: DATA TETAP -->
  <div class="section-title">I. IDENTITAS ANGGOTA (DATA TETAP)</div>
  <table class="data-table">
    <tr>
      <td class="col-label">Nomor Register</td>
      <td class="col-sep">:</td>
      <td class="col-val"><strong>${escapeHtml(member.no_register)}</strong></td>
    </tr>
    <tr>
      <td class="col-label">Nama Lengkap</td>
      <td class="col-sep">:</td>
      <td class="col-val">${escapeHtml(memberName)}</td>
    </tr>
    <tr>
      <td class="col-label">Divisi Spesialisasi</td>
      <td class="col-sep">:</td>
      <td class="col-val">${escapeHtml(member.divisi || '-')}</td>
    </tr>
    <tr>
      <td class="col-label">Tahun Angkatan</td>
      <td class="col-sep">:</td>
      <td class="col-val">${escapeHtml(String(member.angkatan || '-'))}</td>
    </tr>
    <tr>
      <td class="col-label">Tempat / Tanggal Lahir</td>
      <td class="col-sep">:</td>
      <td class="col-val">${escapeHtml(member.tempat_lahir || '-')}, ${formatDateIndo(member.tanggal_lahir)}</td>
    </tr>
    <tr>
      <td class="col-label">Golongan Darah</td>
      <td class="col-sep">:</td>
      <td class="col-val">${escapeHtml(member.golongan_darah || '-')}</td>
    </tr>
    <tr>
      <td class="col-label">Nama Orang Tua</td>
      <td class="col-sep">:</td>
      <td class="col-val">Ayah: ${escapeHtml(member.nama_ayah || '-')} &nbsp;|&nbsp; Ibu: ${escapeHtml(member.nama_ibu || '-')}</td>
    </tr>
    <tr>
      <td class="col-label">Status Keanggotaan</td>
      <td class="col-sep">:</td>
      <td class="col-val">${member.is_active || member.status_aktif ? 'Anggota Aktif (Seumur Hidup)' : 'Nonaktif'}</td>
    </tr>
  </table>

  <div style="clear: both;"></div>

  <!-- BAGIAN II: DATA BERKALA REGISTRASI ULANG (CATATAN: ALAMAT ORANG TUA DIHAPUS DARI TEMPLATE) -->
  <div class="section-title">II. DATA DOMISILI &amp; KONTAK TERBARU (${regData ? `Periode ${escapeHtml(String(regData.periode_tahun || ''))}` : 'Belum Registrasi Ulang'})</div>
  <table class="data-table">
    <tr>
      <td class="col-label">Status Registrasi Ulang</td>
      <td class="col-sep">:</td>
      <td class="col-val"><strong>${regData ? `Sudah Registrasi (Periode ${escapeHtml(String(regData.periode_tahun || ''))})` : 'Belum Registrasi Ulang Periode Berjalan'}</strong></td>
    </tr>
    <tr>
      <td class="col-label">Alamat Domisili Sekarang</td>
      <td class="col-sep">:</td>
      <td class="col-val">${regData && regData.alamat_rumah ? escapeHtml(regData.alamat_rumah) : '-'}</td>
    </tr>
    <tr>
      <td class="col-label">Kota / Kabupaten</td>
      <td class="col-sep">:</td>
      <td class="col-val">${regData && regData.kota_kabupaten ? escapeHtml(regData.kota_kabupaten) : '-'}</td>
    </tr>
    <tr>
      <td class="col-label">Provinsi</td>
      <td class="col-sep">:</td>
      <td class="col-val">${regData && regData.provinsi ? escapeHtml(regData.provinsi) : '-'}</td>
    </tr>
    <tr>
      <td class="col-label">Nomor WhatsApp / HP</td>
      <td class="col-sep">:</td>
      <td class="col-val">${regData && regData.no_hp ? escapeHtml(regData.no_hp) : '-'}</td>
    </tr>
    <tr>
      <td class="col-label">Alamat Surel (Email)</td>
      <td class="col-sep">:</td>
      <td class="col-val">${regData && regData.email ? escapeHtml(regData.email) : '-'}</td>
    </tr>
    <tr>
      <td class="col-label">Akun Media Sosial</td>
      <td class="col-sep">:</td>
      <td class="col-val">${medsosFormatted}</td>
    </tr>
    <tr>
      <td class="col-label">Pekerjaan / Instansi</td>
      <td class="col-sep">:</td>
      <td class="col-val">${regData && regData.pekerjaan ? escapeHtml(regData.pekerjaan) : '-'}</td>
    </tr>
    <tr>
      <td class="col-label">Kontak Darurat</td>
      <td class="col-sep">:</td>
      <td class="col-val">${regData && (regData.kontak_darurat || regData.alamat_ortu || regData.alamat_orang_tua) ? escapeHtml(regData.kontak_darurat || regData.alamat_ortu || regData.alamat_orang_tua) : '-'}</td>
    </tr>
    <tr>
      <td class="col-label">Sumber &amp; Waktu Input</td>
      <td class="col-sep">:</td>
      <td class="col-val">${inputInfo}</td>
    </tr>
  </table>

  <!-- BAGIAN III: KEPEMILIKAN ATRIBUT ORGANISASI -->
  <div class="section-title">III. STATUS KEPEMILIKAN ATRIBUT ORGANISASI</div>
  <table class="attr-table">
    <thead>
      <tr>
        <th style="width: 8%; text-align: center;">No.</th>
        <th style="width: 54%;">Nama Atribut Organisasi</th>
        <th style="width: 38%; text-align: center;">Status Kepemilikan</th>
      </tr>
    </thead>
    <tbody>
      ${attrList.map((a, idx) => `
        <tr>
          <td style="text-align: center;">${idx + 1}</td>
          <td>${escapeHtml(a.nama || a.nama_atribut)}</td>
          <td style="text-align: center;">
            <span class="badge-status ${a.memiliki ? 'badge-owned' : 'badge-not-owned'}">
              ${a.memiliki ? '✓ Memiliki' : (regData ? '✗ Belum Memiliki' : '– Belum Terdata')}
            </span>
          </td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <!-- PENGESAHAN / TANDA TANGAN RESMI -->
  <table class="sign-table">
    <tr>
      <td>
        Mengetahui,<br>
        <strong>Pengurus Mapala UNAND</strong><br>
        Bidang Kesekretariatan
        <div class="sign-space"></div>
        ( ...................................................... )<br>
        No. Reg: ...........................................
      </td>
      <td>
        Padang, ${currentDate}<br>
        Anggota Bersangkutan,
        <div class="sign-space"></div>
        <strong>( ${escapeHtml(memberName)} )</strong><br>
        No. Reg: ${escapeHtml(member.no_register)}
      </td>
    </tr>
  </table>

</body>
</html>`;
}

module.exports = {
  generatePrintableBiodataHTML,
  escapeHtml,
  getSafeImageSrc
};
