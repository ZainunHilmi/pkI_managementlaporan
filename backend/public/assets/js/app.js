// ============================================================
// Sparepart Management System - Frontend App Logic (v2 soft)
// - Dynamic API base (dev/prod) + override via localStorage
// - XSS-safe rendering, 401 auto-logout, debounce, skeleton
// ============================================================

(function resolveApiBase() {
  if (window.APP_CONFIG && window.APP_CONFIG.API_BASE) return;
  const override = localStorage.getItem('api_base_override');
  if (override) {
    window.APP_CONFIG = { API_BASE: override };
    return;
  }
  // Same-origin /api bila frontend diserve Laravel (prod Render),
  // fallback ke localhost saat dev Live Server / file://
  const sameOriginApi = `${window.location.origin}/api`;
  const isLocalHost = ['localhost', '127.0.0.1', ''].includes(window.location.hostname);
  const def = isLocalHost ? 'http://localhost:8000/api' : sameOriginApi;
  window.APP_CONFIG = { API_BASE: def };
})();

const API_BASE = (window.APP_CONFIG && window.APP_CONFIG.API_BASE) || 'http://localhost:8000/api';

// ---- API HELPERS ----
function getAuthHeaders(isMultipart = false) {
  const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
  const h = { Accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
  if (!isMultipart) h['Content-Type'] = 'application/json';
  return h;
}

function getToken() {
  return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
}

function getSavedUser() {
  try {
    return JSON.parse(localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser') || 'null');
  } catch { return null; }
}

function persistSession(token, user, remember = true) {
  const store = remember ? localStorage : sessionStorage;
  const other = remember ? sessionStorage : localStorage;
  store.setItem('auth_token', token);
  store.setItem('currentUser', JSON.stringify(user));
  other.removeItem('auth_token');
  other.removeItem('currentUser');
}

function clearSession() {
  ['auth_token', 'currentUser'].forEach((k) => { localStorage.removeItem(k); sessionStorage.removeItem(k); });
  currentUser = null;
}

function redirectToLogin() {
  if (!window.location.pathname.endsWith('login.html')) window.location.href = 'login.html';
}

async function apiRequest(url, options = {}) {
  const isForm = options.body instanceof FormData;
  let res;
  try {
    res = await fetch(`${API_BASE}${url}`, {
      ...options,
      headers: { ...getAuthHeaders(isForm), ...options.headers },
    });
  } catch {
    throw { status: 0, message: 'Tidak dapat terhubung ke server. Pastikan backend berjalan.' };
  }
  const ct = res.headers.get('content-type') || '';
  const data = ct.includes('application/json') ? await res.json().catch(() => ({})) : {};
  if (res.status === 401) {
    clearSession();
    redirectToLogin();
    throw { status: 401, message: 'Sesi berakhir, silakan login kembali.' };
  }
  if (!res.ok) {
    const msg = data.message || data.error || `Terjadi kesalahan (${res.status})`;
    throw { status: res.status, message: msg, errors: data.errors };
  }
  return data;
}

async function checkApiHealth() {
  try {
    await fetch(`${API_BASE}/health`, { headers: { Accept: 'application/json' } });
    return true;
  } catch { return false; }
}

// ---- STATE ----
let currentUser = getSavedUser();
let currentPage = 'dashboard';

// ---- UTILITIES ----
function formatNumber(n) {
  return Number(n || 0).toLocaleString('id-ID');
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').filter(Boolean).map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

// XSS-safe: wajib dipakai untuk semua data dari server sebelum innerHTML
function escapeHtml(v) {
  return String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function debounce(fn, wait = 250) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); };
}

// ---- TOAST ----
function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const icons = {
    success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
    error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
    warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
  };
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', 'status');
  toast.innerHTML = `<span>${icons[type] || icons.info}</span><span>${escapeHtml(message)}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('out');
    setTimeout(() => toast.remove(), 320);
  }, 3200);
}

// ---- SKELETON HELPERS ----
function skeletonCards(containerId, n = 6) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = Array.from({ length: n }).map(() => `
    <div class="skeleton-card" aria-hidden="true">
      <div class="skeleton skeleton-img"></div>
      <div class="skeleton-body">
        <div class="skeleton" style="height:12px;width:40%"></div>
        <div class="skeleton" style="height:18px;width:85%"></div>
        <div class="skeleton" style="height:14px;width:60%"></div>
      </div>
    </div>`).join('');
}

function skeletonTable(tbodyId, cols = 5, rows = 5) {
  const tb = document.getElementById(tbodyId);
  if (!tb) return;
  tb.innerHTML = Array.from({ length: rows }).map(() => `
    <tr>${Array.from({ length: cols }).map(() => '<td><div class="skeleton" style="height:14px"></div></td>').join('')}</tr>`).join('');
}

function skeletonStats(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = Array.from({ length: 4 }).map(() => `
    <div class="stat-card"><div class="skeleton skeleton-avatar"></div>
      <div style="flex:1;display:grid;gap:8px"><div class="skeleton" style="height:12px;width:60%"></div><div class="skeleton" style="height:26px;width:45%"></div></div>
    </div>`).join('');
}

// ---- MODAL SYSTEM (ESC + scroll lock + focus) ----
function openModal(id) {
  const overlay = document.getElementById(id);
  if (!overlay) return;
  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
  const focusable = overlay.querySelector('input, select, textarea, button:not(.modal-close)');
  setTimeout(() => focusable && focusable.focus({ preventScroll: true }), 120);
}

function closeModal(id) {
  const overlay = document.getElementById(id);
  if (overlay) overlay.classList.remove('active');
  syncBodyScroll();
}

function syncBodyScroll() {
  const anyModal = document.querySelector('.modal-overlay.active');
  const anyLightbox = document.getElementById('imageLightbox')?.classList.contains('active');
  document.body.style.overflow = (anyModal || anyLightbox) ? 'hidden' : '';
}

document.addEventListener('click', (e) => {
  if (e.target.classList && e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('active');
    syncBodyScroll();
  }
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    // Lightbox gambar berdiri sendiri: tutup dia dulu, jangan ikut tutup card popup di belakangnya.
    const lb = document.getElementById('imageLightbox');
    if (lb && lb.classList.contains('active')) {
      e.stopPropagation();
      closeImageLightbox();
      return;
    }
    document.querySelectorAll('.modal-overlay.active').forEach((m) => m.classList.remove('active'));
    syncBodyScroll();
    closeSidebar();
  }
});

// ---- IMAGE LIGHTBOX (mandiri, terpisah dari card popup) ----
// Lightbox fullscreen khusus lihat gambar: punya tombol zoom sendiri (+/-/reset),
// geser (drag), scroll-wheel zoom, double-click zoom, download & buka tab baru.
// Sengaja TIDAK memakai .modal-overlay agar tidak menumpuk dengan popup detail/form.
const __lb = { scale: 1, x: 0, y: 0, min: 1, max: 5, dragging: false, sx: 0, sy: 0, ox: 0, oy: 0, pinchD: 0 };

function ensureImageLightbox() {
  // Bersihkan viewer lama (modal putih) bila masih ada di halaman lama.
  document.getElementById('imageViewer')?.remove();
  let overlay = document.getElementById('imageLightbox');
  if (overlay) return overlay;
  overlay = document.createElement('div');
  overlay.className = 'lightbox-overlay';
  overlay.id = 'imageLightbox';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Lihat gambar sparepart');
  overlay.innerHTML = `
    <div class="lightbox-topbar">
      <div class="lightbox-title-wrap">
        <span class="lightbox-title" id="lbTitle">Pratinjau Gambar</span>
        <span class="lightbox-caption" id="lbCaption"></span>
      </div>
      <div class="lightbox-top-actions">
        <span class="lightbox-zoom-pill" id="lbZoomLabel" title="Level zoom">100%</span>
        <button type="button" class="lightbox-btn" onclick="closeImageLightbox()" title="Tutup (Esc)" aria-label="Tutup pratinjau">&times;</button>
      </div>
    </div>
    <div class="lightbox-stage" id="lbStage">
      <div class="lightbox-spinner" id="lbSpinner"></div>
      <img id="lbImg" alt="Foto sparepart" draggable="false">
      <div class="lightbox-hint">Scroll / cubit untuk zoom • Seret untuk geser • Klik 2x untuk perbesar</div>
    </div>
    <div class="lightbox-toolbar" role="toolbar" aria-label="Kontrol gambar">
      <button type="button" class="lightbox-tool" onclick="lightboxZoomOut()" title="Perkecil (-)" aria-label="Perkecil">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
      </button>
      <button type="button" class="lightbox-tool" onclick="lightboxReset()" title="Reset ke 100% (0)" aria-label="Reset zoom">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 3-6.7"/><polyline points="3 4 3 9 8 9"/></svg>
        <span>100%</span>
      </button>
      <button type="button" class="lightbox-tool" onclick="lightboxZoomIn()" title="Perbesar (+)" aria-label="Perbesar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
      </button>
      <span class="lightbox-sep"></span>
      <button type="button" class="lightbox-tool" onclick="lightboxDownload()" title="Unduh gambar" aria-label="Unduh gambar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
      </button>
      <button type="button" class="lightbox-tool" onclick="lightboxOpenNewTab()" title="Buka di tab baru" aria-label="Buka di tab baru">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
      </button>
      <button type="button" class="lightbox-tool lightbox-tool-close" onclick="closeImageLightbox()" title="Tutup (Esc)">Tutup</button>
    </div>`;
  document.body.appendChild(overlay);

  const stage = overlay.querySelector('#lbStage');
  const img = overlay.querySelector('#lbImg');

  // Klik backdrop (area di luar toolbar/topbar/stage-content) untuk tutup.
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay || e.target === stage) closeImageLightbox();
  });
  // Wheel zoom (tanpa ctrl pun bisa, karena ini viewer khusus gambar).
  stage.addEventListener('wheel', (e) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
    lightboxApplyZoom(__lb.scale * factor);
  }, { passive: false });
  // Double-click toggle zoom 1x <-> 2.5x.
  img.addEventListener('dblclick', () => {
    lightboxApplyZoom(__lb.scale > 1.5 ? 1 : 2.5);
  });
  // Drag to pan saat zoom > 1.
  img.addEventListener('pointerdown', (e) => {
    if (__lb.scale <= 1) return;
    __lb.dragging = true;
    __lb.sx = e.clientX; __lb.sy = e.clientY;
    __lb.ox = __lb.x; __lb.oy = __lb.y;
    img.setPointerCapture(e.pointerId);
    stage.classList.add('panning');
  });
  img.addEventListener('pointermove', (e) => {
    if (!__lb.dragging) return;
    __lb.x = __lb.ox + (e.clientX - __lb.sx);
    __lb.y = __lb.oy + (e.clientY - __lb.sy);
    lightboxRender();
  });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach((ev) =>
    img.addEventListener(ev, () => { __lb.dragging = false; stage.classList.remove('panning'); })
  );
  // Pinch zoom dasar untuk layar sentuh.
  stage.addEventListener('touchmove', (e) => {
    if (e.touches.length !== 2) return;
    e.preventDefault();
    const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
    if (__lb.pinchD > 0) lightboxApplyZoom(__lb.scale * (d / __lb.pinchD));
    __lb.pinchD = d;
  }, { passive: false });
  stage.addEventListener('touchend', () => { __lb.pinchD = 0; });
  // Keyboard khusus lightbox: + / - / 0.
  document.addEventListener('keydown', (e) => {
    const lb = document.getElementById('imageLightbox');
    if (!lb || !lb.classList.contains('active')) return;
    if (e.key === '+' || e.key === '=') { lightboxZoomIn(); }
    else if (e.key === '-' || e.key === '_') { lightboxZoomOut(); }
    else if (e.key === '0') { lightboxReset(); }
  });
  return overlay;
}

function lightboxRender() {
  const img = document.getElementById('lbImg');
  const label = document.getElementById('lbZoomLabel');
  if (!img) return;
  // Batasi geseran agar gambar tidak hilang dari layar.
  const bound = 220 * (__lb.scale - 1);
  __lb.x = Math.max(-bound, Math.min(bound, __lb.x));
  __lb.y = Math.max(-bound, Math.min(bound, __lb.y));
  img.style.transform = `translate(${__lb.x}px, ${__lb.y}px) scale(${__lb.scale})`;
  img.style.cursor = __lb.scale > 1 ? (__lb.dragging ? 'grabbing' : 'grab') : 'zoom-in';
  if (label) label.textContent = `${Math.round(__lb.scale * 100)}%`;
}

function lightboxApplyZoom(next) {
  __lb.scale = Math.max(__lb.min, Math.min(__lb.max, next));
  if (__lb.scale === 1) { __lb.x = 0; __lb.y = 0; }
  lightboxRender();
}
function lightboxZoomIn() { lightboxApplyZoom(__lb.scale * 1.3); }
function lightboxZoomOut() { lightboxApplyZoom(__lb.scale / 1.3); }
function lightboxReset() { __lb.scale = 1; __lb.x = 0; __lb.y = 0; lightboxRender(); }

function lightboxDownload() {
  const img = document.getElementById('lbImg');
  if (!img?.src) return;
  const a = document.createElement('a');
  a.href = img.src;
  a.download = (document.getElementById('lbTitle')?.textContent || 'sparepart').replace(/[^\w\- ]+/g, '').trim() || 'sparepart';
  document.body.appendChild(a);
  a.click();
  a.remove();
}
function lightboxOpenNewTab() {
  const src = document.getElementById('lbImg')?.src;
  if (src) window.open(src, '_blank', 'noopener');
}

function openImageLightbox(src, title = '', caption = '') {
  if (!src) { showToast('Sparepart ini belum memiliki foto', 'warning'); return; }
  const overlay = ensureImageLightbox();
  const img = overlay.querySelector('#lbImg');
  const spinner = overlay.querySelector('#lbSpinner');
  overlay.querySelector('#lbTitle').textContent = title || 'Pratinjau Gambar';
  overlay.querySelector('#lbCaption').textContent = caption || '';
  lightboxReset();
  spinner.style.display = 'block';
  img.style.opacity = '0';
  img.alt = title || 'Foto sparepart';
  img.onerror = () => { spinner.style.display = 'none'; showToast('Gagal memuat gambar', 'error'); closeImageLightbox(); };
  img.onload = () => { spinner.style.display = 'none'; img.style.opacity = '1'; };
  img.src = src;
  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeImageLightbox() {
  document.getElementById('imageLightbox')?.classList.remove('active');
  syncBodyScroll();
}

// Nama lama tetap didukung (dipakai catalog + kelola): arahkan ke lightbox baru.
function openImageViewer(src, title = '', caption = '') {
  openImageLightbox(src, title, caption);
}
function ensureImageViewer() {
  return ensureImageLightbox();
}

// ---- SIDEBAR (MOBILE) ----
function toggleSidebar() {
  document.querySelector('.sidebar')?.classList.toggle('open');
  document.querySelector('.sidebar-overlay')?.classList.toggle('active');
}
function closeSidebar() {
  document.querySelector('.sidebar')?.classList.remove('open');
  document.querySelector('.sidebar-overlay')?.classList.remove('active');
}
document.addEventListener('click', (e) => {
  const link = e.target.closest && e.target.closest('.sidebar-link');
  if (link && window.innerWidth <= 1024) closeSidebar();
});

// ---- DROPDOWN ----
function toggleDropdown(id) {
  document.querySelectorAll('.dropdown-menu').forEach((m) => { if (m.id !== id) m.classList.remove('active'); });
  document.getElementById(id)?.classList.toggle('active');
}
document.addEventListener('click', (e) => {
  if (!e.target.closest('.dropdown')) {
    document.querySelectorAll('.dropdown-menu').forEach((m) => m.classList.remove('active'));
  }
});

// ---- SEARCH FILTER (client fallback; server search diutamakan) ----
function filterTable(inputId, tableId) {
  const query = (document.getElementById(inputId)?.value || '').toLowerCase();
  document.querySelectorAll(`#${tableId} tbody tr`).forEach((row) => {
    row.style.display = row.textContent.toLowerCase().includes(query) ? '' : 'none';
  });
  updateResultCount(tableId);
}
function filterCards(searchInputId, cardClass) {
  const query = (document.getElementById(searchInputId)?.value || '').toLowerCase();
  let visible = 0;
  document.querySelectorAll(`.${cardClass}`).forEach((card) => {
    const show = card.textContent.toLowerCase().includes(query);
    card.style.display = show ? '' : 'none';
    if (show) visible++;
  });
  const rc = document.getElementById('result-count');
  if (rc) rc.textContent = `${visible} part ditampilkan`;
}
const debouncedFilterTable = debounce(filterTable, 200);
const debouncedFilterCards = debounce(filterCards, 200);

function updateResultCount(tableId) {
  const rows = [...document.querySelectorAll(`#${tableId} tbody tr`)].filter((r) => r.style.display !== 'none');
  const badge = document.querySelector('.card-header .badge');
  if (badge && rows.length) {
    const label = badge.id === 'tx-count' ? 'transaksi' : badge.id === 'sp-count' ? 'item' : 'data';
    if (!badge.dataset.locked) badge.textContent = `${rows.length} ${label}`;
  }
}

// ---- API CRUD ----
async function fetchSpareparts(params = {}) {
  const q = new URLSearchParams(params).toString();
  return await apiRequest(`/spareparts${q ? `?${q}` : ''}`);
}
async function createSparepart(data) {
  const isForm = data instanceof FormData;
  return await apiRequest('/spareparts', { method: 'POST', body: isForm ? data : JSON.stringify(data) });
}
async function updateSparepart(partId, data) {
  // Laravel: spoof PUT bila multipart
  if (data instanceof FormData) {
    data.append('_method', 'PUT');
    return await apiRequest(`/spareparts/${partId}`, { method: 'POST', body: data });
  }
  return await apiRequest(`/spareparts/${partId}`, { method: 'PUT', body: JSON.stringify(data) });
}
async function deleteSparepart(partId) {
  return await apiRequest(`/spareparts/${partId}`, { method: 'DELETE' });
}
async function fetchUsers() { return await apiRequest('/users'); }
async function createUser(data) {
  return await apiRequest('/users', { method: 'POST', body: JSON.stringify(data) });
}
async function updateUser(userId, data) {
  return await apiRequest(`/users/${userId}`, { method: 'PUT', body: JSON.stringify(data) });
}
async function deleteUser(userId) {
  return await apiRequest(`/users/${userId}`, { method: 'DELETE' });
}
async function fetchTransactions(type = null) {
  const params = type && type !== 'all' ? `?type=${type}` : '';
  return await apiRequest(`/transactions${params}`);
}
async function createTransaction(data) {
  return await apiRequest('/transactions', { method: 'POST', body: JSON.stringify(data) });
}
async function takePart(data) {
  return await apiRequest('/transactions/take', { method: 'POST', body: JSON.stringify(data) });
}
async function fetchDashboardStats() { return await apiRequest('/dashboard/stats'); }
async function fetchStockChartData() { return await apiRequest('/dashboard/chart/stock'); }
async function fetchTransactionChartData() { return await apiRequest('/dashboard/chart/transactions'); }

// ---- AUTH ----
async function apiLogin(email, password) {
  const data = await apiRequest('/login', { method: 'POST', body: JSON.stringify({ email, password }) });
  const remember = document.getElementById('rememberMe')?.checked !== false;
  persistSession(data.token, data.user, remember);
  currentUser = data.user;
  return data;
}
async function apiLogout() {
  try { await apiRequest('/logout', { method: 'POST' }); } catch { /* abaikan */ }
  clearSession();
}

// ---- SHARED AUTH GUARD ----
function requireAuth(roles = []) {
  const user = getSavedUser();
  const token = getToken();
  if (!user || !token) { redirectToLogin(); return null; }
  if (roles.length && !roles.includes(user.role)) {
    window.location.href = user.role === 'admin' ? 'dashboard.html' : 'catalog.html';
    return null;
  }
  currentUser = user;
  return user;
}
function paintUserChip(nameEl = 'sidebar-name', avatarEl = 'sidebar-avatar', roleEl = 'sidebar-role') {
  if (!currentUser) return;
  const n = document.getElementById(nameEl);
  const a = document.getElementById(avatarEl);
  const r = document.getElementById(roleEl);
  if (n) n.textContent = currentUser.name;
  if (a) a.textContent = getInitials(currentUser.name);
  if (r) r.textContent = currentUser.role === 'admin' ? 'Administrator' : 'Mekanik';
}

// ---- CHARTS (soft defaults + no-leak) ----
let stockChartInstance = null;
let trendChartInstance = null;
function applyChartDefaults() {
  if (!window.Chart) return;
  Chart.defaults.font.family = 'Inter, sans-serif';
  Chart.defaults.color = '#7D7461';
  Chart.defaults.borderColor = '#EFE9DA';
}

// Gagal load chart jangan diam-diam kosong: tampilkan pesan di kotaknya.
function chartError(canvasId, message) {
  const canvas = document.getElementById(canvasId);
  const box = canvas?.closest('.chart-container');
  const msg = (message && message.message) || message || 'Coba muat ulang halaman';
  if (box) {
    box.innerHTML = `<div class="chart-skeleton">⚠️ Gagal memuat grafik (${escapeHtml(String(msg)).slice(0, 80)})</div>`;
  } else {
    console.error(canvasId, msg);
  }
}

async function initDashboardCharts() {
  if (!window.Chart) return;
  applyChartDefaults();
  const stockCtx = document.getElementById('stockChart');
  if (stockCtx) {
    try {
      const parts = await fetchStockChartData();
      if (stockChartInstance) stockChartInstance.destroy();
      const colors = ['#D97757', '#4E8A5F', '#DFA83E', '#C65B45', '#9B8BD4', '#D98AA0', '#7FA8C9', '#8A9A4B', '#E8A173', '#7FBFA3'];
      stockChartInstance = new Chart(stockCtx, {
        type: 'doughnut',
        data: {
          labels: parts.map((p) => p.name),
          datasets: [{ data: parts.map((p) => p.current_stock), backgroundColor: colors.slice(0, Math.max(parts.length, 1)), borderWidth: 3, borderColor: '#fff', hoverOffset: 8 }],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true, pointStyleWidth: 9, font: { size: 12 } } } },
          cutout: '68%',
        },
      });
    } catch (e) { chartError('stockChart', e); }
  }
  const trendCtx = document.getElementById('trendChart');
  if (trendCtx) {
    try {
      const chartData = await fetchTransactionChartData();
      if (trendChartInstance) trendChartInstance.destroy();
      trendChartInstance = new Chart(trendCtx, {
        type: 'bar',
        data: {
          labels: chartData.labels,
          datasets: [
            { label: 'Masuk', data: chartData.in, backgroundColor: '#4E8A5F', borderRadius: 7, barPercentage: 0.55, categoryPercentage: 0.6 },
            { label: 'Keluar', data: chartData.out, backgroundColor: '#C65B45', borderRadius: 7, barPercentage: 0.55, categoryPercentage: 0.6 },
          ],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { position: 'top', align: 'end', labels: { usePointStyle: true, pointStyleWidth: 9, font: { size: 12 } } } },
          scales: {
            x: { grid: { display: false } },
            y: { beginAtZero: true, grid: { color: '#EFE9DA' }, ticks: { precision: 0 } },
          },
        },
      });
    } catch (e) { chartError('trendChart', e); }
  }
}

// ---- DASHBOARD STATS ----
async function renderDashboardStats() {
  const statsEl = document.getElementById('dashboard-stats');
  if (!statsEl) return;
  skeletonStats('dashboard-stats');
  try {
    const stats = await fetchDashboardStats();
    statsEl.innerHTML = `
      <div class="stat-card stat-primary"><div class="stat-icon icon-primary">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg></div>
        <div class="stat-info"><div class="stat-label">Total Jenis Part</div><div class="stat-value">${formatNumber(stats.total_parts)}</div></div></div>
      <div class="stat-card stat-success"><div class="stat-icon icon-success">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg></div>
        <div class="stat-info"><div class="stat-label">Total Stok</div><div class="stat-value">${formatNumber(stats.total_stock)}</div></div></div>
      <div class="stat-card stat-warning"><div class="stat-icon icon-warning">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div>
        <div class="stat-info"><div class="stat-label">Stok Menipis</div><div class="stat-value">${formatNumber(stats.low_stock)}</div>
        <div class="stat-change ${stats.low_stock > 0 ? 'down' : 'up'}">${stats.low_stock > 0 ? 'Perlu restok' : 'Semua aman'}</div></div></div>
      <div class="stat-card stat-danger"><div class="stat-icon icon-danger">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></div>
        <div class="stat-info"><div class="stat-label">Transaksi Hari Ini</div><div class="stat-value">${formatNumber(stats.today_transactions)}</div></div></div>`;
  } catch (e) {
    statsEl.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-ill">⚠️</div><h3>Gagal memuat statistik</h3><p>${escapeHtml(e.message || '')}</p></div>`;
  }
}

// ---- RECENT TRANSACTIONS ----
async function renderRecentTransactions(limit = 5) {
  const container = document.getElementById('recent-tx');
  if (!container) return;
  container.innerHTML = Array.from({ length: 3 }).map(() => '<div class="skeleton-row"><div class="skeleton skeleton-avatar"></div><div style="flex:1;display:grid;gap:6px"><div class="skeleton" style="height:13px;width:70%"></div><div class="skeleton" style="height:11px;width:45%"></div></div></div>').join('');
  try {
    const transactions = await fetchTransactions();
    const recent = transactions.slice(0, limit);
    if (!recent.length) {
      container.innerHTML = '<div class="empty-state"><div class="empty-ill">🧾</div><h3>Belum ada transaksi</h3><p>Aktivitas masuk & keluar akan muncul di sini.</p></div>';
      return;
    }
    container.innerHTML = recent.map((tx) => `
      <div class="tx-row">
        <div class="tx-icon ${tx.type === 'in' ? 'tx-in' : 'tx-out'}">
          ${tx.type === 'in'
            ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12l7-7 7 7"/></svg>'
            : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19V5M5 12l7 7 7-7"/></svg>'}
        </div>
        <div class="tx-details">
          <div class="tx-title">${escapeHtml(tx.sparepart ? tx.sparepart.name : tx.part_id)}</div>
          <div class="tx-sub">${escapeHtml(tx.user ? tx.user.name : 'Unknown')} &middot; ${escapeHtml(tx.notes || '')}</div>
        </div>
        <div class="tx-amount">
          <div class="tx-qty ${tx.type}">${tx.type === 'in' ? '+' : '−'}${formatNumber(tx.quantity)}</div>
          <div class="tx-time">${escapeHtml(formatDate(tx.created_at))}</div>
        </div>
      </div>`).join('');
  } catch (e) {
    container.innerHTML = `<div class="empty-state"><h3>Gagal memuat</h3><p>${escapeHtml(e.message || '')}</p></div>`;
  }
}
