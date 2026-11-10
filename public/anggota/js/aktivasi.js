/**
 * Aktivasi Akun Anggota Baru (3-Step Onboarding Wizard)
 * Sistem Informasi Keanggotaan Mapala UNAND
 */

let currentUser = {};
let activeKebijakanId = 1;
let currentStep = 1;

// State sementara onboarding wizard (data disimpan di memori hingga Step 3 selesai)
const activationState = {
  oldPassword: '',
  newPassword: '',
  kebijakan_id: 1
};

// 1. Inisialisasi Saat Halaman Dimuat
document.addEventListener('DOMContentLoaded', async () => {
  initLucide();
  const isValidSession = checkActivationAuth();
  if (!isValidSession) return;

  // Muat data kebijakan dan data profil awal
  await loadPrivacyPolicy();
  await loadMemberProfile();

  // Tentukan langkah awal berdasarkan status akun saat ini
  determineInitialStep();
});

function initLucide() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// 2. Auth & Route Guard
function checkActivationAuth() {
  const token = localStorage.getItem('mapala_token');
  const userJson = localStorage.getItem('mapala_user');

  if (!token || !userJson) {
    window.location.href = '/login';
    return false;
  }

  try {
    currentUser = JSON.parse(userJson);
  } catch (e) {
    localStorage.removeItem('mapala_token');
    localStorage.removeItem('mapala_user');
    window.location.href = '/login';
    return false;
  }

  // Jika admin, arahkan ke dashboard admin
  if (currentUser.role === 'admin') {
    window.location.href = '/admin';
    return false;
  }

  // GUARD: Jika akun anggota SUDAH pernah tuntas aktivasi, tidak boleh membuka halaman ini lagi
  const isAlreadyActivated = currentUser.must_change_password === false && Number(currentUser.profil_lengkap) === 1;
  if (isAlreadyActivated) {
    window.location.href = '/anggota';
    return false;
  }

  // Tampilkan identitas di header
  const elName = document.getElementById('headerMemberName');
  const elReg = document.getElementById('headerMemberReg');
  if (elName) elName.textContent = currentUser.nama || 'Anggota Mapala UNAND';
  if (elReg) elReg.textContent = currentUser.username || currentUser.no_register || '-';

  return true;
}

// 3. Tentukan Langkah Awal (Step 1, Step 2, atau Step 3)
function determineInitialStep() {
  // Jika akun belum tuntas aktivasi atau password baru belum divalidasi di wizard saat ini, selalu mulai dari Step 1
  if (currentUser.must_change_password === true || !activationState.newPassword) {
    goToStep(1);
  } else if (!currentUser.privacy_consent_given) {
    // Jika password sudah divalidasi tapi belum setujui privasi -> Step 2
    markStepCompleted(1);
    goToStep(2);
  } else {
    // Jika password dan privasi selesai, tapi profil belum lengkap -> Step 3
    markStepCompleted(1);
    markStepCompleted(2);
    goToStep(3);
  }
}

// 4. Stepper Navigation
function goToStep(step) {
  currentStep = step;

  // Sembunyikan semua pane
  const pane1 = document.getElementById('stepPane1');
  const pane2 = document.getElementById('stepPane2');
  const pane3 = document.getElementById('stepPane3');

  if (pane1) pane1.classList.add('hidden');
  if (pane2) pane2.classList.add('hidden');
  if (pane3) pane3.classList.add('hidden');

  // Tampilkan pane target
  const activePane = document.getElementById(`stepPane${step}`);
  if (activePane) {
    activePane.classList.remove('hidden');
    activePane.classList.add('animate-in', 'fade-in', 'duration-300');
  }

  // Update indikator stepper
  for (let i = 1; i <= 3; i++) {
    const indicator = document.getElementById(`stepIndicator${i}`);
    const badge = document.getElementById(`stepBadge${i}`);
    if (!indicator || !badge) continue;

    if (i === step) {
      // Langkah saat ini aktif
      indicator.className = 'flex flex-col items-center sm:items-start p-3 sm:p-4 rounded-2xl bg-[#11161B] border border-[#FF6B00] shadow-lg shadow-[#FF6B00]/10 transition-all';
      badge.className = 'w-6 h-6 rounded-full bg-[#FF6B00] text-white flex items-center justify-center text-xs font-bold shrink-0';
      badge.innerHTML = String(i);
    } else if (i < step) {
      // Langkah sebelumnya selesai
      indicator.className = 'flex flex-col items-center sm:items-start p-3 sm:p-4 rounded-2xl bg-[#11161B] border border-emerald-500/40 opacity-90 transition-all';
      badge.className = 'w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center text-xs font-bold shrink-0';
      badge.innerHTML = '<i data-lucide="check" class="w-3.5 h-3.5 text-emerald-400"></i>';
    } else {
      // Langkah berikutnya belum aktif
      indicator.className = 'flex flex-col items-center sm:items-start p-3 sm:p-4 rounded-2xl bg-[#11161B] border border-[#1C2530] opacity-50 transition-all';
      badge.className = 'w-6 h-6 rounded-full bg-[#1C2530] text-[#8C9BAE] flex items-center justify-center text-xs font-bold shrink-0';
      badge.innerHTML = String(i);
    }
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
  initLucide();
}

function markStepCompleted(step) {
  const indicator = document.getElementById(`stepIndicator${step}`);
  const badge = document.getElementById(`stepBadge${step}`);
  if (indicator && badge) {
    indicator.className = 'flex flex-col items-center sm:items-start p-3 sm:p-4 rounded-2xl bg-[#11161B] border border-emerald-500/40 opacity-90 transition-all';
    badge.className = 'w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center text-xs font-bold shrink-0';
    badge.innerHTML = '<i data-lucide="check" class="w-3.5 h-3.5 text-emerald-400"></i>';
  }
}

// ====================================================================
// STEP 1 HANDLER: VALIDASI PASSWORD SEMENTARA (TANPA COMMIT DATABASE)
// Kata sandi HANYA akan resmi disimpan ke MySQL pada Step 3 (Atomic Commit)
// ====================================================================
async function submitStep1(e) {
  e.preventDefault();
  const token = localStorage.getItem('mapala_token');
  if (!token) {
    showToast('Sesi Anda telah kedaluwarsa. Silakan login kembali.', 'error');
    return;
  }

  const oldPass = document.getElementById('step1OldPass').value;
  const newPass = document.getElementById('step1NewPass').value;
  const confPass = document.getElementById('step1ConfPass').value;

  if (newPass !== confPass) {
    showToast('Konfirmasi kata sandi baru tidak cocok. Periksa kembali.', 'error');
    return;
  }

  if (newPass.length < 6) {
    showToast('Kata sandi baru minimal harus 6 karakter.', 'error');
    return;
  }

  if (newPass === 'mapala123' || newPass === oldPass) {
    showToast('Kata sandi baru tidak boleh sama dengan kata sandi bawaan (mapala123).', 'error');
    return;
  }

  const btn = document.getElementById('btnStep1');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i data-lucide="loader" class="w-4 h-4 animate-spin"></i><span>Memverifikasi Kata Sandi...</span>';
    initLucide();
  }

  try {
    // Panggil endpoint validasi backend tanpa mengubah password_hash di database
    const res = await fetch('/api/member/activation/validate-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ oldPassword: oldPass, newPassword: newPass })
    });

    const result = await res.json();
    if (!res.ok || !result.success) {
      showToast(result.message || 'Gagal memverifikasi kata sandi.', 'error');
      return;
    }

    // Simpan kata sandi baru di memori wizard (TIDAK di database, dan TIDAK ubah must_change_password)
    activationState.oldPassword = oldPass;
    activationState.newPassword = newPass;

    showToast('Validasi Kata Sandi Berhasil! Kata sandi akan resmi diterapkan setelah seluruh langkah diselesaikan.', 'success');

    markStepCompleted(1);
    goToStep(2);

  } catch (err) {
    console.error('Error Step 1:', err);
    showToast('Terjadi kesalahan jaringan saat memverifikasi kata sandi.', 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<span>Lanjut ke Langkah 2</span><i data-lucide="arrow-right" class="w-4 h-4"></i>';
      initLucide();
    }
  }
}

// ====================================================================
// STEP 2 HANDLER: KEBIJAKAN PRIVASI (FR-44 & FR-45)
// ====================================================================
async function loadPrivacyPolicy() {
  const token = localStorage.getItem('mapala_token');
  if (!token) return;

  try {
    const res = await fetch('/api/member/privacy-policy', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) return;

    const json = await res.json();
    if (json.success && json.data) {
      const d = json.data;
      activeKebijakanId = d.kebijakan_id || 1;

      const titleEl = document.getElementById('policyTitle');
      const verEl = document.getElementById('policyVersion');
      const contentEl = document.getElementById('policyContent');

      if (titleEl && d.judul) titleEl.textContent = d.judul;
      if (verEl && d.versi) verEl.textContent = `Versi ${d.versi} (Aktif)`;

      if (contentEl && d.isi) {
        // Format teks paragraf
        const paragraphs = d.isi.split('\n\n').filter(Boolean);
        contentEl.innerHTML = paragraphs.map(p => `<p class="leading-relaxed">${p.replace(/\n/g, '<br>')}</p>`).join('');
      }

      if (d.sudah_disetujui) {
        currentUser.privacy_consent_given = true;
        localStorage.setItem('mapala_user', JSON.stringify(currentUser));
        const chk = document.getElementById('step2ConsentCheckbox');
        if (chk) chk.checked = true;
      }
    }
  } catch (err) {
    console.warn('Gagal memuat kebijakan privasi:', err);
  }
}

async function submitStep2(e) {
  e.preventDefault();
  const token = localStorage.getItem('mapala_token');
  if (!token) return;

  const chk = document.getElementById('step2ConsentCheckbox');
  if (!chk || !chk.checked) {
    showToast('Anda wajib mencentang persetujuan kebijakan privasi untuk melanjutkan.', 'error');
    return;
  }

  // Simpan kebijakan_id di memori wizard
  activationState.kebijakan_id = activeKebijakanId;
  currentUser.privacy_consent_given = true;

  showToast('Langkah 2 Selesai: Persetujuan Kebijakan Privasi dicatat!', 'success');

  markStepCompleted(2);
  goToStep(3);
}

// ====================================================================
// STEP 3 HANDLER: LENGKAPI BIODATA ESENSIAL & ATOMIC COMMIT
// Menyimpan secara atomik: Password Baru + Persetujuan Privasi + Biodata Esensial
// ====================================================================
async function loadMemberProfile() {
  const token = localStorage.getItem('mapala_token');
  if (!token) return;

  try {
    const res = await fetch('/api/member/profile', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) return;

    const json = await res.json();
    if (json.success && json.data) {
      const d = json.data.data_tetap || {};
      const reg = json.data.data_berkala_terbaru || {};

      // Profil Terkunci
      const elNoReg = document.getElementById('step3LockedNoReg');
      const elNama = document.getElementById('step3LockedNama');
      const elDivisi = document.getElementById('step3LockedDivisi');
      const elAngkatan = document.getElementById('step3LockedAngkatan');

      if (elNoReg) elNoReg.textContent = d.no_register || currentUser.username || '-';
      if (elNama) elNama.textContent = d.nama || currentUser.nama || '-';
      if (elDivisi) elDivisi.textContent = d.divisi_nama || d.divisi || 'Divisi Resmi';
      if (elAngkatan) elAngkatan.textContent = d.angkatan ? `Angkatan ${d.angkatan}` : '-';

      // Prefill kolom input jika ada data lama
      const elTempat = document.getElementById('step3TempatLahir');
      const elTgl = document.getElementById('step3TanggalLahir');
      const elGoldar = document.getElementById('step3Goldar');
      const elAyah = document.getElementById('step3NamaAyah');
      const elIbu = document.getElementById('step3NamaIbu');
      const elHp = document.getElementById('step3NoHp');
      const elKota = document.getElementById('step3Kota');
      const elProv = document.getElementById('step3Provinsi');
      const elAlamat = document.getElementById('step3Alamat');

      if (elTempat && d.tempat_lahir) elTempat.value = d.tempat_lahir;
      if (elTgl && d.tanggal_lahir) elTgl.value = d.tanggal_lahir.substring(0, 10);
      if (elGoldar && d.golongan_darah) elGoldar.value = d.golongan_darah;
      if (elAyah && d.nama_ayah) elAyah.value = d.nama_ayah;
      if (elIbu && d.nama_ibu) elIbu.value = d.nama_ibu;

      if (elHp && reg.no_hp) elHp.value = reg.no_hp;
      if (elKota && reg.kota_kabupaten) elKota.value = reg.kota_kabupaten;
      if (elProv && reg.provinsi) elProv.value = reg.provinsi;
      if (elAlamat && reg.alamat_rumah) elAlamat.value = reg.alamat_rumah;
    }
  } catch (err) {
    console.warn('Gagal memuat profil anggota untuk aktivasi:', err);
  }
}

async function submitStep3(e) {
  e.preventDefault();
  const token = localStorage.getItem('mapala_token');
  if (!token) return;

  // Pastikan Langkah 1 telah diisi jika akun masih wajib ganti password
  if (currentUser.must_change_password && !activationState.newPassword) {
    showToast('Silakan selesaikan Langkah 1 (Kata Sandi Baru) terlebih dahulu.', 'error');
    goToStep(1);
    return;
  }

  const nama = document.getElementById('step3LockedNama')?.textContent || currentUser.nama;
  const tempat_lahir = document.getElementById('step3TempatLahir').value.trim();
  const tanggal_lahir = document.getElementById('step3TanggalLahir').value;
  const golongan_darah = document.getElementById('step3Goldar').value;
  const nama_ayah = document.getElementById('step3NamaAyah').value.trim();
  const nama_ibu = document.getElementById('step3NamaIbu').value.trim();
  const no_hp = document.getElementById('step3NoHp').value.trim();
  const kota_kabupaten = document.getElementById('step3Kota').value.trim();
  const provinsi = document.getElementById('step3Provinsi').value.trim();
  const alamat_rumah = document.getElementById('step3Alamat').value.trim();

  if (!tempat_lahir || !tanggal_lahir || !golongan_darah || !nama_ayah || !nama_ibu || !no_hp || !kota_kabupaten || !provinsi) {
    showToast('Seluruh kolom wajib bertanda bintang (*) harus diisi lengkap.', 'error');
    return;
  }

  const btn = document.getElementById('btnStep3');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i data-lucide="loader" class="w-4 h-4 animate-spin"></i><span>Menyimpan Seluruh Aktivasi...</span>';
    initLucide();
  }

  try {
    // Panggil Endpoint Atomic Complete Activation
    const res = await fetch('/api/member/activation/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        oldPassword: activationState.oldPassword,
        newPassword: activationState.newPassword,
        kebijakan_id: activationState.kebijakan_id || activeKebijakanId || 1,
        nama,
        tempat_lahir,
        tanggal_lahir,
        golongan_darah,
        nama_ayah,
        nama_ibu,
        no_hp,
        kota_kabupaten,
        provinsi,
        alamat_rumah
      })
    });

    const result = await res.json();
    if (!res.ok || !result.success) {
      showToast(result.message || 'Gagal menyelesaikan aktivasi akun.', 'error');
      return;
    }

    // Tandai tuntas aktivasi secara permanen di state lokal
    currentUser.profil_lengkap = 1;
    currentUser.must_change_password = false;
    currentUser.privacy_consent_given = true;
    currentUser.nama = nama;
    localStorage.setItem('mapala_user', JSON.stringify(currentUser));

    markStepCompleted(3);

    // Tampilkan Modal Sukses Selebrasi
    const overlay = document.getElementById('successOverlay');
    if (overlay) {
      overlay.classList.remove('hidden');
      initLucide();
    }

    // Auto redirect dalam 3 detik jika tidak diklik
    setTimeout(() => {
      finishActivationRedirect();
    }, 3000);

  } catch (err) {
    console.error('Error Step 3:', err);
    showToast('Terjadi kesalahan jaringan saat menyelesaikan aktivasi.', 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i data-lucide="check-circle" class="w-4 h-4"></i><span>Selesaikan Aktivasi Akun</span>';
      initLucide();
    }
  }
}

// 5. Finalisasi & Pengalihan Permanen ke /anggota
function finishActivationRedirect() {
  window.location.href = '/anggota';
}

// 6. Logout
function handleLogout() {
  localStorage.removeItem('mapala_token');
  localStorage.removeItem('mapala_user');
  window.location.href = '/login';
}

// 7. Toast Notifikasi
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  const bg = type === 'success' ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' :
             type === 'error' ? 'bg-red-500/10 border-red-500/40 text-red-400' :
             'bg-blue-500/10 border-blue-500/40 text-blue-400';

  const iconName = type === 'success' ? 'check-circle' : type === 'error' ? 'alert-triangle' : 'info';

  toast.className = `p-4 rounded-2xl border ${bg} backdrop-blur-md shadow-2xl flex items-center gap-3 text-xs font-semibold max-w-sm pointer-events-auto transition-all animate-in fade-in slide-in-from-bottom-3 duration-300`;
  toast.innerHTML = `
    <i data-lucide="${iconName}" class="w-4 h-4 shrink-0"></i>
    <span class="flex-1 leading-relaxed">${message}</span>
  `;

  container.appendChild(toast);
  initLucide();

  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}
