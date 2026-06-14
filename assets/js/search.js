// ============================================================
// assets/js/search.js — Search Handler
// ============================================================

const Search = {
  debounceTimer: null,
  history: JSON.parse(localStorage.getItem('ka-search-history') || '[]'),

  init() {
    const input = document.getElementById('global-search');
    const dropdown = document.getElementById('search-dropdown');
    if (!input) return;

    input.addEventListener('input', () => {
      clearTimeout(this.debounceTimer);
      const q = input.value.trim();
      if (q.length < 2) { dropdown?.classList.remove('show'); return; }
      this.debounceTimer = setTimeout(() => this.liveSearch(q), 280);
    });

    input.addEventListener('focus', () => {
      if (input.value.trim().length >= 2) dropdown?.classList.add('show');
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.search-bar')) dropdown?.classList.remove('show');
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && input.value.trim()) {
        dropdown?.classList.remove('show');
        this.saveHistory(input.value.trim());
        window.location.href = `search.html?q=${encodeURIComponent(input.value.trim())}`;
      }
    });
  },

  async liveSearch(query) {
    const session = await Auth.getSession();
    if (!session) return;
    const uid = session.user.id;
    const dropdown = document.getElementById('search-dropdown');
    if (!dropdown) return;

    const { data } = await window.supabaseClient
      .from('files')
      .select('id,title,category,semester,file_type,file_url,file_size')
      .eq('user_id', uid)
      .or(`title.ilike.%${query}%,course.ilike.%${query}%,tags.ilike.%${query}%,description.ilike.%${query}%`)
      .limit(6);

    if (!data || data.length === 0) {
      dropdown.innerHTML = `<div style="padding:20px;text-align:center;color:var(--text-faint);font-size:.85rem">Tidak ditemukan untuk "<strong>${query}</strong>"</div>`;
      dropdown.classList.add('show');
      return;
    }

    dropdown.innerHTML = data.map(f => `
      <div class="search-result-item" onclick="FileViewer.open('${f.file_url}','${f.file_type}','${f.title}')">
        <span class="search-result-icon">${Format.fileIcon(f.file_type)}</span>
        <div>
          <div class="search-result-name">${f.title}</div>
          <div class="search-result-meta">${f.category || '—'} ${f.semester ? '· Sem ' + f.semester : ''} · ${Format.fileSize(f.file_size || 0)}</div>
        </div>
      </div>
    `).join('') + `<div style="padding:10px;text-align:center;border-top:1px solid var(--border)"><a href="search.html?q=${encodeURIComponent(query)}" style="font-size:.8rem;color:var(--primary)">Lihat semua hasil →</a></div>`;

    dropdown.classList.add('show');
  },

  saveHistory(q) {
    this.history = [q, ...this.history.filter(h => h !== q)].slice(0, 10);
    localStorage.setItem('ka-search-history', JSON.stringify(this.history));
  },

  async fullSearch(query, filters = {}) {
    const session = await Auth.getSession();
    if (!session) return [];
    const uid = session.user.id;

    let req = window.supabaseClient
      .from('files')
      .select('*')
      .eq('user_id', uid);

    if (query) {
      req = req.or(`title.ilike.%${query}%,course.ilike.%${query}%,tags.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%`);
    }
    if (filters.semester) req = req.eq('semester', filters.semester);
    if (filters.category) req = req.eq('category', filters.category);
    if (filters.year) req = req.eq('year', filters.year);

    req = req.order('created_at', { ascending: false }).limit(50);
    const { data } = await req;
    return data || [];
  }
};

window.Search = Search;
