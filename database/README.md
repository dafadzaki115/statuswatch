# Database — StatusWatch

Folder ini berisi file SQL untuk manajemen schema database Supabase (Postgres).

## Struktur

```
database/
├── migrations/
│   └── 0001_init.sql      # Schema awal: tabel, index, RLS, trigger, fungsi
├── seeds/
│   └── demo-monitors.sql  # Data contoh untuk demo
└── README.md
```

## Cara Penggunaan

### Migrasi

1. Buka **Supabase Dashboard → SQL Editor**
2. Salin dan jalankan isi file `migrations/0001_init.sql`
3. Pastikan semua tabel, index, dan policy terbuat

### Seed Data

1. Daftarkan akun di aplikasi untuk mendapatkan `user_id`
2. Edit `seeds/demo-monitors.sql`, ganti `<USER_ID>` dengan UUID akun
3. Jalankan di SQL Editor

## ERD

Lihat `prd.md` Bagian 7.1 untuk diagram Entity-Relationship lengkap.
