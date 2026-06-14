-- ============================================================
-- Kesling Archive D3 — Supabase SQL Schema
-- Jalankan di: Supabase Dashboard → SQL Editor
-- ============================================================

-- ── USERS TABLE ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.users (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  email        TEXT NOT NULL,
  nim          TEXT,
  angkatan     TEXT,
  program_studi TEXT DEFAULT 'D3 Kesehatan Lingkungan',
  avatar       TEXT,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- ── FILES TABLE ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.files (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  description  TEXT,
  semester     SMALLINT CHECK (semester BETWEEN 1 AND 6),
  course       TEXT,
  category     TEXT,
  year         TEXT,
  dosen        TEXT,
  tags         TEXT,
  file_url     TEXT NOT NULL,
  file_type    TEXT,
  file_size    BIGINT DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- ── FAVORITES TABLE ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.favorites (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  file_id      UUID NOT NULL REFERENCES public.files(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, file_id)
);

-- ── ACTIVITIES TABLE ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.activities (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  activity     TEXT NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- ── INDEXES ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_files_user_id    ON public.files(user_id);
CREATE INDEX IF NOT EXISTS idx_files_semester   ON public.files(semester);
CREATE INDEX IF NOT EXISTS idx_files_category   ON public.files(category);
CREATE INDEX IF NOT EXISTS idx_files_created    ON public.files(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_favorites_user   ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_user  ON public.activities(user_id);

-- ── ROW LEVEL SECURITY (RLS) ─────────────────────────────────
ALTER TABLE public.users       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities  ENABLE ROW LEVEL SECURITY;

-- Users: hanya bisa akses data sendiri
CREATE POLICY "users_self" ON public.users
  FOR ALL USING (auth.uid() = id);

-- Files: hanya bisa akses file sendiri
CREATE POLICY "files_owner" ON public.files
  FOR ALL USING (auth.uid() = user_id);

-- Favorites: hanya bisa akses favorit sendiri
CREATE POLICY "favorites_owner" ON public.favorites
  FOR ALL USING (auth.uid() = user_id);

-- Activities: hanya bisa akses aktivitas sendiri
CREATE POLICY "activities_owner" ON public.activities
  FOR ALL USING (auth.uid() = user_id);

-- ── STORAGE BUCKET ───────────────────────────────────────────
-- Buat bucket di: Supabase → Storage → New bucket
-- Name: kesling-files
-- Public: true (atau false jika ingin private dengan signed URLs)

-- Storage policy (jalankan di SQL Editor):
INSERT INTO storage.buckets (id, name, public)
VALUES ('kesling-files', 'kesling-files', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "storage_owner_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'kesling-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "storage_owner_select" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'kesling-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "storage_owner_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'kesling-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- ── TRIGGER: Auto-create user profile on signup ──────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, name, email, nim, angkatan, program_studi)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    NEW.raw_user_meta_data->>'nim',
    NEW.raw_user_meta_data->>'angkatan',
    COALESCE(NEW.raw_user_meta_data->>'program_studi', 'D3 Kesehatan Lingkungan')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
