// MAPALA UNIVERSITAS ANDALAS - CORE INTERACTION SCRIPT

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initHomeActivitiesCarousel();
  initHomePrestasiSlider();
  initCategoryFilters();
  initSearchInput();
  initArticleDetailPage();
  initLoginForm();
  initScrollReveal();
  initCounterAnimation();
  initHistorySlider();
  fetchLivePublicData();
});

async function fetchLivePublicData() {
  try {
    // ============================================================================
    // 1. KONTEN BERANDA & HERO (GET /api/public/content/beranda)
    // ============================================================================
    try {
      const res = await fetch('/api/public/content/beranda');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const d = json.data;

          // A. Hero Banner
          if (d.hero) {
            const heroMainTitle = document.querySelector('.hero-main-title');
            const heroTagline = document.querySelector('.hero-tagline');
            const heroDesc = document.querySelector('.hero-description');
            const heroSec = document.querySelector('.hero-section');

            if (heroMainTitle && d.hero.judul) {
              heroMainTitle.innerHTML = d.hero.judul.replace(/\n/g, '<br>');
            }
            if (heroTagline && d.hero.tagline) {
              heroTagline.innerHTML = d.hero.tagline.replace(/\n/g, '<br>');
            }
            if (heroDesc && d.hero.deskripsi) {
              heroDesc.textContent = d.hero.deskripsi;
            }
            if (heroSec && d.hero.foto_url) {
              heroSec.style.setProperty('--hero-bg-image', `url('${d.hero.foto_url}')`);
            }
          }

          // A2. 4 Statistik Hero Beranda (Tahun Otomatis, Puncak Manual Admin, Anggota Otomatis DB, Konservasi Otomatis DB)
          if (d.statistik && Array.isArray(d.statistik)) {
            const statsRow = document.querySelector('.hero-stats-row');
            if (statsRow) {
              const statItems = statsRow.querySelectorAll('.stat-item');
              d.statistik.forEach((st, idx) => {
                if (statItems[idx]) {
                  const numEl = statItems[idx].querySelector('.stat-number');
                  const lblEl = statItems[idx].querySelector('.stat-label');
                  if (numEl) {
                    const rawSuffix = st.satuan || '';
                    numEl.setAttribute('data-target', st.angka);
                    numEl.setAttribute('data-suffix', rawSuffix.startsWith('+') ? rawSuffix : ` ${rawSuffix}`);
                    numEl.textContent = `0${rawSuffix.startsWith('+') ? rawSuffix : ' ' + rawSuffix}`;
                  }
                  if (lblEl && st.label) {
                    lblEl.textContent = st.label;
                  }
                }
              });
              initCounterAnimation();
            }
          }

          // B. Kegiatan & Artikel Terbaru di Carousel Beranda
          if (d.kegiatan_terbaru && d.kegiatan_terbaru.length > 0 && window.MAPALA_DATA) {
            window.MAPALA_DATA.activities = d.kegiatan_terbaru.map(item => ({
              id: item.slug || item.id,
              category: (item.kategori || 'ekspedisi').toLowerCase(),
              categoryBadge: (item.divisi || item.kategori || 'KEGIATAN').toUpperCase(),
              title: item.judul,
              location: item.lokasi,
              image: item.foto_sampul,
              excerpt: item.ringkasan,
              status: item.status_kegiatan || 'Selesai',
              team: item.tim_capaian || 'Tim Mapala UNAND',
              date: item.tanggal
            }));
            initHomeActivitiesCarousel();
          }

          // C. Bagan Struktur Organisasi di Beranda
          if (d.struktur_ringkas && d.struktur_ringkas.gambar_url) {
            const homeBagan = document.querySelector('.org-image-wrapper img');
            if (homeBagan) {
              homeBagan.src = d.struktur_ringkas.gambar_url;
              if (d.struktur_ringkas.judul_bagan) {
                homeBagan.alt = `${d.struktur_ringkas.judul_bagan} (${d.struktur_ringkas.periode || ''})`;
              }
            }
          }

          // D. Sorotan Prestasi & Foto Sesuai Prestasi Terkait di Beranda
          const prs = d.prestasi_utama || (d.sorotan_prestasi && d.sorotan_prestasi[0]);
          if (prs) {
            const hTitle = document.querySelector('.prestasi-title');
            const hDesc = document.querySelector('.prestasi-desc');
            const prestasiImg = document.getElementById('prestasiMainImg');
            const prestasiCaption = document.getElementById('prestasiCaptionText');

            if (hTitle && prs.judul) hTitle.textContent = prs.judul;
            if (hDesc && (prs.deskripsi || prs.detail)) hDesc.textContent = prs.deskripsi || prs.detail;

            // Foto sebelah kanan disesuaikan langsung dengan prestasi terkait
            if (prestasiImg && (prs.foto || prs.gambar_url)) {
              prestasiImg.src = prs.foto || prs.gambar_url;
              prestasiImg.alt = prs.judul || 'Foto Prestasi Mapala UNAND';
            }
            if (prestasiCaption && (prs.caption || prs.judul)) {
              prestasiCaption.textContent = prs.caption || `${prs.judul} (${prs.tahun || ''}) - Mapala UNAND`;
            }
          }

          // E. 4 Kolom Capaian Prestasi Beranda (Hanya Teks Oranye & Teks Putih)
          if (d.prestasi_boxes && Array.isArray(d.prestasi_boxes)) {
            const boxesContainer = document.getElementById('prestasiBoxesGrid') || document.querySelector('.prestasi-stats-grid');
            if (boxesContainer) {
              boxesContainer.innerHTML = d.prestasi_boxes.slice(0, 4).map((b, idx) => `
                <div class="prestasi-box reveal stagger-${idx + 1} revealed">
                  <div class="prestasi-box-title">${b.title || ''}</div>
                  <div class="prestasi-box-sub">${b.sub || ''}</div>
                </div>
              `).join('');
            }
          }
        }
      }
    } catch (e) {
      console.warn('Gagal memuat konten beranda live:', e);
    }

    // ============================================================================
    // 2. KONTEN KONTAK, FOOTER, & WHATSAPP (GET /api/public/content/kontak)
    // ============================================================================
    try {
      const kontakRes = await fetch('/api/public/content/kontak');
      if (kontakRes.ok) {
        const kontakJson = await kontakRes.json();
        if (kontakJson.success && kontakJson.data) {
          const k = kontakJson.data;

          // A. Email
          const emailLinks = document.querySelectorAll('.footer-email-link');
          emailLinks.forEach(el => {
            if (k.email) {
              el.href = `mailto:${k.email}`;
              el.textContent = k.email;
            }
          });

          // B. Alamat Sekretariat
          const contactBoxes = document.querySelectorAll('.footer-contact-info');
          contactBoxes.forEach(box => {
            if (k.alamat) {
              const pTags = box.querySelectorAll('p');
              if (pTags.length > 0) {
                pTags[0].textContent = k.alamat;
              }
            }

            // WhatsApp link di footer (kontras tinggi)
            if (k.whatsapp) {
              const cleanWA = k.whatsapp.replace(/[^\d]/g, '');
              let waP = box.querySelector('.footer-wa-item');
              if (!waP) {
                waP = document.createElement('p');
                waP.className = 'footer-wa-item';
                waP.style.marginTop = '6px';
                box.appendChild(waP);
              }
              waP.innerHTML = `<span style="color: #94A3B8; font-weight: 500;">WhatsApp:</span> <a href="https://wa.me/${cleanWA}" target="_blank" rel="noopener" class="footer-wa-link">+${cleanWA}</a>`;
            }
          });

          // C. Tautan Media Sosial Resmi (Ditetapkan tepat 1 per platform, X dihapus, logo Facebook & TikTok asli)
          if (k.social_links && Array.isArray(k.social_links)) {
            const socialWraps = document.querySelectorAll('.footer-social-links');
            if (socialWraps.length > 0 && k.social_links.length > 0) {
              const iconMap = {
                'instagram': '/images/icons/instagram.svg',
                'youtube': '/images/icons/youtube.svg',
                'facebook': '/images/icons/facebook.svg',
                'tiktok': '/images/icons/tiktok.svg'
              };

              // Pastikan hanya tepat 1 tombol per masing-masing platform & tidak menampilkan X/Twitter
              const seen = new Set();
              const uniqueLinks = [];
              k.social_links.forEach(s => {
                const pKey = (s.platform || '').trim().toLowerCase();
                // Kecualikan platform X / Twitter dari tampilan
                if (!pKey || pKey === 'x' || pKey === 'twitter' || pKey === 'x-twitter') return;

                if (!seen.has(pKey)) {
                  seen.add(pKey);
                  uniqueLinks.push({ ...s, _key: pKey });
                }
              });

              const socialHtml = uniqueLinks.map(s => {
                const icon = iconMap[s._key] || '/images/icons/share.svg';
                return `
                  <a href="${s.url}" target="_blank" rel="noopener" class="social-btn" title="${s.platform}">
                    <img src="${icon}" alt="${s.platform}" style="width: 20px; height: 20px;">
                  </a>
                `;
              }).join('');

              socialWraps.forEach(wrap => {
                wrap.innerHTML = socialHtml;
              });
            }
          }

          // D. Floating WhatsApp Contact Button di Website Publik
          if (k.whatsapp) {
            const cleanWA = k.whatsapp.replace(/[^\d]/g, '');
            let floatBtn = document.getElementById('floatingWhatsAppBtn');
            if (!floatBtn) {
              floatBtn = document.createElement('a');
              floatBtn.id = 'floatingWhatsAppBtn';
              floatBtn.className = 'floating-wa-btn';
              floatBtn.target = '_blank';
              floatBtn.rel = 'noopener';
              floatBtn.title = 'Hubungi Pengurus Mapala UNAND via WhatsApp';
              floatBtn.innerHTML = `
                <span class="wa-icon-wrap">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                  </svg>
                  <span class="wa-status-dot" aria-hidden="true"></span>
                </span>
                <span class="wa-text">Tanya Admin</span>
              `;
              document.body.appendChild(floatBtn);
            }
            floatBtn.href = `https://wa.me/${cleanWA}`;
          }
        }
      }
    } catch (e) {
      console.warn('Gagal memuat kontak live:', e);
    }

    // ============================================================================
    // 3. HALAMAN KEGIATAN & ARTIKEL (/kegiatan-artikel)
    // ============================================================================
    const allGrid = document.getElementById('allArticlesGrid');
    if (allGrid) {
      try {
        const artRes = await fetch('/api/public/articles');
        if (artRes.ok) {
          const artJson = await artRes.json();
          if (artJson.success && artJson.data && artJson.data.length > 0 && window.MAPALA_DATA) {
            window.MAPALA_DATA.activities = artJson.data.map(item => ({
              id: item.slug || item.id,
              category: (item.kategori || 'ekspedisi').toLowerCase(),
              categoryBadge: (item.divisi || item.kategori || 'KEGIATAN').toUpperCase(),
              title: item.judul,
              location: item.lokasi,
              image: item.foto_sampul,
              excerpt: item.ringkasan,
              status: item.status_kegiatan || 'Selesai',
              team: item.tim_capaian || 'Tim Mapala UNAND',
              date: item.tanggal
            }));
            initCategoryFilters();
          }
        }
      } catch (_) {}
    }

    // ============================================================================
    // 5. HALAMAN PRESTASI (/prestasi)
    // ============================================================================
    const prestasiContainer = document.getElementById('prestasiListContainer') ||
      document.querySelector('.section-padding .container > div[style*="flex-direction: column"]');
    if (prestasiContainer && window.location.pathname.includes('/prestasi')) {
      try {
        const pRes = await fetch('/api/public/prestasi');
        if (pRes.ok) {
          const pJson = await pRes.json();
          if (pJson.success && pJson.data && pJson.data.length > 0) {
            prestasiContainer.innerHTML = pJson.data.map(p => `
              <div class="prestasi-grid" style="background-color: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); padding: 36px;">
                <div>
                  <span class="badge-tag badge-orange" style="margin-bottom: 12px;">TAHUN ${p.tahun} • ${p.kategori ? p.kategori.toUpperCase() : 'PRESTASI'}</span>
                  <h2 class="prestasi-title" style="font-size: 1.8rem; margin-bottom: 12px;">${p.judul}</h2>
                  <p class="prestasi-desc">${p.deskripsi}</p>
                  <div style="display: flex; gap: 12px; margin-top: 20px; flex-wrap: wrap;">
                    ${p.info_label_1 ? `<span class="badge-tag badge-dark">${p.info_label_1}</span>` : ''}
                    ${p.info_label_2 ? `<span class="badge-tag badge-dark">${p.info_label_2}</span>` : ''}
                    ${p.is_sorotan ? `<span class="badge-tag badge-orange">★ Sorotan Utama</span>` : ''}
                  </div>
                </div>
                <div class="prestasi-image-card">
                  <img src="${p.foto}" alt="${p.judul}">
                  <div class="prestasi-caption">${p.gambar_caption || p.judul}</div>
                </div>
              </div>
            `).join('');
          }
        }
      } catch (_) {}
    }

    // ============================================================================
    // 6. HALAMAN TENTANG KAMI (/tentang-kami)
    // ============================================================================
    const narrativeEl = document.querySelector('.about-narrative');
    if (narrativeEl && window.location.pathname.includes('/tentang-kami')) {
      try {
        const tkRes = await fetch('/api/public/content/tentang-kami');
        if (tkRes.ok) {
          const tkJson = await tkRes.json();
          if (tkJson.success && tkJson.data) {
            const tk = tkJson.data;
            if (tk.sejarah) {
              const paragraphs = tk.sejarah.split('\n\n').filter(Boolean);
              narrativeEl.innerHTML = paragraphs.map(p => `<p>${p}</p>`).join('');
            }
            if (tk.visi) {
              const visiBox = Array.from(document.querySelectorAll('.section-padding div[style*="background-color: var(--bg-card)"]')).find(el => el.querySelector('h3')?.textContent.trim() === 'Visi');
              if (visiBox) {
                const visiP = visiBox.querySelector('p');
                if (visiP) visiP.textContent = tk.visi;
              }
            }
            if (tk.misi && Array.isArray(tk.misi) && tk.misi.length > 0) {
              const misiBox = Array.from(document.querySelectorAll('.section-padding div[style*="background-color: var(--bg-card)"]')).find(el => el.querySelector('h3')?.textContent.trim() === 'Misi');
              if (misiBox) {
                const misiUl = misiBox.querySelector('ul');
                if (misiUl) {
                  misiUl.innerHTML = tk.misi.map(m => `<li>${m.teks}</li>`).join('');
                }
              }
            }
            if (tk.kode_etik) {
              const kodeEtikQuote = document.querySelector('.kode-etik-quote');
              if (kodeEtikQuote) kodeEtikQuote.textContent = `"${tk.kode_etik}"`;
            }
          }
        }
      } catch (_) {}
    }
  } catch (err) {
    console.warn('API Publik offline, menggunakan data lokal frontend:', err);
  }
}

// 1. Navbar Behavior
function initNavbar() {
  const navbar = document.querySelector('.site-navbar');
  const toggleBtn = document.querySelector('.mobile-nav-toggle');
  const navMenu = document.querySelector('.nav-menu');

  if (navbar) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 40) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    });
  }

  if (toggleBtn && navMenu) {
    toggleBtn.addEventListener('click', () => {
      navMenu.classList.toggle('open');
      const isOpen = navMenu.classList.contains('open');
      toggleBtn.innerHTML = isOpen 
        ? '<img src="/images/icons/close.svg" alt="Tutup" style="width: 20px; height: 20px;">' 
        : '<img src="/images/icons/menu.svg" alt="Menu" style="width: 20px; height: 20px;">';
    });
  }
}

// 2. Activities Carousel on Homepage
function initHomeActivitiesCarousel() {
  const prevBtn = document.getElementById('activityPrevBtn');
  const nextBtn = document.getElementById('activityNextBtn');
  const dots = document.querySelectorAll('.carousel-dots .dot');
  const grid = document.getElementById('activityCardsContainer');

  if (!grid || !window.MAPALA_DATA) return;

  const activities = window.MAPALA_DATA.activities;
  let currentIndex = 0;
  const itemsPerPage = window.innerWidth < 768 ? 1 : (window.innerWidth < 1024 ? 2 : 3);

  function renderCards(startIndex) {
    const visibleItems = [];
    for (let i = 0; i < itemsPerPage; i++) {
      const idx = (startIndex + i) % activities.length;
      visibleItems.push(activities[idx]);
    }

    grid.innerHTML = visibleItems.map((item, i) => `
      <a href="/kegiatan-artikel/detail?id=${item.id}" class="activity-card reveal stagger-${i+1} revealed" style="--card-bg: url('${item.image}')">
        <div class="activity-card-top">
          <span class="badge-tag badge-dark">${item.categoryBadge}</span>
          <div class="card-arrow-btn">↗</div>
        </div>
        <div class="activity-card-bottom">
          <div class="activity-location">
            <span><img src="/images/icons/pin.svg" alt="Lokasi" style="width: 14px; height: 14px; vertical-align: middle; margin-right: 4px;"></span> ${item.location}
          </div>
          <h3 class="activity-title">${item.title}</h3>
          <p class="activity-desc">${item.excerpt}</p>
        </div>
      </a>
    `).join('');

    // Apply background image dynamically
    const cardEls = grid.querySelectorAll('.activity-card');
    cardEls.forEach((card, idx) => {
      const item = visibleItems[idx];
      const styleTag = document.createElement('style');
      const uniqueClass = 'act-card-' + item.id;
      card.classList.add(uniqueClass);
      styleTag.textContent = `.${uniqueClass}::before { background-image: url('${item.image}'); }`;
      document.head.appendChild(styleTag);
    });

    // Update dots
    dots.forEach((dot, idx) => {
      dot.classList.toggle('active', idx === (startIndex % dots.length));
    });
  }

  renderCards(0);

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      currentIndex = (currentIndex + 1) % activities.length;
      renderCards(currentIndex);
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      currentIndex = (currentIndex - 1 + activities.length) % activities.length;
      renderCards(currentIndex);
    });
  }

  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      currentIndex = index;
      renderCards(currentIndex);
    });
  });
}

// 3. Prestasi Beranda (Foto Statis Sesuai Prestasi Terkait, Tanpa Slider/Next)
function initHomePrestasiSlider() {
  // Fitur next foto dihapus: foto beranda tetap sinkron dengan data prestasi terkait
}

// 4. Category Filter for Kegiatan & Artikel Page
function initCategoryFilters() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const articlesGrid = document.getElementById('allArticlesGrid');

  if (!articlesGrid || !window.MAPALA_DATA) return;

  const activities = window.MAPALA_DATA.activities;

  function displayArticles(category = 'all', searchQuery = '') {
    let filtered = activities;

    if (category !== 'all') {
      filtered = filtered.filter(a => a.category.toLowerCase().includes(category.toLowerCase()));
    }

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(a => a.title.toLowerCase().includes(q) || a.excerpt.toLowerCase().includes(q) || a.location.toLowerCase().includes(q));
    }

    if (filtered.length === 0) {
      articlesGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
          <p style="color: var(--text-dim); font-size: 1.1rem; margin-bottom: 8px;">Tidak ditemukan kegiatan atau artikel untuk kriteria ini.</p>
          <span style="color: var(--text-muted); font-size: 0.85rem;">Silakan coba pilih kategori lain atau reset pencarian.</span>
        </div>
      `;
      return;
    }

    articlesGrid.innerHTML = filtered.map(item => `
      <a href="/kegiatan-artikel/detail?id=${item.id}" class="activity-card" style="min-height: 400px;">
        <div class="activity-card-top">
          <span class="badge-tag badge-dark">${item.categoryBadge}</span>
          <div class="card-arrow-btn">↗</div>
        </div>
        <div class="activity-card-bottom">
          <div class="activity-location">
            <span><img src="/images/icons/pin.svg" alt="Lokasi" style="width: 14px; height: 14px; vertical-align: middle; margin-right: 4px;"></span> ${item.location}
          </div>
          <h3 class="activity-title">${item.title}</h3>
          <p class="activity-desc">${item.excerpt}</p>
          <div class="activity-meta">
            <span>Tanggal: <strong>${item.date}</strong></span>
            <span>${item.team}</span>
          </div>
        </div>
      </a>
    `).join('');

    const cards = articlesGrid.querySelectorAll('.activity-card');
    cards.forEach((card, idx) => {
      const item = filtered[idx];
      const styleTag = document.createElement('style');
      const uniqueClass = 'all-card-' + item.id;
      card.classList.add(uniqueClass);
      styleTag.textContent = `.${uniqueClass}::before { background-image: url('${item.image}'); }`;
      document.head.appendChild(styleTag);
    });
  }

  // Initial load
  displayArticles('all');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.getAttribute('data-category');
      const searchVal = document.getElementById('articleSearchInput') ? document.getElementById('articleSearchInput').value : '';
      displayArticles(cat, searchVal);
    });
  });
}

// 5. Search Bar on Article Page
function initSearchInput() {
  const searchInput = document.getElementById('articleSearchInput');
  if (!searchInput) return;

  searchInput.addEventListener('input', (e) => {
    const activeBtn = document.querySelector('.filter-btn.active');
    const cat = activeBtn ? activeBtn.getAttribute('data-category') : 'all';
    const filterFn = window.displayArticles;
    // trigger custom filter
    const event = new CustomEvent('searchChange', { detail: { query: e.target.value, category: cat } });
    document.dispatchEvent(event);
  });
}

// 6. Detail Article Page Loader (Dynamic Live Fetch dari MySQL)
async function initArticleDetailPage() {
  const detailContainer = document.getElementById('articleDetailContent');
  if (!detailContainer) return;

  const urlParams = new URLSearchParams(window.location.search);
  let articleId = urlParams.get('id');
  if (!articleId) {
    const parts = window.location.pathname.split('/').filter(Boolean);
    if (parts.length > 1 && parts[0] === 'kegiatan-artikel' && parts[1] !== 'detail') {
      articleId = parts[1];
    }
  }
  if (!articleId) articleId = 'ekspedisi-kerinci-3805';

  let article = null;

  try {
    const res = await fetch(`/api/public/articles/${encodeURIComponent(articleId)}`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        const d = json.data;
        article = {
          id: d.slug || d.id,
          categoryBadge: (d.divisi || d.kategori || 'KEGIATAN').toUpperCase(),
          title: d.judul,
          date: d.tanggal || '-',
          location: d.lokasi || 'Sumatera Barat',
          author: d.penulis || 'Humas Mapala UNAND',
          image: d.foto_sampul || '/images/hero-mountain.jpg',
          fullContent: d.isi ? (d.isi.includes('<p>') ? d.isi : d.isi.split('\n\n').map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('')) : (d.ringkasan || ''),
          galeri: d.galeri || [],
          artikel_terkait: d.artikel_terkait || []
        };
      }
    }
  } catch (err) {
    console.warn('Gagal memuat artikel live, mencoba fallback lokal:', err);
  }

  // Fallback lokal jika data belum tersedia di backend
  if (!article && window.MAPALA_DATA && window.MAPALA_DATA.activities) {
    article = window.MAPALA_DATA.activities.find(a => a.id === articleId) || window.MAPALA_DATA.activities[0];
  }

  if (!article) return;

  const elBadge = document.getElementById('detailCategoryBadge');
  const elTitle = document.getElementById('detailTitle');
  const elDate = document.getElementById('detailDate');
  const elLoc = document.getElementById('detailLocation');
  const elAuth = document.getElementById('detailAuthor');
  const elHero = document.getElementById('detailHeroImg');
  const elBody = document.getElementById('detailBodyContent');

  if (elBadge) elBadge.textContent = article.categoryBadge;
  if (elTitle) elTitle.textContent = article.title;
  if (elDate) elDate.textContent = article.date;
  if (elLoc) elLoc.textContent = article.location;
  if (elAuth) elAuth.textContent = article.author;
  if (elHero) {
    elHero.src = article.image;
    elHero.alt = article.title;
  }
  if (elBody) elBody.innerHTML = article.fullContent;

  // Hapus dokumentasi galeri jika ada (hanya menyisakan foto utama/hero di atas)
  const existingGalleryWrap = document.getElementById('articleGalleryWrap');
  if (existingGalleryWrap) existingGalleryWrap.remove();

  // Render related articles
  const relatedGrid = document.getElementById('relatedArticlesGrid');
  if (relatedGrid) {
    let related = [];
    if (article.artikel_terkait && article.artikel_terkait.length > 0) {
      related = article.artikel_terkait.map(item => ({
        id: item.slug || item.id,
        categoryBadge: 'TERKAIT',
        title: item.judul,
        image: item.foto_sampul
      }));
    } else if (window.MAPALA_DATA && window.MAPALA_DATA.activities) {
      related = window.MAPALA_DATA.activities.filter(a => a.id !== article.id).slice(0, 3);
    }

    relatedGrid.innerHTML = related.map(item => `
      <a href="/kegiatan-artikel/detail?id=${item.id}" class="activity-card" style="height: 380px;">
        <div class="activity-card-top">
          <span class="badge-tag badge-dark">${item.categoryBadge || 'KEGIATAN'}</span>
          <div class="card-arrow-btn">↗</div>
        </div>
        <div class="activity-card-bottom">
          <h3 class="activity-title" style="font-size: 1.1rem;">${item.title}</h3>
          ${item.date ? `<div class="activity-meta"><span>${item.date}</span></div>` : ''}
        </div>
      </a>
    `).join('');

    const cards = relatedGrid.querySelectorAll('.activity-card');
    cards.forEach((card, idx) => {
      const item = related[idx];
      const styleTag = document.createElement('style');
      const uniqueClass = 'rel-card-' + String(item.id).replace(/[^\w\-]/g, '');
      card.classList.add(uniqueClass);
      styleTag.textContent = `.${uniqueClass}::before { background-image: url('${item.image}'); }`;
      document.head.appendChild(styleTag);
    });
  }
}


// 8. Login Form Interaction (Password Visibility & Ready for Backend Auth)
function initLoginForm() {
  const form = document.getElementById('loginForm');
  const togglePassBtn = document.getElementById('togglePassword');
  const passInput = document.getElementById('password');

  if (togglePassBtn && passInput) {
    togglePassBtn.innerHTML = '<img src="/images/icons/eye.svg" alt="Show" style="width: 18px; height: 18px; opacity: 0.7;">';
    togglePassBtn.addEventListener('click', () => {
      const isPass = passInput.getAttribute('type') === 'password';
      passInput.setAttribute('type', isPass ? 'text' : 'password');
      togglePassBtn.innerHTML = isPass 
        ? '<img src="/images/icons/eye-off.svg" alt="Hide" style="width: 18px; height: 18px; opacity: 0.9;">' 
        : '<img src="/images/icons/eye.svg" alt="Show" style="width: 18px; height: 18px; opacity: 0.7;">';
    });
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = form.querySelector('button[type="submit"]');
      const usernameInput = document.getElementById('username');
      const passwordInput = document.getElementById('password');

      const username = usernameInput ? usernameInput.value.trim() : '';
      const password = passwordInput ? passwordInput.value : '';

      submitBtn.innerHTML = 'Memverifikasi Akses...';
      submitBtn.disabled = true;

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        const result = await res.json();

        if (result.success && result.data) {
          localStorage.setItem('mapala_token', result.data.token);
          localStorage.setItem('mapala_user', JSON.stringify(result.data.user));
          if (result.data.user.role === 'admin') {
            window.location.href = '/admin';
          } else {
            const u = result.data.user;
            const needsActivation = u.must_change_password === true || Number(u.profil_lengkap) === 0;
            if (needsActivation) {
              window.location.href = '/aktivasi-anggota';
            } else {
              window.location.href = '/anggota';
            }
          }
          return;
        } else if (!result.success) {
          alert(result.message || 'Login gagal. Periksa kembali No. Register dan Password.');
        }
      } catch (err) {
        // Fallback for development / static preview
        console.warn('API login offline or unreachable, using client-side routing:', err);
        if (username.toLowerCase().includes('admin')) {
          localStorage.setItem('mapala_user', JSON.stringify({ username, role: 'admin', nama: 'Administrator' }));
          window.location.href = '/admin';
        } else {
          localStorage.setItem('mapala_user', JSON.stringify({ username, role: 'anggota', nama: username, must_change_password: false, profil_lengkap: 1 }));
          window.location.href = '/anggota';
        }
      } finally {
        submitBtn.innerHTML = 'Masuk ke Sistem Keanggotaan →';
        submitBtn.disabled = false;
      }
    });
  }
}

// 8. Scroll Reveal Animation
function initScrollReveal() {
  const elements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-zoom');
  if (!elements.length) return;

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        obs.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -30px 0px'
  });

  elements.forEach(el => observer.observe(el));
}

// 9. Number Counter Running Animation
function initCounterAnimation() {
  const counters = document.querySelectorAll('.counter-number');
  if (!counters.length) return;

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.getAttribute('data-target'), 10);
        const prefix = el.getAttribute('data-prefix') || '';
        const suffix = el.getAttribute('data-suffix') || '';
        const duration = 1600; // ms
        const startTime = performance.now();

        function updateCounter(currentTime) {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);
          // Ease-out quart for ultra smooth slowing down
          const easeProgress = 1 - Math.pow(1 - progress, 4);
          const currentVal = Math.floor(easeProgress * target);

          el.textContent = `${prefix}${currentVal}${suffix}`;

          if (progress < 1) {
            requestAnimationFrame(updateCounter);
          } else {
            el.textContent = `${prefix}${target}${suffix}`;
          }
        }

        requestAnimationFrame(updateCounter);
        obs.unobserve(el);
      }
    });
  }, {
    threshold: 0.2
  });

  counters.forEach(c => observer.observe(c));
}

// 10. History Auto-Slideshow (Every 3 seconds)
function initHistorySlider() {
  const slider = document.getElementById('historySlider');
  if (!slider) return;

  const slides = slider.querySelectorAll('.history-slide');
  const dots = slider.querySelectorAll('.history-dot');
  if (!slides.length) return;

  let currentIdx = 0;
  let intervalId = null;

  function showSlide(index) {
    slides.forEach((s, i) => {
      s.classList.toggle('active', i === index);
    });
    dots.forEach((d, i) => {
      d.classList.toggle('active', i === index);
    });
    currentIdx = index;
  }

  function nextSlide() {
    const nextIdx = (currentIdx + 1) % slides.length;
    showSlide(nextIdx);
  }

  function startAutoPlay() {
    stopAutoPlay();
    intervalId = setInterval(nextSlide, 3000); // 3 seconds interval
  }

  function stopAutoPlay() {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  // Interactive dot click
  dots.forEach((dot, idx) => {
    dot.addEventListener('click', () => {
      showSlide(idx);
      startAutoPlay();
    });
  });

  // Pause on hover, resume on mouse leave
  slider.addEventListener('mouseenter', stopAutoPlay);
  slider.addEventListener('mouseleave', startAutoPlay);

  // Initial trigger
  startAutoPlay();
}


