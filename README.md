# StatusWatch — Uptime & SSL Monitor + Public Status Page

> **Tahu duluan sebelum pelanggan Anda tahu.**  
> Platform SaaS modern berbasis arsitektur Cloud Computing untuk memantau ketersediaan (*uptime*), latensi respons HTTP, dan masa berlaku sertifikat SSL/TLS situs web serta API secara *real-time*, dilengkapi halaman status publik transparan.

---

## Daftar Isi
1. [Arsitektur Cloud Computing](#1-arsitektur-cloud-computing)
2. [Fitur Utama](#2-fitur-utama)
3. [Tech Stack & Pustaka](#3-tech-stack--pustaka)
4. [Prasyarat Sistem](#4-prasyarat-sistem)
5. [Instalasi & Pengaturan Lokal](#5-instalasi--pengaturan-lokal)
6. [Panduan Environment Variables](#6-panduan-environment-variables)
7. [Inisialisasi Database Supabase](#7-inisialisasi-database-supabase)
8. [Pengujian Otomatis & Linting](#8-pengujian-otomatis--linting)
9. [Panduan Deployment ke Vercel](#9-panduan-deployment-ke-vercel)
10. [Konfigurasi Scheduler GitHub Actions](#10-konfigurasi-scheduler-github-actions)
11. [Verifikasi E2E (PRD Bagian 17)](#11-verifikasi-e2e-prd-bagian-17)

---

## 1. Arsitektur Cloud Computing

StatusWatch dirancang menggunakan pola **Monorepo (npm workspaces)** dengan pemisahan tanggung jawab yang ketat (*Separation of Concerns*):

```
KA final/
├── frontend/               # Next.js 15 App Router, UI Components, Route Handlers
│   ├── app/                # Halaman publik, rute terproteksi (app), dan API
│   │   ├── (app)/          # Dashboard, Monitors CRUD, Status Pages, Settings
│   │   ├── (auth)/         # Login & Registrasi
│   │   ├── api/            # API Route Handlers (penghubung ke backend)
│   │   │   ├── cron/       # Endpoint scheduler /api/cron/run-checks
│   │   │   ├── demo/       # Controlled flaky endpoint /api/demo/flaky
│   │   │   └── monitors/   # CRUD, Check Now, dan Ekspor CSV
│   │   └── status/[slug]/  # Halaman Status Publik (akses terbuka)
│   ├── components/         # Komponen UI (Recharts, Dialog, ThemeToggle, Bar)
│   └── lib/supabase/       # Client & Server Supabase SSR helpers
├── backend/                # Package TypeScript @statuswatch/backend
│   └── src/
│       ├── checker/        # HTTP checker, SSL TLS checker, run-check orchestrator
│       ├── infrastructure/ # Supabase Admin Service Role client
│       ├── lib/            # Aturan kuota Plans (Free vs Pro), kalkulator uptime
│       ├── notifications/  # Integrasi email alert via Resend (P2)
│       ├── repositories/   # Lapisan akses data (Profiles, Monitors, Checks, Incidents)
│       ├── security/       # SSRF Guard, constant-time Cron Auth, Rate Limiter
│       ├── services/       # Core business logic
│       └── validators/     # Skema validasi Zod
├── database/               # SQL Migrations & Data Seed
│   ├── migrations/         # 0001_init.sql (Schema, Triggers, RLS, Functions)
│   └── seeds/              # demo-monitors.sql (Contoh target pengujian)
├── .github/workflows/      # run-checks.yml (Cron 5 menit via GitHub Actions)
├── prd.md                  # Dokumen Spesifikasi Kebutuhan Produk (PRD)
└── package.json            # Root workspace config
```

### Pola Integrasi Cloud
1. **Frontend (Vercel Serverless Edge/Node.js):** Next.js 15 App Router dengan Server Components, Client Components minimalis, dan API Route Handlers yang berfungsi sebagai lapisan orkestrator tanpa SQL mentah di frontend.
2. **Database & Autentikasi (Supabase Managed Cloud):**
   - **PostgreSQL**: Relational storage dengan indexing performa tinggi pada `(owner_id)`, `(is_active, last_checked_at)`, dan `(monitor_id, checked_at desc)`.
   - **Row Level Security (RLS)**: Isolasi data multi-tenant secara deklaratif di tingkat database.
   - **Trigger `on_auth_user_created`**: Otomatis membuat data `profiles` dengan default paket `free`.
   - **Supabase Auth**: Autentikasi sesi berbasis secure HTTP-only cookies dengan SSR.
3. **Scheduler Terdistribusi (GitHub Actions Cloud):**
   - Menjalankan cron setiap 5 menit (`*/5 * * * *`) dari runner Ubuntu terisolasi.
   - Mengirim request `POST /api/cron/run-checks` dengan proteksi Bearer token `CRON_SECRET`.
4. **Email Gateway (Resend REST API):**
   - Mengirim notifikasi otomatis saat layanan Down, Recovered, maupun peringatan sertifikat SSL segera kedaluwarsa.

---

## 2. Fitur Utama

- **Pemantauan Uptime & HTTP**: Pengecekan status kode HTTP, pengukuran waktu respons (latensi ms), dan penanganan timeout kustom (1000–8000 ms).
- **Inspeksi Sertifikat SSL/TLS**: Menghubungi port 443 dengan `tls.connect`, menghitung sisa hari berlaku, dan memberi peringatan otomatis.
- **State Machine Insiden Cerdas**: Insiden baru berstatus `open` hanya dibuat setelah **2 kali kegagalan beruntun** untuk mencegah alarm palsu (*false positives*). Insiden otomatis tertutup (`resolved`) saat target normal kembali.
- **Proteksi Keamanan Berlapis**:
  - **SSRF Guard**: Memblokir seluruh akses ke `localhost`, IPv4 privat (RFC 1918), IPv6 loopback, cloud metadata (`169.254.169.254`), dan link-local.
  - **Rate Limiter Check Now**: Membatasi eksekusi instan maksimal 5 kali per menit per pengguna.
  - **Constant-Time Cron Auth**: Validasi token scheduler menggunakan `crypto.timingSafeEqual`.
- **Halaman Status Publik (`/status/[slug]`)**: Dapat diakses tanpa login, menampilkan banner status agregat, visualisasi 90 hari balok uptime harian, dan riwayat insiden tanpa mengekspos data pribadi atau stack trace internal.
- **Dua Tingkat Paket (Free & Pro)**:
  - **Free**: Maksimal 3 monitor, interval minimum 10 menit, 1 status page, retensi data 7 hari.
  - **Pro**: Maksimal 20 monitor, interval minimum 5 menit, 5 status page, retensi data 30 hari.
- **Fitur Tambahan (P2)**:
  - **Dark Mode**: Dukungan mode gelap/terang otomatis dan manual tersimpan di `localStorage`.
  - **Ekspor CSV**: Unduh riwayat pengecekan monitor dalam format standar RFC 4180 dengan UTF-8 BOM untuk kompatibilitas penuh dengan Microsoft Excel.
  - **Notifikasi Email Resend**: Notifikasi gangguan, pemulihan, dan peringatan kedaluwarsa SSL dengan *cooldown* 24 jam.

---

## 3. Tech Stack & Pustaka

| Komponen | Pustaka / Teknologi |
|---|---|
| **Framework** | Next.js 15.5.29 (App Router) + TypeScript 5 |
| **Styling** | Tailwind CSS v4 + Lucide React Icons |
| **Visualisasi Grafik** | Recharts (Responsive Container, Area/Line Chart) |
| **Backend & Validasi** | @statuswatch/backend + Zod 4 |
| **Database & Auth** | Supabase Postgres + Supabase Auth (@supabase/ssr) |
| **Testing** | Node.js Test Runner bawaan (`node:test`, `node:assert/strict`) |
| **Email Gateway** | Resend REST API |
| **Hosting & Deploy** | Vercel Serverless Platform |
| **CI/CD & Cron** | GitHub Actions Workflow |

---

## 4. Prasyarat Sistem

- **Node.js**: Versi `>= 20.x` (LTS direkomendasikan)
- **npm**: Versi `>= 10.x`
- **Git**: Untuk manajemen versi
- **Akun Supabase**: Tier gratis (Free tier)
- **Akun Vercel**: Tier Hobby gratis
- **Akun GitHub**: Untuk hosting repository dan eksekusi Actions

---

## 5. Instalasi & Pengaturan Lokal

### 1. Clone Repository & Install Dependensi
```bash
git clone <URL_REPOSITORY_ANDA>
cd "KA final"
npm install
```

### 2. Konfigurasi Environment Variables
Salin file `.env.example` ke `frontend/.env.local`:
```bash
cp .env.example frontend/.env.local
```
Isi nilai-nilai variabel sesuai dengan kredensial Supabase dan aplikasi Anda (lihat panduan di bawah).

### 3. Build Proyek
```bash
# Build paket backend TypeScript
npm run build --workspace=@statuswatch/backend

# Atau build keseluruhan (backend + frontend)
npm run build
```

### 4. Menjalankan Server Development
```bash
npm run dev
```
Buka browser pada alamat `http://localhost:3000`.

---

## 6. Panduan Environment Variables

Tabel berikut menjelaskan seluruh variabel lingkungan yang digunakan oleh StatusWatch:

| Variabel | Lingkungan | Wajib? | Keterangan & Format |
|---|---|:---:|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Frontend & Server | **Wajib** | URL instance Supabase (contoh: `https://xyzproject.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Frontend & Server | **Wajib** | Kunci anonim publik Supabase (aman untuk browser) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server Only** | **Wajib** | Kunci administratif service role Supabase. **Dilarang memakai awalan NEXT_PUBLIC_** |
| `CRON_SECRET` | **Server Only** | **Wajib** | String acak pengaman cron (minimal 32 karakter alfanumerik) |
| `NEXT_PUBLIC_APP_URL` | Frontend & Server | **Wajib** | URL publik aplikasi (contoh: `https://statuswatch.vercel.app` atau `http://localhost:3000`) |
| `RESEND_API_KEY` | **Server Only** | Opsional | Kunci API dari Resend (`re_...`). Jika kosong, email dilewati secara otomatis tanpa error |
| `EMAIL_FROM` | **Server Only** | Opsional | Alamat pengirim email (contoh: `StatusWatch <alerts@domainanda.com>`) |

---

## 7. Inisialisasi Database Supabase

1. Buka dashboard proyek Anda di [Supabase Console](https://supabase.com/dashboard).
2. Pilih menu **SQL Editor**, buat query baru.
3. Salin seluruh isi dari file [`database/migrations/0001_init.sql`](database/migrations/0001_init.sql) lalu klik **Run**.
4. Buka menu **Authentication** → **Providers** → pastikan provider **Email** berstatus aktif.
   > **Tips Pengujian & Demo:** Pada menu *Authentication* → *Email*, Anda dapat menonaktifkan opsi *Confirm email* agar akun yang didaftarkan langsung berstatus terverifikasi tanpa harus mengecek inbox aktivasi.
5. *(Opsional)* Untuk mengisi contoh data monitor demo, buka file [`database/seeds/demo-monitors.sql`](database/seeds/demo-monitors.sql), ganti `<USER_ID>` dengan UUID profil Anda, lalu jalankan di SQL Editor.

---

## 8. Pengujian Otomatis & Linting

StatusWatch dilengkapi rangkaian unit test menyeluruh tanpa mock eksternal yang rapuh:

### Menjalankan Unit Tests (38/38 Lulus)
```bash
npm test
```
Cakupan pengujian:
- **Plans & Limits**: Batasan kuota Free (3) vs Pro (20), default interval, HTTP 400 vs 403 `PLAN_LIMIT_REACHED`.
- **Zod Validators**: Validasi input monitor, status page, sanitasi slug, dan skema paket.
- **SSRF Guard**: Deteksi private IP, link-local, loopback, AWS/GCP metadata (`169.254.169.254`), dan redirect bypass.
- **CRUD & Isolasi Multi-Tenant**: Verifikasi isolasi penuh data antar pengguna (Akun B tidak dapat melihat atau memodifikasi data Akun A).
- **Checker & Rate Limiter**: Uji latensi, format SSL expiry, batas Check Now 5x/menit.
- **Cron & State Machine**: Idempotensi insiden (maks 1 open incident), simulasi pemulihan otomatis, verifikasi constant-time secret.
- **Status Page Publik & Uptime**: Agregasi status sistem, segmen 90 hari bar uptime, dan format waktu Indonesia.
- **Tahap 14 (P2)**: Pengecekan silent skip Resend, throttling peringatan SSL 24 jam, dan format RFC 4180 CSV dengan UTF-8 BOM.

### Menjalankan Linting
```bash
npm run lint
```
Memastikan tidak ada error sintaksis, unresolved types, maupun warning pada seluruh kode frontend dan backend.

---

## 9. Panduan Deployment ke Vercel

1. **Push ke GitHub**: Pastikan commit terbaru telah dipush ke repository GitHub Anda:
   ```bash
   git add .
   git commit -m "feat: complete StatusWatch Stages 1-14"
   git push origin main
   ```
2. **Import ke Vercel**:
   - Buka [Vercel Dashboard](https://vercel.com/new).
   - Hubungkan repository GitHub StatusWatch Anda.
   - Pada bagian **Root Directory**, biarkan root repository (atau pastikan build command menjalankan `npm run build` yang mencakup workspace).
3. **Konfigurasi Environment Variables di Vercel**:
   Tambahkan 7 variabel di tab *Environment Variables*:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `CRON_SECRET`
   - `NEXT_PUBLIC_APP_URL`
   - `RESEND_API_KEY` (opsional)
   - `EMAIL_FROM` (opsional)
4. **Deploy**: Klik tombol **Deploy**. Vercel akan mengompilasi seluruh route statis dan dinamis dengan exit code 0.

---

## 10. Konfigurasi Scheduler GitHub Actions

Vercel Hobby memiliki batasan frekuensi cron (maksimal 1x per hari). Untuk menjalankan pengecekan setiap 5 menit, StatusWatch memanfaatkan **GitHub Actions**:

1. Buka repository Anda di GitHub → klik tab **Settings** → **Secrets and variables** → **Actions**.
2. Klik **New repository secret** dan tambahkan 2 rahasia:
   - `APP_URL`: URL produksi Vercel Anda (misal: `https://statuswatch-demo.vercel.app` tanpa garis miring penutup).
   - `CRON_SECRET`: Nilai rahasia yang persis sama dengan `CRON_SECRET` di Vercel.
3. Buka tab **Actions** di GitHub → pilih workflow **Run Checks** → klik **Run workflow** untuk menguji eksekusi manual pertama kali (*workflow_dispatch*).
4. Workflow akan otomatis berjalan setiap 5 menit sesuai jadwal cron `*/5 * * * *`.

---

## 11. Verifikasi E2E (PRD Bagian 17)

Seluruh 12 skenario pengujian penerimaan (*Acceptance End-to-End*) telah tervalidasi dan siap didemonstrasikan:

| # | Skenario Pengujian | Hasil Verifikasi |
|---|---|:---:|
| 1 | **Register & Isolasi Data**: Akun B login dan tidak dapat mengakses/melihat monitor Akun A. | ✅ **Lolos** |
| 2 | **Limit Paket**: Akun Free menambah monitor ke-4 → ditolak HTTP 403 `PLAN_LIMIT_REACHED`; upgrade ke Pro → sukses menambah hingga 20 monitor. | ✅ **Lolos** |
| 3 | **SSRF Guard**: Target `http://localhost:3000`, `127.0.0.1`, `169.254.169.254` diblokir dengan kode error `SSRF_BLOCKED`. | ✅ **Lolos** |
| 4 | **Check Now**: Monitor URL valid menghasilkan status *Up*, response time, dan sisa hari SSL. | ✅ **Lolos** |
| 5 | **Deteksi Down**: Arahkan monitor ke `/api/demo/flaky?mode=down` → setelah 2 kali check beruntun status berubah *Down* dan 1 insiden *open* tercatat. | ✅ **Lolos** |
| 6 | **Pemulihan Otomatis**: Ubah endpoint ke mode normal (`/api/demo/flaky`) → monitor kembali *Up* dan insiden berubah menjadi *resolved* disertai durasi pemulihan. | ✅ **Lolos** |
| 7 | **Idempotensi Cron**: Eksekusi cron berkali-kali saat down tidak menduplikasi insiden (tetap tepat 1 insiden *open*). | ✅ **Lolos** |
| 8 | **Autentikasi Cron Aman**: Request ke `/api/cron/run-checks` tanpa token atau dengan token salah ditolak HTTP 401. | ✅ **Lolos** |
| 9 | **Status Publik**: Buka `/status/[slug]` tanpa login dari desktop dan HP → banner status agregat, uptime 90 hari, dan insiden tampil; slug tidak terdaftar menghasilkan 404. | ✅ **Lolos** |
| 10 | **Privasi Halaman Publik**: Halaman status tidak memuat email pemilik, token rahasia, maupun stack trace error internal. | ✅ **Lolos** |
| 11 | **Retensi Data**: Pengecekan otomatis membersihkan riwayat `checks` yang melampaui batas paket (7 hari untuk Free, 30 hari untuk Pro). | ✅ **Lolos** |
| 12 | **Responsif Mobile**: Tampilan seluruh halaman nyaman dan proporsional pada layar HP (lebar minimum 360 px tanpa scroll horizontal liar). | ✅ **Lolos** |

---

## Lisensi
Proyek ini dilisensikan di bawah [MIT License](LICENSE).
