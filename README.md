# StatusWatch — Uptime & SSL Monitor + Public Status Page

> **Tahu duluan sebelum pelanggan Anda tahu.**

Layanan SaaS untuk memantau ketersediaan (uptime), kecepatan respons, dan masa berlaku sertifikat SSL dari situs web/API, dilengkapi halaman status publik.

## Arsitektur Proyek

Proyek menggunakan **npm workspaces** dengan 3 folder utama:

```
KA final/
├── frontend/          # Next.js 15 App Router + Tailwind CSS
│   ├── app/           # Halaman & Route Handlers (penghubung ke backend)
│   │   ├── api/       # Route Handlers — hanya memanggil service backend
│   │   └── ...
│   └── ...
├── backend/           # Business logic (TypeScript package)
│   └── src/
│       ├── checker/       # HTTP check, SSL check, run-check orchestrator
│       ├── lib/           # Plans, uptime, errors, types
│       ├── repositories/  # Data access layer (Supabase)
│       ├── security/      # SSRF guard, cron auth, rate limit
│       ├── services/      # Business logic layer
│       └── validators/    # Zod schemas
├── database/          # SQL migrations, seeds, dokumentasi
│   ├── migrations/
│   └── seeds/
├── .github/workflows/ # GitHub Actions scheduler
├── prd.md             # Product Requirements Document
└── package.json       # Root workspace config
```

### Alur Dependensi

```
frontend (Next.js) ──depends on──> @statuswatch/backend (npm workspace)
         │
         └── app/api/* Route Handlers → memanggil service/validator dari backend
```

- **frontend**: UI, halaman, dan Route Handlers. Route Handler hanya berfungsi sebagai "penghubung" — memvalidasi request lalu mendelegasikan ke backend.
- **backend**: Semua business logic, validasi (Zod), keamanan (SSRF, rate limit, cron auth), dan data access. Diekspor sebagai package `@statuswatch/backend`.
- **database**: File SQL murni. Tidak termasuk di npm workspace (dijalankan manual di Supabase SQL Editor).

## Tech Stack

| Lapisan | Teknologi |
|---|---|
| Framework | Next.js 15 (App Router) + TypeScript |
| Styling/UI | Tailwind CSS + shadcn/ui, ikon lucide-react |
| Grafik | Recharts |
| Database & Auth | Supabase (Postgres + Supabase Auth) |
| Validasi | Zod |
| Hosting | Vercel (Hobby) |
| Scheduler | GitHub Actions (cron tiap 5 menit) |
| Package Manager | npm (workspaces) |

## Prasyarat

- Node.js >= 20
- npm >= 10
- Akun Supabase (gratis)
- Akun Vercel (Hobby)

## Menjalankan Lokal

### 1. Clone & Install

```bash
git clone <repo-url>
cd "KA final"
npm install
```

### 2. Konfigurasi Environment

```bash
cp .env.example frontend/.env.local
```

Isi variabel di `frontend/.env.local` dengan kredensial Supabase Anda.

### 3. Setup Database

1. Buka Supabase Dashboard → SQL Editor
2. Jalankan `database/migrations/0001_init.sql`
3. Di Authentication → Providers, aktifkan Email

### 4. Build & Run

```bash
# Build backend dulu, lalu frontend
npm run build

# Jalankan development server
npm run dev
```

Buka `http://localhost:3000`.

## Environment Variables

| Variabel | Deskripsi | Wajib |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL proyek Supabase | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key Supabase | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (SERVER ONLY) | ✅ |
| `CRON_SECRET` | Secret untuk autentikasi cron (≥ 32 karakter) | ✅ |
| `NEXT_PUBLIC_APP_URL` | URL publik aplikasi | ✅ |
| `RESEND_API_KEY` | API key Resend untuk email (P2, opsional) | ❌ |
| `EMAIL_FROM` | Alamat pengirim email (P2, opsional) | ❌ |

## Deploy ke Vercel

1. Push repo ke GitHub
2. Vercel → Add New → Project → import repo
3. Atur **Root Directory** ke `frontend`
4. Isi semua environment variables
5. Deploy

## GitHub Actions (Scheduler)

Tambahkan **Repository Secrets** berikut di GitHub:
- `APP_URL` — URL produksi (misal: `https://statuswatch.vercel.app`)
- `CRON_SECRET` — sama dengan yang diisi di Vercel

## Asumsi

- Database dikelola sepenuhnya oleh Supabase (managed Postgres + RLS).
- Tidak ada framework backend tambahan (Express, Fastify, dll.) — business logic dijalankan sebagai modul TypeScript murni yang dipanggil oleh Next.js Route Handlers.
- Paket langganan (Free/Pro) bersifat simulasi tanpa pembayaran sungguhan.
- Scheduler menggunakan GitHub Actions karena Vercel Hobby hanya mengizinkan cron 1×/hari.

## Referensi

Lihat [prd.md](./prd.md) untuk spesifikasi lengkap.
