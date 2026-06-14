# 🌿 Kesling Archive D3

**Arsip Digital Mahasiswa D3 Kesehatan Lingkungan Poltekkes**

Platform arsip digital pribadi untuk menyimpan seluruh dokumen kuliah dari Semester 1–6, lengkap dengan PWA agar bisa diinstall seperti aplikasi Android.

---

## ✨ Fitur Utama

- 🔐 **Autentikasi** — Login, Register, Forgot Password via Supabase Auth
- 📁 **Manajemen File** — Upload, Download, Delete, Favorit, Preview
- 📂 **Kategori Lengkap** — Makalah, Laporan Praktikum, PKL, Tugas Akhir, Sertifikat, dll.
- 🔬 **Khusus Kesling** — Kategori Praktikum Mikrobiologi, Air Bersih, Air Limbah, Sanitasi, dll.
- 🔍 **Smart Search** — Realtime search + filter Semester, Kategori, Tahun
- 📱 **PWA** — Install di Android seperti aplikasi native
- 🌙 **Dark Mode** — Tema gelap yang tersimpan otomatis
- 📊 **Dashboard** — Statistik file, aktivitas terbaru, storage usage

---

## 🚀 Cara Setup & Menjalankan

### 1. Clone / Download Project

```bash
git clone https://github.com/username/kesling-archive-d3.git
cd kesling-archive-d3
```

Atau ekstrak ZIP yang sudah didownload.

### 2. Setup Supabase

#### a. Buka SQL Editor di Supabase Dashboard
Pergi ke: **https://supabase.com/dashboard → Project → SQL Editor**

#### b. Jalankan Schema
Copy isi file `supabase/schema.sql` lalu paste dan jalankan di SQL Editor.

#### c. Buat Storage Bucket
Pergi ke **Storage → New Bucket**:
- Name: `kesling-files`
- Public: ✅ (centang public)

> Storage policy sudah ada di `schema.sql`, tinggal jalankan.

### 3. Konfigurasi Sudah Otomatis

File `supabase/supabase.js` sudah berisi kredensial project:

```js
const SUPABASE_URL = 'https://ljzrjqsuxfxanoctrekw.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Y_wzCp_k_4uH4QM8BNCkqQ_WixZH548';
```

### 4. Jalankan Lokal

Karena ini pure HTML/CSS/JS, cukup pakai Live Server di VS Code:

1. Install extension **Live Server** di VS Code
2. Klik kanan `index.html` → **Open with Live Server**
3. Buka browser di `http://127.0.0.1:5500`

Atau pakai Python:
```bash
python -m http.server 8080
# Buka: http://localhost:8080
```

---

## 📦 Deploy

### GitHub Pages

```bash
# 1. Buat repo baru di GitHub
# 2. Push semua file
git init
git add .
git commit -m "Initial commit — Kesling Archive D3"
git branch -M main
git remote add origin https://github.com/username/kesling-archive-d3.git
git push -u origin main

# 3. Di GitHub: Settings → Pages → Source: main branch → Save
# URL: https://username.github.io/kesling-archive-d3/
```

### Vercel

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Deploy
vercel

# Ikuti instruksi, pilih: No framework
# Output directory: . (root)
```

Atau drag & drop folder ke https://vercel.com/new

### Netlify

Drag & drop folder project ke https://app.netlify.com/drop

Atau via CLI:
```bash
npm i -g netlify-cli
netlify deploy --prod --dir .
```

---

## 📁 Struktur Folder

```
kesling-archive-d3/
├── index.html          # Splash screen + redirect
├── login.html          # Halaman login
├── register.html       # Halaman register
├── forgot.html         # Lupa password
├── dashboard.html      # Dashboard utama
├── upload.html         # Upload file
├── search.html         # Pencarian file
├── files.html          # Browse per semester/kategori
├── profile.html        # Profil mahasiswa
├── settings.html       # Pengaturan
├── assets/
│   ├── css/
│   │   ├── style.css       # Design system & base
│   │   ├── dashboard.css   # Layout & komponen
│   │   ├── upload.css      # Upload page
│   │   └── responsive.css  # Auth & responsive
│   ├── js/
│   │   ├── app.js          # Utilities (Toast, Theme, Format)
│   │   ├── auth.js         # Auth handler
│   │   ├── dashboard.js    # Dashboard logic
│   │   ├── upload.js       # Upload handler
│   │   └── search.js       # Search handler
│   └── icons/              # Icon PWA (tambahkan manual)
├── supabase/
│   ├── supabase.js         # Supabase client config
│   └── schema.sql          # SQL schema lengkap
├── pwa/
│   ├── manifest.json       # PWA manifest
│   ├── service-worker.js   # Service worker caching
│   └── offline.html        # Halaman offline
├── .env.example
├── .gitignore
└── README.md
```

---

## 🖼️ Icon PWA

Tambahkan dua file icon ke `assets/icons/`:
- `icon-192.png` (192×192 px)
- `icon-512.png` (512×512 px)

Bisa dibuat di: https://realfavicongenerator.net atau Canva.

---

## 🗄️ Struktur Database

| Tabel | Deskripsi |
|-------|-----------|
| `users` | Profil mahasiswa (nama, NIM, angkatan, dll.) |
| `files` | Metadata file (judul, semester, kategori, URL, dll.) |
| `favorites` | File yang difavoritkan user |
| `activities` | Log aktivitas user |

---

## 🔒 Keamanan

- Semua halaman (kecuali login/register) dilindungi autentikasi
- Row Level Security (RLS) aktif — user hanya bisa akses data sendiri
- Storage policy — user hanya bisa upload/akses file milik sendiri
- File validation di frontend (tipe & ukuran)

---

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+)
- **Backend**: Supabase (Auth + Database + Storage)
- **PWA**: Service Worker + Web App Manifest
- **Font**: Plus Jakarta Sans (Google Fonts)
- **Hosting**: GitHub Pages / Vercel / Netlify

---

## 📞 Support

Dibuat untuk mahasiswa D3 Kesehatan Lingkungan Poltekkes.
