-- ============ EXTENSIONS ============
create extension if not exists "pgcrypto";

-- ============ TABLES ============
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  plan text not null default 'free' check (plan in ('free','pro')),
  created_at timestamptz not null default now()
);

create table public.status_pages (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  slug text not null unique check (slug ~ '^[a-z0-9]([a-z0-9-]{1,38})[a-z0-9]$'),
  title text not null check (char_length(title) between 1 and 80),
  description text check (char_length(description) <= 300),
  is_public boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.monitors (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  status_page_id uuid references public.status_pages(id) on delete set null,
  name text not null check (char_length(name) between 1 and 80),
  url text not null check (char_length(url) <= 2048),
  method text not null default 'GET' check (method in ('GET','HEAD')),
  interval_minutes int not null default 5 check (interval_minutes in (5,10,30,60)),
  expected_status int not null default 200 check (expected_status between 100 and 599),
  timeout_ms int not null default 5000 check (timeout_ms between 1000 and 8000),
  is_active boolean not null default true,
  current_status text not null default 'unknown' check (current_status in ('up','down','unknown')),
  consecutive_failures int not null default 0,
  last_checked_at timestamptz,
  last_status_code int,
  last_response_ms int,
  ssl_expires_at timestamptz,
  created_at timestamptz not null default now()
);
create index monitors_owner_idx on public.monitors(owner_id);
create index monitors_due_idx on public.monitors(is_active, last_checked_at);
create index monitors_status_page_idx on public.monitors(status_page_id);

create table public.checks (
  id bigint generated always as identity primary key,
  monitor_id uuid not null references public.monitors(id) on delete cascade,
  checked_at timestamptz not null default now(),
  status_code int,
  response_ms int,
  is_up boolean not null,
  error text,
  ssl_days_remaining int
);
create index checks_monitor_time_idx on public.checks(monitor_id, checked_at desc);

create table public.incidents (
  id uuid primary key default gen_random_uuid(),
  monitor_id uuid not null references public.monitors(id) on delete cascade,
  title text not null,
  status text not null default 'open' check (status in ('open','resolved')),
  started_at timestamptz not null default now(),
  resolved_at timestamptz,
  last_error text
);
create index incidents_monitor_idx on public.incidents(monitor_id, started_at desc);
-- Idempotensi: maksimal 1 insiden OPEN per monitor
create unique index one_open_incident_per_monitor
  on public.incidents(monitor_id) where status = 'open';

-- ============ AUTO-PROFILE SAAT REGISTER ============
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email);
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============ ROW LEVEL SECURITY ============
alter table public.profiles enable row level security;
alter table public.status_pages enable row level security;
alter table public.monitors enable row level security;
alter table public.checks enable row level security;
alter table public.incidents enable row level security;

-- profiles: hanya baca/ubah milik sendiri (kolom plan diubah lewat API server)
create policy "profiles_select_own" on public.profiles for select using (id = auth.uid());

-- status_pages
create policy "sp_select_own" on public.status_pages for select using (owner_id = auth.uid());
create policy "sp_insert_own" on public.status_pages for insert with check (owner_id = auth.uid());
create policy "sp_update_own" on public.status_pages for update using (owner_id = auth.uid());
create policy "sp_delete_own" on public.status_pages for delete using (owner_id = auth.uid());

-- monitors
create policy "mon_select_own" on public.monitors for select using (owner_id = auth.uid());
create policy "mon_insert_own" on public.monitors for insert with check (owner_id = auth.uid());
create policy "mon_update_own" on public.monitors for update using (owner_id = auth.uid());
create policy "mon_delete_own" on public.monitors for delete using (owner_id = auth.uid());

-- checks & incidents: baca lewat kepemilikan monitor (tulis hanya oleh service role)
create policy "checks_select_own" on public.checks for select
  using (exists (select 1 from public.monitors m where m.id = monitor_id and m.owner_id = auth.uid()));
create policy "inc_select_own" on public.incidents for select
  using (exists (select 1 from public.monitors m where m.id = monitor_id and m.owner_id = auth.uid()));

-- ============ FUNGSI UPTIME ============
create or replace function public.uptime_percent(p_monitor uuid, p_hours int)
returns numeric language sql stable as $$
  select coalesce(
    round(100.0 * count(*) filter (where is_up) / nullif(count(*), 0), 2), null)
  from public.checks
  where monitor_id = p_monitor
    and checked_at >= now() - make_interval(hours => p_hours);
$$;
