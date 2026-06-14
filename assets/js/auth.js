// ============================================================
// assets/js/auth.js — Authentication Handler
// ============================================================

const Auth = {
  // Cek session aktif
  async getSession() {
    const { data: { session }, error } = await window.supabaseClient.auth.getSession();
    return session;
  },

  // Login dengan email & password
  async login(email, password) {
    const { data, error } = await window.supabaseClient.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  // Register akun baru
  async register(email, password, profile) {
    const { data, error } = await window.supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: profile.name,
          nim: profile.nim,
          angkatan: profile.angkatan,
          program_studi: profile.program_studi || 'D3 Kesehatan Lingkungan'
        }
      }
    });
    if (error) throw error;

    // Insert ke tabel users
    if (data.user) {
      const { error: dbErr } = await window.supabaseClient.from('users').insert({
        id: data.user.id,
        name: profile.name,
        email: email,
        nim: profile.nim,
        angkatan: profile.angkatan,
        program_studi: profile.program_studi || 'D3 Kesehatan Lingkungan'
      });
      if (dbErr) console.warn('User profile insert error:', dbErr.message);
    }
    return data;
  },

  // Logout
  async logout() {
    const { error } = await window.supabaseClient.auth.signOut();
    if (error) throw error;
    window.location.href = 'https://ktaeyvne.github.io/kesling/login.html';
  },

  // Forgot password
  async forgotPassword(email) {
    const { error } = await window.supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/settings.html`
    });
    if (error) throw error;
  },

  // Update password
  async updatePassword(newPassword) {
    const { error } = await window.supabaseClient.auth.updateUser({ password: newPassword });
    if (error) throw error;
  },

  // Require auth — redirect ke login jika tidak login
  async requireAuth() {
    const session = await this.getSession();
    if (!session) {
      window.location.href = 'https://ktaeyvne.github.io/kesling//login.html';
      return null;
    }
    return session;
  },

  // Get user profile dari tabel users
  async getProfile(userId) {
    const { data, error } = await window.supabaseClient
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) throw error;
    return data;
  },

  // Update profile
  async updateProfile(userId, updates) {
    const { data, error } = await window.supabaseClient
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};

window.Auth = Auth;
