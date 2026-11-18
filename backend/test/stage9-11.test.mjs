import test from 'node:test';
import assert from 'node:assert/strict';

import {
  StatusPageService,
  PlanService,
  calculateUptimePercent,
  calculateAverageResponseTime,
  calculateDailyUptimeSegments,
  formatDurationSeconds,
  formatSslStatus,
  AppError,
  ErrorCode,
} from '../dist/index.js';

// ============================================
// HELPER: Mock Supabase Client (In-Memory)
// ============================================
function createMockSupabase(initialData = {}) {
  const db = {
    profiles: JSON.parse(JSON.stringify(initialData.profiles || [])),
    monitors: JSON.parse(JSON.stringify(initialData.monitors || [])),
    checks: JSON.parse(JSON.stringify(initialData.checks || [])),
    incidents: JSON.parse(JSON.stringify(initialData.incidents || [])),
    status_pages: JSON.parse(JSON.stringify(initialData.status_pages || [])),
  };

  const client = {
    _db: db,
    from(table) {
      let rows = [...(db[table] || [])];
      let limitCount = null;
      let orderField = null;
      let orderAsc = true;
      let isSingle = false;
      let isMaybeSingle = false;
      let isCount = false;
      let pendingInsert = null;
      let pendingUpdate = null;
      let isDelete = false;

      const builder = {
        select(_fields = '*', options = {}) {
          if (options && options.count === 'exact') {
            isCount = true;
          }
          return builder;
        },
        eq(col, val) {
          rows = rows.filter((r) => r[col] === val);
          return builder;
        },
        neq(col, val) {
          rows = rows.filter((r) => r[col] !== val);
          return builder;
        },
        in(col, vals) {
          rows = rows.filter((r) => vals.includes(r[col]));
          return builder;
        },
        gte(col, val) {
          rows = rows.filter((r) => r[col] >= val);
          return builder;
        },
        lt(col, val) {
          rows = rows.filter((r) => r[col] < val);
          return builder;
        },
        order(col, options = {}) {
          orderField = col;
          orderAsc = options.ascending ?? true;
          return builder;
        },
        limit(n) {
          limitCount = n;
          return builder;
        },
        single() {
          isSingle = true;
          return builder;
        },
        maybeSingle() {
          isMaybeSingle = true;
          return builder;
        },
        insert(data) {
          pendingInsert = data;
          return builder;
        },
        update(data) {
          pendingUpdate = data;
          return builder;
        },
        delete(options = {}) {
          isDelete = true;
          if (options && options.count === 'exact') isCount = true;
          return builder;
        },
        async then(resolve, reject) {
          try {
            if (pendingInsert) {
              const inserted = Array.isArray(pendingInsert)
                ? pendingInsert.map((item, idx) => ({ id: item.id || `mock-${Date.now()}-${idx}`, ...item }))
                : [{ id: pendingInsert.id || `mock-${Date.now()}`, ...pendingInsert }];
              db[table].push(...inserted);
              const res = isSingle ? inserted[0] : inserted;
              return resolve({ data: res, error: null });
            }
            if (pendingUpdate) {
              const updated = [];
              for (const r of rows) {
                Object.assign(r, pendingUpdate);
                updated.push(r);
              }
              const res = isSingle ? updated[0] : updated;
              return resolve({ data: res, error: null });
            }
            if (isDelete) {
              const count = rows.length;
              db[table] = db[table].filter((r) => !rows.includes(r));
              return resolve({ data: null, count, error: null });
            }
            if (orderField) {
              rows.sort((a, b) => {
                if (a[orderField] === b[orderField]) return 0;
                if (a[orderField] == null) return orderAsc ? -1 : 1;
                if (b[orderField] == null) return orderAsc ? 1 : -1;
                return orderAsc
                  ? a[orderField] > b[orderField] ? 1 : -1
                  : a[orderField] < b[orderField] ? 1 : -1;
              });
            }
            if (limitCount != null) {
              rows = rows.slice(0, limitCount);
            }
            if (isSingle) {
              if (rows.length === 0) return resolve({ data: null, error: { message: 'Row not found' } });
              return resolve({ data: rows[0], error: null });
            }
            if (isMaybeSingle) {
              return resolve({ data: rows[0] || null, error: null });
            }
            return resolve({ data: rows, count: isCount ? rows.length : undefined, error: null });
          } catch (err) {
            reject(err);
          }
        },
      };
      return builder;
    },
  };
  return client;
}

// ============================================
// TAHAP 9: DASHBOARD & DETAIL MONITOR UTILITIES
// ============================================

test('Tahap 9: Uptime & Metrik - Perhitungan persentase uptime dan rata-rata latensi', () => {
  // Empty data
  assert.equal(calculateUptimePercent([]), null);
  assert.equal(calculateAverageResponseTime([]), null);

  // 100% up
  assert.equal(calculateUptimePercent([{ is_up: true }, { is_up: true }]), 100);

  // 75% up (3 up, 1 down)
  assert.equal(calculateUptimePercent([{ is_up: true }, { is_up: true }, { is_up: true }, { is_up: false }]), 75);

  // Rata-rata response time (100ms, 200ms, 300ms -> 200ms)
  assert.equal(calculateAverageResponseTime([{ response_ms: 100 }, { response_ms: 200 }, { response_ms: 300 }]), 200);
});

test('Tahap 9: Uptime & Metrik - Perhitungan segmen harian 90 hari dan warna status PRD', () => {
  const now = new Date();
  const todayKey = now.toISOString().slice(0, 10);

  const checks = [
    { checked_at: now.toISOString(), is_up: true },
    { checked_at: now.toISOString(), is_up: true },
  ];

  const segments = calculateDailyUptimeSegments(checks, 90);
  assert.equal(segments.length, 90);

  // Hari ini ada 2 check up -> green (100%)
  const todaySeg = segments[segments.length - 1];
  assert.equal(todaySeg.date, todayKey);
  assert.equal(todaySeg.status, 'green');
  assert.equal(todaySeg.uptimePercent, 100);

  // Segmen tanpa check -> gray
  const emptySeg = segments[0];
  assert.equal(emptySeg.status, 'gray');
  assert.equal(emptySeg.uptimePercent, null);
});

test('Tahap 9: Uptime & Metrik - Format durasi detik ke teks Bahasa Indonesia', () => {
  assert.equal(formatDurationSeconds(45), '45 detik');
  assert.equal(formatDurationSeconds(120), '2 menit');
  assert.equal(formatDurationSeconds(3600), '1 jam');
  assert.equal(formatDurationSeconds(3660), '1 jam 1 menit');
  assert.equal(formatDurationSeconds(86400), '1 hari');
  assert.equal(formatDurationSeconds(null), '-');
});

test('Tahap 9: Uptime & Metrik - Format status sertifikat SSL (>30, 8-30, <=7, expired, null)', () => {
  // > 30 hari -> safe (hijau)
  const safe = formatSslStatus(85);
  assert.equal(safe.level, 'safe');
  assert.equal(safe.label, '85 hari');

  const safe31 = formatSslStatus(31);
  assert.equal(safe31.level, 'safe');
  assert.equal(safe31.label, '31 hari');

  // 8 s/d 30 hari -> warning (kuning)
  const warn30 = formatSslStatus(30);
  assert.equal(warn30.level, 'warning');
  assert.equal(warn30.label, '30 hari');

  const warn8 = formatSslStatus(8);
  assert.equal(warn8.level, 'warning');
  assert.equal(warn8.label, '8 hari');

  // <= 7 hari -> danger (merah)
  const danger7 = formatSslStatus(7);
  assert.equal(danger7.level, 'danger');
  assert.equal(danger7.label, '7 hari');

  const danger1 = formatSslStatus(1);
  assert.equal(danger1.level, 'danger');
  assert.equal(danger1.label, '1 hari');

  // <= 0 -> expired
  const exp0 = formatSslStatus(0);
  assert.equal(exp0.level, 'expired');
  assert.equal(exp0.label, 'Expired');

  const expNegative = formatSslStatus(-5);
  assert.equal(expNegative.level, 'expired');
  assert.equal(expNegative.label, 'Expired');

  // null / undefined -> none ('-')
  const noneNull = formatSslStatus(null);
  assert.equal(noneNull.level, 'none');
  assert.equal(noneNull.label, '-');
});

// ============================================
// TAHAP 10: STATUS PAGES & HALAMAN PUBLIK
// ============================================

test('Tahap 10: Status Pages - CRUD Status Page dan validasi batas kuota Free (maks 1)', async () => {
  const supabase = createMockSupabase({
    profiles: [{ id: 'user-sp', email: 'sp@example.com', plan: 'free' }],
    status_pages: [],
  });
  const service = new StatusPageService(supabase);

  // 1. Buat status page pertama (berhasil)
  const sp1 = await service.createStatusPage('user-sp', {
    title: 'Status Toko Saya',
    slug: 'toko-saya',
    description: 'Situs resmi operasional',
    is_public: true,
  }, 'free');

  assert.equal(sp1.title, 'Status Toko Saya');
  assert.equal(sp1.slug, 'toko-saya');
  assert.equal(sp1.owner_id, 'user-sp');

  // 2. Buat status page kedua di paket Free -> Ditolak 403 PLAN_LIMIT_REACHED
  await assert.rejects(
    async () => {
      await service.createStatusPage('user-sp', {
        title: 'Status Page Kedua',
        slug: 'page-kedua',
      }, 'free');
    },
    (err) => {
      assert(err instanceof AppError);
      assert.equal(err.statusCode, 403);
      assert.equal(err.code, ErrorCode.PLAN_LIMIT_REACHED);
      return true;
    }
  );
});

test('Tahap 10: Status Pages - Validasi keunikan slug di server menolak duplikasi', async () => {
  const supabase = createMockSupabase({
    profiles: [{ id: 'user-1', email: 'u1@example.com', plan: 'pro' }],
    status_pages: [
      { id: 'sp-1', owner_id: 'user-1', slug: 'status-server', title: 'Status 1', is_public: true },
    ],
  });
  const service = new StatusPageService(supabase);

  // Pengecekan availability
  const available = await service.isSlugAvailable('status-server');
  assert.equal(available, false);

  const availableNew = await service.isSlugAvailable('slug-baru');
  assert.equal(availableNew, true);

  // Mencoba buat dengan slug yang sama -> 400
  await assert.rejects(
    async () => {
      await service.createStatusPage('user-1', {
        title: 'Status Duplikat',
        slug: 'status-server',
      }, 'pro');
    },
    (err) => {
      assert(err instanceof AppError);
      assert.equal(err.statusCode, 400);
      assert.equal(err.code, ErrorCode.VALIDATION_ERROR);
      return true;
    }
  );
});

test('Tahap 10: Status Pages - Isolasi data antarpengguna (Akun B tidak bisa update/delete milik Akun A)', async () => {
  const supabase = createMockSupabase({
    profiles: [
      { id: 'user-a', email: 'a@example.com', plan: 'pro' },
      { id: 'user-b', email: 'b@example.com', plan: 'pro' },
    ],
    status_pages: [
      { id: 'sp-a', owner_id: 'user-a', slug: 'status-a', title: 'Milik A', is_public: true },
    ],
  });
  const service = new StatusPageService(supabase);

  // User B mencoba update status page milik User A
  await assert.rejects(
    async () => {
      await service.updateStatusPage('sp-a', 'user-b', { title: 'Hacked Title' });
    },
    (err) => {
      assert(err instanceof AppError);
      assert.equal(err.statusCode, 404);
      return true;
    }
  );

  // User B mencoba delete status page milik User A
  await assert.rejects(
    async () => {
      await service.deleteStatusPage('sp-a', 'user-b');
    },
    (err) => {
      assert(err instanceof AppError);
      assert.equal(err.statusCode, 404);
      return true;
    }
  );
});

test('Tahap 10: Halaman Publik - getPublicStatusPageData menghasilkan agregat status dan menolak slug privat/tidak ada', async () => {
  const supabase = createMockSupabase({
    status_pages: [
      { id: 'sp-public', owner_id: 'user-1', slug: 'publik-normal', title: 'Layanan Publik', is_public: true },
      { id: 'sp-private', owner_id: 'user-1', slug: 'privat-rahasia', title: 'Layanan Rahasia', is_public: false },
    ],
    monitors: [
      { id: 'm1', status_page_id: 'sp-public', name: 'Web Utama', current_status: 'up', last_response_ms: 120, is_active: true },
      { id: 'm2', status_page_id: 'sp-public', name: 'API Server', current_status: 'up', last_response_ms: 80, is_active: true },
    ],
    checks: [],
    incidents: [],
  });
  const service = new StatusPageService(supabase);

  // 1. Slug publik yang valid
  const pubData = await service.getPublicStatusPageData('publik-normal');
  assert.equal(pubData.title, 'Layanan Publik');
  assert.equal(pubData.slug, 'publik-normal');
  assert.equal(pubData.aggregateStatus, 'operational');
  assert.equal(pubData.aggregateLabel, 'Semua sistem normal');
  assert.equal(pubData.monitors.length, 2);

  // Pastikan tidak membocorkan data privat
  assert.equal(pubData.owner_id, undefined);

  // 2. Slug privat -> 404
  await assert.rejects(
    async () => {
      await service.getPublicStatusPageData('privat-rahasia');
    },
    (err) => {
      assert(err instanceof AppError);
      assert.equal(err.statusCode, 404);
      return true;
    }
  );

  // 3. Slug tidak ada -> 404
  await assert.rejects(
    async () => {
      await service.getPublicStatusPageData('tidak-ada');
    },
    (err) => {
      assert(err instanceof AppError);
      assert.equal(err.statusCode, 404);
      return true;
    }
  );
});

// ============================================
// TAHAP 11: SETTINGS & PERUBAHAN PAKET
// ============================================

test('Tahap 11: Plan Service - Upgrade ke Pro berhasil memperbarui profil pengguna', async () => {
  const supabase = createMockSupabase({
    profiles: [{ id: 'user-upgrade', email: 'up@example.com', plan: 'free' }],
    monitors: [],
    status_pages: [],
  });
  const planService = new PlanService(supabase);

  const updated = await planService.updatePlan('user-upgrade', { plan: 'pro' });
  assert.equal(updated.plan, 'pro');
  assert.equal(supabase._db.profiles[0].plan, 'pro');
});

test('Tahap 11: Plan Service - Tolak downgrade ke Free jika pengguna memiliki lebih dari 3 monitor', async () => {
  const supabase = createMockSupabase({
    profiles: [{ id: 'user-pro', email: 'pro@example.com', plan: 'pro' }],
    monitors: [
      { id: 'm1', owner_id: 'user-pro', name: 'M1' },
      { id: 'm2', owner_id: 'user-pro', name: 'M2' },
      { id: 'm3', owner_id: 'user-pro', name: 'M3' },
      { id: 'm4', owner_id: 'user-pro', name: 'M4' },
    ],
    status_pages: [],
  });
  const planService = new PlanService(supabase);

  await assert.rejects(
    async () => {
      await planService.updatePlan('user-pro', { plan: 'free' });
    },
    (err) => {
      assert(err instanceof AppError);
      assert.equal(err.statusCode, 400);
      assert.equal(err.code, ErrorCode.PLAN_LIMIT_REACHED);
      assert.match(err.message, /Hapus 1 monitor terlebih dahulu/);
      return true;
    }
  );

  // Profil tetap pro
  assert.equal(supabase._db.profiles[0].plan, 'pro');
});

test('Tahap 11: Plan Service - Tolak downgrade ke Free jika status page > 1', async () => {
  const supabase = createMockSupabase({
    profiles: [{ id: 'user-pro-sp', email: 'sp@example.com', plan: 'pro' }],
    monitors: [{ id: 'm1', owner_id: 'user-pro-sp', name: 'M1' }],
    status_pages: [
      { id: 'sp1', owner_id: 'user-pro-sp', slug: 'sp1', title: 'SP1' },
      { id: 'sp2', owner_id: 'user-pro-sp', slug: 'sp2', title: 'SP2' },
    ],
  });
  const planService = new PlanService(supabase);

  await assert.rejects(
    async () => {
      await planService.updatePlan('user-pro-sp', { plan: 'free' });
    },
    (err) => {
      assert(err instanceof AppError);
      assert.equal(err.statusCode, 400);
      assert.equal(err.code, ErrorCode.PLAN_LIMIT_REACHED);
      assert.match(err.message, /Hapus 1 status page terlebih dahulu/);
      return true;
    }
  );
});

test('Tahap 11: Plan Service - Berhasil downgrade ke Free jika monitor <= 3 dan status page <= 1', async () => {
  const supabase = createMockSupabase({
    profiles: [{ id: 'user-downgrade', email: 'dg@example.com', plan: 'pro' }],
    monitors: [
      { id: 'm1', owner_id: 'user-downgrade', name: 'M1' },
      { id: 'm2', owner_id: 'user-downgrade', name: 'M2' },
    ],
    status_pages: [
      { id: 'sp1', owner_id: 'user-downgrade', slug: 'sp1', title: 'SP1' },
    ],
  });
  const planService = new PlanService(supabase);

  const updated = await planService.updatePlan('user-downgrade', { plan: 'free' });
  assert.equal(updated.plan, 'free');
  assert.equal(supabase._db.profiles[0].plan, 'free');
});
