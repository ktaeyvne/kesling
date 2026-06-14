// ============================================================
// assets/js/app.js — Core Utilities
// ============================================================

// ── Theme Manager ──────────────────────────────────────────
const Theme = {
  init() {
    const saved = localStorage.getItem('ka-theme') || 'light';
    this.apply(saved);
  },
  apply(mode) {
    document.documentElement.setAttribute('data-theme', mode);
    localStorage.setItem('ka-theme', mode);
    const icon = document.getElementById('theme-icon');
    if (icon) icon.textContent = mode === 'dark' ? '☀️' : '🌙';
  },
  toggle() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    this.apply(current === 'dark' ? 'light' : 'dark');
  }
};

// ── Toast Notification ──────────────────────────────────────
const Toast = {
  show(message, type = 'info', duration = 3500) {
    const container = document.getElementById('toast-container') || this._createContainer();
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
    toast.innerHTML = `<span class="toast-icon">${icons[type] || 'ℹ️'}</span><span class="toast-msg">${message}</span>`;
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('toast-show'));
    setTimeout(() => {
      toast.classList.remove('toast-show');
      setTimeout(() => toast.remove(), 400);
    }, duration);
  },
  _createContainer() {
    const c = document.createElement('div');
    c.id = 'toast-container';
    document.body.appendChild(c);
    return c;
  }
};

// ── Loading Overlay ─────────────────────────────────────────
const Loader = {
  show(text = 'Memuat...') {
    let el = document.getElementById('global-loader');
    if (!el) {
      el = document.createElement('div');
      el.id = 'global-loader';
      el.innerHTML = `<div class="loader-inner"><div class="loader-spinner"></div><p>${text}</p></div>`;
      document.body.appendChild(el);
    }
    el.style.display = 'flex';
  },
  hide() {
    const el = document.getElementById('global-loader');
    if (el) el.style.display = 'none';
  }
};

// ── Format Helpers ──────────────────────────────────────────
const Format = {
  fileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  },
  date(isoStr) {
    if (!isoStr) return '-';
    return new Date(isoStr).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  },
  relativeTime(isoStr) {
    const diff = Date.now() - new Date(isoStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'Baru saja';
    if (m < 60) return `${m} menit lalu`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} jam lalu`;
    const d = Math.floor(h / 24);
    return `${d} hari lalu`;
  },
  fileIcon(type) {
    const map = {
      'pdf': '📄', 'docx': '📝', 'doc': '📝',
      'pptx': '📊', 'ppt': '📊',
      'xlsx': '📋', 'xls': '📋',
      'png': '🖼️', 'jpg': '🖼️', 'jpeg': '🖼️',
      'zip': '📦', 'rar': '📦'
    };
    return map[type?.toLowerCase()] || '📁';
  }
};

// ── Storage Helper (Supabase) ───────────────────────────────
const StorageHelper = {
  async upload(file, path) {
    const { data, error } = await window.supabaseClient.storage
      .from(window.STORAGE_BUCKET)
      .upload(path, file, { upsert: false });
    if (error) throw error;
    return data;
  },
  getPublicUrl(path) {
    const { data } = window.supabaseClient.storage
      .from(window.STORAGE_BUCKET)
      .getPublicUrl(path);
    return data.publicUrl;
  },
  async remove(path) {
    const { error } = await window.supabaseClient.storage
      .from(window.STORAGE_BUCKET)
      .remove([path]);
    if (error) throw error;
  },
  async download(path) {
    const { data, error } = await window.supabaseClient.storage
      .from(window.STORAGE_BUCKET)
      .download(path);
    if (error) throw error;
    return data;
  }
};

// ── Activity Logger ─────────────────────────────────────────
const Activity = {
  async log(userId, activity) {
    await window.supabaseClient.from('activities').insert({ user_id: userId, activity });
  }
};

// ── Export semua util ───────────────────────────────────────
window.Theme = Theme;
window.Toast = Toast;
window.Loader = Loader;
window.Format = Format;
window.StorageHelper = StorageHelper;
window.Activity = Activity;

// Init theme on load
document.addEventListener('DOMContentLoaded', () => Theme.init());
