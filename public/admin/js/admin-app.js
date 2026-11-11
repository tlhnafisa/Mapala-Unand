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

// Authentication Check (FR-15: Proteksi Halaman Admin)
function checkAuth() {
  const loginModal = document.getElementById('loginModal');
  const appContainer = document.getElementById('appContainer');

  // Periksa apakah token ada dan role adalah admin
  if (!STATE.token || !STATE.user || STATE.user.role !== 'admin') {
    // Alihkan otomatis ke halaman login portal
    window.location.href = '/login';
    return false;
  } else {
    if (loginModal) loginModal.classList.remove('active');
    if (appContainer) appContainer.classList.remove('opacity-20', 'pointer-events-none');
    const adminNameEl = document.getElementById('currentAdminName');
    if (adminNameEl) {
      adminNameEl.innerText = STATE.user.nama || STATE.user.username;
    }
    return true;
  }
}

// Login Action (POST /api/auth/login)
async function handleLogin(e) {
  e.preventDefault();
  const usernameInput = document.getElementById('loginUsername').value.trim();
  const passwordInput = document.getElementById('loginPassword').value;

  const res = await api('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username: usernameInput, password: passwordInput })
  });

  if (res && res.success && res.data) {
    if (res.data.user.role !== 'admin') {
      showToast('Akses ditolak: Akun Anda bukan Administrator.', 'error');
      setTimeout(() => {
        window.location.href = '/login';
      }, 1500);
      return;
    }
    STATE.token = res.data.token;
    STATE.user = res.data.user;
    localStorage.setItem('mapala_token', STATE.token);
    localStorage.setItem('mapala_user', JSON.stringify(STATE.user));
    showToast('Login Admin berhasil!', 'success');
    
    const loginModal = document.getElementById('loginModal');
    const appContainer = document.getElementById('appContainer');
    if (loginModal) loginModal.classList.remove('active');
    if (appContainer) appContainer.classList.remove('opacity-20', 'pointer-events-none');
    
    const adminNameEl = document.getElementById('currentAdminName');
    if (adminNameEl) adminNameEl.innerText = STATE.user.nama || STATE.user.username;

    loadDashboardStats();
    loadMembers();
  } else {
    showToast(res ? res.message : 'Kombinasi No. Register dan Password salah.', 'error');
  }
}

// Fungsi Logout (Menghapus token & kembali ke halaman utama)
function logout() {
  if (confirm('Apakah Anda yakin ingin keluar dari Dashboard Administrator?')) {
    STATE.token = null;
    STATE.user = null;
    localStorage.removeItem('mapala_token');
    localStorage.removeItem('mapala_user');
    showToast('Anda telah keluar dari sistem.', 'info');
    setTimeout(() => {
      window.location.href = '/';
    }, 400);
  }
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

  // Render Angkatan Distribution & Total Angkatan Badge
  const angkatanCountBadge = document.getElementById('angkatanCountBadge');
  const angkatanContainer = document.getElementById('chartAngkatanBars');

  // Ambil list angkatan dari backend (angkatanList array terurut total DESC, angkatan DESC)
  let angkatans = [];
  if (Array.isArray(res.data.angkatanList) && res.data.angkatanList.length > 0) {
    angkatans = res.data.angkatanList;
  } else if (angkatanStats && Object.keys(angkatanStats).length > 0) {
    angkatans = Object.entries(angkatanStats).map(([angkatan, total]) => ({
      angkatan,
      total: Number(total)
    })).sort((a, b) => b.total - a.total || b.angkatan - a.angkatan);
  }

  if (angkatanCountBadge) {
    angkatanCountBadge.innerText = `${angkatans.length} Angkatan`;
  }

  // Sinkronkan filter dropdown Angkatan di tab Data Anggota secara dinamis
  populateAngkatanFilterOptions(angkatans);

  if (angkatanContainer) {
    angkatanContainer.innerHTML = '';
    if (angkatans.length === 0) {
      angkatanContainer.innerHTML = `
        <div class="text-center py-6 text-[#8C9BAE] text-xs">
          Belum ada data sebaran angkatan.
        </div>
      `;
    } else {
      const totalMemberCount = metrics.totalMembers || 1;
      const maxAngkatanCount = Math.max(...angkatans.map(a => a.total), 1);

      angkatans.forEach(item => {
        const count = item.total;
        const year = item.angkatan;
        const pctOfTotal = Math.round((count / totalMemberCount) * 100);
        const barWidth = Math.round((count / maxAngkatanCount) * 100);

        angkatanContainer.innerHTML += `
          <div class="p-2.5 rounded-xl bg-[#0D1217] border border-white/5 hover:border-white/10 transition-colors">
            <div class="flex items-center justify-between text-xs mb-1.5">
              <span class="font-semibold text-white">Angkatan ${year}</span>
              <div class="flex items-center gap-2">
                <span class="text-[#8C9BAE] text-[11px]">${pctOfTotal}%</span>
                <span class="badge-pill badge-orange font-bold text-[11px]">${count} anggota</span>
              </div>
            </div>
            <div class="w-full bg-[#1C2530] rounded-full h-1.5">
              <div class="bg-gradient-to-r from-[#FF6B00] to-[#FFA048] h-1.5 rounded-full transition-all duration-500" style="width: ${barWidth}%"></div>
            </div>
          </div>
        `;
      });
    }
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

// Helper sinkronisasi opsi dropdown filter Angkatan dengan database
function populateAngkatanFilterOptions(angkatans) {
  const filterEl = document.getElementById('filterAngkatan');
  if (!filterEl) return;

  const currentVal = filterEl.value;

  // Ekstrak tahun unik dan urutkan descending (misal 2022, 2021, 2020, ..., 1995)
  const years = (angkatans || [])
    .map(a => (typeof a === 'object' ? a.angkatan : a))
    .filter(Boolean)
    .map(y => String(y))
    .filter((v, idx, arr) => arr.indexOf(v) === idx)
    .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));

  if (years.length === 0) return;

  // Jangan overwrite jika opsi sudah sama persis
  const existingOptions = Array.from(filterEl.options).map(o => o.value).filter(Boolean);
  const isSame = existingOptions.length === years.length && existingOptions.every((v, i) => v === years[i]);
  if (isSame) return;

  filterEl.innerHTML = '<option value="">Semua Angkatan</option>';
  years.forEach(year => {
    filterEl.innerHTML += `<option value="${year}">Angkatan ${year}</option>`;
  });

  if (currentVal && years.includes(currentVal)) {
    filterEl.value = currentVal;
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

  // Jika memuat seluruh anggota tanpa filter, sinkronkan opsi dropdown filter angkatan
  if (!search && !angkatan && !divisi && !status_reg && !domisili && Array.isArray(res.data)) {
    const memberYears = [...new Set(res.data.map(m => m.angkatan).filter(Boolean))];
    populateAngkatanFilterOptions(memberYears);
  }
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
            <button onclick="printMemberBiodata('${m.no_register}')" title="Cetak Formulir Biodata Resmi" class="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-[#38BDF8] transition-colors">
              <i data-lucide="printer" class="w-4 h-4"></i>
            </button>
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
    const res = await api(`/api/admin/members/${encodeURIComponent(no_reg)}/reset-password`, { method: 'POST' });
    if (res && res.success) {
      showToast(res.message, 'success');
      loadLogs();
    }
  }
}

// Toggle Member Status (FR-30)
async function toggleMemberStatus(no_reg) {
  const res = await api(`/api/admin/members/${encodeURIComponent(no_reg)}/toggle-status`, { method: 'PATCH' });
  if (res && res.success) {
    showToast(res.message, 'success');
    loadMembers();
    loadDashboardStats();
  }
}

// Member Detail Modal
async function openMemberDetailModal(no_reg) {
  const res = await api(`/api/admin/members/${encodeURIComponent(no_reg)}`);
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
  const detailPrintBtn = document.getElementById('detailPrintBtn');
  if (detailPrintBtn) {
    const tokenParam = STATE.token ? `?token=${encodeURIComponent(STATE.token)}` : '';
    detailPrintBtn.href = `/api/admin/members/${encodeURIComponent(profile.no_register)}/print-biodata${tokenParam}`;
    detailPrintBtn.target = '_blank';
  }

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
  const res = await api(`/api/admin/members/${encodeURIComponent(no_reg)}`);
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

  const res = await api(`/api/admin/members/${encodeURIComponent(no_reg)}`, {
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
    commitBtn.innerHTML = `<i data-lucide="check-circle" class="w-4 h-4"></i><span>Simpan & Terapkan Data (${data.validCount} Anggota)</span>`;
    lucide.createIcons();
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

  const commitBtn = document.getElementById('btnCommitImport');
  const originalHtml = commitBtn.innerHTML;
  commitBtn.disabled = true;
  commitBtn.innerHTML = `<i data-lucide="loader" class="w-4 h-4 animate-spin"></i><span>Menyimpan ke MySQL...</span>`;
  lucide.createIcons();

  const res = await api('/api/admin/members/import-commit', {
    method: 'POST',
    body: JSON.stringify({ validRows })
  });

  commitBtn.disabled = false;
  commitBtn.innerHTML = originalHtml;
  lucide.createIcons();

  if (res && res.success) {
    showToast(res.message, 'success');
    closeModal('importModal');
    loadMembers();
    loadDashboardStats();
  } else {
    showToast(res ? res.message : 'Gagal menyimpan impor data.', 'error');
  }
}

// Unduh Templat Excel (FR-31)
function downloadTemplateFile() {
  const tokenParam = STATE.token ? `?token=${encodeURIComponent(STATE.token)}` : '';
  showToast('Mengunduh templat resmi Excel Mapala UNAND...', 'info');
  window.location.href = `/api/admin/members/template${tokenParam}`;
}

// Cetak Formulir Biodata Resmi Anggota (FR-38)
function printMemberBiodata(no_reg) {
  const tokenParam = STATE.token ? `?token=${encodeURIComponent(STATE.token)}` : '';
  window.open(`/api/admin/members/${encodeURIComponent(no_reg)}/print-biodata${tokenParam}`, '_blank');
}

// Buka/Tutup Menu Ekspor Format
function toggleExportMenu(e) {
  e.stopPropagation();
  const menu = document.getElementById('exportDropdownMenu');
  if (menu) menu.classList.toggle('hidden');
}

// Tutup Menu Ekspor saat klik di luar
document.addEventListener('click', () => {
  const menu = document.getElementById('exportDropdownMenu');
  if (menu && !menu.classList.contains('hidden')) {
    menu.classList.add('hidden');
  }
});

// Ekspor Data Anggota Tersaring (.xlsx atau .csv) (FR-35)
function exportMembersFiltered(format = 'xlsx') {
  const angkatan = document.getElementById('filterAngkatan').value;
  const divisi = document.getElementById('filterDivisi').value;
  const status_reg = document.getElementById('filterStatusReg').value;
  const domisili = document.getElementById('filterDomisili').value;

  const params = new URLSearchParams();
  if (angkatan) params.append('angkatan', angkatan);
  if (divisi) params.append('divisi', divisi);
  if (status_reg) params.append('status_reg', status_reg);
  if (domisili) params.append('domisili', domisili);
  params.append('format', format);
  if (STATE.token) params.append('token', STATE.token);

  const menu = document.getElementById('exportDropdownMenu');
  if (menu) menu.classList.add('hidden');

  showToast(`Mengekspor rekapan data anggota (.${format.toUpperCase()})...`, 'info');
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
  const kepatuhanEl = document.getElementById('monPersentaseKepatuhan');
  if (kepatuhanEl) kepatuhanEl.innerText = `${res.persentaseKepatuhan}%`;

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
  const memberRes = await api(`/api/admin/members/${encodeURIComponent(no_reg)}`);
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
  formData.append('periode_tahun', STATE.activePeriod?.tahun || 2026);
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
          <div class="flex items-center gap-1.5">
            <button onclick="openEditDivisionModal('${d.id}', '${d.nama_divisi.replace(/'/g, "\\'")}', '${d.kode}', '${(d.deskripsi||'').replace(/'/g, "\\'")}')" class="btn-secondary !py-1 !px-2.5 !text-xs text-white" title="Edit Penamaan Divisi (Cegah Typo)">
              <i data-lucide="edit-3" class="w-3.5 h-3.5 text-[#FF6B00]"></i> Edit
            </button>
            <button onclick="confirmDeleteDivision('${d.id}', '${d.nama_divisi.replace(/'/g, "\\'")}')" class="p-1 px-2 rounded-xl bg-white/5 hover:bg-[#EF4444]/20 text-[#F87171] text-xs transition-colors" title="Hapus Divisi">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  });
  lucide.createIcons();
}

async function confirmDeleteDivision(id, name) {
  if (confirm(`Apakah Anda yakin ingin menghapus divisi '${name}'?`)) {
    const res = await api(`/api/admin/divisions/${id}`, { method: 'DELETE' });
    if (res && res.success) {
      showToast(res.message, 'success');
      loadPeriodesAndDivisions();
      loadDashboardStats();
    } else {
      showToast(res ? res.message : 'Gagal menghapus divisi.', 'error');
    }
  }
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

// ============================================================================
// 5. CMS WEBSITE (FR-39 s.d. FR-42)
// ============================================================================
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

// Helper to populate division options in Article Modal
async function populateDivisionSelectOptions() {
  const select = document.getElementById('artDivisi');
  if (!select) return;
  try {
    const res = await api('/api/admin/divisions');
    if (res && res.success && res.data) {
      select.innerHTML = '<option value="">-- Tanpa Divisi Khusus --</option>';
      res.data.forEach(d => {
        select.innerHTML += `<option value="${d.id}">${d.nama}</option>`;
      });
    }
  } catch (e) {
    console.warn('Gagal memuat divisi untuk artikel:', e);
  }
}

// -------------------------------------------------------------
// SUBTAB 1: ARTIKEL & KEGIATAN (FR-39, P-02)
// -------------------------------------------------------------
async function loadCMSArticles() {
  await populateDivisionSelectOptions();
  const res = await api('/api/admin/cms/articles');
  if (!res || !res.success) return;

  STATE.articles = res.data || [];
  const tbody = document.getElementById('cmsArticlesTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (STATE.articles.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-8 text-[#8C9BAE]">Belum ada data artikel atau kegiatan.</td></tr>`;
    return;
  }

  STATE.articles.forEach(a => {
    const isPublished = a.status === 'terbit';
    const statusBadge = isPublished
      ? `<span class="badge-pill badge-success cursor-pointer" onclick="toggleArticleStatus('${a.id}')" title="Klik untuk ubah jadi Draf">● Terbit (Publik)</span>`
      : `<span class="badge-pill badge-warning cursor-pointer" onclick="toggleArticleStatus('${a.id}')" title="Klik untuk Terbitkan">○ Draf</span>`;

    const fotosCount = (a.fotos && Array.isArray(a.fotos)) ? a.fotos.length : 1;
    const divisiLabel = a.divisi ? `<span class="text-[#8C9BAE]">• Div. ${a.divisi}</span>` : '';
    const tanggalTampil = a.tanggal || a.tanggal_raw || '-';

    tbody.innerHTML += `
      <tr>
        <td>
          <div class="font-bold text-white text-sm hover:text-[#FF6B00] transition-colors">${a.judul}</div>
          <div class="text-xs text-[#8C9BAE] mt-0.5">
            ${a.penulis} ${divisiLabel} ${a.lokasi ? `• <span class="text-white/80">${a.lokasi}</span>` : ''} • <span class="text-[#FF6B00] font-semibold">${fotosCount} foto</span>
          </div>
        </td>
        <td>
          <span class="badge-pill badge-orange">${a.kategori || 'Kegiatan'}</span>
        </td>
        <td class="text-xs text-[#CBD5E1] whitespace-nowrap">${tanggalTampil}</td>
        <td>${statusBadge}</td>
        <td>
          <div class="flex items-center gap-1.5">
            <button onclick="openEditArticleModal('${a.id}')" class="btn-secondary !py-1 !px-2.5 !text-xs text-[#CBD5E1] hover:text-white" title="Edit Artikel">
              <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
            </button>
            <button onclick="toggleArticleStatus('${a.id}')" class="btn-secondary !py-1 !px-2.5 !text-xs ${isPublished ? 'text-amber-400' : 'text-emerald-400'}" title="${isPublished ? 'Jadikan Draf' : 'Terbitkan Sekarang'}">
              <i data-lucide="${isPublished ? 'eye-off' : 'globe'}" class="w-3.5 h-3.5"></i>
            </button>
            <button onclick="deleteArticle('${a.id}')" class="btn-danger !py-1 !px-2.5 !text-xs" title="Hapus Artikel Permanen">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  });
  lucide.createIcons();
}

function openCreateArticleModal() {
  document.getElementById('artEditId').value = '';
  document.getElementById('articleModalTitle').innerText = 'Buat Artikel & Dokumentasi Kegiatan';
  document.getElementById('btnSaveArticle').innerText = 'Simpan & Publikasikan';
  document.getElementById('artJudul').value = '';
  document.getElementById('artKategori').value = '1';
  document.getElementById('artDivisi').value = '';
  document.getElementById('artLokasi').value = '';
  document.getElementById('artTanggal').value = new Date().toISOString().split('T')[0];
  document.getElementById('artStatus').value = 'terbit';
  document.getElementById('artPenulis').value = 'Bidang Kesekretariatan & Humas';
  document.getElementById('artRingkasan').value = '';
  document.getElementById('artFotoUrl').value = '';
  document.getElementById('artIsi').value = '';
  const fileMulti = document.getElementById('artFileMulti');
  if (fileMulti) fileMulti.value = '';

  document.getElementById('articleModal').classList.add('active');
}

function openEditArticleModal(id) {
  const a = STATE.articles.find(item => String(item.id) === String(id));
  if (!a) return;

  document.getElementById('artEditId').value = a.id;
  document.getElementById('articleModalTitle').innerText = `Edit Artikel: ${a.judul.slice(0, 30)}...`;
  document.getElementById('btnSaveArticle').innerText = 'Perbarui Artikel';
  document.getElementById('artJudul').value = a.judul || '';
  document.getElementById('artKategori').value = String(a.kategori_id || '1');
  document.getElementById('artDivisi').value = a.divisi_id ? String(a.divisi_id) : '';
  document.getElementById('artLokasi').value = a.lokasi || '';
  document.getElementById('artTanggal').value = a.tanggal_raw || (a.tanggal ? a.tanggal.split('T')[0] : '');
  document.getElementById('artStatus').value = a.status || 'terbit';
  document.getElementById('artPenulis').value = a.penulis || '';
  document.getElementById('artRingkasan').value = a.ringkasan || '';
  document.getElementById('artFotoUrl').value = (a.foto && a.foto.startsWith('http')) ? a.foto : '';
  document.getElementById('artIsi').value = a.isi || '';
  const fileMulti = document.getElementById('artFileMulti');
  if (fileMulti) fileMulti.value = '';

  document.getElementById('articleModal').classList.add('active');
}

async function handleSaveArticle(e) {
  e.preventDefault();
  const editId = document.getElementById('artEditId').value.trim();
  const isEditing = Boolean(editId);
  const judul = document.getElementById('artJudul').value.trim();

  // Cegah duplikasi judul artikel (1 judul hanya boleh ada 1 artikel),
  // sambil tetap mengizinkan edit isi artikel yang judulnya tidak diubah.
  const currentEditingItem = isEditing
    ? (STATE.articles || []).find(item => String(item.id) === String(editId))
    : null;
  const isTitleChanged = !currentEditingItem ||
    (currentEditingItem.judul || '').trim().toLowerCase() !== judul.toLowerCase();

  if (isTitleChanged) {
    const duplicateArticle = (STATE.articles || []).find(item =>
      (item.judul || '').trim().toLowerCase() === judul.toLowerCase() &&
      (!isEditing || String(item.id) !== String(editId))
    );
    if (duplicateArticle) {
      showToast(`Judul "${judul}" sudah terdaftar. Satu judul hanya boleh dimiliki 1 artikel — edit artikel yang sudah ada.`, 'error');
      return;
    }
  }

  const saveBtn = document.getElementById('btnSaveArticle');
  const originalBtnText = saveBtn ? saveBtn.innerText : '';
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.innerText = isEditing ? 'Memperbarui...' : 'Menyimpan...';
  }

  const formData = new FormData();
  formData.append('judul', judul);
  formData.append('kategori_id', document.getElementById('artKategori').value);
  formData.append('divisi_id', document.getElementById('artDivisi').value);
  formData.append('lokasi', document.getElementById('artLokasi').value.trim());
  formData.append('tanggal_kegiatan', document.getElementById('artTanggal').value);
  formData.append('status_publikasi', document.getElementById('artStatus').value);
  formData.append('penulis', document.getElementById('artPenulis').value.trim());
  formData.append('ringkasan', document.getElementById('artRingkasan').value.trim());
  formData.append('isi', document.getElementById('artIsi').value.trim());

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

  const url = isEditing ? `/api/admin/cms/articles/${editId}` : '/api/admin/cms/articles';
  const method = isEditing ? 'PUT' : 'POST';

  try {
    const res = await api(url, {
      method,
      body: formData
    });

    if (res && res.success) {
      showToast(res.message, 'success');
      closeModal('articleModal');
      loadCMSArticles();
    } else {
      showToast(res ? res.message : 'Gagal menyimpan artikel.', 'error');
    }
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerText = originalBtnText;
    }
  }
}

async function toggleArticleStatus(id) {
  const a = STATE.articles.find(item => String(item.id) === String(id));
  if (!a) return;
  const newStatus = a.status === 'terbit' ? 'draf' : 'terbit';
  const label = newStatus === 'terbit' ? 'Terbitkan' : 'Jadikan Draf';

  if (!confirm(`Ubah status artikel '${a.judul}' menjadi ${label.toUpperCase()}?`)) return;

  const res = await api(`/api/admin/cms/articles/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status_publikasi: newStatus })
  });

  if (res && res.success) {
    showToast(`Status artikel berhasil diubah menjadi ${newStatus === 'terbit' ? 'Terbit' : 'Draf'}.`, 'success');
    loadCMSArticles();
  } else {
    showToast(res ? res.message : 'Gagal memperbarui status artikel.', 'error');
  }
}

async function deleteArticle(id) {
  if (confirm('Hapus artikel ini secara permanen dari database? [FR-43]')) {
    const res = await api(`/api/admin/cms/articles/${id}`, { method: 'DELETE' });
    if (res && res.success) {
      showToast(res.message, 'success');
      loadCMSArticles();
    } else {
      showToast(res ? res.message : 'Gagal menghapus artikel.', 'error');
    }
  }
}

// -------------------------------------------------------------
// SUBTAB 2: STRUKTUR ORGANISASI (FR-40, P-01)
// -------------------------------------------------------------
async function loadCMSStrukturOrganisasi() {
  const res = await api('/api/admin/cms/struktur');
  if (!res || !res.success) return;

  const data = res.data;
  const periodeInp = document.getElementById('strukturPeriode');
  const previewImg = document.getElementById('strukturPreviewImg');
  const badge = document.getElementById('strukturPeriodeBadge');

  if (periodeInp) periodeInp.value = data.periode || '2025/2026';
  if (previewImg) previewImg.src = data.foto || data.gambar_path || '/images/struktur-organisasi.svg';
  if (badge) badge.innerText = `Periode ${data.periode || '2025/2026'}`;
}

function previewStrukturFile(input) {
  if (input.files && input.files[0]) {
    const file = input.files[0];
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    const isSvg = file.name.toLowerCase().endsWith('.svg');
    if (!allowedTypes.includes(file.type) && !isSvg) {
      showToast('Format berkas tidak valid. Harap gunakan format JPG, PNG, WEBP, atau SVG.', 'error');
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
  const periodeInp = document.getElementById('strukturPeriode');
  const periode = (periodeInp && periodeInp.value.trim()) ? periodeInp.value.trim() : '2025/2026';

  const formData = new FormData();
  formData.append('periode', periode);

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

// -------------------------------------------------------------
// SUBTAB 3: PRESTASI & PENGHARGAAN (FR-41)
// -------------------------------------------------------------
async function loadCMSPrestasi() {
  loadCMSPrestasiBoxes();
  const res = await api('/api/admin/cms/prestasi');
  if (!res || !res.success) return;

  STATE.prestasi = res.data || [];
  const tbody = document.getElementById('cmsPrestasiTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (STATE.prestasi.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-8 text-[#8C9BAE]">Belum ada catatan prestasi tersimpan.</td></tr>`;
    return;
  }

  STATE.prestasi.forEach(p => {
    const isSorotan = Boolean(p.is_sorotan);
    const sorotanBadge = isSorotan
      ? `<span class="badge-pill badge-orange font-bold text-[10px]">★ Sorotan Beranda</span>`
      : `<span class="text-xs text-[#8C9BAE]">Standar</span>`;

    tbody.innerHTML += `
      <tr>
        <td class="font-bold text-[#FF6B00] whitespace-nowrap">${p.tahun}</td>
        <td>
          <div class="font-bold text-white text-sm hover:text-[#FF6B00] transition-colors">${p.judul}</div>
          <div class="text-[11px] text-[#8C9BAE] mt-0.5">${p.kategori || 'Kompetisi'} ${p.info_label_1 ? `• ${p.info_label_1}` : ''}</div>
        </td>
        <td class="text-xs text-[#CBD5E1] max-w-xs truncate">${p.deskripsi}</td>
        <td>${sorotanBadge}</td>
        <td>
          <div class="flex items-center gap-1.5">
            <button onclick="openEditPrestasiModal('${p.id}')" class="btn-secondary !py-1 !px-2.5 !text-xs text-[#CBD5E1] hover:text-white" title="Edit Prestasi">
              <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
            </button>
            <button onclick="deletePrestasi('${p.id}')" class="btn-danger !py-1 !px-2.5 !text-xs" title="Hapus Prestasi">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  });
  lucide.createIcons();
}

function openCreatePrestasiModal() {
  document.getElementById('prsEditId').value = '';
  document.getElementById('prestasiModalTitle').innerText = 'Tambah Catatan Prestasi';
  document.getElementById('btnSavePrestasi').innerText = 'Simpan Prestasi';
  document.getElementById('prsTahun').value = new Date().getFullYear();
  document.getElementById('prsKategori').value = 'Kompetisi';
  document.getElementById('prsJudul').value = '';
  document.getElementById('prsDeskripsi').value = '';
  document.getElementById('prsInfoPenyelenggara').value = '';
  document.getElementById('prsIsSorotan').checked = false;
  const fileInput = document.getElementById('prsFotoFile');
  if (fileInput) fileInput.value = '';

  document.getElementById('prestasiModal').classList.add('active');
}

function openEditPrestasiModal(id) {
  const p = STATE.prestasi.find(item => String(item.id) === String(id));
  if (!p) return;

  document.getElementById('prsEditId').value = p.id;
  document.getElementById('prestasiModalTitle').innerText = `Edit Prestasi: ${p.judul.slice(0, 25)}...`;
  document.getElementById('btnSavePrestasi').innerText = 'Perbarui Prestasi';
  document.getElementById('prsTahun').value = p.tahun || new Date().getFullYear();
  document.getElementById('prsKategori').value = p.kategori || 'Kompetisi';
  document.getElementById('prsJudul').value = p.judul || '';
  document.getElementById('prsDeskripsi').value = p.deskripsi || '';
  document.getElementById('prsInfoPenyelenggara').value = p.info_label_1 || '';
  document.getElementById('prsIsSorotan').checked = Boolean(p.is_sorotan);
  const fileInput = document.getElementById('prsFotoFile');
  if (fileInput) fileInput.value = '';

  document.getElementById('prestasiModal').classList.add('active');
}

async function handleSavePrestasi(e) {
  e.preventDefault();
  const editId = document.getElementById('prsEditId').value.trim();
  const isEditing = Boolean(editId);

  const fileInput = document.getElementById('prsFotoFile');
  const hasFile = fileInput && fileInput.files && fileInput.files[0];

  let res;
  if (hasFile) {
    const formData = new FormData();
    formData.append('tahun', document.getElementById('prsTahun').value);
    formData.append('kategori', document.getElementById('prsKategori').value.trim());
    formData.append('judul', document.getElementById('prsJudul').value.trim());
    formData.append('deskripsi', document.getElementById('prsDeskripsi').value.trim());
    formData.append('info_label_1', document.getElementById('prsInfoPenyelenggara').value.trim());
    formData.append('is_sorotan', document.getElementById('prsIsSorotan').checked ? '1' : '0');
    formData.append('foto', fileInput.files[0]);

    const url = isEditing ? `/api/admin/cms/prestasi/${editId}` : '/api/admin/cms/prestasi';
    const method = isEditing ? 'PUT' : 'POST';
    res = await api(url, { method, body: formData });
  } else {
    const payload = {
      tahun: document.getElementById('prsTahun').value,
      kategori: document.getElementById('prsKategori').value.trim(),
      judul: document.getElementById('prsJudul').value.trim(),
      deskripsi: document.getElementById('prsDeskripsi').value.trim(),
      info_label_1: document.getElementById('prsInfoPenyelenggara').value.trim(),
      is_sorotan: document.getElementById('prsIsSorotan').checked ? 1 : 0
    };

    const url = isEditing ? `/api/admin/cms/prestasi/${editId}` : '/api/admin/cms/prestasi';
    const method = isEditing ? 'PUT' : 'POST';
    res = await api(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  }

  if (res && res.success) {
    showToast(res.message, 'success');
    closeModal('prestasiModal');
    loadCMSPrestasi();
  } else {
    showToast(res ? res.message : 'Gagal menyimpan data prestasi.', 'error');
  }
}

async function deletePrestasi(id) {
  if (confirm('Hapus data prestasi ini dari database? [FR-43]')) {
    const res = await api(`/api/admin/cms/prestasi/${id}`, { method: 'DELETE' });
    if (res && res.success) {
      showToast(res.message, 'success');
      loadCMSPrestasi();
    } else {
      showToast(res ? res.message : 'Gagal menghapus prestasi.', 'error');
    }
  }
}

// -------------------------------------------------------------
// KELOLA 4 KOLOM CAPAIAN PRESTASI BERANDA (Teks Oranye & Putih)
// -------------------------------------------------------------
async function loadCMSPrestasiBoxes() {
  const container = document.getElementById('prestasiBoxesContainer');
  if (!container) return;

  try {
    const res = await api('/api/admin/cms/prestasi/boxes');
    const boxes = (res && res.success && Array.isArray(res.data)) ? res.data : [
      { id: 1, title: 'Juara 1', sub: 'Ekspedisi Navigasi Nasional' },
      { id: 2, title: 'Kalpataru', sub: 'Apresiasi Konservasi Kampus' },
      { id: 3, title: '7 Summits', sub: 'Jalur Ekspedisi Nusantara' },
      { id: 4, title: '30+ Riset', sub: 'Publikasi Ilmiah & Speleologi' }
    ];

    container.innerHTML = boxes.map((box, idx) => {
      const safeTitle = (box.title || '').replace(/"/g, '&quot;');
      const safeSub = (box.sub || '').replace(/"/g, '&quot;');
      return `
        <div class="p-3.5 rounded-xl bg-black/30 border border-white/5 space-y-2.5">
          <div class="flex items-center justify-between text-[11px] font-bold text-[#8C9BAE] border-b border-white/5 pb-1.5">
            <span class="text-white">Kolom #${idx + 1}</span>
            <span class="text-[#FF6B00]">Box ${idx + 1}</span>
          </div>
          <div>
            <label class="block text-[11px] font-medium text-[#FF6B00] mb-1">Teks Oranye (Judul):</label>
            <input type="text" id="prsBoxTitle_${idx + 1}" value="${safeTitle}" placeholder="Misal: Juara 1" class="form-input !text-xs !py-1.5 !font-bold text-[#FF6B00]">
          </div>
          <div>
            <label class="block text-[11px] font-medium text-white/90 mb-1">Teks Putih (Subjudul):</label>
            <input type="text" id="prsBoxSub_${idx + 1}" value="${safeSub}" placeholder="Misal: Navigasi Nasional" class="form-input !text-xs !py-1.5 text-white">
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    console.warn('Gagal memuat 4 kotak prestasi:', err);
  }
}

async function handleSavePrestasiBoxes(e) {
  if (e) e.preventDefault();
  const btn = document.getElementById('btnSavePrestasiBoxes');
  const originalText = btn ? btn.innerText : 'Simpan 4 Kolom Beranda';
  if (btn) {
    btn.disabled = true;
    btn.innerText = 'Menyimpan...';
  }

  const boxes = [];
  for (let i = 1; i <= 4; i++) {
    const titleEl = document.getElementById(`prsBoxTitle_${i}`);
    const subEl = document.getElementById(`prsBoxSub_${i}`);
    boxes.push({
      id: i,
      title: titleEl ? titleEl.value.trim() : '',
      sub: subEl ? subEl.value.trim() : ''
    });
  }

  const res = await api('/api/admin/cms/prestasi/boxes', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ boxes })
  });

  if (btn) {
    btn.disabled = false;
    btn.innerText = originalText;
  }

  if (res && res.success) {
    showToast('4 Kolom capaian prestasi beranda berhasil disimpan.', 'success');
  } else {
    showToast(res ? res.message : 'Gagal menyimpan 4 kolom prestasi.', 'error');
  }
}

// -------------------------------------------------------------
// SUBTAB 4: KONTEN STATIS & KONTAK (FR-42)
// -------------------------------------------------------------
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
    const ytEl = document.getElementById('staticYouTube');
    if (ytEl) ytEl.value = kontak.youtube || '';
    const fbEl = document.getElementById('staticFacebook');
    if (fbEl) fbEl.value = kontak.facebook || '';
    const ttEl = document.getElementById('staticTikTok');
    if (ttEl) ttEl.value = kontak.tiktok || '';
  }
  if (beranda) {
    document.getElementById('staticHeadline').value = beranda.headline || '';
    document.getElementById('staticSubHeadline').value = beranda.subheadline || '';

    // Puncak (Manual Admin)
    const pAngka = document.getElementById('staticPuncakAngka');
    if (pAngka) pAngka.value = beranda.puncak_angka || 120;
    const pSatuan = document.getElementById('staticPuncakSatuan');
    if (pSatuan) pSatuan.value = beranda.puncak_satuan || '+ Puncak';
    const pLabel = document.getElementById('staticPuncakLabel');
    if (pLabel) pLabel.value = beranda.puncak_label || 'Sumatera & Seven Summits';

    // Pratinjau Nilai Otomatis
    const elTahunPrev = document.getElementById('statAutoTahunPreview');
    if (elTahunPrev) {
      const curYear = new Date().getFullYear();
      elTahunPrev.innerText = `${Math.max(1, curYear - 1984)}+ Tahun`;
    }
    const elAnggotaPrev = document.getElementById('statAutoAnggotaPreview');
    if (elAnggotaPrev && STATE.members && STATE.members.length > 0) {
      elAnggotaPrev.innerText = `${STATE.members.length}+ Anggota`;
    }
    lucide.createIcons();
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
    const ytEl = document.getElementById('staticYouTube');
    const fbEl = document.getElementById('staticFacebook');
    const ttEl = document.getElementById('staticTikTok');
    data = {
      email: document.getElementById('staticEmail').value.trim(),
      whatsapp: document.getElementById('staticWA').value.trim(),
      alamat: document.getElementById('staticAlamat').value.trim(),
      instagram: document.getElementById('staticInstagram').value.trim(),
      youtube: ytEl ? ytEl.value.trim() : '',
      facebook: fbEl ? fbEl.value.trim() : '',
      tiktok: ttEl ? ttEl.value.trim() : ''
    };
  } else if (section === 'beranda') {
    const pAngka = document.getElementById('staticPuncakAngka');
    const pSatuan = document.getElementById('staticPuncakSatuan');
    const pLabel = document.getElementById('staticPuncakLabel');

    data = {
      headline: document.getElementById('staticHeadline').value,
      subheadline: document.getElementById('staticSubHeadline').value,
      puncak_angka: pAngka ? Number(pAngka.value) : 120,
      puncak_satuan: pSatuan ? pSatuan.value.trim() : '+ Puncak',
      puncak_label: pLabel ? pLabel.value.trim() : 'Sumatera & Seven Summits'
    };
  }

  const res = await api('/api/admin/cms/static-content', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ section, data })
  });

  if (res && res.success) {
    showToast(res.message, 'success');
  } else {
    showToast(res ? res.message : 'Gagal memperbarui konten statis.', 'error');
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
  if (id === 'articleModal') {
    const editInput = document.getElementById('artEditId');
    if (editInput) editInput.value = '';
  }
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

