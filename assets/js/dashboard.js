// ============================================================
// assets/js/dashboard.js — Dashboard Logic
// ============================================================

const Dashboard = {
  user: null,
  session: null,

  async init() {
    this.session = await Auth.requireAuth();
    if (!this.session) return;

    try {
      this.user = await Auth.getProfile(this.session.user.id);
    } catch {
      this.user = { name: this.session.user.email, nim: '-', angkatan: '-' };
    }

    this.renderUserInfo();
    await Promise.all([
      this.loadStats(),
      this.loadRecentFiles(),
      this.loadActivities(),
      this.loadStorageInfo()
    ]);
  },

  renderUserInfo() {
    const name = this.user?.name || 'Mahasiswa';
    const nim = this.user?.nim || '-';
    const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

    document.querySelectorAll('[data-user-name]').forEach(el => el.textContent = name);
    document.querySelectorAll('[data-user-nim]').forEach(el => el.textContent = nim);
    document.querySelectorAll('[data-user-initials]').forEach(el => {
      if (this.user?.avatar) {
        el.innerHTML = `<img src="${this.user.avatar}" class="avatar" style="width:100%;height:100%" />`;
      } else {
        el.textContent = initials;
      }
    });
  },

  async loadStats() {
    const uid = this.session.user.id;
    const { count: totalFiles } = await window.supabaseClient
      .from('files').select('*', { count: 'exact', head: true }).eq('user_id', uid);
    const { count: totalFavs } = await window.supabaseClient
      .from('favorites').select('*', { count: 'exact', head: true }).eq('user_id', uid);

    // Count by category
    const { data: catData } = await window.supabaseClient
      .from('files').select('category').eq('user_id', uid);

    const counts = {};
    (catData || []).forEach(r => { counts[r.category] = (counts[r.category] || 0) + 1; });

    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) { el.textContent = val ?? 0; el.closest('.stat-card')?.classList.add('fade-in'); }
    };

    setVal('stat-total', totalFiles);
    setVal('stat-fav', totalFavs);
    setVal('stat-makalah', counts['Makalah'] || 0);
    setVal('stat-laprak', counts['Laporan Praktikum'] || 0);
    setVal('stat-ppt', counts['Presentasi'] || 0);
    setVal('stat-pkl', counts['PKL'] || 0);
    setVal('stat-ta', counts['Tugas Akhir'] || 0);
    setVal('stat-sertifikat', counts['Sertifikat'] || 0);
  },

  async loadRecentFiles() {
    const uid = this.session.user.id;
    const { data } = await window.supabaseClient
      .from('files')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
      .limit(8);

    const grid = document.getElementById('recent-files-grid');
    if (!grid) return;

    if (!data || data.length === 0) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">📂</div><h3>Belum ada file</h3><p>Upload file pertamamu sekarang</p><a href="upload.html" class="btn btn-primary" style="margin-top:12px">Upload File</a></div>`;
      return;
    }

    grid.innerHTML = data.map(f => FileCard.render(f)).join('');
    // Attach events
    grid.querySelectorAll('.file-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (!e.target.closest('.file-card-actions')) {
          FileViewer.open(card.dataset.fileUrl, card.dataset.fileType, card.dataset.fileTitle);
        }
      });
    });
    grid.querySelectorAll('[data-action="download"]').forEach(btn => {
      btn.addEventListener('click', () => FileActions.download(btn.dataset.url, btn.dataset.name));
    });
    grid.querySelectorAll('[data-action="fav"]').forEach(btn => {
      btn.addEventListener('click', () => FileActions.toggleFav(btn.dataset.id, btn));
    });
    grid.querySelectorAll('[data-action="delete"]').forEach(btn => {
      btn.addEventListener('click', () => FileActions.confirmDelete(btn.dataset.id, btn.dataset.path));
    });
  },

  async loadActivities() {
    const uid = this.session.user.id;
    const { data } = await window.supabaseClient
      .from('activities')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
      .limit(8);

    const list = document.getElementById('activity-list');
    if (!list) return;

    if (!data || data.length === 0) {
      list.innerHTML = `<p style="color:var(--text-faint);font-size:.85rem;text-align:center;padding:20px">Belum ada aktivitas</p>`;
      return;
    }

    list.innerHTML = data.map(a => `
      <div class="activity-item">
        <div class="activity-dot"></div>
        <div>
          <div class="activity-text">${a.activity}</div>
          <div class="activity-time">${Format.relativeTime(a.created_at)}</div>
        </div>
      </div>
    `).join('');
  },

  async loadStorageInfo() {
    const uid = this.session.user.id;
    const { data } = await window.supabaseClient
      .from('files').select('file_size').eq('user_id', uid);

    const total = (data || []).reduce((s, r) => s + (r.file_size || 0), 0);
    const maxBytes = 1024 * 1024 * 1024; // 1 GB display cap
    const pct = Math.min((total / maxBytes) * 100, 100).toFixed(1);

    const fill = document.getElementById('storage-fill');
    const label = document.getElementById('storage-used');
    if (fill) fill.style.width = pct + '%';
    if (label) label.textContent = Format.fileSize(total);
  }
};

// ── File Card Renderer ──────────────────────────────────────
const FileCard = {
  render(f) {
    const ext = (f.file_url || '').split('.').pop();
    const icon = Format.fileIcon(f.file_type || ext);
    return `
      <div class="file-card card-hover"
           data-file-url="${f.file_url}"
           data-file-type="${f.file_type || ext}"
           data-file-title="${f.title}">
        <div class="file-card-icon">${icon}</div>
        <div class="file-card-title">${f.title}</div>
        <div class="file-card-meta">
          ${f.semester ? `Sem ${f.semester} · ` : ''}${f.category || ''} · ${Format.fileSize(f.file_size || 0)}
        </div>
        <div class="file-card-footer">
          <span class="text-xs text-muted">${Format.relativeTime(f.created_at)}</span>
          <div class="file-card-actions">
            <button class="file-action-btn fav" data-action="fav" data-id="${f.id}" title="Favorit">⭐</button>
            <button class="file-action-btn" data-action="download" data-url="${f.file_url}" data-name="${f.title}" title="Unduh">⬇️</button>
            <button class="file-action-btn" data-action="delete" data-id="${f.id}" data-path="${f.file_url}" title="Hapus">🗑️</button>
          </div>
        </div>
      </div>`;
  }
};

// ── File Actions ──────────────────────────────────────────
const FileActions = {
  download(url, name) {
    const a = document.createElement('a');
    a.href = url; a.download = name; a.target = '_blank';
    a.click();
  },
  async toggleFav(fileId, btn) {
    const session = await Auth.getSession();
    const uid = session.user.id;
    const { data: existing } = await window.supabaseClient
      .from('favorites').select('id').eq('user_id', uid).eq('file_id', fileId).single();
    if (existing) {
      await window.supabaseClient.from('favorites').delete().eq('id', existing.id);
      btn.style.opacity = '0.4';
      Toast.show('Dihapus dari favorit', 'info');
    } else {
      await window.supabaseClient.from('favorites').insert({ user_id: uid, file_id: fileId });
      btn.style.opacity = '1';
      Toast.show('Ditambahkan ke favorit ⭐', 'success');
    }
  },
  async confirmDelete(fileId, filePath) {
    if (!confirm('Hapus file ini? Tindakan tidak bisa dibatalkan.')) return;
    Loader.show('Menghapus file...');
    try {
      // Extract storage path from URL
      const pathMatch = filePath.split('/kesling-files/')[1];
      if (pathMatch) await StorageHelper.remove(pathMatch);
      await window.supabaseClient.from('files').delete().eq('id', fileId);
      Toast.show('File berhasil dihapus', 'success');
      setTimeout(() => location.reload(), 800);
    } catch (err) {
      Toast.show('Gagal menghapus: ' + err.message, 'error');
    } finally {
      Loader.hide();
    }
  }
};

// ── File Viewer ──────────────────────────────────────────
const FileViewer = {
  open(url, type, title) {
    const modal = document.getElementById('viewer-modal');
    const titleEl = document.getElementById('viewer-title');
    const body = document.getElementById('viewer-body');
    if (!modal) return window.open(url, '_blank');

    titleEl.textContent = title || 'Preview File';
    const t = (type || '').toLowerCase();

    if (['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(t)) {
      body.innerHTML = `<img src="${url}" class="file-viewer-img" />`;
    } else if (t === 'pdf') {
      body.innerHTML = `<iframe src="${url}" class="file-viewer-frame"></iframe>`;
    } else {
      body.innerHTML = `<div style="text-align:center;padding:40px">
        <div style="font-size:4rem">📄</div>
        <p style="margin:12px 0">Preview tidak tersedia untuk tipe file ini.</p>
        <a href="${url}" target="_blank" class="btn btn-primary">Buka File</a>
      </div>`;
    }
    modal.classList.add('active');
  },
  close() {
    const modal = document.getElementById('viewer-modal');
    if (modal) { modal.classList.remove('active'); document.getElementById('viewer-body').innerHTML = ''; }
  }
};

window.Dashboard = Dashboard;
window.FileCard = FileCard;
window.FileActions = FileActions;
window.FileViewer = FileViewer;
