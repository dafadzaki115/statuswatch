-- ============================================================
-- StatusWatch — Seed Akun Demo & Monitor untuk Dosen / Presentasi
-- Jalankan di SQL Editor Supabase: https://supabase.com/dashboard/project/kijdsdefvxxpevhmdkso/sql
-- ============================================================

-- 1. Konfirmasi email akun dosen@demo.com agar bisa langsung login
UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, now())
WHERE email = 'dosen@demo.com';

-- Pastikan profil terbuat
INSERT INTO public.profiles (id, email, plan)
SELECT id, email, 'pro'
FROM auth.users
WHERE email = 'dosen@demo.com'
ON CONFLICT (id) DO UPDATE SET plan = 'pro';

-- 2. Buat Status Page publik untuk akun demo
INSERT INTO public.status_pages (owner_id, title, slug, description, is_public)
SELECT id, 'Status Layanan Cloud & Web', 'dosen-demo', 'Halaman resmi pemantauan operasional sistem dan keandalan uptime layanan StatusWatch.', true
FROM auth.users
WHERE email = 'dosen@demo.com'
ON CONFLICT (slug) DO NOTHING;

-- 3. Masukkan 3 contoh monitor nyata
INSERT INTO public.monitors (owner_id, status_page_id, name, url, method, interval_minutes, expected_status, timeout_ms, current_status, last_status_code, last_response_ms, last_checked_at)
SELECT 
  u.id,
  sp.id,
  'Google Gateway API',
  'https://www.google.com',
  'GET',
  10,
  200,
  5000,
  'up',
  200,
  45,
  now()
FROM auth.users u
LEFT JOIN public.status_pages sp ON sp.slug = 'dosen-demo'
WHERE u.email = 'dosen@demo.com'
ON CONFLICT DO NOTHING;

INSERT INTO public.monitors (owner_id, status_page_id, name, url, method, interval_minutes, expected_status, timeout_ms, current_status, last_status_code, last_response_ms, last_checked_at)
SELECT 
  u.id,
  sp.id,
  'GitHub Production',
  'https://github.com',
  'GET',
  10,
  200,
  5000,
  'up',
  200,
  78,
  now()
FROM auth.users u
LEFT JOIN public.status_pages sp ON sp.slug = 'dosen-demo'
WHERE u.email = 'dosen@demo.com'
ON CONFLICT DO NOTHING;

INSERT INTO public.monitors (owner_id, status_page_id, name, url, method, interval_minutes, expected_status, timeout_ms, current_status, last_status_code, last_response_ms, last_checked_at)
SELECT 
  u.id,
  sp.id,
  'Simulasi Server Cadangan',
  'https://httpstat.us/200',
  'GET',
  10,
  200,
  5000,
  'up',
  200,
  110,
  now()
FROM auth.users u
LEFT JOIN public.status_pages sp ON sp.slug = 'dosen-demo'
WHERE u.email = 'dosen@demo.com'
ON CONFLICT DO NOTHING;

-- 4. Masukkan sampel riwayat checks untuk grafik & uptime bar
INSERT INTO public.checks (monitor_id, is_up, status_code, response_ms, checked_at)
SELECT 
  m.id,
  true,
  200,
  45 + (random() * 30)::int,
  now() - (s || ' minutes')::interval
FROM public.monitors m
CROSS JOIN generate_series(0, 120, 10) AS s
WHERE m.owner_id = (SELECT id FROM auth.users WHERE email = 'dosen@demo.com');
