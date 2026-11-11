// ========================================================================
// PORTAL ANGGOTA MAPALA UNAND - APP CONTROLLER
// ========================================================================

const API_BASE = '/api';

// Current session state
let currentUser = {
  no_register: 'MU 280 RGM',
  nama: 'Rahmat Hidayat',
  divisi: 'Rimba Gunung',
  angkatan: 2018,
  role: 'anggota',
  must_change_password: false,
  privacy_consent_given: true
};

// Mock Member Biodata State (Pre-integration with MySQL)
let memberData = {
  data_tetap: {
    no_register: 'MU 280 RGM',
    nama: 'Rahmat Hidayat',
    divisi: 'Rimba Gunung',
    angkatan: 2018,
    tempat_lahir: 'Kota Padang',
    tanggal_lahir: '1998-05-12',
    golongan_darah: 'O',
    nama_ayah: 'Hidayatullah',
    nama_ibu: 'Rahmawati',
    profil_lengkap: 1
  },
  data_registrasi_terkini: {
    periode_tahun: 2026,
    status: 'Sudah Registrasi Ulang',
    submitted_at: '2026-02-10 14:30',
    alamat_rumah: 'Jl. Gajah Mada No. 42, Gunung Pangilun',
    kota_kabupaten: 'Kota Padang',
    provinsi: 'Sumatera Barat',
    pekerjaan: 'Software Engineer',
    no_hp: '081267890123',
    email: 'rahmat.hidayat@gmail.com',
    alamat_orang_tua: 'Jl. Gajah Mada No. 42, Kota Padang',
    media_sosial: '@rahmathidayat',
    atribut: [
      { nama: 'Topi Rimba', status: 'Ada' },
      { nama: 'Baju Lapangan', status: 'Ada' }
    ]
  }
};

// Mock Directory Data (conforming to view v_direktori_anggota - 5 restricted attributes)
let directoryList = [
  { nama: 'Rahmat Hidayat', no_register: 'MU 280 RGM', no_hp: '081267890123', golongan_darah: 'O', alamat_rumah: 'Jl. Melati No. 10', kota_kabupaten: 'Kota Padang', provinsi: 'Sumatera Barat' },
  { nama: 'Fajar Nugraha', no_register: 'MU 285 PCT', no_hp: '081378901234', golongan_darah: 'A', alamat_rumah: 'Jl. Sudirman No. 22', kota_kabupaten: 'Kota Bukittinggi', provinsi: 'Sumatera Barat' },
  { nama: 'Dian Permata Sari', no_register: 'MU 292 CAV', no_hp: '085267123456', golongan_darah: 'B', alamat_rumah: 'Jl. Ahmad Yani No. 15', kota_kabupaten: 'Kota Solok', provinsi: 'Sumatera Barat' },
  { nama: 'Ilham Syahputra', no_register: 'MU 301 OLA', no_hp: '082189012345', golongan_darah: 'AB', alamat_rumah: 'Jl. Veteran No. 8', kota_kabupaten: 'Kota Payakumbuh', provinsi: 'Sumatera Barat' },
  { nama: 'Budi Santoso', no_register: 'MU 310 RGM', no_hp: '081234567890', golongan_darah: 'O', alamat_rumah: 'Jl. Diponegoro No. 3', kota_kabupaten: 'Kota Pekanbaru', provinsi: 'Riau' },
  { nama: 'Arif Gunawan', no_register: 'MU 325 PCT', no_hp: '081987654321', golongan_darah: 'O', alamat_rumah: 'Komp. Griya Indah C/8', kota_kabupaten: 'Jakarta Selatan', provinsi: 'DKI Jakarta' },
  { nama: 'Aulia Rahman', no_register: 'MU 335 CAV', no_hp: '082267890123', golongan_darah: 'AB', alamat_rumah: 'Jl. Riau No. 55', kota_kabupaten: 'Kota Bandung', provinsi: 'Jawa Barat' }
];

let currentPolicyId = 1;

document.addEventListener('DOMContentLoaded', () => {
  const isAuth = checkAuthSession();
  if (!isAuth) return;
  initLucide();
  renderDashboard();
  renderBiodata();
  renderRegistrasiForm();
  renderDirectory();
  loadLiveDataFromMySQL();
});

async function loadLiveDataFromMySQL() {
  const token = localStorage.getItem('mapala_token');
  if (!token) return;

  try {
    // 1. Fetch live member dashboard (identitas KTA, status periode aktif, kepatuhan registrasi)
    const dashRes = await fetch('/api/member/dashboard', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (dashRes.ok) {
      const dashJson = await dashRes.json();
      if (dashJson.success && dashJson.data) {
        renderDashboard(dashJson.data);
      }
    }

    // 2. Fetch live member profile (data tetap & snapshot kontak/domisili)
    const pRes = await fetch('/api/member/profile', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (pRes.ok) {
      const pJson = await pRes.json();
      if (pJson.success && pJson.data) {
        if (pJson.data.data_tetap) memberData.data_tetap = pJson.data.data_tetap;
        if (pJson.data.data_berkala_terbaru) memberData.data_registrasi_terkini = pJson.data.data_berkala_terbaru;
        renderSidebarAvatar(
          memberData.data_tetap?.nama || currentUser.nama,
          memberData.data_registrasi_terkini?.foto_path || memberData.data_tetap?.foto_path
        );
        renderBiodata();
        renderRegistrasiForm();
      }
    }

    // 3. Fetch live directory from MySQL view v_direktori_anggota
    await fetchDirectory();
  } catch (err) {
    console.warn('Live API connection failed, maintaining local display:', err);
  }
}

function initLucide() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function getMemberInitials(nama) {
  if (!nama || typeof nama !== 'string') return 'MU';
  const parts = nama.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'MU';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function renderSidebarAvatar(nama, fotoPath) {
  const avatarEl = document.getElementById('navMemberAvatar');
  if (!avatarEl) return;

  const initials = getMemberInitials(nama);
  const hasValidPhoto =
    typeof fotoPath === 'string' &&
    fotoPath.trim() !== '' &&
    fotoPath !== '/uploads/default-avatar.png';

  if (!hasValidPhoto) {
    avatarEl.textContent = initials;
    return;
  }

  avatarEl.innerHTML = '';
  const img = document.createElement('img');
  img.src = fotoPath;
  img.alt = nama ? `Foto ${nama}` : 'Foto Profil Anggota';
  img.className = 'w-full h-full object-cover';
  img.addEventListener('error', () => {
    avatarEl.textContent = initials;
  });
  avatarEl.appendChild(img);
}

// 1. Session & Auth Check (Validasi Token JWT & Peran Anggota)
function checkAuthSession() {
  const token = localStorage.getItem('mapala_token');
  const userJson = localStorage.getItem('mapala_user');
  
  if (!token || !userJson) {
    window.location.href = '/login';
    return false;
  }

  let parsed;
  try {
    parsed = JSON.parse(userJson);
  } catch (e) {
    localStorage.removeItem('mapala_token');
    localStorage.removeItem('mapala_user');
    window.location.href = '/login';
    return false;
  }

  // Jika token tidak valid atau peran bukan 'anggota', arahkan kembali ke rute yang sesuai
  if (!parsed || parsed.role !== 'anggota') {
    if (parsed && parsed.role === 'admin') {
      window.location.href = '/admin';
    } else {
      window.location.href = '/login';
    }
    return false;
  }

  currentUser = { ...currentUser, ...parsed };
  if (currentUser.nama) {
    const navName = document.getElementById('navMemberName');
    const navReg = document.getElementById('navMemberReg');
    if (navName) navName.textContent = currentUser.nama;
    if (navReg) navReg.textContent = currentUser.username || currentUser.no_register;
    renderSidebarAvatar(currentUser.nama, currentUser.foto_path);
  }

  // Jika akun anggota belum tuntas aktivasi 3-Step Wizard, kunci akses portal dan redirect ke /aktivasi-anggota
  if (currentUser.must_change_password === true || Number(currentUser.profil_lengkap) === 0) {
    window.location.href = '/aktivasi-anggota';
    return false;
  }

  // Security Gate 1 & 2 cadangan (jika ada flag khusus)
  if (currentUser.must_change_password) {
    openModal('mandatoryPasswordModal');
  } else {
    checkPrivacyConsentGate();
  }

  return true;
}

// 2. Tab Navigation
function switchTab(tabId) {
  document.querySelectorAll('.tab-pane').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('.nav-tab-btn').forEach(btn => {
    btn.classList.remove('active', 'bg-[#FF6B00]/10', 'text-[#FF6B00]', 'border-l-2', 'border-[#FF6B00]');
    btn.classList.add('text-[#94A3B8]');
  });

  const activePane = document.getElementById(tabId);
  const activeBtn = document.querySelector(`[data-tab="${tabId}"]`);

  if (activePane) activePane.classList.remove('hidden');
  if (activeBtn) {
    activeBtn.classList.add('active', 'bg-[#FF6B00]/10', 'text-[#FF6B00]', 'border-l-2', 'border-[#FF6B00]');
    activeBtn.classList.remove('text-[#94A3B8]');
  }

  if (tabId === 'tab-direktori') {
    fetchDirectory();
  }

  initLucide();
}

// 3. Render Dashboard Anggota (FR-16)
function renderDashboard(dashData) {
  // Ambil data dari payload API atau fallback lokal
  const member = dashData?.identitas || memberData.data_tetap;
  const activePeriod = dashData ? dashData.periode_berjalan : { tahun: 2026, nama: 'Registrasi Ulang Tahunan 2026', status: 'buka' };
  const regStatus = dashData ? dashData.status_registrasi : {
    sudah_registrasi: memberData.data_registrasi_terkini?.status === 'Sudah Registrasi Ulang',
    submitted_at: memberData.data_registrasi_terkini?.submitted_at,
    sumber_input: 'mandiri'
  };

  // 1. Render Identitas & Kartu Anggota Digital (KTA)
  if (member) {
    const elNama = document.getElementById('dashNama');
    const elNoReg = document.getElementById('dashNoReg');
    const elDivisi = document.getElementById('dashDivisi');
    const elAngkatan = document.getElementById('dashAngkatan');
    const elGoldar = document.getElementById('dashGoldar');

    if (elNama) elNama.textContent = member.nama || '-';
    if (elNoReg) elNoReg.textContent = member.no_register || '-';
    if (elDivisi) elDivisi.textContent = member.divisi ? `Divisi ${member.divisi}` : 'Anggota Mapala UNAND';
    if (elAngkatan) elAngkatan.textContent = member.angkatan || '-';
    if (elGoldar) elGoldar.textContent = member.golongan_darah || '-';

    // Perbarui label dan avatar di sidebar jika belum sinkron
    const navName = document.getElementById('navMemberName');
    const navReg = document.getElementById('navMemberReg');
    if (navName && member.nama) navName.textContent = member.nama;
    if (navReg && member.no_register) navReg.textContent = member.no_register;
    renderSidebarAvatar(
      member.nama,
      member.foto_path || memberData.data_registrasi_terkini?.foto_path || currentUser.foto_path
    );

    // 2. Render Persentase Kelengkapan Profil (profil_lengkap)
    const isProfileComplete = Number(member.profil_lengkap) === 1;
    const elProfilPct = document.getElementById('dashProfilPct');
    const elProfilBar = document.getElementById('dashProfilBar');
    if (elProfilPct && elProfilBar) {
      if (isProfileComplete) {
        elProfilPct.textContent = '100% Lengkap';
        elProfilPct.className = 'font-bold text-emerald-400 font-mono';
        elProfilBar.className = 'bg-gradient-to-r from-emerald-500 to-teal-400 h-2 rounded-full transition-all duration-700';
        elProfilBar.style.width = '100%';
      } else {
        elProfilPct.textContent = '65% Perlu Dilengkapi';
        elProfilPct.className = 'font-bold text-[#FF6B00] font-mono';
        elProfilBar.className = 'bg-gradient-to-r from-[#FF6B00] to-[#FFA143] h-2 rounded-full transition-all duration-700';
        elProfilBar.style.width = '65%';
      }
    }
  }

  // 3. Render Status Kepatuhan Registrasi Periode Berjalan
  const elPeriodeLabel = document.getElementById('dashPeriodeLabel');
  const elPeriodeNama = document.getElementById('dashPeriodeNama');
  const elStatusBadge = document.getElementById('dashRegBadge');
  const elStatusDesc = document.getElementById('dashRegDesc');
  const elMetaText = document.getElementById('dashRegMetaText');
  const elActionBtn = document.getElementById('dashRegActionBtn');
  const elActionBtnText = document.getElementById('dashRegActionBtnText');

  if (activePeriod && activePeriod.status === 'buka') {
    if (elPeriodeLabel) elPeriodeLabel.textContent = `PERIODE ${activePeriod.tahun}`;
    if (elPeriodeNama) elPeriodeNama.textContent = activePeriod.nama || `Registrasi Ulang ${activePeriod.tahun}`;

    if (regStatus && regStatus.sudah_registrasi) {
      // Kondisi SUDAH Registrasi
      const sumberLabel = regStatus.sumber_input === 'admin' ? 'Admin Override' : 'Mandiri';
      if (elStatusBadge) {
        elStatusBadge.className = 'px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30';
        elStatusBadge.textContent = `Sudah Registrasi (${sumberLabel})`;
      }
      if (elStatusDesc) {
        elStatusDesc.textContent = `Data domisili, nomor HP WhatsApp, dan inventaris atribut resmi Anda telah tercatat untuk periode ${activePeriod.tahun}. Data Anda sudah mutakhir.`;
      }
      if (elMetaText) {
        const timeStr = regStatus.submitted_at
          ? new Date(regStatus.submitted_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
          : 'Sistem Terverifikasi';
        elMetaText.textContent = `Tercatat pada: ${timeStr} via ${sumberLabel}`;
      }
      if (elActionBtn) {
        elActionBtn.className = 'mt-5 w-full btn-secondary !text-xs justify-center font-bold text-white hover:border-[#FF6B00]/40';
        if (elActionBtnText) elActionBtnText.textContent = 'Periksa / Perbarui Formulir';
      }
    } else {
      // Kondisi BELUM Registrasi
      if (elStatusBadge) {
        elStatusBadge.className = 'px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/40 animate-pulse';
        elStatusBadge.textContent = 'Belum Registrasi Ulang';
      }
      if (elStatusDesc) {
        elStatusDesc.textContent = `Periode registrasi ulang ${activePeriod.tahun} sedang dibuka! Segera lengkapi alamat tempat tinggal, nomor kontak, serta kepemilikan atribut Anda sebelum tenggat waktu.`;
      }
      if (elMetaText) {
        const deadlineStr = activePeriod.tanggal_tutup
          ? new Date(activePeriod.tanggal_tutup).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
          : 'Segera';
        elMetaText.textContent = `Batas akhir registrasi: ${deadlineStr}`;
      }
      if (elActionBtn) {
        elActionBtn.className = 'mt-5 w-full btn-primary !text-xs justify-center font-bold !bg-[#FF6B00] hover:!bg-[#FFA143] text-white shadow-lg shadow-[#FF6B00]/20';
        if (elActionBtnText) elActionBtnText.textContent = 'Isi Formulir Sekarang →';
      }
    }
  } else {
    // Kondisi PERIODE DITUTUP
    if (elPeriodeLabel) elPeriodeLabel.textContent = 'PERIODE DITUTUP';
    if (elPeriodeNama) elPeriodeNama.textContent = 'Registrasi Ulang Tahunan';
    if (elStatusBadge) {
      elStatusBadge.className = 'px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/10 text-[#8C9BAE] border border-white/10';
      elStatusBadge.textContent = 'Periode Ditutup';
    }
    if (elStatusDesc) {
      elStatusDesc.textContent = 'Saat ini belum ada periode registrasi ulang tahunan yang sedang dibuka oleh Administrator. Silakan pantau pengumuman resmi pengurus.';
    }
    if (elMetaText) {
      elMetaText.textContent = 'Status keanggotaan Anda tetap Anggota Penuh Seumur Hidup.';
    }
    if (elActionBtn) {
      elActionBtn.className = 'mt-5 w-full btn-secondary !text-xs justify-center font-bold text-[#8C9BAE] opacity-60 cursor-not-allowed';
      if (elActionBtnText) elActionBtnText.textContent = 'Pendaftaran Belum Dibuka';
    }
  }

  initLucide();
}

// 4. Render Biodata Saya (FR-17, FR-18)
function renderBiodata() {
  const d = memberData.data_tetap || {};
  const reg = memberData.data_registrasi_terkini;

  // Kolom Terkunci (Read-Only)
  const elNoReg = document.getElementById('bioNoReg');
  const elDivisi = document.getElementById('bioDivisi');
  const elAngkatan = document.getElementById('bioAngkatan');
  if (elNoReg) elNoReg.value = d.no_register || '-';
  if (elDivisi) elDivisi.value = d.divisi_nama || d.divisi || '-';
  if (elAngkatan) elAngkatan.value = d.angkatan ? `Angkatan ${d.angkatan}` : '-';

  // Kolom Yang Dapat Diperbarui (Editable)
  const elNama = document.getElementById('bioNama');
  const elTempatLahir = document.getElementById('bioTempatLahir');
  const elTanggalLahir = document.getElementById('bioTanggalLahir');
  const elGoldar = document.getElementById('bioGoldar');
  const elNamaAyah = document.getElementById('bioNamaAyah');
  const elNamaIbu = document.getElementById('bioNamaIbu');

  if (elNama) elNama.value = d.nama || '';
  if (elTempatLahir) elTempatLahir.value = d.tempat_lahir || '';
  if (elTanggalLahir) elTanggalLahir.value = d.tanggal_lahir ? d.tanggal_lahir.substring(0, 10) : '';
  if (elGoldar) elGoldar.value = d.golongan_darah || '';
  if (elNamaAyah) elNamaAyah.value = d.nama_ayah || '';
  if (elNamaIbu) elNamaIbu.value = d.nama_ibu || '';

  // Render Snapshot Data Berkala Terkini
  const elDomisili = document.getElementById('bioSnapshotDomisili');
  const elHp = document.getElementById('bioSnapshotHp');
  const elEmail = document.getElementById('bioSnapshotEmail');
  const elPekerjaan = document.getElementById('bioSnapshotPekerjaan');

  if (reg && (reg.alamat_rumah || reg.kota_kabupaten)) {
    const alamatParts = [reg.alamat_rumah, reg.kota_kabupaten, reg.provinsi].filter(Boolean);
    if (elDomisili) elDomisili.textContent = alamatParts.join(', ');
    if (elHp) elHp.textContent = reg.no_hp || '-';
    if (elEmail) elEmail.textContent = reg.email || '-';
    if (elPekerjaan) elPekerjaan.textContent = reg.pekerjaan || '-';
  } else {
    if (elDomisili) elDomisili.textContent = 'Belum mengisi data registrasi ulang';
    if (elHp) elHp.textContent = '-';
    if (elEmail) elEmail.textContent = '-';
    if (elPekerjaan) elPekerjaan.textContent = '-';
  }
}

// Simpan Pembaruan Biodata Tetap (PUT /api/member/profile) (FR-18)
async function handleSaveBiodata(e) {
  e.preventDefault();
  const token = localStorage.getItem('mapala_token');
  if (!token) {
    showToast('Sesi autentikasi Anda telah berakhir. Silakan login kembali.', 'error');
    return;
  }

  const nama = document.getElementById('bioNama').value.trim();
  const tempat_lahir = document.getElementById('bioTempatLahir').value.trim();
  const tanggal_lahir = document.getElementById('bioTanggalLahir').value;
  const golongan_darah = document.getElementById('bioGoldar').value;
  const nama_ayah = document.getElementById('bioNamaAyah').value.trim();
  const nama_ibu = document.getElementById('bioNamaIbu').value.trim();

  if (!nama) {
    showToast('Nama lengkap wajib diisi.', 'error');
    return;
  }

  const btn = e.target.querySelector('button[type="submit"]');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i data-lucide="loader" class="w-4 h-4 animate-spin"></i><span>Menyimpan ke Database...</span>';
    initLucide();
  }

  try {
    const res = await fetch('/api/member/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        nama,
        tempat_lahir,
        tanggal_lahir,
        golongan_darah,
        nama_ayah,
        nama_ibu
      })
    });
    const result = await res.json();

    if (!res.ok || !result.success) {
      showToast(result.message || 'Gagal menyimpan perubahan biodata.', 'error');
      return;
    }

    // Perbarui state lokal
    memberData.data_tetap = {
      ...memberData.data_tetap,
      nama,
      tempat_lahir,
      tanggal_lahir,
      golongan_darah,
      nama_ayah,
      nama_ibu,
      profil_lengkap: result.data?.profil_lengkap ?? 1
    };

    currentUser.nama = nama;
    localStorage.setItem('mapala_user', JSON.stringify(currentUser));

    showToast('Biodata tetap Anda berhasil disimpan ke database!', 'success');

    // Muat ulang tampilan dashboard, biodata, dan form registrasi
    renderDashboard();
    renderBiodata();
    renderRegistrasiForm();
    loadLiveDataFromMySQL();

  } catch (err) {
    console.error('Error save biodata:', err);
    showToast('Terjadi gangguan jaringan saat menyimpan biodata.', 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i data-lucide="save" class="w-4 h-4"></i><span>Simpan Perubahan Biodata</span>';
      initLucide();
    }
  }
}

// 5. Render Registrasi Ulang Form (FR-21 s.d FR-25)
async function renderRegistrasiForm() {
  const token = localStorage.getItem('mapala_token');
  if (!token) return;

  const formEl = document.getElementById('formRegistrasiUlang');
  const closedBanner = document.getElementById('regClosedBanner');
  const periodBadgeText = document.getElementById('regPeriodBadgeText');
  const formTitle = document.getElementById('regFormTitle');
  const submitBtnText = document.getElementById('regSubmitBtnText');

  try {
    const res = await fetch('/api/member/re-registration/form-data', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) return;

    const json = await res.json();
    if (!json.success || !json.data || !json.data.periode_aktif) {
      // Periode ditutup / belum dibuka oleh admin
      if (closedBanner) closedBanner.classList.remove('hidden');
      if (formEl) formEl.classList.add('hidden');
      if (periodBadgeText) {
        periodBadgeText.textContent = 'Periode Registrasi Ditutup';
        periodBadgeText.parentElement.className = 'px-3 py-1 rounded-full bg-white/10 border border-white/10 text-[#8C9BAE] text-xs font-semibold flex items-center gap-1.5';
      }
      return;
    }

    // Periode AKTIF
    const { periode_aktif, profil_terkunci, prefill_data, atribut_master, is_already_registered } = json.data;

    if (closedBanner) closedBanner.classList.add('hidden');
    if (formEl) formEl.classList.remove('hidden');

    if (periodBadgeText) {
      periodBadgeText.textContent = `Periode ${periode_aktif.tahun} Sedang Dibuka`;
      periodBadgeText.parentElement.className = 'px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-1.5';
    }

    if (formTitle) formTitle.textContent = `Formulir Registrasi Ulang ${periode_aktif.tahun}`;
    if (submitBtnText) {
      submitBtnText.textContent = is_already_registered
        ? `Perbarui Data Registrasi Ulang ${periode_aktif.tahun}`
        : `Kirim Formulir Registrasi Ulang ${periode_aktif.tahun}`;
    }

    const regPeriodeIdEl = document.getElementById('regPeriodeId');
    if (regPeriodeIdEl) regPeriodeIdEl.value = periode_aktif.id;

    // Profil Terkunci
    const d = profil_terkunci || memberData.data_tetap || {};
    const elNoReg = document.getElementById('regLockedNoReg');
    const elNama = document.getElementById('regLockedNama');
    const elDivisi = document.getElementById('regLockedDivisi');
    if (elNoReg) elNoReg.value = d.no_register || '-';
    if (elNama) elNama.value = d.nama || '-';
    if (elDivisi) elDivisi.value = d.divisi_nama || d.divisi || '-';

    // Prefill data domisili & kontak
    const reg = prefill_data || memberData.data_registrasi_terkini || {};
    const elAlamat = document.getElementById('regAlamat');
    const elKota = document.getElementById('regKota');
    const elProv = document.getElementById('regProvinsi');
    const elPekerjaan = document.getElementById('regPekerjaan');
    const elNoHp = document.getElementById('regNoHp');
    const elEmail = document.getElementById('regEmail');
    const elAlamatOrtu = document.getElementById('regAlamatOrtu');
    const elMedsos = document.getElementById('regMedsos');

    if (elAlamat) elAlamat.value = reg.alamat_rumah || '';
    if (elKota) elKota.value = reg.kota_kabupaten || '';
    if (elProv) elProv.value = reg.provinsi || '';
    if (elPekerjaan) elPekerjaan.value = reg.pekerjaan || '';
    if (elNoHp) elNoHp.value = reg.no_hp || '';
    if (elEmail) elEmail.value = reg.email || '';
    if (elAlamatOrtu) elAlamatOrtu.value = reg.alamat_orang_tua || '';
    if (elMedsos) elMedsos.value = reg.media_sosial || '';

    // Prefill atribut
    if (Array.isArray(atribut_master)) {
      atribut_master.forEach(attr => {
        if (attr.nama.toLowerCase().includes('topi')) {
          const el = document.getElementById('regAtributTopi');
          if (el) el.value = attr.memiliki ? 'Ada' : 'Hilang/Rusak';
        } else if (attr.nama.toLowerCase().includes('baju') || attr.nama.toLowerCase().includes('pdl')) {
          const el = document.getElementById('regAtributBaju');
          if (el) el.value = attr.memiliki ? 'Ada' : 'Hilang/Rusak';
        }
      });
    }

  } catch (err) {
    console.warn('Gagal memuat form registrasi ulang dari API:', err);
  }
}

// Submit Re-registration Form (FR-24) (POST /api/member/re-registration)
async function handleSubmitRegistrasi(e) {
  e.preventDefault();
  const token = localStorage.getItem('mapala_token');
  if (!token) {
    showToast('Sesi Anda telah berakhir, silakan login kembali.', 'error');
    return;
  }

  const periode_id = document.getElementById('regPeriodeId').value;
  const alamat_rumah = document.getElementById('regAlamat').value.trim();
  const kota_kabupaten = document.getElementById('regKota').value.trim();
  const provinsi = document.getElementById('regProvinsi').value.trim();
  const pekerjaan = document.getElementById('regPekerjaan').value.trim();
  const no_hp = document.getElementById('regNoHp').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const alamat_orang_tua = document.getElementById('regAlamatOrtu').value.trim();
  const media_sosial = document.getElementById('regMedsos').value.trim();

  const topiStatus = document.getElementById('regAtributTopi') ? document.getElementById('regAtributTopi').value : 'Ada';
  const bajuStatus = document.getElementById('regAtributBaju') ? document.getElementById('regAtributBaju').value : 'Ada';

  const atributList = [
    { jenis_atribut_id: 1, nama: 'Topi Rimba', status: topiStatus },
    { jenis_atribut_id: 2, nama: 'Baju Lapangan', status: bajuStatus }
  ];

  const fotoInput = document.getElementById('regFoto');
  const file = fotoInput && fotoInput.files && fotoInput.files[0] ? fotoInput.files[0] : null;

  // Bangun Multipart FormData
  const formData = new FormData();
  if (periode_id) formData.append('periode_id', periode_id);
  formData.append('alamat_rumah', alamat_rumah);
  formData.append('kota_kabupaten', kota_kabupaten);
  formData.append('provinsi', provinsi);
  formData.append('pekerjaan', pekerjaan);
  formData.append('no_hp', no_hp);
  formData.append('email', email);
  formData.append('alamat_orang_tua', alamat_orang_tua);
  if (media_sosial) formData.append('media_sosial', media_sosial);
  formData.append('atribut', JSON.stringify(atributList));
  if (file) formData.append('foto_terbaru', file);

  const btn = document.getElementById('regSubmitBtn');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i data-lucide="loader" class="w-4 h-4 animate-spin"></i><span>Mengirim Data ke Server...</span>';
    initLucide();
  }

  try {
    const res = await fetch('/api/member/re-registration', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    const result = await res.json();

    if (!res.ok || !result.success) {
      showToast(result.message || 'Gagal mengirim formulir registrasi ulang.', 'error');
      return;
    }

    showToast('Formulir Registrasi Ulang Mandiri berhasil disimpan ke database!', 'success');

    // Perbarui data lokal & tampilan
    await loadLiveDataFromMySQL();
    renderDashboard();
    renderBiodata();
    switchTab('tab-dashboard');

  } catch (err) {
    console.error('Error submit registrasi ulang:', err);
    showToast('Terjadi gangguan jaringan saat mengirim formulir registrasi.', 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i data-lucide="check" class="w-4 h-4"></i><span>Kirim Formulir Registrasi Ulang 2026</span>';
      initLucide();
    }
  }
}

// 6. Render Direktori Anggota (FR-46, FR-47) - Privasi UU PDP
let dirDebounceTimer = null;

function getWhatsAppUrl(phone) {
  if (!phone) return null;
  let clean = String(phone).replace(/\D/g, '');
  if (!clean) return null;
  if (clean.startsWith('0')) {
    clean = '62' + clean.slice(1);
  } else if (!clean.startsWith('62') && clean.startsWith('8')) {
    clean = '62' + clean;
  }
  return `https://wa.me/${clean}`;
}

function updateProvinsiDropdown(availableProvinces, currentSelected) {
  const provEl = document.getElementById('dirFilterProvinsi');
  if (!provEl || !Array.isArray(availableProvinces)) return;

  const existingValues = Array.from(provEl.options).map(o => o.value);
  availableProvinces.forEach(prov => {
    if (prov && !existingValues.includes(prov)) {
      const opt = document.createElement('option');
      opt.value = prov;
      opt.textContent = prov;
      provEl.appendChild(opt);
    }
  });

  if (currentSelected) {
    provEl.value = currentSelected;
  }
}

async function fetchDirectory() {
  const token = localStorage.getItem('mapala_token');
  if (!token) return;

  const queryEl = document.getElementById('dirSearch');
  const provEl = document.getElementById('dirFilterProvinsi');
  const goldarEl = document.getElementById('dirFilterGoldar');
  const container = document.getElementById('directoryGrid');
  const countBadge = document.getElementById('dirResultCount');

  const q = queryEl ? queryEl.value.trim() : '';
  const provinsi = provEl ? provEl.value.trim() : '';
  const goldar = goldarEl ? goldarEl.value.trim() : '';

  const params = new URLSearchParams();
  if (q) params.append('q', q);
  if (provinsi) params.append('provinsi', provinsi);
  if (goldar) params.append('goldar', goldar);

  try {
    const url = `/api/member/directory${params.toString() ? '?' + params.toString() : ''}`;
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) throw new Error('Gagal memuat data direktori');
    const result = await res.json();

    if (result.success && result.data) {
      directoryList = result.data.members || [];

      if (result.data.available_provinces) {
        updateProvinsiDropdown(result.data.available_provinces, provinsi);
      }

      renderDirectoryCards(directoryList, countBadge, container);
    }
  } catch (err) {
    console.warn('Gagal memuat direktori live:', err);
    // Fallback filter dari cache lokal jika terjadi offline/gangguan
    const filtered = directoryList.filter(item => {
      const matchQ = !q || (item.nama && item.nama.toLowerCase().includes(q.toLowerCase())) ||
                            (item.no_register && item.no_register.toLowerCase().includes(q.toLowerCase()));
      const matchProv = !provinsi || item.provinsi === provinsi;
      const matchGoldar = !goldar || item.golongan_darah === goldar;
      return matchQ && matchProv && matchGoldar;
    });
    renderDirectoryCards(filtered, countBadge, container);
  }
}

function renderDirectoryCards(members, countBadge, container) {
  if (!container || !countBadge) return;

  countBadge.textContent = `${members.length} Anggota Ditemukan`;

  if (members.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-12 text-center text-[#8C9BAE]">
        <i data-lucide="user-x" class="w-10 h-10 mx-auto mb-2 opacity-40"></i>
        <p class="text-sm font-medium">Tidak ada anggota yang cocok dengan filter atau kata kunci pencarian.</p>
        <p class="text-xs text-[#8C9BAE]/70 mt-1">Hanya anggota aktif yang telah menyetujui Kebijakan Privasi Data yang ditampilkan.</p>
      </div>
    `;
    initLucide();
    return;
  }

  // Hanya menampilkan 5 atribut data resmi (Nama, No. Register, Domisili Kota & Provinsi, No. HP, Golongan Darah)
  container.innerHTML = members.map(item => {
    const waUrl = getWhatsAppUrl(item.no_hp);
    const domisiliText = [item.kota_kabupaten, item.provinsi].filter(Boolean).join(', ') || 'Domisili belum tercatat';
    const goldarBadge = item.golongan_darah ? item.golongan_darah : '-';

    return `
      <div class="bg-[#11161B] border border-[#1C2530] hover:border-[#FF6B00]/40 rounded-2xl p-5 transition-all flex flex-col justify-between shadow-sm">
        <div>
          <div class="flex items-start justify-between gap-3 mb-3">
            <div>
              <span class="text-xs font-mono font-bold text-[#FF6B00] bg-[#FF6B00]/10 px-2 py-0.5 rounded border border-[#FF6B00]/20">
                ${item.no_register || '-'}
              </span>
              <h4 class="text-base font-bold text-white mt-1.5">${item.nama || '-'}</h4>
            </div>
            <div class="text-center bg-[#07090C] border border-[#1C2530] rounded-xl px-2.5 py-1 shrink-0">
              <span class="text-[10px] text-[#8C9BAE] block uppercase font-bold">Goldar</span>
              <span class="text-sm font-extrabold text-red-400 font-mono">${goldarBadge}</span>
            </div>
          </div>

          <div class="space-y-2 text-xs text-[#94A3B8] pt-2 border-t border-white/5">
            <div class="flex items-center gap-2">
              <i data-lucide="map-pin" class="w-3.5 h-3.5 text-[#8C9BAE] shrink-0"></i>
              <span class="truncate" title="${domisiliText}">${domisiliText}</span>
            </div>
          </div>
        </div>

        <div class="mt-4 pt-3 border-t border-[#1C2530] flex items-center justify-between gap-2">
          <div class="flex items-center gap-1.5 text-xs font-mono text-[#8C9BAE] truncate">
            <i data-lucide="phone" class="w-3.5 h-3.5 shrink-0 text-[#8C9BAE]"></i>
            <span class="truncate">${item.no_hp || 'Belum ada nomor'}</span>
          </div>
          ${waUrl ? `
            <a href="${waUrl}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 text-xs font-semibold transition-all shrink-0">
              <i data-lucide="message-circle" class="w-3.5 h-3.5"></i>
              <span>Hubungi WA</span>
            </a>
          ` : `
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 text-[#8C9BAE] text-[11px] font-medium cursor-not-allowed shrink-0">
              <i data-lucide="phone-off" class="w-3.5 h-3.5"></i>
              <span>Belum ada WA</span>
            </span>
          `}
        </div>
      </div>
    `;
  }).join('');

  initLucide();
}

// Handler event pencarian dan filter
function renderDirectory() {
  clearTimeout(dirDebounceTimer);
  dirDebounceTimer = setTimeout(() => {
    fetchDirectory();
  }, 200);
}

// 7. Change Password Handler dari Tab Pengaturan (FR-12)
async function handleChangePassword(e) {
  e.preventDefault();
  const token = localStorage.getItem('mapala_token');
  const oldPass = document.getElementById('settOldPass').value;
  const newPass = document.getElementById('settNewPass').value;
  const confPass = document.getElementById('settConfPass').value;

  if (newPass !== confPass) {
    showToast('Konfirmasi kata sandi baru tidak cocok!', 'error');
    return;
  }
  if (newPass.length < 6) {
    showToast('Kata sandi baru minimal harus 6 karakter!', 'error');
    return;
  }

  const btn = e.target.querySelector('button[type="submit"]');
  if (btn) {
    btn.disabled = true;
    btn.innerText = 'Menyimpan...';
  }

  try {
    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ oldPassword: oldPass, newPassword: newPass })
    });
    const result = await res.json();

    if (!res.ok || !result.success) {
      showToast(result.message || 'Gagal mengubah kata sandi.', 'error');
      return;
    }

    showToast('Kata sandi berhasil diperbarui di database!', 'success');
    document.getElementById('formChangePassword').reset();
  } catch (err) {
    console.error('Error change password:', err);
    showToast('Terjadi gangguan jaringan saat memperbarui kata sandi.', 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerText = 'Simpan Kata Sandi';
    }
  }
}

// Security Gate 1: Mandatory First Login Password Change (FR-11)
async function handleMandatoryPassword(e) {
  e.preventDefault();
  const token = localStorage.getItem('mapala_token');
  const oldPass = document.getElementById('mandOldPass') ? document.getElementById('mandOldPass').value : 'mapala123';
  const newPass = document.getElementById('mandNewPass').value;
  const confPass = document.getElementById('mandConfPass').value;

  if (newPass !== confPass) {
    showToast('Konfirmasi kata sandi tidak cocok!', 'error');
    return;
  }
  if (newPass.length < 6) {
    showToast('Kata sandi baru minimal harus 6 karakter!', 'error');
    return;
  }

  const submitBtn = document.getElementById('btnSubmitMandatoryPassword');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerText = 'Menyimpan Kata Sandi...';
  }

  try {
    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ oldPassword: oldPass, newPassword: newPass })
    });
    const result = await res.json();

    if (!res.ok || !result.success) {
      showToast(result.message || 'Gagal mengubah kata sandi.', 'error');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerText = 'Simpan & Lanjutkan';
      }
      return;
    }

    // Update session state
    currentUser.must_change_password = false;
    localStorage.setItem('mapala_user', JSON.stringify(currentUser));
    closeModal('mandatoryPasswordModal');
    showToast('Kata sandi baru berhasil disimpan di database!', 'success');

    // Lanjutkan otomatis ke Gate 2 (Persetujuan Kebijakan Privasi)
    setTimeout(() => {
      checkPrivacyConsentGate();
    }, 400);

  } catch (err) {
    console.error('Error mandatory password change:', err);
    showToast('Terjadi gangguan jaringan saat memperbarui kata sandi.', 'error');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerText = 'Simpan & Lanjutkan';
    }
  }
}

// Security Gate 2: Verifikasi & Tampilan Kebijakan Privasi (FR-44 & FR-45)
async function checkPrivacyConsentGate() {
  const token = localStorage.getItem('mapala_token');
  if (!token) return;

  try {
    const res = await fetch('/api/member/privacy-policy', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) return;

    const json = await res.json();
    if (json.success && json.data) {
      const policy = json.data;
      currentPolicyId = policy.kebijakan_id;

      const titleEl = document.getElementById('privacyPolicyTitle');
      if (titleEl && policy.judul) titleEl.textContent = policy.judul;

      const contentEl = document.getElementById('privacyPolicyContent');
      if (contentEl && policy.isi) {
        contentEl.innerHTML = policy.isi
          .split('\n\n')
          .map(paragraph => `<p class="mb-2.5">${paragraph.replace(/\n/g, '<br>')}</p>`)
          .join('');
      }

      if (!policy.sudah_disetujui) {
        currentUser.privacy_consent_given = false;
        localStorage.setItem('mapala_user', JSON.stringify(currentUser));
        openModal('mandatoryPrivacyModal');
      } else {
        currentUser.privacy_consent_given = true;
        localStorage.setItem('mapala_user', JSON.stringify(currentUser));
        closeModal('mandatoryPrivacyModal');
      }
    }
  } catch (err) {
    console.warn('Gagal memverifikasi status persetujuan privasi:', err);
  }
}

// Mandatory Privacy Consent Submit (FR-44, FR-45)
async function handleMandatoryConsent() {
  const check = document.getElementById('checkConsentPolicy');
  if (check && !check.checked) {
    showToast('Anda wajib mencentang persetujuan kebijakan privasi.', 'error');
    return;
  }

  const token = localStorage.getItem('mapala_token');
  const btn = document.getElementById('btnSubmitConsent');
  if (btn) {
    btn.disabled = true;
    btn.innerText = 'Menyimpan Persetujuan...';
  }

  try {
    const res = await fetch('/api/member/privacy-policy/consent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ kebijakan_id: currentPolicyId || 1 })
    });
    const result = await res.json();

    if (!res.ok || !result.success) {
      showToast(result.message || 'Gagal menyimpan persetujuan privasi.', 'error');
      return;
    }

    currentUser.privacy_consent_given = true;
    localStorage.setItem('mapala_user', JSON.stringify(currentUser));
    closeModal('mandatoryPrivacyModal');
    showToast('Persetujuan kebijakan privasi berhasil disimpan ke basis data. Selamat datang!', 'success');

  } catch (err) {
    console.error('Error submit consent:', err);
    showToast('Terjadi gangguan jaringan saat menyimpan persetujuan.', 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerText = 'Setujui & Lanjutkan';
    }
  }
}

function closePrivacyModal() {
  if (!currentUser.privacy_consent_given) {
    showToast('Persetujuan kebijakan privasi wajib diberikan sebelum Anda dapat mengakses Portal Anggota.', 'error');
    return;
  }
  closeModal('mandatoryPrivacyModal');
}

// Modal Helpers
function openModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.remove('hidden');
  initLucide();
}

function closeModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.add('hidden');
}

// Toast System
function showToast(msg, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast-msg border-l-4 ' + 
    (type === 'success' ? 'border-emerald-500 text-emerald-300' : 
     type === 'error' ? 'border-red-500 text-red-300' : 'border-[#FF6B00] text-amber-300');

  const iconName = type === 'success' ? 'check-circle' : type === 'error' ? 'alert-triangle' : 'info';
  toast.innerHTML = `
    <i data-lucide="${iconName}" class="w-5 h-5 shrink-0"></i>
    <span>${msg}</span>
  `;

  container.appendChild(toast);
  initLucide();

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(16px)';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Logout
function handleLogout() {
  if (confirm('Apakah Anda yakin ingin keluar dari Portal Anggota?')) {
    localStorage.removeItem('mapala_token');
    localStorage.removeItem('mapala_user');
    window.location.href = '/login';
  }
}
