# 🔍 Laporan Audit Proyek StatusWatch

**Tanggal:** 2026-11-18  
**Commit:** `1c1d516` — `chore: save StatusWatch scaffold`  
**Node.js:** v26.13.1 | **npm:** 11.20.0

---

## 1. Struktur Proyek Saat Ini

```
KA final/
├── .env.example
├── .github/workflows/run-checks.yml
├── .gitignore
├── package.json                        # Root workspace config
├── package-lock.json
├── tsconfig.base.json
├── prd.md                              # ✅ Utuh, tidak diubah
├── README.md
│
├── backend/                            # @statuswatch/backend workspace
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts                    # Barrel export
│       ├── checker/
│       │   ├── http-check.ts           # 🔸 Stub (throw "Not implemented")
│       │   ├── ssl-check.ts            # 🔸 Stub
│       │   └── run-check.ts            # 🔸 Stub
│       ├── lib/
│       │   ├── types.ts                # ✅ Tipe lengkap
│       │   ├── plans.ts               # ✅ Implementasi lengkap
│       │   ├── errors.ts              # ✅ Implementasi lengkap
│       │   └── uptime.ts             # ✅ Implementasi lengkap
│       ├── repositories/
│       │   ├── monitor.repository.ts   # 🔸 Stub (class kosong)
│       │   ├── check.repository.ts     # 🔸 Stub
│       │   ├── incident.repository.ts  # 🔸 Stub
│       │   ├── status-page.repository.ts # 🔸 Stub
│       │   └── profile.repository.ts   # 🔸 Stub
│       ├── security/
│       │   ├── ssrf-guard.ts           # ⚠️ Parsial (belum DNS resolve + IP privat)
│       │   ├── cron-auth.ts            # ✅ Implementasi lengkap
│       │   └── rate-limit.ts           # ✅ Implementasi lengkap
│       ├── services/
│       │   ├── monitor.service.ts      # 🔸 Stub (class kosong)
│       │   ├── status-page.service.ts  # 🔸 Stub
│       │   ├── plan.service.ts         # 🔸 Stub
│       │   └── incident.service.ts     # 🔸 Stub
│       └── validators/
│           ├── monitor.validator.ts    # ✅ Zod schema lengkap
│           ├── status-page.validator.ts# ✅ Zod schema lengkap
│           └── plan.validator.ts       # ✅ Zod schema lengkap
│
├── frontend/                           # Next.js workspace
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.ts
│   ├── eslint.config.mjs
│   ├── next-env.d.ts
│   ├── app/
│   │   ├── layout.tsx                  # ✅ Metadata StatusWatch, lang="id"
│   │   ├── page.tsx                    # ✅ Landing placeholder
│   │   ├── globals.css                 # ✅ Tailwind CSS
│   │   └── api/
│   │       ├── monitors/route.ts              # 🔸 Stub (501)
│   │       ├── monitors/[id]/route.ts         # 🔸 Stub (501)
│   │       ├── monitors/[id]/check/route.ts   # 🔸 Stub (501)
│   │       ├── status-pages/route.ts          # 🔸 Stub (501)
│   │       ├── status-pages/[id]/route.ts     # 🔸 Stub (501)
│   │       ├── plan/route.ts                  # 🔸 Stub (501)
│   │       └── cron/run-checks/route.ts       # 🔸 Stub (501, runtime & maxDuration set)
│   ├── public/                        # SVG default dari create-next-app
│   └── README.md                      # README create-next-app (bukan custom)
│
└── database/
    ├── migrations/0001_init.sql        # ✅ Sesuai PRD 1:1
    ├── seeds/demo-monitors.sql         # ✅ Template (commented out)
    └── README.md
```

---

## 2. Kondisi Frontend

| Aspek | Status | Catatan |
|---|---|---|
| Next.js versi | ⚠️ **16.4.6** | PRD menyebut Next.js **15**. Versi 16 adalah yang di-install oleh `create-next-app@latest`. Perlu downgrade ke Next.js 15.x |
| Tailwind CSS | ✅ v4.3.3 | Terpasang |
| shadcn/ui | ❌ Belum | Belum di-inisialisasi |
| lucide-react | ❌ Belum | Belum di-install |
| Recharts | ❌ Belum | Belum di-install |
| @supabase/supabase-js | ❌ Belum | Belum di dependencies frontend |
| @supabase/ssr | ❌ Belum | Belum di-install |
| Halaman | 🔸 Minimal | Hanya `page.tsx` (placeholder) + `layout.tsx` |
| Route Groups | ❌ Belum | `(marketing)`, `(auth)`, `(app)` belum dibuat |
| Komponen | ❌ Belum | Belum ada `components/` |
| Supabase clients | ❌ Belum | `lib/supabase/{client,server,admin}.ts` belum ada |
| `transpilePackages` | ✅ | Sudah dikonfigurasi di `next.config.ts` |

---

## 3. Kondisi Backend

| Aspek | Status | Catatan |
|---|---|---|
| Package name | ✅ `@statuswatch/backend` | Benar |
| TypeScript config | ✅ | `tsconfig.json` extends `tsconfig.base.json`, composite mode |
| Barrel export (`index.ts`) | ✅ | Semua modul di-export |
| **Lib (types, plans, errors, uptime)** | ✅ Implementasi lengkap | Sesuai PRD |
| **Validators (Zod)** | ✅ Implementasi lengkap | Monitor, status page, plan schema siap |
| **Security: cron-auth** | ✅ Implementasi lengkap | `timingSafeEqual` |
| **Security: rate-limit** | ✅ Implementasi lengkap | In-memory |
| **Security: ssrf-guard** | ⚠️ Parsial | Cek protocol/hostname/port ada; DNS resolve + IP privat **belum** |
| Repositories | 🔸 Stub | 5 class kosong |
| Services | 🔸 Stub | 4 class kosong |
| Checker | 🔸 Stub | 3 fungsi `throw "Not implemented"` |

---

## 4. Kondisi Database

| Aspek | Status |
|---|---|
| `0001_init.sql` | ✅ Sesuai PRD Bagian 7.2 persis |
| Tabel: profiles, status_pages, monitors, checks, incidents | ✅ |
| Index | ✅ |
| RLS policies | ✅ |
| Trigger auto-profile | ✅ |
| Fungsi `uptime_percent` | ✅ |
| Unique index idempotensi | ✅ `one_open_incident_per_monitor` |
| Seed data | ✅ Template tersedia |

---

## 5. Dependencies yang Terpasang

### Root `package.json`
| Package | Versi | Kategori |
|---|---|---|
| typescript | ^5.6.3 | devDependencies |
| @supabase/supabase-js | ^2.47.14 | devDependencies |

### Frontend `package.json`
| Package | Versi | Kategori |
|---|---|---|
| next | 16.4.6 | dependencies |
| react | 19.3.0 | dependencies |
| react-dom | 19.3.0 | dependencies |
| @statuswatch/backend | * (workspace) | dependencies |
| tailwindcss | 4.3.3 | devDependencies |
| typescript | ^5 | devDependencies |
| eslint + eslint-config-next | ^9 / 16.4.6 | devDependencies |
| @types/node, @types/react, @types/react-dom | ^20, ^19, ^19 | devDependencies |
| @tailwindcss/turbopack | 4.3.3 | devDependencies |

### Backend `package.json`
| Package | Versi | Kategori |
|---|---|---|
| zod | ^3.23.8 | dependencies |
| typescript | ^5.6.3 | devDependencies |
| @supabase/supabase-js | ^2.47.14 | devDependencies + peerDependencies |

### Yang BELUM terpasang (diperlukan PRD)
- `@supabase/ssr`
- `lucide-react`
- `recharts`
- `shadcn/ui` (init + components)

---

## 6. Hasil Build

### Backend Build: ❌ GAGAL

```
> tsc
'tsc' is not recognized as an internal or external command
```

**Penyebab:** npm 11 dengan isolated node_modules tidak meng-expose binary `tsc` di PATH workspace backend. `typescript` terdaftar di root dan backend devDependencies tapi binary-nya tidak ter-link ke `backend/node_modules/.bin/`.

### Frontend Build: ❌ GAGAL

```
Error: Cannot find module '@swc/helpers/_/_interop_require_default'
```

**Penyebab:** `node_modules` dalam keadaan korup. Dependensi Next.js 16 tidak ter-install lengkap (kemungkinan dari sesi sebelumnya yang terpotong). Workspace symlink `frontend/node_modules/@statuswatch/backend` juga **tidak ada**.

### Kesimpulan: Kedua build gagal. `node_modules` perlu di-nuke dan di-install ulang dengan benar.

---

## 7. Masalah Kritis yang Ditemukan

> [!CAUTION]
> ### 🔴 Kebocoran Secret di `.env.example`
> File `.env.example` baris 18-19 mengandung **GitHub Personal Access Token** asli:
> ```
> #github
> [REDACTED: GitHub Personal Access Token]
> ```
> Token ini sudah ter-push ke GitHub (ada di commit `1c1d516`). **Harus segera di-revoke** di GitHub Settings → Developer settings → Personal access tokens, dan baris ini harus dihapus dari `.env.example`.

> [!WARNING]
> ### 🟡 Versi Next.js Salah
> PRD Bagian 4 mewajibkan **Next.js 15 (App Router)**. Yang ter-install adalah **Next.js 16.4.6** (dipasang otomatis oleh `create-next-app@latest`). Next.js 16 memiliki breaking changes (misalnya `LayoutProps<"/">` signature baru). Harus di-downgrade ke `next@15.x`.

> [!WARNING]
> ### 🟡 node_modules Korup
> Proses `npm install` pada sesi sebelumnya gagal di tengah jalan, menghasilkan node_modules yang tidak lengkap. Perlu dihapus total dan di-install ulang.

---

## 8. Pemetaan ke Roadmap PRD (Bagian 15)

| # | Tahap | Status | Catatan |
|---|---|---|---|
| 1 | **Scaffold**: Next.js + TS + Tailwind + shadcn, struktur folder, `.env.example`, `.gitignore` | ⚠️ **Parsial** | Struktur 3-folder ada. `.env.example`, `.gitignore`, `README.md` ada. **Tapi**: shadcn belum init, Next.js versi salah, build gagal, `npm run dev` belum bisa jalan. DoD tidak terpenuhi. |
| 2 | **Database**: SQL + 3 klien Supabase | ⚠️ **Parsial** | SQL migration ✅ siap. Klien Supabase (client/server/admin) ❌ belum dibuat. |
| 3 | **Auth**: register, login, logout, guard | ❌ Belum | — |
| 4 | **Plans & validators**: plans.ts, Zod, ssrf-guard | ⚠️ **Parsial** | `plans.ts` ✅, Zod validators ✅, `ssrf-guard` parsial (belum DNS resolve). |
| 5 | **CRUD Monitor** | ❌ Belum | Route handlers = stub 501 |
| 6 | **Checker**: http, ssl, run-check, Check now | ❌ Belum | Semua `throw "Not implemented"` |
| 7 | **Cron endpoint** + insiden + retensi | ❌ Belum | — |
| 8 | **GitHub Actions** | ✅ Siap | `run-checks.yml` sesuai PRD |
| 9 | **Dashboard & Detail Monitor** | ❌ Belum | — |
| 10 | **Status Pages + Halaman Publik** | ❌ Belum | — |
| 11 | **Settings & paket simulasi** | ❌ Belum | — |
| 12 | **Polish** | ❌ Belum | — |
| 13 | **Deploy Vercel** + E2E | ❌ Belum | — |
| 14 | **(P2)** Email, dark mode, CSV | ❌ Belum | — |

---

## 9. Tahap Berikutnya yang Harus Dikerjakan

### Prioritas Langsung (perbaiki fondasi agar build lolos):

1. **Hapus token GitHub dari `.env.example`** dan revoke token di GitHub.
2. **Nuke `node_modules` + `package-lock.json`** di seluruh proyek.
3. **Downgrade Next.js ke versi 15.x** (sesuai PRD).
4. **Perbaiki backend build script** — ubah `"build": "tsc"` menjadi `"build": "npx tsc"` atau pastikan typescript binary terhubung.
5. **Jalankan `npm install` bersih** dari root.
6. **Verifikasi `npm run build` lolos** (backend `tsc` + frontend `next build`).

### Setelah fondasi stabil, lanjutkan roadmap PRD:

7. **Selesaikan Tahap 1** — Init shadcn/ui, install `lucide-react`, buat halaman landing statis, pastikan `npm run dev` jalan.
8. **Tahap 2** — Buat 3 klien Supabase (`client.ts`, `server.ts`, `admin.ts`), install `@supabase/ssr`.
9. **Tahap 3** — Auth (register, login, logout, guard route).
10. **Tahap 4** — Lengkapi SSRF guard (DNS resolve + IP privat), buat unit test sederhana.
11. **Tahap 5–13** — Ikuti urutan PRD.

---

## 10. Ringkasan

| Kategori | Skor |
|---|---|
| Arsitektur (3-folder + workspace) | ✅ Baik — struktur sudah benar |
| Backend (business logic stubs) | ⚠️ Kerangka ada, implementasi masih kosong |
| Frontend (Next.js) | ⚠️ Versi salah, belum bisa build |
| Database (SQL) | ✅ Siap pakai |
| Konfigurasi build | ❌ Gagal — perlu perbaikan |
| Keamanan | 🔴 Token bocor di `.env.example` |
| Kesiapan overall | **Tahap 1 belum selesai** (DoD: `npm run dev` jalan) |

> Proyek ini memiliki fondasi arsitektur yang baik — pemisahan folder, npm workspaces, TypeScript, dan barrel exports sudah tepat. Masalah utamanya adalah **konfigurasi build yang rusak** akibat npm install yang gagal di sesi sebelumnya, **versi Next.js yang salah**, dan **token GitHub yang bocor**. Setelah 3 masalah ini diperbaiki, proyek siap melanjutkan ke implementasi fitur sesuai roadmap PRD.
