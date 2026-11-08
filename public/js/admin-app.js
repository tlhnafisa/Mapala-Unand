/**
 * Mapala UNAND - Admin Dashboard Single Page Application
 * Core JavaScript Logic & API Integration
 */

const STATE = {
  token: localStorage.getItem('mapala_token') || null,
  user: JSON.parse(localStorage.getItem('mapala_user') || 'null'),
  currentTab: 'overview',
  activePeriod: null,
  members: [],
  filteredMembers: [],
  monitoringList: [],
  periodes: [],
  attributes: [],
  articles: [],
  pengurus: [],
  prestasi: [],
  staticContent: {},
  logs: [],
  importPreviewData: null
};

// ========================================================
// THEME MANAGER (DARK & LIGHT THEME)
// ========================================================
function initTheme() {
  const savedTheme = localStorage.getItem('mapala_theme') || 'dark';
  applyTheme(savedTheme);
}

function toggleTheme() {
  const isLight = document.body.classList.contains('theme-light');
  const newTheme = isLight ? 'dark' : 'light';
  applyTheme(newTheme);
  localStorage.setItem('mapala_theme', newTheme);
  showToast(`Beralih ke ${newTheme === 'light' ? 'Tema Terang' : 'Tema Gelap'}`);
}

function applyTheme(theme) {
  const themeIcon = document.getElementById('themeIcon');
  const themeLabel = document.getElementById('themeLabel');

  if (theme === 'light') {
    document.body.classList.add('theme-light');
    if (themeIcon) themeIcon.setAttribute('data-lucide', 'moon');
    if (themeLabel) themeLabel.innerText = 'Tema Gelap';
  } else {
    document.body.classList.remove('theme-light');
    if (themeIcon) themeIcon.setAttribute('data-lucide', 'sun');
    if (themeLabel) themeLabel.innerText = 'Tema Terang';
  }
  lucide.createIcons();
}

// ========================================================
// NO. REGISTER VALIDATION & NORMALIZATION HELPER
// Format: MU XXX(Wajib angka) XXX.(Huruf pertama besar, sisanya kecil diikuti titik)
// Contoh: MU 325 Ltn., MU 123 Abc.
// ========================================================
function isValidNoRegister(val) {
  if (!val || typeof val !== 'string') return false;
  const regex = /^MU[\s-]?(\d{3})[\s-]?([A-Za-z]{3})\.?$/i;
  return regex.test(val.trim());
}

function normalizeNoRegister(val) {
  const match = val.trim().match(/^MU[\s-]?(\d{3})[\s-]?([A-Za-z]{3})\.?$/i);
  if (!match) return val.trim();
  const letters = match[2];
  const formattedCode = letters[0].toUpperCase() + letters.slice(1, 3).toLowerCase() + '.';
  return `MU ${match[1]} ${formattedCode}`;
}

// Global API Fetch helper with Auth Token
async function api(endpoint, options = {}) {
  const headers = {
    ...options.headers
  };

  if (STATE.token) {
    headers['Authorization'] = `Bearer ${STATE.token}`;
  }

  // If not FormData, default to JSON
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const res = await fetch(endpoint, {
      ...options,
      headers
    });

    if (res.status === 401 || res.status === 403) {
      if (endpoint !== '/api/auth/login') {
        showToast('Sesi Anda berakhir atau tidak memiliki izin akses.', 'error');
        logout();
        return null;
      }
    }

    const data = await res.json();
    return data;
  } catch (err) {
    console.error('API Error:', err);
    showToast('Terjadi kesalahan jaringan atau server.', 'error');
    return null;
  }
}

// Toast notification helper
function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  const bg = type === 'success' ? 'bg-[#10B981]' : (type === 'error' ? 'bg-[#EF4444]' : 'bg-[#FF6B00]');

  toast.className = `${bg} text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-sm font-medium transition-all duration-300 transform translate-y-2 opacity-0`;
  toast.innerHTML = `
    <i data-lucide="${type === 'success' ? 'check-circle' : 'alert-circle'}" class="w-5 h-5"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);
  lucide.createIcons();

  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-2', 'opacity-0');
  });

  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Authentication Check
function checkAuth() {
  const loginModal = document.getElementById('loginModal');
  const appContainer = document.getElementById('appContainer');

  if (!STATE.token || !STATE.user || STATE.user.role !== 'admin') {
    loginModal.classList.add('active');
    appContainer.classList.add('opacity-20', 'pointer-events-none');
    return false;
  } else {
    loginModal.classList.remove('active');
    appContainer.classList.remove('opacity-20', 'pointer-events-none');
    document.getElementById('currentAdminName').innerText = STATE.user.nama || STATE.user.username;
    return true;
  }
}

// Login Action
async function handleLogin(e) {
  e.preventDefault();
  const usernameInput = document.getElementById('loginUsername').value;
  const passwordInput = document.getElementById('loginPassword').value;

  const res = await api('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username: usernameInput, password: passwordInput })
  });

  if (res && res.success) {
    if (res.data.user.role !== 'admin') {
      showToast('Akses ditolak: Akun ini bukan administrator.', 'error');
      return;
    }
    STATE.token = res.data.token;
    STATE.user = res.data.user;
    localStorage.setItem('mapala_token', STATE.token);
    localStorage.setItem('mapala_user', JSON.stringify(STATE.user));
    showToast('Login Admin berhasil!', 'success');
    checkAuth();
    loadDashboardStats();
    loadMembers();
  } else {
    showToast(res ? res.message : 'Login gagal.', 'error');
  }
}

function logout() {
  STATE.token = null;
  STATE.user = null;
  localStorage.removeItem('mapala_token');
  localStorage.removeItem('mapala_user');
  checkAuth();
}

// Tab Switching
function switchTab(tabId) {
  STATE.currentTab = tabId;
  document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));

  const targetContent = document.getElementById(`tab-${tabId}`);
  const targetLink = document.getElementById(`nav-${tabId}`);

  if (targetContent) targetContent.classList.remove('hidden');
  if (targetLink) targetLink.classList.add('active');

  // Trigger data load based on tab
  switch (tabId) {
    case 'overview':
      loadDashboardStats();
      break;
    case 'members':
      loadMembers();
      break;
    case 'monitoring':
      loadMonitoringList();
      break;
    case 'settings':
      loadPeriodesAndDivisions();
      break;
    case 'cms':
      loadCMSArticles();
      loadCMSStrukturOrganisasi();
      loadCMSPrestasi();
      loadStaticContent();
      break;
    case 'logs':
      loadLogs();
      break;
  }
}

// 1. DASHBOARD OVERVIEW (FR-28)
async function loadDashboardStats() {
  const res = await api('/api/admin/dashboard/stats');
  if (!res || !res.success) return;

  const { metrics, divisionStats, angkatanStats, domisiliStats, recentLogs, periode } = res.data;
  STATE.activePeriod = periode;

  // Update division count badge in dashboard overview from divisionStats
  const divisionCountBadge = document.getElementById('divisionCountBadge');
  if (divisionCountBadge) {
    const divCount = Object.keys(divisionStats).length;
    divisionCountBadge.innerText = `${divCount} Divisi`;
  }

  // Active period badge
  const activePeriodBadge = document.getElementById('activePeriodBadge');
  if (activePeriodBadge) {
    activePeriodBadge.innerText = `Periode Aktif: ${periode.nama_periode} (${periode.is_active ? 'Buka' : 'Tutup'})`;
  }

  // Update metric counters
  document.getElementById('statTotalMembers').innerText = metrics.totalMembers;
  document.getElementById('statSudahReg').innerText = metrics.sudahReg;
  document.getElementById('statBelumReg').innerText = metrics.belumReg;
  document.getElementById('statPersentase').innerText = `${metrics.persentaseKelengkapan}%`;
  document.getElementById('progressKelengkapan').style.width = `${metrics.persentaseKelengkapan}%`;

  // Render Division Bar Chart
  const divisionContainer = document.getElementById('chartDivisionBars');
  if (divisionContainer) {
    divisionContainer.innerHTML = '';
    const maxDiv = Math.max(...Object.values(divisionStats), 1);
    for (const [divisi, count] of Object.entries(divisionStats)) {
      const pct = Math.round((count / maxDiv) * 100);
      divisionContainer.innerHTML += `
        <div class="mb-3">
          <div class="flex justify-between text-xs mb-1">
            <span class="text-[#CBD5E1] font-medium">${divisi}</span>
            <span class="text-[#FF6B00] font-bold">${count} anggota</span>
          </div>
          <div class="w-full bg-[#1C2530] rounded-full h-2">
            <div class="bg-[#FF6B00] h-2 rounded-full transition-all duration-500" style="width: ${pct}%"></div>
          </div>
        </div>
      `;
    }
  }

  // Render Angkatan Distribution
  const angkatanContainer = document.getElementById('chartAngkatanBars');
  if (angkatanContainer) {
    angkatanContainer.innerHTML = '';
    const sortedAngkatan = Object.entries(angkatanStats).sort((a, b) => b[0] - a[0]);
    sortedAngkatan.slice(0, 6).forEach(([year, count]) => {
      angkatanContainer.innerHTML += `
        <div class="flex items-center justify-between p-2 rounded-xl bg-[#0D1217] border border-white/5">
          <span class="text-xs font-semibold text-white">Angkatan ${year}</span>
          <span class="badge-pill badge-orange font-bold">${count}</span>
        </div>
      `;
    });
  }

  // Render Recent Activity Logs
  const recentLogList = document.getElementById('recentLogsList');
  if (recentLogList) {
    recentLogList.innerHTML = '';
    recentLogs.forEach(l => {
      const timeStr = new Date(l.waktu).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      recentLogList.innerHTML += `
        <div class="flex items-start gap-3 py-2 border-b border-white/5 last:border-0">
          <div class="w-2 h-2 rounded-full bg-[#FF6B00] mt-1.5 shrink-0"></div>
          <div class="text-xs">
            <p class="text-white font-medium">${l.detail}</p>
            <span class="text-[#8C9BAE]">${l.admin} • ${timeStr}</span>
          </div>
        </div>
      `;
    });
  }
}

// 2. MEMBER MANAGEMENT (FR-29 s.d. FR-33, FR-35, FR-38)
async function loadMembers() {
  const search = document.getElementById('searchMember').value;
  const angkatan = document.getElementById('filterAngkatan').value;
  const divisi = document.getElementById('filterDivisi').value;
  const status_reg = document.getElementById('filterStatusReg').value;
  const domisili = document.getElementById('filterDomisili').value;

  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (angkatan) params.append('angkatan', angkatan);
  if (divisi) params.append('divisi', divisi);
  if (status_reg) params.append('status_reg', status_reg);
  if (domisili) params.append('domisili', domisili);

  const res = await api(`/api/admin/members?${params.toString()}`);
  if (!res || !res.success) return;

  STATE.members = res.data;
  renderMembersTable(res.data);
}

function renderMembersTable(members) {
  const tbody = document.getElementById('membersTableBody');
  const countLabel = document.getElementById('membersCountLabel');
  countLabel.innerText = `Menampilkan ${members.length} anggota`;

  tbody.innerHTML = '';
  if (members.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center py-10 text-[#8C9BAE]">
          <i data-lucide="inbox" class="w-10 h-10 mx-auto mb-2 opacity-50"></i>
          Tidak ada data anggota yang sesuai dengan kriteria filter.
        </td>
      </tr>
    `;
    lucide.createIcons();
    return;
  }

  members.forEach(m => {
    const isRegistered = m.reg_status === 'Sudah Registrasi';
    const statusBadge = isRegistered
      ? `<span class="badge-pill badge-success"><i data-lucide="check" class="w-3 h-3"></i> Sudah Regulang</span>`
      : `<span class="badge-pill badge-warning"><i data-lucide="clock" class="w-3 h-3"></i> Belum Regulang</span>`;

    const activeBadge = m.status_aktif
      ? `<span class="badge-pill badge-orange">Aktif</span>`
      : `<span class="badge-pill badge-danger">Nonaktif</span>`;

    const waBtn = m.no_hp
      ? `<a href="https://wa.me/${m.no_hp.replace(/\D/g, '')}" target="_blank" title="Kirim Pesan WhatsApp" class="p-2 rounded-xl bg-white/5 hover:bg-[#10B981]/20 text-[#10B981] transition-colors"><i data-lucide="message-circle" class="w-4 h-4"></i></a>`
      : `<span class="p-2 text-white/20" title="Nomor HP belum tersedia"><i data-lucide="message-circle" class="w-4 h-4"></i></span>`;

    tbody.innerHTML += `
      <tr>
        <td>
          <div class="font-bold text-white text-sm">${m.no_register}</div>
          <div class="text-xs text-[#8C9BAE]">Angkatan ${m.angkatan}</div>
        </td>
        <td>
          <div class="font-semibold text-white">${m.nama}</div>
          <div class="text-xs text-[#94A3B8]">Goldar: ${m.golongan_darah || '-'}</div>
        </td>
        <td>
          <span class="text-xs text-[#CBD5E1]">${m.divisi}</span>
        </td>
        <td>
          <div class="text-xs text-[#CBD5E1]">${m.domisili_kota || '-'}</div>
          <div class="text-[11px] text-[#8C9BAE]">${m.domisili_provinsi || ''}</div>
        </td>
        <td>
          <div class="flex flex-col gap-1 items-start">
            ${statusBadge}
            ${activeBadge}
          </div>
        </td>
        <td>
          <div class="flex items-center gap-1.5">
            ${waBtn}
            <button onclick="openMemberDetailModal('${m.no_register}')" title="Lihat Detail Biodata" class="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-[#FF6B00] transition-colors">
              <i data-lucide="eye" class="w-4 h-4"></i>
            </button>
            <button onclick="openEditMemberModal('${m.no_register}')" title="Edit Data Tetap" class="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors">
              <i data-lucide="edit-3" class="w-4 h-4"></i>
            </button>
            <a href="/api/admin/members/${m.no_register}/print-biodata" target="_blank" title="Cetak Formulir PDF" class="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-[#38BDF8] transition-colors">
              <i data-lucide="printer" class="w-4 h-4"></i>
            </a>
            <button onclick="confirmResetPassword('${m.no_register}')" title="Reset Password" class="p-2 rounded-xl bg-white/5 hover:bg-[#F59E0B]/20 text-[#F59E0B] transition-colors">
              <i data-lucide="key" class="w-4 h-4"></i>
            </button>
            <button onclick="toggleMemberStatus('${m.no_register}')" title="${m.status_aktif ? 'Nonaktifkan' : 'Aktifkan'}" class="p-2 rounded-xl bg-white/5 hover:bg-[#EF4444]/20 text-[#F87171] transition-colors">
              <i data-lucide="${m.status_aktif ? 'user-x' : 'user-check'}" class="w-4 h-4"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  });

  lucide.createIcons();
}

// Reset Password Member (FR-13)
async function confirmResetPassword(no_reg) {
  if (confirm(`Apakah Anda yakin ingin mereset password anggota ${no_reg}? Password akan dikembalikan ke 'mapala123' dan wajib diganti pada login berikutnya.`)) {
    const res = await api(`/api/admin/members/${no_reg}/reset-password`, { method: 'POST' });
    if (res && res.success) {
      showToast(res.message, 'success');
      loadLogs();
    }
  }
}

// Toggle Member Status (FR-30)
async function toggleMemberStatus(no_reg) {
  const res = await api(`/api/admin/members/${no_reg}/toggle-status`, { method: 'PATCH' });
  if (res && res.success) {
    showToast(res.message, 'success');
    loadMembers();
    loadDashboardStats();
  }
}

// Member Detail Modal
async function openMemberDetailModal(no_reg) {
  const res = await api(`/api/admin/members/${no_reg}`);
  if (!res || !res.success) return;

  const { profile, currentRegistration, registrationHistory, account } = res.data;

  document.getElementById('detailNoReg').innerText = profile.no_register;
  document.getElementById('detailNama').innerText = profile.nama;
  document.getElementById('detailDivisi').innerText = profile.divisi;
  document.getElementById('detailAngkatan').innerText = profile.angkatan;
  document.getElementById('detailTTL').innerText = `${profile.tempat_lahir}, ${profile.tanggal_lahir || '-'}`;
  document.getElementById('detailGoldar').innerText = profile.golongan_darah || '-';
  document.getElementById('detailOrtu').innerText = `Ayah: ${profile.nama_ayah} | Ibu: ${profile.nama_ibu}`;
  document.getElementById('detailStatus').innerText = profile.status_aktif ? 'Aktif' : 'Nonaktif';

  // Domisili data
  if (currentRegistration) {
    document.getElementById('detailAlamat').innerText = currentRegistration.alamat_rumah || '-';
    document.getElementById('detailKotaProv').innerText = `${currentRegistration.kota_kabupaten}, ${currentRegistration.provinsi}`;
    document.getElementById('detailHP').innerText = currentRegistration.no_hp || '-';
    document.getElementById('detailEmail').innerText = currentRegistration.email || '-';
    document.getElementById('detailPekerjaan').innerText = currentRegistration.pekerjaan || '-';
    document.getElementById('detailSumber').innerText = `${currentRegistration.sumber_input === 'admin' ? 'Diinput Admin (' + currentRegistration.input_by + ')' : 'Mandiri'} pada ${new Date(currentRegistration.submitted_at).toLocaleDateString('id-ID')}`;
  } else {
    document.getElementById('detailAlamat').innerText = 'Belum melakukan registrasi ulang periode ini';
    document.getElementById('detailKotaProv').innerText = '-';
    document.getElementById('detailHP').innerText = '-';
    document.getElementById('detailEmail').innerText = '-';
    document.getElementById('detailPekerjaan').innerText = '-';
    document.getElementById('detailSumber').innerText = '-';
  }

  // Print button link
  document.getElementById('detailPrintBtn').href = `/api/admin/members/${profile.no_register}/print-biodata`;

  document.getElementById('memberDetailModal').classList.add('active');
}

// Add Member Modal
function openAddMemberModal() {
  document.getElementById('addMemberForm').reset();
  document.getElementById('addMemberModal').classList.add('active');
}

async function handleAddMember(e) {
  e.preventDefault();
  const rawNoReg = document.getElementById('addNoReg').value.trim();

  // Client-side validation: MU XXX(3 digit angka) Xxx.
  if (!isValidNoRegister(rawNoReg)) {
    showToast("Format No. Register tidak valid. Wajib 'MU XXX(3 digit angka) Xxx.' contoh: MU 325 Ltn.", 'error');
    return;
  }

  const normalizedNoReg = normalizeNoRegister(rawNoReg);

  const payload = {
    no_register: normalizedNoReg,
    nama: document.getElementById('addNama').value,
    divisi: document.getElementById('addDivisi').value,
    angkatan: document.getElementById('addAngkatan').value,
    tempat_lahir: document.getElementById('addTempatLahir').value,
    tanggal_lahir: document.getElementById('addTanggalLahir').value,
    golongan_darah: document.getElementById('addGoldar').value,
    nama_ayah: document.getElementById('addAyah').value,
    nama_ibu: document.getElementById('addIbu').value
  };

  const res = await api('/api/admin/members', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

  if (res && res.success) {
    showToast('Anggota berhasil didaftarkan!', 'success');
    closeModal('addMemberModal');
    loadMembers();
    loadDashboardStats();
  } else {
    showToast(res ? res.message : 'Gagal menambahkan anggota.', 'error');
  }
}

// Edit Member Modal
async function openEditMemberModal(no_reg) {
  const res = await api(`/api/admin/members/${no_reg}`);
  if (!res || !res.success) return;

  const m = res.data.profile;
  document.getElementById('editNoReg').value = m.no_register;
  document.getElementById('editNama').value = m.nama;
  document.getElementById('editDivisi').value = m.divisi;
  document.getElementById('editAngkatan').value = m.angkatan;
  document.getElementById('editTempatLahir').value = m.tempat_lahir;
  document.getElementById('editTanggalLahir').value = m.tanggal_lahir;
  document.getElementById('editGoldar').value = m.golongan_darah;
  document.getElementById('editAyah').value = m.nama_ayah;
  document.getElementById('editIbu').value = m.nama_ibu;

  document.getElementById('editMemberModal').classList.add('active');
}

async function handleEditMember(e) {
  e.preventDefault();
  const no_reg = document.getElementById('editNoReg').value;
  const payload = {
    nama: document.getElementById('editNama').value,
    divisi: document.getElementById('editDivisi').value,
    angkatan: document.getElementById('editAngkatan').value,
    tempat_lahir: document.getElementById('editTempatLahir').value,
    tanggal_lahir: document.getElementById('editTanggalLahir').value,
    golongan_darah: document.getElementById('editGoldar').value,
    nama_ayah: document.getElementById('editAyah').value,
    nama_ibu: document.getElementById('editIbu').value
  };

  const res = await api(`/api/admin/members/${no_reg}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });

  if (res && res.success) {
    showToast('Biodata anggota berhasil diperbarui!', 'success');
    closeModal('editMemberModal');
    loadMembers();
  } else {
    showToast(res ? res.message : 'Gagal memperbarui anggota.', 'error');
  }
}

// Modal Impor Excel (FR-31)
function openImportModal() {
  STATE.importPreviewData = null;
  document.getElementById('importFile').value = '';
  document.getElementById('importPreviewContainer').classList.add('hidden');
  document.getElementById('btnCommitImport').classList.add('hidden');
  document.getElementById('importModal').classList.add('active');
}

async function handleImportFileSelected(input) {
  if (!input.files || input.files.length === 0) return;

  const file = input.files[0];
  const formData = new FormData();
  formData.append('file', file);

  const previewContainer = document.getElementById('importPreviewContainer');
  previewContainer.classList.remove('hidden');
  document.getElementById('importPreviewTableBody').innerHTML = `
    <tr><td colspan="5" class="text-center py-6 text-white"><i data-lucide="loader" class="w-6 h-6 animate-spin mx-auto mb-2"></i>Memproses file Excel dan memeriksa validasi...</td></tr>
  `;
  lucide.createIcons();

  const res = await api('/api/admin/members/import-preview', {
    method: 'POST',
    body: formData
  });

  if (res && res.success) {
    STATE.importPreviewData = res.data;
    renderImportPreview(res.data);
  } else {
    showToast(res ? res.message : 'Gagal memproses pratinjau file.', 'error');
    previewContainer.classList.add('hidden');
  }
}

function renderImportPreview(data) {
  document.getElementById('importStatTotal').innerText = data.totalRows;
  document.getElementById('importStatValid').innerText = data.validCount;
  document.getElementById('importStatError').innerText = data.errorCount;
  document.getElementById('importStatDuplicate').innerText = data.duplicateCount;

  const tbody = document.getElementById('importPreviewTableBody');
  tbody.innerHTML = '';

  data.rows.slice(0, 15).forEach(r => {
    const statusPill = r.isValid
      ? `<span class="badge-pill badge-success">Valid</span>`
      : `<span class="badge-pill badge-danger">${r.errors.join(', ')}</span>`;

    tbody.innerHTML += `
      <tr class="${!r.isValid ? 'bg-red-500/10' : ''}">
        <td>#${r.rowNum}</td>
        <td class="font-bold text-white">${r.no_reg || '-'}</td>
        <td>${r.nama || '-'}</td>
        <td>${r.divisi || '-'} (${r.angkatan || '-'})</td>
        <td>${statusPill}</td>
      </tr>
    `;
  });

  if (data.rows.length > 15) {
    tbody.innerHTML += `
      <tr>
        <td colspan="5" class="text-center text-xs text-[#8C9BAE] py-2">
          ... dan ${data.rows.length - 15} baris lainnya
        </td>
      </tr>
    `;
  }

  const commitBtn = document.getElementById('btnCommitImport');
  if (data.validCount > 0) {
    commitBtn.classList.remove('hidden');
    commitBtn.innerText = `Simpan ${data.validCount} Data Valid ke Database`;
  } else {
    commitBtn.classList.add('hidden');
  }
}

async function commitImportData() {
  if (!STATE.importPreviewData) return;
  const validRows = STATE.importPreviewData.rows.filter(r => r.isValid);

  if (validRows.length === 0) {
    showToast('Tidak ada data valid untuk disimpan.', 'error');
    return;
  }

  const res = await api('/api/admin/members/import-commit', {
    method: 'POST',
    body: JSON.stringify({ validRows })
  });

  if (res && res.success) {
    showToast(res.message, 'success');
    closeModal('importModal');
    loadMembers();
    loadDashboardStats();
  } else {
    showToast(res ? res.message : 'Gagal menyimpan impor data.', 'error');
  }
}

// Export Filtered Members (FR-35)
function exportMembersFiltered() {
  const angkatan = document.getElementById('filterAngkatan').value;
  const divisi = document.getElementById('filterDivisi').value;
  const status_reg = document.getElementById('filterStatusReg').value;
  const domisili = document.getElementById('filterDomisili').value;

  const params = new URLSearchParams();
  if (angkatan) params.append('angkatan', angkatan);
  if (divisi) params.append('divisi', divisi);
  if (status_reg) params.append('status_reg', status_reg);
  if (domisili) params.append('domisili', domisili);

  window.location.href = `/api/admin/members/export?${params.toString()}`;
}

// 3. MONITORING REGISTRASI ULANG (FR-34 & FR-32)
async function loadMonitoringList() {
  const periode = document.getElementById('monitoringPeriodFilter').value;
  const status = document.getElementById('monitoringStatusFilter').value;
  const sumber = document.getElementById('monitoringSourceFilter').value;
  const search = document.getElementById('monitoringSearch').value;

  const params = new URLSearchParams();
  if (periode) params.append('periode_tahun', periode);
  if (status) params.append('status', status);
  if (sumber) params.append('sumber_input', sumber);
  if (search) params.append('search', search);

  const res = await api(`/api/admin/registrations/monitoring?${params.toString()}`);
  if (!res || !res.success) return;

  STATE.monitoringList = res.data;
  document.getElementById('monTotalSudah').innerText = res.sudahCount;
  document.getElementById('monTotalBelum').innerText = res.belumCount;

  const tbody = document.getElementById('monitoringTableBody');
  tbody.innerHTML = '';

  if (res.data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-8 text-[#8C9BAE]">Tidak ada data monitoring yang sesuai filter.</td></tr>`;
    return;
  }

  res.data.forEach(r => {
    const isSudah = r.status_registrasi === 'Sudah Registrasi';
    const statusBadge = isSudah
      ? `<span class="badge-pill badge-success"><i data-lucide="check-circle" class="w-3.5 h-3.5"></i> Sudah Registrasi</span>`
      : `<span class="badge-pill badge-warning"><i data-lucide="alert-circle" class="w-3.5 h-3.5"></i> Belum Registrasi</span>`;

    const sourceBadge = r.sumber_input === 'admin'
      ? `<span class="badge-pill badge-orange" title="${r.input_by}"><i data-lucide="shield" class="w-3 h-3"></i> Diinput Admin</span>`
      : (r.sumber_input === 'mandiri'
          ? `<span class="badge-pill" style="color:#60A5FA;background:rgba(96,165,250,0.1);"><i data-lucide="user" class="w-3 h-3"></i> Mandiri</span>`
          : `<span class="text-xs text-[#8C9BAE]">-</span>`);

    tbody.innerHTML += `
      <tr>
        <td>
          <div class="font-bold text-white text-sm">${r.no_register}</div>
          <div class="text-xs text-[#8C9BAE]">${r.divisi} (${r.angkatan})</div>
        </td>
        <td class="font-semibold text-white">${r.nama}</td>
        <td>${statusBadge}</td>
        <td>${sourceBadge}</td>
        <td class="text-xs text-[#CBD5E1]">${r.domisili || '-'}</td>
        <td class="text-xs text-[#8C9BAE]">${r.waktu_terakhir ? new Date(r.waktu_terakhir).toLocaleDateString('id-ID') : '-'}</td>
        <td>
          <button onclick="openOverrideModal('${r.no_register}')" class="btn-secondary !py-1.5 !px-3 !text-xs !rounded-xl" title="Input/Ubah Registrasi atas nama Anggota">
            <i data-lucide="user-check" class="w-3.5 h-3.5 text-[#FF6B00]"></i> Input via Admin
          </button>
        </td>
      </tr>
    `;
  });

  lucide.createIcons();
}

// Modal Admin Override Input (FR-32)
async function openOverrideModal(no_reg) {
  const memberRes = await api(`/api/admin/members/${no_reg}`);
  if (!memberRes || !memberRes.success) return;

  const { profile, currentRegistration } = memberRes.data;

  document.getElementById('overrideNoReg').value = profile.no_register;
  document.getElementById('overrideMemberDisplay').innerText = `${profile.no_register} - ${profile.nama}`;

  // Pre-fill if already exists
  if (currentRegistration) {
    document.getElementById('overrideAlamat').value = currentRegistration.alamat_rumah || '';
    document.getElementById('overrideKota').value = currentRegistration.kota_kabupaten || '';
    document.getElementById('overrideProvinsi').value = currentRegistration.provinsi || '';
    document.getElementById('overridePekerjaan').value = currentRegistration.pekerjaan || '';
    document.getElementById('overrideHP').value = currentRegistration.no_hp || '';
    document.getElementById('overrideEmail').value = currentRegistration.email || '';
    document.getElementById('overrideMedsos').value = currentRegistration.media_sosial || '';
    document.getElementById('overrideOrtu').value = currentRegistration.alamat_ortu || '';
  } else {
    document.getElementById('overrideForm').reset();
    document.getElementById('overrideNoReg').value = profile.no_register;
    document.getElementById('overrideKota').value = profile.tempat_lahir || '';
    document.getElementById('overrideProvinsi').value = 'Sumatera Barat';
  }

  // Load dynamic attributes as file upload inputs
  const attrRes = await api('/api/admin/attributes');
  const attrContainer = document.getElementById('overrideAttributesList');
  attrContainer.innerHTML = '';

  if (attrRes && attrRes.success) {
    attrRes.data.forEach(a => {
      const inputId = `attrFile_${a.id}`;
      const previewId = `attrPreview_${a.id}`;
      attrContainer.innerHTML += `
        <div class="p-3 rounded-xl bg-[#0D1217] border border-white/5 attr-file-upload-wrapper" data-attr-id="${a.id}" data-attr-nama="${a.nama_atribut}">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs text-white font-semibold">${a.nama_atribut}</span>
            ${a.wajib ? '<span class="badge-pill badge-orange text-[10px]">Wajib</span>' : '<span class="badge-pill text-[10px]" style="color:#94A3B8;background:rgba(148,163,184,0.1)">Opsional</span>'}
          </div>
          <label for="${inputId}" class="attr-file-label">
            <i data-lucide="image" class="w-4 h-4 attr-file-icon"></i>
            <span class="attr-file-text">Pilih foto bukti atribut (JPG / PNG)</span>
          </label>
          <input
            id="${inputId}"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            class="hidden attr-file-input"
            data-id="${a.id}"
            data-nama="${a.nama_atribut}"
            onchange="handleAttrFileSelected(this, '${previewId}')"
          >
          <div id="${previewId}" class="attr-file-preview">
            <i data-lucide="check-circle" class="w-3.5 h-3.5 text-[#10B981]"></i>
            <span class="attr-file-name text-xs truncate max-w-[180px]"></span>
            <button type="button" class="attr-file-remove" onclick="removeAttrFile('${inputId}', '${previewId}')">
              <i data-lucide="x" class="w-3 h-3"></i>
            </button>
          </div>
        </div>
      `;
    });
    lucide.createIcons();
  }

  document.getElementById('overrideModal').classList.add('active');
}

async function handleSaveOverride(e) {
  e.preventDefault();
  const no_reg = document.getElementById('overrideNoReg').value;

  // Gather attribute file uploads using FormData
  const formData = new FormData();
  formData.append('no_register', no_reg);
  formData.append('periode_tahun', 2026);
  formData.append('alamat_rumah', document.getElementById('overrideAlamat').value);
  formData.append('kota_kabupaten', document.getElementById('overrideKota').value);
  formData.append('provinsi', document.getElementById('overrideProvinsi').value);
  formData.append('pekerjaan', document.getElementById('overridePekerjaan').value);
  formData.append('no_hp', document.getElementById('overrideHP').value);
  formData.append('email', document.getElementById('overrideEmail').value);
  formData.append('media_sosial', document.getElementById('overrideMedsos').value);
  formData.append('alamat_ortu', document.getElementById('overrideOrtu').value);

  // Collect attribute metadata and files
  const attrMeta = [];
  document.querySelectorAll('.attr-file-input').forEach(inp => {
    const attrId = inp.getAttribute('data-id');
    const attrNama = inp.getAttribute('data-nama');
    attrMeta.push({ atribut_id: attrId, nama: attrNama });
    if (inp.files && inp.files[0]) {
      formData.append(`attrFile_${attrId}`, inp.files[0]);
    }
  });
  formData.append('atribut', JSON.stringify(attrMeta));

  const res = await api('/api/admin/registrations/override', {
    method: 'POST',
    body: formData
  });

  if (res && res.success) {
    showToast(res.message, 'success');
    closeModal('overrideModal');
    loadMonitoringList();
    loadDashboardStats();
  } else {
    showToast(res ? res.message : 'Gagal menyimpan override registrasi.', 'error');
  }
}

// Helper: handle attribute file input selection
function handleAttrFileSelected(input, previewId) {
  const preview = document.getElementById(previewId);
  if (!preview) return;
  if (input.files && input.files[0]) {
    const file = input.files[0];
    // Validate type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      showToast('Format berkas tidak valid. Gunakan JPG, PNG, atau WEBP.', 'error');
      input.value = '';
      return;
    }
    // Validate size (5 MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast('Ukuran berkas terlalu besar. Maksimal 5 MB per berkas.', 'error');
      input.value = '';
      return;
    }
    preview.classList.add('has-file');
    const nameEl = preview.querySelector('.attr-file-name');
    if (nameEl) nameEl.textContent = file.name;
    // Update label text
    const label = input.previousElementSibling;
    if (label) {
      const textEl = label.querySelector('.attr-file-text');
      if (textEl) textEl.textContent = 'Ganti berkas…';
    }
  } else {
    preview.classList.remove('has-file');
  }
  lucide.createIcons();
}

// Helper: remove attribute file selection
function removeAttrFile(inputId, previewId) {
  const input = document.getElementById(inputId);
  const preview = document.getElementById(previewId);
  if (input) input.value = '';
  if (preview) {
    preview.classList.remove('has-file');
    const nameEl = preview.querySelector('.attr-file-name');
    if (nameEl) nameEl.textContent = '';
  }
  if (input) {
    const label = input.previousElementSibling;
    if (label) {
      const textEl = label.querySelector('.attr-file-text');
      if (textEl) textEl.textContent = 'Pilih foto bukti atribut (JPG / PNG)';
    }
  }
}

// 4. PERIODE & KELOLA DIVISI (Permanen, Edit Penamaan, Tambah Periode)
async function loadPeriodesAndDivisions() {
  const [periodRes, divRes] = await Promise.all([
    api('/api/admin/periodes'),
    api('/api/admin/divisions')
  ]);

  // Render Periodes
  if (periodRes && periodRes.success) {
    STATE.periodes = periodRes.data;
    updatePeriodFilterSelect(periodRes.data);
    const list = document.getElementById('periodeListContainer');
    list.innerHTML = '';
    periodRes.data.forEach(p => {
      list.innerHTML += `
        <div class="card-alpine p-4 flex items-center justify-between">
          <div>
            <div class="flex items-center gap-2">
              <h4 class="font-bold text-white text-base">${p.nama_periode}</h4>
              <span class="badge-pill ${p.is_active ? 'badge-success' : 'badge-danger'}">
                ${p.is_active ? 'Sedang Dibuka' : 'Ditutup'}
              </span>
            </div>
            <p class="text-xs text-[#8C9BAE] mt-1">Jadwal: ${p.tanggal_buka} s/d ${p.tanggal_tutup}</p>
          </div>
          <div>
            <button onclick="togglePeriodActive('${p.id}')" class="btn-secondary !py-2 !px-4 !text-xs !rounded-xl">
              ${p.is_active ? 'Tutup Periode' : 'Aktifkan & Buka'}
            </button>
          </div>
        </div>
      `;
    });
  }

  // Render Divisions
  if (divRes && divRes.success) {
    STATE.divisions = divRes.data;
    renderDivisionsTable(divRes.data);
    updateDivisionSelects(divRes.data);
  }
}

function updatePeriodFilterSelect(periodes) {
  const select = document.getElementById('monitoringPeriodFilter');
  if (!select || !Array.isArray(periodes)) return;
  const currentVal = select.value;
  select.innerHTML = '';
  periodes.forEach(p => {
    select.innerHTML += `<option value="${p.tahun}">${p.nama_periode} ${p.is_active ? '(Aktif)' : ''}</option>`;
  });
  if (currentVal && periodes.find(p => String(p.tahun) === String(currentVal))) {
    select.value = currentVal;
  } else {
    const active = periodes.find(p => p.is_active);
    if (active) select.value = active.tahun;
  }
}

function openAddPeriodModal() {
  const existingYears = (STATE.periodes || []).map(p => p.tahun);
  const nextYear = existingYears.length > 0 ? Math.max(...existingYears) + 1 : 2027;
  document.getElementById('addPeriodTahun').value = nextYear;
  autoFillPeriodName(nextYear);
  document.getElementById('addPeriodDesc').value = `Periode registrasi ulang tahun ${nextYear} Mapala UNAND.`;
  document.getElementById('addPeriodModal').classList.add('active');
}

function autoFillPeriodName(val) {
  const year = parseInt(val, 10);
  if (year) {
    document.getElementById('addPeriodNama').value = `Registrasi Ulang Tahunan ${year}`;
    document.getElementById('addPeriodBuka').value = `${year}-01-01`;
    document.getElementById('addPeriodTutup').value = `${year}-12-31`;
  }
}

async function handleAddPeriod(e) {
  e.preventDefault();
  const tahun = parseInt(document.getElementById('addPeriodTahun').value, 10);
  const nama_periode = document.getElementById('addPeriodNama').value.trim();
  const tanggal_buka = document.getElementById('addPeriodBuka').value;
  const tanggal_tutup = document.getElementById('addPeriodTutup').value;
  const deskripsi = document.getElementById('addPeriodDesc').value.trim();

  if (!tahun || !nama_periode) {
    showToast('Tahun dan Nama Periode wajib diisi.', 'error');
    return;
  }

  const res = await api('/api/admin/periodes', {
    method: 'POST',
    body: JSON.stringify({ tahun, nama_periode, tanggal_buka, tanggal_tutup, deskripsi })
  });

  if (res && res.success) {
    showToast(`Periode ${nama_periode} (${tahun}) berhasil dibuat!`, 'success');
    closeModal('addPeriodModal');
    loadPeriodesAndDivisions();
    loadDashboardStats();
  } else {
    showToast(res ? res.message : 'Gagal membuat periode baru.', 'error');
  }
}

function renderDivisionsTable(divisions) {
  const tbody = document.getElementById('divisionTableBody');
  const badge = document.getElementById('totalDivisiBadge');
  if (badge) badge.innerText = `${divisions.length} Divisi Aktif`;

  // Sync dashboard overview division count badge
  const dashDivBadge = document.getElementById('divisionCountBadge');
  if (dashDivBadge) dashDivBadge.innerText = `${divisions.length} Divisi`;

  tbody.innerHTML = '';
  if (divisions.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center py-6 text-[#8C9BAE]">Belum ada divisi terdaftar.</td></tr>`;
    return;
  }

  divisions.forEach(d => {
    tbody.innerHTML += `
      <tr>
        <td class="font-bold text-white text-sm">${d.nama_divisi}</td>
        <td><span class="badge-pill badge-orange font-mono">${d.kode}</span></td>
        <td class="text-xs text-[#CBD5E1]">${d.deskripsi || '-'}</td>
        <td>
          <button onclick="openEditDivisionModal('${d.id}', '${d.nama_divisi.replace(/'/g, "\\'")}', '${d.kode}', '${(d.deskripsi||'').replace(/'/g, "\\'")}')" class="btn-secondary !py-1 !px-2.5 !text-xs text-white" title="Edit Penamaan Divisi (Cegah Typo)">
            <i data-lucide="edit-3" class="w-3.5 h-3.5 text-[#FF6B00]"></i> Edit
          </button>
        </td>
      </tr>
    `;
  });
  lucide.createIcons();
}

function updateDivisionSelects(divisions) {
  const filterSelect = document.getElementById('filterDivisi');
  const addSelect = document.getElementById('addDivisi');
  const editSelect = document.getElementById('editDivisi');

  if (filterSelect) {
    const currentVal = filterSelect.value;
    filterSelect.innerHTML = `<option value="">Semua Divisi</option>`;
    divisions.forEach(d => {
      filterSelect.innerHTML += `<option value="${d.nama_divisi}">${d.nama_divisi}</option>`;
    });
    filterSelect.value = currentVal;
  }

  if (addSelect) {
    addSelect.innerHTML = '';
    divisions.forEach(d => {
      addSelect.innerHTML += `<option value="${d.nama_divisi}">${d.nama_divisi}</option>`;
    });
  }

  if (editSelect) {
    const currentVal = editSelect.value;
    editSelect.innerHTML = '';
    divisions.forEach(d => {
      editSelect.innerHTML += `<option value="${d.nama_divisi}">${d.nama_divisi}</option>`;
    });
    if (currentVal) editSelect.value = currentVal;
  }
}

async function togglePeriodActive(id) {
  const res = await api(`/api/admin/periodes/${id}/toggle`, { method: 'PATCH' });
  if (res && res.success) {
    showToast(res.message, 'success');
    loadPeriodesAndDivisions();
    loadDashboardStats();
  }
}

// Pop up validasi sebelum penambahan divisi dilakukan
function promptAddDivision(e) {
  e.preventDefault();
  const nama = document.getElementById('newDivName').value.trim();
  const kode = document.getElementById('newDivKode').value.trim().toUpperCase();

  if (!nama || !kode) {
    showToast('Nama dan Kode divisi wajib diisi.', 'error');
    return;
  }

  document.getElementById('confirmDivNamaDisplay').innerText = nama;
  document.getElementById('confirmDivKodeDisplay').innerText = kode;
  document.getElementById('confirmAddDivisionModal').classList.add('active');
}

async function executeAddDivision() {
  const nama = document.getElementById('newDivName').value.trim();
  const kode = document.getElementById('newDivKode').value.trim().toUpperCase();
  const deskripsi = document.getElementById('newDivDesc').value.trim();

  closeModal('confirmAddDivisionModal');

  const res = await api('/api/admin/divisions', {
    method: 'POST',
    body: JSON.stringify({ nama_divisi: nama, kode, deskripsi })
  });

  if (res && res.success) {
    showToast(`Divisi '${nama}' berhasil ditambahkan ke sistem!`, 'success');
    document.getElementById('newDivName').value = '';
    document.getElementById('newDivKode').value = '';
    document.getElementById('newDivDesc').value = '';
    loadPeriodesAndDivisions();
    loadDashboardStats();
  } else {
    showToast(res ? res.message : 'Gagal menambahkan divisi.', 'error');
  }
}

// Edit Nama Divisi (Cegah Typo)
function openEditDivisionModal(id, nama, kode, desc) {
  document.getElementById('editDivId').value = id;
  document.getElementById('editDivName').value = nama;
  document.getElementById('editDivKode').value = kode;
  document.getElementById('editDivDesc').value = desc || '';
  document.getElementById('editDivisionModal').classList.add('active');
}

async function handleEditDivisionSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('editDivId').value;
  const nama = document.getElementById('editDivName').value.trim();
  const kode = document.getElementById('editDivKode').value.trim().toUpperCase();
  const desc = document.getElementById('editDivDesc').value.trim();

  if (!nama || !kode) {
    showToast('Nama dan Kode divisi wajib diisi.', 'error');
    return;
  }

  const res = await api(`/api/admin/divisions/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ nama_divisi: nama, kode, deskripsi: desc })
  });

  if (res && res.success) {
    showToast(res.message, 'success');
    closeModal('editDivisionModal');
    loadPeriodesAndDivisions();
    loadDashboardStats();
    loadMembers();
  } else {
    showToast(res ? res.message : 'Gagal memperbarui divisi.', 'error');
  }
}

// 5. CMS WEBSITE (FR-39 s.d. FR-42)
function switchCmsSubTab(subTabId) {
  document.querySelectorAll('.cms-sub-content').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('.cms-tab-btn').forEach(el => {
    el.classList.remove('bg-[#FF6B00]', 'text-white');
    el.classList.add('bg-white/5', 'text-[#94A3B8]');
  });

  const subEl = document.getElementById(`cmsSub-${subTabId}`);
  if (subEl) subEl.classList.remove('hidden');
  const btn = document.getElementById(`cmsBtn-${subTabId}`);
  if (btn) {
    btn.classList.add('bg-[#FF6B00]', 'text-white');
    btn.classList.remove('bg-white/5', 'text-[#94A3B8]');
  }

  if (subTabId === 'articles') loadCMSArticles();
  if (subTabId === 'pengurus') loadCMSStrukturOrganisasi();
  if (subTabId === 'prestasi') loadCMSPrestasi();
  if (subTabId === 'static') loadStaticContent();
}

// Articles (P-02: Multi-image support)
async function loadCMSArticles() {
  const res = await api('/api/admin/cms/articles');
  if (!res || !res.success) return;

  const tbody = document.getElementById('cmsArticlesTableBody');
  tbody.innerHTML = '';
  res.data.forEach(a => {
    const statusBadge = a.status === 'terbit'
      ? `<span class="badge-pill badge-success">Terbit</span>`
      : `<span class="badge-pill badge-warning">Draf</span>`;

    const fotosCount = (a.fotos && Array.isArray(a.fotos)) ? a.fotos.length : 1;

    tbody.innerHTML += `
      <tr>
        <td>
          <div class="font-bold text-white text-sm">${a.judul}</div>
          <div class="text-xs text-[#8C9BAE]">${a.penulis} • ${a.tanggal} • <span class="text-[#FF6B00] font-semibold">${fotosCount} foto</span></div>
        </td>
        <td><span class="badge-pill badge-orange">${a.kategori}</span></td>
        <td>${statusBadge}</td>
        <td>
          <button onclick="deleteArticle('${a.id}')" class="btn-danger !py-1 !px-2.5 !text-xs" title="Hapus Artikel">
            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
          </button>
        </td>
      </tr>
    `;
  });
  lucide.createIcons();
}

async function handleCreateArticle(e) {
  e.preventDefault();
  const formData = new FormData();
  formData.append('judul', document.getElementById('artJudul').value);
  formData.append('kategori', document.getElementById('artKategori').value);
  formData.append('tanggal', document.getElementById('artTanggal').value);
  formData.append('status', document.getElementById('artStatus').value);
  formData.append('penulis', document.getElementById('artPenulis').value);
  formData.append('isi', document.getElementById('artIsi').value);

  const fotoUrl = document.getElementById('artFotoUrl').value.trim();
  if (fotoUrl) {
    formData.append('foto', fotoUrl);
  }

  // Multi-image file input (P-02)
  const fileMulti = document.getElementById('artFileMulti');
  if (fileMulti && fileMulti.files && fileMulti.files.length > 0) {
    for (let i = 0; i < fileMulti.files.length; i++) {
      formData.append('fotos', fileMulti.files[i]);
    }
  }

  const res = await api('/api/admin/cms/articles', {
    method: 'POST',
    body: formData
  });

  if (res && res.success) {
    showToast(res.message, 'success');
    closeModal('articleModal');
    document.getElementById('artJudul').value = '';
    document.getElementById('artIsi').value = '';
    document.getElementById('artFotoUrl').value = '';
    if (fileMulti) fileMulti.value = '';
    loadCMSArticles();
  } else {
    showToast(res ? res.message : 'Gagal menyimpan artikel.', 'error');
  }
}

async function deleteArticle(id) {
  if (confirm('Hapus artikel ini secara permanen? [FR-43]')) {
    const res = await api(`/api/admin/cms/articles/${id}`, { method: 'DELETE' });
    if (res && res.success) {
      showToast(res.message, 'success');
      loadCMSArticles();
    }
  }
}

// Struktur Organisasi (P-01: Unggah Gambar Bagan Struktur)
async function loadCMSStrukturOrganisasi() {
  const res = await api('/api/admin/cms/struktur');
  if (!res || !res.success) return;

  const data = res.data;
  const periodeInp = document.getElementById('strukturPeriode');
  const ketInp = document.getElementById('strukturKeterangan');
  const previewImg = document.getElementById('strukturPreviewImg');
  const previewKet = document.getElementById('strukturPreviewKet');
  const badge = document.getElementById('strukturPeriodeBadge');

  if (periodeInp) periodeInp.value = data.periode || '2025/2026';
  if (ketInp) ketInp.value = data.keterangan || '';
  if (previewImg) previewImg.src = data.foto || '';
  if (previewKet) previewKet.innerText = data.keterangan || 'Bagan Struktur Organisasi Resmi Mapala UNAND';
  if (badge) badge.innerText = `Periode ${data.periode || '2025/2026'}`;
}

function previewStrukturFile(input) {
  if (input.files && input.files[0]) {
    const file = input.files[0];
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      showToast('Format berkas tidak valid. Harap gunakan format JPG, PNG, atau WEBP.', 'error');
      input.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('Ukuran berkas terlalu besar. Maksimal 5 MB.', 'error');
      input.value = '';
      return;
    }
    const previewImg = document.getElementById('strukturPreviewImg');
    if (previewImg) previewImg.src = URL.createObjectURL(file);
    const labelText = document.getElementById('strukturFileLabelText');
    if (labelText) labelText.innerText = file.name;
  }
}

async function handleSaveStrukturOrganisasi(e) {
  e.preventDefault();
  const fileInp = document.getElementById('strukturFile');
  const periode = document.getElementById('strukturPeriode').value.trim();
  const keterangan = document.getElementById('strukturKeterangan').value.trim();

  const formData = new FormData();
  formData.append('periode', periode);
  formData.append('keterangan', keterangan);

  if (fileInp && fileInp.files && fileInp.files[0]) {
    formData.append('foto', fileInp.files[0]);
  }

  const res = await api('/api/admin/cms/struktur', {
    method: 'POST',
    body: formData
  });

  if (res && res.success) {
    showToast(res.message, 'success');
    loadCMSStrukturOrganisasi();
  } else {
    showToast(res ? res.message : 'Gagal memperbarui bagan struktur organisasi.', 'error');
  }
}

// Prestasi
async function loadCMSPrestasi() {
  const res = await api('/api/admin/cms/prestasi');
  if (!res || !res.success) return;

  const tbody = document.getElementById('cmsPrestasiTableBody');
  tbody.innerHTML = '';
  res.data.forEach(p => {
    tbody.innerHTML += `
      <tr>
        <td class="font-bold text-[#FF6B00]">${p.tahun}</td>
        <td class="font-semibold text-white">${p.judul}</td>
        <td class="text-xs text-[#CBD5E1]">${p.deskripsi}</td>
        <td>
          <button onclick="deletePrestasi('${p.id}')" class="btn-danger !py-1 !px-2.5 !text-xs">
            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
          </button>
        </td>
      </tr>
    `;
  });
  lucide.createIcons();
}

async function handleCreatePrestasi(e) {
  e.preventDefault();
  const payload = {
    tahun: document.getElementById('prsTahun').value,
    judul: document.getElementById('prsJudul').value,
    deskripsi: document.getElementById('prsDeskripsi').value
  };

  const res = await api('/api/admin/cms/prestasi', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

  if (res && res.success) {
    showToast('Prestasi baru berhasil ditambahkan!', 'success');
    closeModal('prestasiModal');
    loadCMSPrestasi();
  }
}

async function deletePrestasi(id) {
  if (confirm('Hapus data prestasi ini? [FR-43]')) {
    const res = await api(`/api/admin/cms/prestasi/${id}`, { method: 'DELETE' });
    if (res && res.success) {
      showToast(res.message, 'success');
      loadCMSPrestasi();
    }
  }
}

// Static Content
async function loadStaticContent() {
  const res = await api('/api/admin/cms/static-content');
  if (!res || !res.success) return;

  const { tentang_kami, kontak, beranda } = res.data;
  STATE.staticContent = res.data;

  if (tentang_kami) {
    document.getElementById('staticSejarah').value = tentang_kami.sejarah || '';
    document.getElementById('staticVisi').value = tentang_kami.visi || '';
    document.getElementById('staticMisi').value = tentang_kami.misi || '';
  }
  if (kontak) {
    document.getElementById('staticEmail').value = kontak.email || '';
    document.getElementById('staticWA').value = kontak.whatsapp || '';
    document.getElementById('staticAlamat').value = kontak.alamat || '';
    document.getElementById('staticInstagram').value = kontak.instagram || '';
    const fbEl = document.getElementById('staticFacebook');
    if (fbEl) fbEl.value = kontak.facebook || '';
    const ttEl = document.getElementById('staticTikTok');
    if (ttEl) ttEl.value = kontak.tiktok || '';
  }
  if (beranda) {
    document.getElementById('staticHeadline').value = beranda.headline || '';
    document.getElementById('staticSubHeadline').value = beranda.subheadline || '';
  }
}

async function saveStaticContent(section) {
  let data = {};
  if (section === 'tentang_kami') {
    data = {
      sejarah: document.getElementById('staticSejarah').value,
      visi: document.getElementById('staticVisi').value,
      misi: document.getElementById('staticMisi').value
    };
  } else if (section === 'kontak') {
    const fbEl = document.getElementById('staticFacebook');
    const ttEl = document.getElementById('staticTikTok');
    data = {
      email: document.getElementById('staticEmail').value,
      whatsapp: document.getElementById('staticWA').value,
      alamat: document.getElementById('staticAlamat').value,
      instagram: document.getElementById('staticInstagram').value,
      facebook: fbEl ? fbEl.value.trim() : '',
      tiktok: ttEl ? ttEl.value.trim() : ''
    };
  } else if (section === 'beranda') {
    data = {
      headline: document.getElementById('staticHeadline').value,
      subheadline: document.getElementById('staticSubHeadline').value
    };
  }

  const res = await api('/api/admin/cms/static-content', {
    method: 'PUT',
    body: JSON.stringify({ section, data })
  });

  if (res && res.success) {
    showToast(`Konten publik bagian ${section} berhasil diperbarui!`, 'success');
  }
}

// 6. LOG AKTIVITAS & GANTI PASSWORD ADMIN (FR-36, FR-12)
async function loadLogs() {
  const res = await api('/api/admin/logs');
  if (!res || !res.success) return;

  const tbody = document.getElementById('logsTableBody');
  tbody.innerHTML = '';
  res.data.forEach(l => {
    tbody.innerHTML += `
      <tr>
        <td class="text-xs text-[#8C9BAE] whitespace-nowrap">${new Date(l.waktu).toLocaleString('id-ID')}</td>
        <td class="font-bold text-white text-xs">${l.admin}</td>
        <td><span class="badge-pill badge-orange text-[10px]">${l.aksi}</span></td>
        <td class="text-xs text-[#E2E8F0]">${l.detail}</td>
      </tr>
    `;
  });
}

async function handleChangePassword(e) {
  e.preventDefault();
  const oldPassword = document.getElementById('adminOldPass').value;
  const newPassword = document.getElementById('adminNewPass').value;
  const confirmPassword = document.getElementById('adminConfirmPass').value;

  if (newPassword !== confirmPassword) {
    showToast('Konfirmasi password baru tidak cocok.', 'error');
    return;
  }

  const res = await api('/api/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ oldPassword, newPassword })
  });

  if (res && res.success) {
    showToast('Password admin berhasil diubah!', 'success');
    document.getElementById('changePasswordForm').reset();
    loadLogs();
  } else {
    showToast(res ? res.message : 'Gagal mengubah password.', 'error');
  }
}

// Modal helper
function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('active');
}

// Init Application on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  lucide.createIcons();
  const isAuth = checkAuth();
  if (isAuth) {
    loadDashboardStats();
    loadMembers();
    api('/api/admin/divisions').then(res => {
      if (res && res.success) updateDivisionSelects(res.data);
    });
  }
});

