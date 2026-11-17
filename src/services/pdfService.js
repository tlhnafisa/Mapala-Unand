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
      margin: 1.0cm 1.2cm 1.0cm 1.5cm;
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
      line-height: 1.25;
      font-size: 9.5pt;
      margin: 0;
      padding: 10px;
    }
    .page-container {
      width: 100%;
      max-width: 100%;
    }
    .print-bar {
      background: #11161B;
      color: #fff;
      padding: 8px 16px;
      border-radius: 6px;
      margin-bottom: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-family: Arial, sans-serif;
      font-size: 12px;
    }
    .btn-print {
      background: #FF6B00;
      color: #fff;
      border: none;
      padding: 6px 16px;
      border-radius: 5px;
      font-weight: bold;
      cursor: pointer;
      font-size: 12px;
    }
    .btn-close {
      background: #475569;
      color: #fff;
      border: none;
      padding: 6px 12px;
      border-radius: 5px;
      cursor: pointer;
      margin-left: 8px;
      font-size: 12px;
    }
    .kop {
      text-align: center;
      border-bottom: 2.5px double #000;
      padding-bottom: 4px;
      margin-bottom: 7px;
    }
    .kop h2 {
      margin: 0;
      font-size: 11pt;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      font-weight: bold;
      line-height: 1.15;
    }
    .kop h1 {
      margin: 1px 0;
      font-size: 13.5pt;
      font-weight: bold;
      letter-spacing: 0.5px;
      line-height: 1.15;
    }
    .kop p {
      margin: 0;
      font-size: 7.8pt;
      font-style: italic;
      line-height: 1.2;
    }
    .doc-title-wrap {
      text-align: center;
      margin-bottom: 6px;
    }
    .title {
      font-weight: bold;
      font-size: 10.5pt;
      text-decoration: underline;
      letter-spacing: 0.5px;
      margin-bottom: 1px;
    }
    .sub-title {
      font-size: 9pt;
    }
    .section-title {
      font-size: 8.8pt;
      font-weight: bold;
      background: #f0f0f0;
      padding: 2.5px 8px;
      margin-top: 13px;
      margin-bottom: 4px;
      border-left: 3.5px solid #000;
      page-break-after: avoid;
    }
    .section-title.first {
      margin-top: 6px;
    }
    .identitas-wrapper {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 4px;
    }
    .identitas-wrapper table.data-table {
      flex: 1;
      margin-bottom: 0;
    }
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 4px;
    }
    table.data-table td {
      padding: 1.8px 3px;
      vertical-align: top;
      font-size: 8.8pt;
      line-height: 1.25;
    }
    .col-label {
      width: 4.6cm;
      font-weight: 600;
      color: #111;
      white-space: nowrap;
    }
    .col-sep {
      width: 0.3cm;
      text-align: center;
    }
    .col-val {
      word-break: break-word;
    }
    .photo-box {
      width: 2.8cm;
      height: 3.6cm;
      border: 1px solid #444;
      text-align: center;
      margin: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #fafafa;
      overflow: hidden;
      flex-shrink: 0;
    }
    .photo-box img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .photo-placeholder {
      font-size: 8pt;
      color: #666;
      line-height: 1.3;
      text-align: center;
    }
    .attr-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 3px;
      margin-bottom: 4px;
      font-size: 8.5pt;
    }
    .attr-table th, .attr-table td {
      border: 1px solid #777;
      padding: 2.5px 6px;
    }
    .attr-table th {
      background: #f4f4f4;
      font-weight: bold;
      text-align: left;
    }
    .badge-status {
      display: inline-block;
      padding: 1.5px 6px;
      border: 1px solid #777;
      border-radius: 3px;
      font-size: 7.8pt;
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
    .attr-photo-box {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 135px;
      height: 90px;
      border: 1px solid #777;
      background: #fafafa;
      border-radius: 3px;
      overflow: hidden;
      vertical-align: middle;
      margin: 3px 0;
    }
    .attr-photo-box img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .no-photo-text {
      font-size: 7.5pt;
      color: #777;
      font-style: italic;
    }
    .sign-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 16px;
      page-break-inside: avoid;
    }
    .sign-table td {
      text-align: center;
      width: 50%;
      font-size: 8.8pt;
      line-height: 1.25;
      padding: 0 8px;
    }
    .sign-title-cell {
      vertical-align: top;
    }
    .sign-space-cell {
      height: 50px;
    }
    .sign-name-cell {
      vertical-align: top;
    }
    @media print {
      html, body {
        width: 100%;
        height: auto;
        margin: 0 !important;
        padding: 0 !important;
      }
      .no-print {
        display: none !important;
      }
      .page-container {
        page-break-inside: avoid;
        page-break-after: avoid;
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

  <div class="page-container">
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

    <!-- BAGIAN I: DATA TETAP -->
    <div class="section-title first">I. IDENTITAS ANGGOTA (DATA TETAP)</div>
    <div class="identitas-wrapper">
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

      <!-- Foto Pasfoto Resmi (Hanya path aman /uploads atau /images) -->
      <div class="photo-box">
        ${safePhotoSrc
          ? `<img src="${safePhotoSrc}" alt="Pasfoto ${escapeHtml(memberName)}">`
          : `<div class="photo-placeholder"><span>Pasfoto<br>3 x 4</span></div>`
        }
      </div>
    </div>

    <!-- BAGIAN II: DATA BERKALA REGISTRASI ULANG (TATA LETAK 1-KOLOM RAPI & SELARAS) -->
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
        <td class="col-val">${regData && regData.kontak_darurat ? escapeHtml(regData.kontak_darurat) : '-'}</td>
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
          <th style="width: 6%; text-align: center;">No.</th>
          <th style="width: 30%;">Nama Atribut Organisasi</th>
          <th style="width: 24%; text-align: center;">Status Kepemilikan</th>
          <th style="width: 40%; text-align: center;">Foto Bukti Fisik</th>
        </tr>
      </thead>
      <tbody>
        ${attrList.map((a, idx) => {
          const safeAttrPhoto = getSafeImageSrc(a.foto_path);
          const isOwned = Boolean(a.memiliki);
          return `
            <tr>
              <td style="text-align: center; vertical-align: middle;">${idx + 1}</td>
              <td style="vertical-align: middle;"><strong>${escapeHtml(a.nama || a.nama_atribut)}</strong></td>
              <td style="text-align: center; vertical-align: middle;">
                <span class="badge-status ${isOwned ? 'badge-owned' : 'badge-not-owned'}">
                  ${isOwned ? '✓ Memiliki' : (regData ? '✗ Belum Memiliki' : '– Belum Terdata')}
                </span>
              </td>
              <td style="text-align: center; vertical-align: middle;">
                ${safeAttrPhoto
                  ? `<div class="attr-photo-box"><img src="${safeAttrPhoto}" alt="Bukti ${escapeHtml(a.nama || a.nama_atribut)}"></div>`
                  : `<span class="no-photo-text">${isOwned ? 'Foto belum diunggah' : '–'}</span>`
                }
              </td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>

    <!-- PENGESAHAN / TANDA TANGAN RESMI -->
    <table class="sign-table">
      <tr>
        <td class="sign-title-cell">
          Mengetahui,<br>
          <strong>Pengurus Mapala UNAND</strong><br>
          Bidang Kesekretariatan
        </td>
        <td class="sign-title-cell">
          Padang, ${currentDate}<br>
          Anggota Bersangkutan,<br>
          <span style="visibility: hidden;">&nbsp;</span>
        </td>
      </tr>
      <tr>
        <td class="sign-space-cell"></td>
        <td class="sign-space-cell"></td>
      </tr>
      <tr>
        <td class="sign-name-cell">
          ( ...................................................... )<br>
          No. Reg: ...........................................
        </td>
        <td class="sign-name-cell">
          <strong>( ${escapeHtml(memberName)} )</strong><br>
          No. Reg: ${escapeHtml(member.no_register)}
        </td>
      </tr>
    </table>
  </div>

</body>
</html>`;
}

module.exports = {
  generatePrintableBiodataHTML,
  escapeHtml,
  getSafeImageSrc
};
