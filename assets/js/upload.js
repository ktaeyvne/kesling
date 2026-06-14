// ============================================================
// assets/js/upload.js — Upload Handler
// ============================================================

const ALLOWED_TYPES = ['pdf','docx','doc','pptx','ppt','xlsx','xls','png','jpg','jpeg','zip','rar'];
const MAX_SIZE_MB = 50;

const Uploader = {
  queue: [],
  session: null,

  async init() {
    this.session = await Auth.requireAuth();
    if (!this.session) return;

    this.setupDropzone();
    this.setupForm();
  },

  setupDropzone() {
    const zone = document.getElementById('dropzone');
    const fileInput = document.getElementById('file-input');
    if (!zone) return;

    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      zone.classList.add('dragover');
    });
    zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('dragover');
      this.addFiles([...e.dataTransfer.files]);
    });
    fileInput?.addEventListener('change', (e) => {
      this.addFiles([...e.target.files]);
      e.target.value = '';
    });
  },

  addFiles(files) {
    files.forEach(file => {
      const ext = file.name.split('.').pop().toLowerCase();
      if (!ALLOWED_TYPES.includes(ext)) {
        Toast.show(`Format .${ext} tidak didukung`, 'error'); return;
      }
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        Toast.show(`${file.name} melebihi batas ${MAX_SIZE_MB}MB`, 'error'); return;
      }
      this.queue.push({ file, id: Date.now() + Math.random() });
    });
    this.renderQueue();
  },

  renderQueue() {
    const container = document.getElementById('upload-queue');
    if (!container) return;
    if (this.queue.length === 0) {
      container.innerHTML = '';
      return;
    }
    container.innerHTML = this.queue.map(item => `
      <div class="upload-item" id="qi-${item.id}">
        <div class="upload-item-icon">${Format.fileIcon(item.file.name.split('.').pop())}</div>
        <div class="upload-item-info">
          <div class="upload-item-name">${item.file.name}</div>
          <div class="upload-item-size">${Format.fileSize(item.file.size)}</div>
          <div class="upload-progress-bar">
            <div class="upload-progress-fill" id="prog-${item.id}" style="width:0%"></div>
          </div>
        </div>
        <span class="upload-status upload-status-pending" id="status-${item.id}">Menunggu</span>
        <button class="upload-remove-btn" onclick="Uploader.removeFile('${item.id}')">✕</button>
      </div>
    `).join('');

    const submitBtn = document.getElementById('submit-upload');
    if (submitBtn) submitBtn.disabled = false;
  },

  removeFile(id) {
    this.queue = this.queue.filter(i => String(i.id) !== String(id));
    this.renderQueue();
  },

  setupForm() {
    const form = document.getElementById('upload-form');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (this.queue.length === 0) {
        Toast.show('Pilih file terlebih dahulu', 'error'); return;
      }
      await this.processUpload();
    });
  },

  async processUpload() {
    const uid = this.session.user.id;
    const title = document.getElementById('f-title').value.trim();
    const semester = document.getElementById('f-semester').value;
    const course = document.getElementById('f-course').value.trim();
    const category = document.getElementById('f-category').value;
    const year = document.getElementById('f-year').value;
    const dosen = document.getElementById('f-dosen').value.trim();
    const desc = document.getElementById('f-desc').value.trim();
    const tags = document.getElementById('f-tags').value.trim();

    if (!category) { Toast.show('Pilih kategori file', 'error'); return; }

    const btn = document.getElementById('submit-upload');
    btn.disabled = true; btn.textContent = 'Mengupload...';

    let successCount = 0;
    for (const item of this.queue) {
      const statusEl = document.getElementById(`status-${item.id}`);
      const progEl = document.getElementById(`prog-${item.id}`);
      if (statusEl) statusEl.textContent = 'Uploading...';
      if (progEl) progEl.style.width = '30%';

      try {
        const ext = item.file.name.split('.').pop();
        const safeName = `${uid}/${semester || 'umum'}/${Date.now()}-${item.file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

        await StorageHelper.upload(item.file, safeName);
        if (progEl) progEl.style.width = '70%';

        const publicUrl = StorageHelper.getPublicUrl(safeName);

        await window.supabaseClient.from('files').insert({
          user_id: uid,
          title: title || item.file.name,
          description: desc,
          semester: semester ? parseInt(semester) : null,
          course,
          category,
          year: year || new Date().getFullYear().toString(),
          tags,
          dosen,
          file_url: publicUrl,
          file_type: ext.toLowerCase(),
          file_size: item.file.size
        });

        if (progEl) progEl.style.width = '100%';
        if (statusEl) { statusEl.textContent = 'Selesai ✓'; statusEl.className = 'upload-status upload-status-done'; }

        await Activity.log(uid, `Upload file: ${title || item.file.name}`);
        successCount++;
      } catch (err) {
        if (statusEl) { statusEl.textContent = 'Gagal ✗'; statusEl.className = 'upload-status upload-status-error'; }
        Toast.show(`Gagal upload ${item.file.name}: ${err.message}`, 'error');
      }
    }

    if (successCount > 0) {
      Toast.show(`${successCount} file berhasil diupload! 🎉`, 'success');
      this.queue = [];
      setTimeout(() => window.location.href = 'dashboard.html', 1500);
    }
    btn.disabled = false; btn.textContent = 'Upload File';
  }
};

window.Uploader = Uploader;
