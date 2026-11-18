import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import {
  MonitorService,
  MonitorRepository,
  CheckRepository,
  IncidentRepository,
  IncidentService,
  computeIncidentState,
  checkSingleMonitor,
  runScheduledChecks,
  checkRateLimit,
  verifyCronSecret,
  performSslCheck,
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
// TAHAP 5: CRUD MONITOR & DATA ISOLATION & LIMITS
// ============================================

test('Tahap 5: CRUD Monitor - Buat monitor baru dengan validasi dan default interval', async () => {
  const supabase = createMockSupabase({
    profiles: [{ id: 'user-1', email: 'user1@example.com', plan: 'free' }],
  });
  const service = new MonitorService(supabase);

  const monitor = await service.createMonitor('user-1', {
    name: 'Situs Utama',
    url: 'https://example.com',
  });

  assert.equal(monitor.name, 'Situs Utama');
  assert.equal(monitor.url, 'https://example.com');
  assert.equal(monitor.interval_minutes, 10); // default free = 10
  assert.equal(monitor.owner_id, 'user-1');
  assert.equal(monitor.current_status, 'unknown');
});

test('Tahap 5: CRUD Monitor - Proteksi SSRF menolak target localhost dan IP privat saat buat monitor', async () => {
  const supabase = createMockSupabase({
    profiles: [{ id: 'user-1', email: 'user1@example.com', plan: 'free' }],
  });
  const service = new MonitorService(supabase);

  await assert.rejects(
    async () => {
      await service.createMonitor('user-1', {
        name: 'Local Attack',
        url: 'http://localhost:3000',
      });
    },
    (err) => {
      assert(err instanceof AppError);
      assert.equal(err.statusCode, 400);
      assert.equal(err.code, ErrorCode.SSRF_BLOCKED);
      return true;
    }
  );

  await assert.rejects(
    async () => {
      await service.createMonitor('user-1', {
        name: 'Private IP Attack',
        url: 'http://192.168.1.1',
      });
    },
    (err) => {
      assert(err instanceof AppError);
      assert.equal(err.statusCode, 400);
      assert.equal(err.code, ErrorCode.SSRF_BLOCKED);
      return true;
    }
  );
});

test('Tahap 5: CRUD Monitor - Penegakan limit paket Free (maks 3 monitor) mengembalikan HTTP 403 PLAN_LIMIT_REACHED', async () => {
  const supabase = createMockSupabase({
    profiles: [{ id: 'user-free', email: 'free@example.com', plan: 'free' }],
    monitors: [
      { id: 'm1', owner_id: 'user-free', name: 'Mon 1', url: 'https://example1.com' },
      { id: 'm2', owner_id: 'user-free', name: 'Mon 2', url: 'https://example2.com' },
      { id: 'm3', owner_id: 'user-free', name: 'Mon 3', url: 'https://example3.com' },
    ],
  });
  const service = new MonitorService(supabase);

  await assert.rejects(
    async () => {
      await service.createMonitor('user-free', {
        name: 'Mon 4',
        url: 'https://example4.com',
      });
    },
    (err) => {
      assert(err instanceof AppError);
      assert.equal(err.statusCode, 403);
      assert.equal(err.code, ErrorCode.PLAN_LIMIT_REACHED);
      return true;
    }
  );
});

test('Tahap 5: CRUD Monitor - Isolasi data antar pengguna (Akun B tidak bisa lihat/ubah/hapus monitor Akun A)', async () => {
  const supabase = createMockSupabase({
    profiles: [
      { id: 'user-a', email: 'a@example.com', plan: 'free' },
      { id: 'user-b', email: 'b@example.com', plan: 'free' },
    ],
    monitors: [
      { id: 'mon-a', owner_id: 'user-a', name: 'Monitor Milik A', url: 'https://a.com' },
    ],
  });
  const service = new MonitorService(supabase);

  // User B melihat daftar monitor miliknya
  const listB = await service.listMonitors('user-b');
  assert.equal(listB.length, 0);

  // User B mencoba melihat detail monitor milik User A -> Harus ditolak 404
  await assert.rejects(
    async () => {
      await service.getMonitorById('mon-a', 'user-b');
    },
    (err) => {
      assert(err instanceof AppError);
      assert.equal(err.statusCode, 404);
      assert.equal(err.code, ErrorCode.NOT_FOUND);
      return true;
    }
  );

  // User B mencoba update monitor milik User A
  await assert.rejects(
    async () => {
      await service.updateMonitor('mon-a', 'user-b', { name: 'Hacked' });
    },
    (err) => {
      assert(err instanceof AppError);
      assert.equal(err.statusCode, 404);
      return true;
    }
  );

  // User B mencoba hapus monitor milik User A
  await assert.rejects(
    async () => {
      await service.deleteMonitor('mon-a', 'user-b');
    },
    (err) => {
      assert(err instanceof AppError);
      assert.equal(err.statusCode, 404);
      return true;
    }
  );
});

// ============================================
// TAHAP 6: CHECKER & RATE LIMITING & SSL
// ============================================

test('Tahap 6: Rate Limiter - Membatasi Check Now maks 5 kali per menit per user', () => {
  const userId = 'user-test-rl-' + Date.now();
  const key = `check-now:${userId}`;

  // 5 panggilan pertama harus berhasil tanpa error
  for (let i = 0; i < 5; i++) {
    assert.doesNotThrow(() => checkRateLimit(key, 5, 60000));
  }

  // Panggilan ke-6 harus gagal dengan 429 RATE_LIMITED
  assert.throws(
    () => checkRateLimit(key, 5, 60000),
    (err) => {
      assert(err instanceof AppError);
      assert.equal(err.statusCode, 429);
      assert.equal(err.code, ErrorCode.RATE_LIMITED);
      return true;
    }
  );
});

test('Tahap 6: SSL Check - Menangani domain dan URL https dengan aman tanpa unhandled exception', async () => {
  // Pengecekan terhadap hostname dummy / unreachable
  const result = await performSslCheck('127.0.0.1.nonexistent.domain', 1000);
  assert.equal(result.expiresAt, null);
  assert.notEqual(result.error, null);
});

test('Tahap 6: checkSingleMonitor - Melakukan pengecekan, mencatat checks, dan update monitors', async () => {
  const mockMonitor = {
    id: 'mon-123',
    owner_id: 'user-1',
    name: 'Test Mon',
    url: 'https://example.com',
    method: 'GET',
    interval_minutes: 10,
    expected_status: 200,
    timeout_ms: 3000,
    is_active: true,
    current_status: 'unknown',
    consecutive_failures: 0,
    last_checked_at: null,
    last_status_code: null,
    last_response_ms: null,
    ssl_expires_at: null,
    created_at: new Date().toISOString(),
  };

  const supabase = createMockSupabase({
    monitors: [mockMonitor],
    checks: [],
    incidents: [],
  });

  // Jalankan checkSingleMonitor
  const execution = await checkSingleMonitor(mockMonitor, supabase);

  assert.ok(execution.check);
  assert.equal(execution.check.monitor_id, 'mon-123');
  assert.ok(typeof execution.result.http.responseMs === 'number');

  // Pastikan record tersimpan di tabel checks dan monitors ter-update
  assert.equal(supabase._db.checks.length, 1);
  assert.equal(supabase._db.monitors[0].id, 'mon-123');
  assert.ok(supabase._db.monitors[0].last_checked_at !== null);
});

// ============================================
// TAHAP 7: CRON, AUTH, RETENTION & STATE MACHINE INSIDEN
// ============================================

test('Tahap 7: Cron Auth - verifyCronSecret memverifikasi token constant-time secara aman', () => {
  const secret = 'super-secret-cron-key-1234567890';

  // 1. Header valid
  assert.doesNotThrow(() => {
    verifyCronSecret(`Bearer ${secret}`, secret);
  });

  // 2. Header tidak ada
  assert.throws(
    () => verifyCronSecret(null, secret),
    (err) => {
      assert(err instanceof AppError);
      assert.equal(err.statusCode, 401);
      return true;
    }
  );

  // 3. Format bukan Bearer
  assert.throws(
    () => verifyCronSecret(`Basic ${secret}`, secret),
    (err) => {
      assert(err instanceof AppError);
      assert.equal(err.statusCode, 401);
      return true;
    }
  );

  // 4. Secret salah
  assert.throws(
    () => verifyCronSecret('Bearer wrong-secret-token', secret),
    (err) => {
      assert(err instanceof AppError);
      assert.equal(err.statusCode, 401);
      return true;
    }
  );

  // 5. Secret salah panjang (mismatched buffer length lebih pendek & lebih panjang tidak membuat crash)
  assert.throws(
    () => verifyCronSecret('Bearer short', secret),
    (err) => {
      assert(err instanceof AppError);
      assert.equal(err.statusCode, 401);
      return true;
    }
  );

  assert.throws(
    () => verifyCronSecret(`Bearer ${secret}-much-longer-suffix-that-exceeds-length`, secret),
    (err) => {
      assert(err instanceof AppError);
      assert.equal(err.statusCode, 401);
      return true;
    }
  );

  assert.throws(
    () => verifyCronSecret('Bearer ', secret),
    (err) => {
      assert(err instanceof AppError);
      assert.equal(err.statusCode, 401);
      return true;
    }
  );
});

test('Tahap 7: State Machine Insiden - Fungsi murni computeIncidentState menangani semua transisi', () => {
  // Transisi 1: Gagal pertama kali (consecutive_failures = 0 -> 1), belum buka insiden (mencegah flapping)
  const t1 = computeIncidentState(0, 'up', false, false);
  assert.equal(t1.nextStatus, 'up');
  assert.equal(t1.consecutiveFailures, 1);
  assert.equal(t1.shouldOpenIncident, false);
  assert.equal(t1.shouldResolveIncident, false);

  // Transisi 2: Gagal kedua kali (consecutive_failures = 1 -> 2), insiden HARUS dibuka dan status down
  const t2 = computeIncidentState(1, 'up', false, false);
  assert.equal(t2.nextStatus, 'down');
  assert.equal(t2.consecutiveFailures, 2);
  assert.equal(t2.shouldOpenIncident, true);
  assert.equal(t2.shouldResolveIncident, false);

  // Transisi 3: Gagal berlanjut saat sudah ada insiden open -> jangan buka ganda (idempoten)
  const t3 = computeIncidentState(2, 'down', true, false);
  assert.equal(t3.nextStatus, 'down');
  assert.equal(t3.consecutiveFailures, 3);
  assert.equal(t3.shouldOpenIncident, false);
  assert.equal(t3.shouldResolveIncident, false);

  // Transisi 4: Sukses kembali saat insiden open -> reset kegagalan ke 0, status up, dan resolve insiden
  const t4 = computeIncidentState(3, 'down', true, true);
  assert.equal(t4.nextStatus, 'up');
  assert.equal(t4.consecutiveFailures, 0);
  assert.equal(t4.shouldOpenIncident, false);
  assert.equal(t4.shouldResolveIncident, true);

  // Transisi 5: Sukses saat tidak ada insiden -> status tetap up, consecutiveFailures 0
  const t5 = computeIncidentState(0, 'up', false, true);
  assert.equal(t5.nextStatus, 'up');
  assert.equal(t5.consecutiveFailures, 0);
  assert.equal(t5.shouldOpenIncident, false);
  assert.equal(t5.shouldResolveIncident, false);
});

test('Tahap 7: State Machine Insiden - 2x gagal beruntun membuka insiden; idempotensi & pemulihan otomatis', async () => {
  const supabase = createMockSupabase({
    incidents: [],
  });
  const incidentService = new IncidentService(supabase);

  const monitor = {
    id: 'mon-incident-1',
    owner_id: 'user-1',
    name: 'Situs Toko',
    url: 'https://tokoku.com',
    method: 'GET',
    interval_minutes: 5,
    expected_status: 200,
    timeout_ms: 5000,
    is_active: true,
    current_status: 'up',
    consecutive_failures: 0,
    last_checked_at: null,
    last_status_code: 200,
    last_response_ms: 120,
    ssl_expires_at: null,
    created_at: new Date().toISOString(),
  };

  // Check 1: GAGAL pertama kali (consecutive_failures = 1) -> Belum membuka insiden untuk mencegah flapping
  const res1 = await incidentService.processCheckResult(monitor, false, 'TIMEOUT');
  assert.equal(res1.consecutiveFailures, 1);
  assert.equal(res1.incidentOpened, false);
  assert.equal(res1.nextStatus, 'up'); // Belum down
  assert.equal(supabase._db.incidents.length, 0);

  // Perbarui state monitor
  monitor.consecutive_failures = 1;

  // Check 2: GAGAL kedua kali (consecutive_failures = 2) -> Buka insiden OPEN dan status menjadi down
  const res2 = await incidentService.processCheckResult(monitor, false, 'TIMEOUT');
  assert.equal(res2.consecutiveFailures, 2);
  assert.equal(res2.incidentOpened, true);
  assert.equal(res2.nextStatus, 'down');
  assert.equal(supabase._db.incidents.length, 1);
  assert.equal(supabase._db.incidents[0].status, 'open');
  assert.equal(supabase._db.incidents[0].title, 'Situs Toko tidak dapat diakses');

  // Perbarui state monitor
  monitor.consecutive_failures = 2;
  monitor.current_status = 'down';

  // Check 3: GAGAL ketiga kali -> Idempotensi: TIDAK membuat insiden ganda!
  const res3 = await incidentService.processCheckResult(monitor, false, 'TIMEOUT');
  assert.equal(res3.consecutiveFailures, 3);
  assert.equal(res3.incidentOpened, false); // Tidak membuka insiden baru
  assert.equal(res3.nextStatus, 'down');
  assert.equal(supabase._db.incidents.length, 1); // Tetap 1 insiden

  // Check 4: Pengecekan SUKSES (Pemulihan) -> Menutup insiden (resolved) dan status kembali up
  const res4 = await incidentService.processCheckResult(monitor, true, null);
  assert.equal(res4.consecutiveFailures, 0);
  assert.equal(res4.incidentResolved, true);
  assert.equal(res4.nextStatus, 'up');
  assert.equal(supabase._db.incidents[0].status, 'resolved');
  assert.ok(supabase._db.incidents[0].resolved_at !== null);
});

test('Tahap 7: runScheduledChecks - Eksekusi batch, filter jatuh tempo, dan retensi data', async () => {
  const now = Date.now();
  const pastDue = new Date(now - 15 * 60 * 1000).toISOString(); // 15 menit lalu
  const notDue = new Date(now - 2 * 60 * 1000).toISOString(); // 2 menit lalu

  const supabase = createMockSupabase({
    profiles: [{ id: 'user-1', email: 'u1@example.com', plan: 'free' }],
    monitors: [
      {
        id: 'mon-due',
        owner_id: 'user-1',
        name: 'Due Monitor',
        url: 'https://example.com',
        method: 'GET',
        interval_minutes: 5,
        expected_status: 200,
        timeout_ms: 3000,
        is_active: true,
        current_status: 'unknown',
        consecutive_failures: 0,
        last_checked_at: pastDue,
        last_status_code: null,
        last_response_ms: null,
        ssl_expires_at: null,
        created_at: new Date().toISOString(),
      },
      {
        id: 'mon-not-due',
        owner_id: 'user-1',
        name: 'Not Due Monitor',
        url: 'https://example.com',
        method: 'GET',
        interval_minutes: 10,
        expected_status: 200,
        timeout_ms: 3000,
        is_active: true,
        current_status: 'up',
        consecutive_failures: 0,
        last_checked_at: notDue,
        last_status_code: 200,
        last_response_ms: 80,
        ssl_expires_at: null,
        created_at: new Date().toISOString(),
      },
    ],
    checks: [],
    incidents: [],
  });

  const summary = await runScheduledChecks(supabase);

  // Hanya 1 monitor yang jatuh tempo
  assert.equal(summary.checked, 1);
  assert.ok(summary.duration_ms >= 0);
  assert.equal(supabase._db.checks.length, 1);
});

// ============================================
// TAHAP 8: GITHUB ACTIONS WORKFLOW VERIFIKASI
// ============================================

test('Tahap 8: GitHub Actions Workflow - File workflow valid sesuai PRD Bagian 14.2', () => {
  let workflowPath = path.resolve(process.cwd(), '.github/workflows/run-checks.yml');
  if (!fs.existsSync(workflowPath)) {
    workflowPath = path.resolve(process.cwd(), '../.github/workflows/run-checks.yml');
  }
  assert.ok(fs.existsSync(workflowPath), 'Workflow file run-checks.yml harus ada');

  const content = fs.readFileSync(workflowPath, 'utf8');

  // 1. Schedule tiap 5 menit
  assert.match(content, /cron:\s*["']\*\/(?:5|\*)[^"']*["']/);

  // 2. workflow_dispatch untuk manual trigger
  assert.match(content, /workflow_dispatch:/);

  // 3. POST ke /api/cron/run-checks dengan Bearer token
  assert.match(content, /\/api\/cron\/run-checks/);
  assert.match(content, /Authorization:\s*Bearer\s*\${{\s*secrets\.CRON_SECRET\s*}}/);
  assert.match(content, /secrets\.APP_URL/);
});
