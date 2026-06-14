// ============================================================
// supabase/supabase.js — Kesling Archive D3
// ============================================================

const SUPABASE_URL = 'https://ljzrjqsuxfxanoctrekw.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Y_wzCp_k_4uH4QM8BNCkqQ_WixZH548';

function initSupabase() {
  if (typeof window.supabase === 'undefined' || typeof window.supabase.createClient !== 'function') {
    setTimeout(initSupabase, 50);
    return;
  }
  const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  });
  window.supabaseClient = client;
  window.STORAGE_BUCKET = 'kesling-files';
  document.dispatchEvent(new Event('supabase-ready'));
}

initSupabase();
