/**
 * Form Biodata Anggota Penuh Mapala UNAND (Format MU 325 Ltn.)
 * Generates an official printable document ready for Print / Save as PDF
 */
function generatePrintableBiodataHTML(member, regData, attributes = []) {
  const currentDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Biodata Anggota Penuh - ${member.no_register} - ${member.nama}</title>
  <style>
    @page {
      size: A4;
      margin: 1.5cm;
    }
    body {
      font-family: 'Times New Roman', Times, serif;
      color: #000;
      background: #fff;
      line-height: 1.4;
      font-size: 11pt;
      margin: 0;
      padding: 20px;
    }
    .kop {
      text-align: center;
      border-bottom: 3px double #000;
      padding-bottom: 8px;
      margin-bottom: 18px;
      position: relative;
    }
    .kop h2 {
      margin: 0;
      font-size: 15pt;
      letter-spacing: 1px;
      text-transform: uppercase;
    }
    .kop h1 {
      margin: 2px 0;
      font-size: 18pt;
      font-weight: bold;
      letter-spacing: 1.5px;
    }
    .kop p {
      margin: 0;
      font-size: 9pt;
      font-style: italic;
    }
    .title {
      text-align: center;
      font-weight: bold;
      font-size: 13pt;
      text-decoration: underline;
      margin-bottom: 4px;
    }
    .sub-title {
      text-align: center;
      font-size: 11pt;
      margin-bottom: 20px;
    }
    .section-title {
      font-size: 11pt;
      font-weight: bold;
      background: #eee;
      padding: 4px 8px;
      margin-top: 14px;
      margin-bottom: 8px;
      border-left: 4px solid #FF6B00;
    }
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 10px;
    }
    table.data-table td {
      padding: 5px 6px;
      vertical-align: top;
    }
    .col-label {
      width: 28%;
      font-weight: 500;
    }
    .col-sep {
      width: 2%;
    }
    .col-val {
      width: 70%;
    }
    .photo-box {
      float: right;
      width: 3cm;
      height: 4cm;
      border: 1px solid #333;
      text-align: center;
      margin-left: 15px;
      margin-bottom: 10px;
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
    }
    .sign-table {
      width: 100%;
      margin-top: 35px;
      page-break-inside: avoid;
    }
    .sign-table td {
      text-align: center;
      width: 50%;
      vertical-align: top;
    }
    .sign-space {
      height: 70px;
    }
    .badge-status {
      display: inline-block;
      padding: 2px 6px;
      border: 1px solid #999;
      font-size: 9pt;
      margin-right: 5px;
    }
    @media print {
      body {
        padding: 0;
      }
      .no-print {
        display: none;
      }
    }
    .print-bar {
      background: #11161B;
      color: #fff;
      padding: 12px 20px;
      border-radius: 8px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-family: sans-serif;
    }
    .btn-print {
      background: #FF6B00;
      color: #fff;
      border: none;
      padding: 8px 18px;
      border-radius: 6px;
      font-weight: bold;
      cursor: pointer;
    }
  </style>
</head>
<body>

  <div class="print-bar no-print">
    <div><strong>Pratinjau Biodata Anggota:</strong> ${member.no_register} - ${member.nama}</div>
    <div>
      <button onclick="window.print()" class="btn-print">Cetak / Simpan PDF</button>
      <button onclick="window.close()" style="background:#444;color:#fff;border:none;padding:8px 14px;border-radius:6px;cursor:pointer;margin-left:8px;">Tutup</button>
    </div>
  </div>

  <div class="kop">
    <h2>Mahasiswa Pecinta Alam</h2>
    <h1>MAPALA UNIVERSITAS ANDALAS</h1>
    <p>Sekretariat: Gedung PKM Lt. 1 Universitas Andalas, Limau Manis, Padang - Sumatera Barat 25163</p>
    <p>Laman: www.mapalaunand.org | Surel: sekretariat@mapalaunand.org</p>
  </div>

  <div class="title">BIODATA ANGGOTA PENUH</div>
  <div class="sub-title">Nomor Register: <strong>${member.no_register}</strong></div>

  <!-- Foto Pas Foto -->
  <div class="photo-box">
    ${regData && regData.foto_terbaru && regData.foto_terbaru.startsWith('http')
      ? `<img src="${regData.foto_terbaru}" alt="Foto ${member.nama}">`
      : `<div style="font-size:9pt;color:#666;">Pasfoto<br>3 x 4</div>`
    }
  </div>

  <!-- BAGIAN I: DATA TETAP -->
  <div class="section-title">I. IDENTITAS ANGGOTA (DATA TETAP)</div>
  <table class="data-table">
    <tr>
      <td class="col-label">Nomor Register</td>
      <td class="col-sep">:</td>
      <td class="col-val"><strong>${member.no_register}</strong></td>
    </tr>
    <tr>
      <td class="col-label">Nama Lengkap</td>
      <td class="col-sep">:</td>
      <td class="col-val">${member.nama}</td>
    </tr>
    <tr>
      <td class="col-label">Divisi Spesialisasi</td>
      <td class="col-sep">:</td>
      <td class="col-val">${member.divisi || '-'}</td>
    </tr>
    <tr>
      <td class="col-label">Tahun Angkatan</td>
      <td class="col-sep">:</td>
      <td class="col-val">${member.angkatan || '-'}</td>
    </tr>
    <tr>
      <td class="col-label">Tempat / Tanggal Lahir</td>
      <td class="col-sep">:</td>
      <td class="col-val">${member.tempat_lahir || '-'}, ${member.tanggal_lahir || '-'}</td>
    </tr>
    <tr>
      <td class="col-label">Golongan Darah</td>
      <td class="col-sep">:</td>
      <td class="col-val">${member.golongan_darah || '-'}</td>
    </tr>
    <tr>
      <td class="col-label">Nama Orang Tua</td>
      <td class="col-sep">:</td>
      <td class="col-val">Ayah: ${member.nama_ayah || '-'} | Ibu: ${member.nama_ibu || '-'}</td>
    </tr>
    <tr>
      <td class="col-label">Status Keanggotaan</td>
      <td class="col-sep">:</td>
      <td class="col-val">${member.status_aktif ? 'Anggota Aktif (Seumur Hidup)' : 'Nonaktif'}</td>
    </tr>
  </table>

  <!-- BAGIAN II: DATA BERKALA REGISTRASI ULANG -->
  <div class="section-title">II. DATA DOMISILI & KONTAK TERBARU (${regData ? regData.periode_tahun : 'Belum Registrasi Ulang'})</div>
  <table class="data-table">
    <tr>
      <td class="col-label">Status Registrasi Ulang</td>
      <td class="col-sep">:</td>
      <td class="col-val"><strong>${regData ? regData.status_registrasi : 'Belum Registrasi Ulang Periode Berjalan'}</strong></td>
    </tr>
    <tr>
      <td class="col-label">Alamat Domisili Sekarang</td>
      <td class="col-sep">:</td>
      <td class="col-val">${regData ? regData.alamat_rumah : '-'}</td>
    </tr>
    <tr>
      <td class="col-label">Kota/Kabupaten & Provinsi</td>
      <td class="col-sep">:</td>
      <td class="col-val">${regData ? `${regData.kota_kabupaten}, ${regData.provinsi}` : '-'}</td>
    </tr>
    <tr>
      <td class="col-label">Nomor WhatsApp / HP</td>
      <td class="col-sep">:</td>
      <td class="col-val">${regData ? regData.no_hp : '-'}</td>
    </tr>
    <tr>
      <td class="col-label">Alamat Surel (Email)</td>
      <td class="col-sep">:</td>
      <td class="col-val">${regData ? regData.email : '-'}</td>
    </tr>
    <tr>
      <td class="col-label">Akun Media Sosial</td>
      <td class="col-sep">:</td>
      <td class="col-val">${regData ? regData.media_sosial : '-'}</td>
    </tr>
    <tr>
      <td class="col-label">Pekerjaan / Instansi</td>
      <td class="col-sep">:</td>
      <td class="col-val">${regData ? regData.pekerjaan : '-'}</td>
    </tr>
    <tr>
      <td class="col-label">Alamat Orang Tua / Darurat</td>
      <td class="col-sep">:</td>
      <td class="col-val">${regData ? regData.alamat_ortu : '-'}</td>
    </tr>
    <tr>
      <td class="col-label">Sumber & Waktu Input</td>
      <td class="col-sep">:</td>
      <td class="col-val">${regData ? `${regData.sumber_input === 'admin' ? 'Diinput Admin (' + regData.input_by + ')' : 'Mandiri oleh Anggota'} pada ${regData.submitted_at ? new Date(regData.submitted_at).toLocaleString('id-ID') : '-'}` : '-'}</td>
    </tr>
  </table>

  <!-- BAGIAN III: KEPEMILIKAN ATRIBUT ORGANISASI -->
  <div class="section-title">III. STATUS KEPEMILIKAN ATRIBUT ORGANISASI</div>
  <table class="data-table">
    <tr>
      <td class="col-label">Daftar Atribut</td>
      <td class="col-sep">:</td>
      <td class="col-val">
        ${(regData && regData.atribut && regData.atribut.length > 0)
          ? regData.atribut.map(a => `<span class="badge-status">[${a.status}] ${a.nama}</span>`).join(' ')
          : attributes.map(a => `<span class="badge-status">[?] ${a.nama_atribut}</span>`).join(' ')
        }
      </td>
    </tr>
  </table>

  <!-- PENGESAHAN / TANDA TANGAN -->
  <table class="sign-table">
    <tr>
      <td>
        Mengetahui,<br>
        <strong>Pengurus Mapala UNAND</strong><br>
        Bidang Kesekretariatan
        <div class="sign-space"></div>
        ( .................................................. )<br>
        No. Reg: .......................................
      </td>
      <td>
        Padang, ${currentDate}<br>
        Anggota Bersangkutan,
        <div class="sign-space"></div>
        <strong>( ${member.nama} )</strong><br>
        No. Reg: ${member.no_register}
      </td>
    </tr>
  </table>

</body>
</html>
  `;
}

module.exports = {
  generatePrintableBiodataHTML
};

