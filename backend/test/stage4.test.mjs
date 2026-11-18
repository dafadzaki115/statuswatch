import test from 'node:test';
import assert from 'node:assert/strict';

import {
  PLAN_LIMITS,
  getPlanLimits,
  getDefaultIntervalForPlan,
  isIntervalAllowedForPlan,
  assertIntervalAllowedForPlan,
  assertCanCreateMonitor,
  assertCanCreateStatusPage,
} from '../dist/lib/plans.js';

import {
  createMonitorSchema,
  updateMonitorSchema,
  resolveMonitorInterval,
} from '../dist/validators/monitor.validator.js';

import {
  createStatusPageSchema,
  updateStatusPageSchema,
} from '../dist/validators/status-page.validator.js';

import { updatePlanSchema } from '../dist/validators/plan.validator.js';

import {
  isPrivateIp,
  validateUrlNotSSRF,
  validateUrlNotSSRFAsync,
  validateRedirectUrl,
} from '../dist/security/ssrf-guard.js';

// ============================================
// 1. PENGUJIAN PLANS & LIMIT ATURAN
// ============================================
test('Plans: Batasan Paket Free dan Pro sesuai PRD', () => {
  const freeLimits = getPlanLimits('free');
  assert.equal(freeLimits.maxMonitors, 3);
  assert.equal(freeLimits.minIntervalMinutes, 10);
  assert.equal(freeLimits.maxStatusPages, 1);
  assert.equal(freeLimits.retentionDays, 7);

  const proLimits = getPlanLimits('pro');
  assert.equal(proLimits.maxMonitors, 20);
  assert.equal(proLimits.minIntervalMinutes, 5);
  assert.equal(proLimits.maxStatusPages, 5);
  assert.equal(proLimits.retentionDays, 30);
});

test('Plans: Default interval per paket (Free = 10 menit, Pro = 5 menit)', () => {
  assert.equal(getDefaultIntervalForPlan('free'), 10);
  assert.equal(getDefaultIntervalForPlan('pro'), 5);
});

test('Plans: Validasi interval Free vs Pro dan penanganan status code HTTP 400 vs 403', () => {
  assert.equal(isIntervalAllowedForPlan(5, 'free'), false);
  assert.equal(isIntervalAllowedForPlan(10, 'free'), true);
  assert.equal(isIntervalAllowedForPlan(30, 'free'), true);
  assert.equal(isIntervalAllowedForPlan(60, 'free'), true);

  // Pro mengizinkan 5 menit
  assert.equal(isIntervalAllowedForPlan(5, 'pro'), true);

  // 1. Kesalahan format atau input tidak valid (misal: 7 menit) -> HTTP 400 (VALIDATION_ERROR)
  assert.throws(
    () => assertIntervalAllowedForPlan(7, 'free'),
    (err) => err.code === 'VALIDATION_ERROR' && err.statusCode === 400
  );
  assert.throws(
    () => assertIntervalAllowedForPlan(-5, 'pro'),
    (err) => err.code === 'VALIDATION_ERROR' && err.statusCode === 400
  );

  // 2. Pelanggaran batas paket (Free mencoba interval 5 menit) -> HTTP 403 (PLAN_LIMIT_REACHED)
  assert.throws(
    () => assertIntervalAllowedForPlan(5, 'free'),
    (err) => err.code === 'PLAN_LIMIT_REACHED' && err.statusCode === 403
  );

  // 3. Interval yang sah sesuai paket -> tidak melempar error
  assert.doesNotThrow(() => assertIntervalAllowedForPlan(10, 'free'));
  assert.doesNotThrow(() => assertIntervalAllowedForPlan(30, 'free'));
  assert.doesNotThrow(() => assertIntervalAllowedForPlan(60, 'free'));
  assert.doesNotThrow(() => assertIntervalAllowedForPlan(5, 'pro'));
});

test('Plans: Penegakan kuota monitor dan status page di server', () => {
  // Kuota monitor Free: 3
  assert.doesNotThrow(() => assertCanCreateMonitor(2, 'free'));
  assert.throws(
    () => assertCanCreateMonitor(3, 'free'),
    (err) => err.code === 'PLAN_LIMIT_REACHED' && err.statusCode === 403
  );

  // Kuota status page Free: 1
  assert.doesNotThrow(() => assertCanCreateStatusPage(0, 'free'));
  assert.throws(
    () => assertCanCreateStatusPage(1, 'free'),
    (err) => err.code === 'PLAN_LIMIT_REACHED' && err.statusCode === 403
  );

  // Kuota monitor Pro: 20
  assert.doesNotThrow(() => assertCanCreateMonitor(19, 'pro'));
  assert.throws(
    () => assertCanCreateMonitor(20, 'pro'),
    (err) => err.code === 'PLAN_LIMIT_REACHED' && err.statusCode === 403
  );
});

// ============================================
// 2. PENGUJIAN VALIDATORS (ZOD)
// ============================================
test('Validator: Monitor Schema validasi lengkap', () => {
  // Valid monitor input
  const valid = createMonitorSchema.safeParse({
    name: 'Website Toko',
    url: 'https://myshop.com/health',
    method: 'GET',
    interval_minutes: 10,
    expected_status: 200,
    timeout_ms: 5000,
  });
  assert.equal(valid.success, true);

  // Invalid: nama kosong
  const invalidName = createMonitorSchema.safeParse({
    name: '   ',
    url: 'https://myshop.com',
  });
  assert.equal(invalidName.success, false);

  // Invalid: protokol bukan http/https
  const invalidProtocol = createMonitorSchema.safeParse({
    name: 'FTP Service',
    url: 'ftp://files.example.com',
  });
  assert.equal(invalidProtocol.success, false);

  // Invalid: method selain GET/HEAD
  const invalidMethod = createMonitorSchema.safeParse({
    name: 'API Service',
    url: 'https://example.com',
    method: 'POST',
  });
  assert.equal(invalidMethod.success, false);

  // Invalid: status code di luar 100-599
  const invalidStatus = createMonitorSchema.safeParse({
    name: 'API Service',
    url: 'https://example.com',
    expected_status: 99,
  });
  assert.equal(invalidStatus.success, false);

  // Invalid: timeout di luar 1000-8000 ms
  const invalidTimeout = createMonitorSchema.safeParse({
    name: 'API Service',
    url: 'https://example.com',
    timeout_ms: 10000,
  });
  assert.equal(invalidTimeout.success, false);
});

test('Validator: resolveMonitorInterval mencegah Free lolos 5 menit karena default DB', () => {
  // Jika pengguna Free tidak mengisi interval, default diubah menjadi 10 (bukan 5 default DB)
  assert.equal(resolveMonitorInterval(undefined, 'free'), 10);

  // Pengguna Pro mendapatkan default 5
  assert.equal(resolveMonitorInterval(undefined, 'pro'), 5);

  // Jika Free mencoba kirim 5 menit secara eksplisit -> ditolak
  assert.throws(
    () => resolveMonitorInterval(5, 'free'),
    (err) => err.code === 'PLAN_LIMIT_REACHED'
  );

  // Jika Free kirim 10 menit -> diterima
  assert.equal(resolveMonitorInterval(10, 'free'), 10);
});

test('Validator: Status Page Schema validasi slug & title', () => {
  // Valid slug
  const valid = createStatusPageSchema.safeParse({
    slug: 'status-toko-rina',
    title: 'Status Toko Rina',
    description: 'Halaman status resmi',
    is_public: true,
  });
  assert.equal(valid.success, true);

  // Invalid: slug diawali strip
  const invalidSlugPrefix = createStatusPageSchema.safeParse({
    slug: '-invalid-slug',
    title: 'Status',
  });
  assert.equal(invalidSlugPrefix.success, false);

  // Invalid: slug mengandung huruf kapital
  const invalidSlugUpper = createStatusPageSchema.safeParse({
    slug: 'Invalid-Slug',
    title: 'Status',
  });
  assert.equal(invalidSlugUpper.success, false);

  // Invalid: slug terlalu pendek (< 3 karakter)
  const invalidSlugShort = createStatusPageSchema.safeParse({
    slug: 'ab',
    title: 'Status',
  });
  assert.equal(invalidSlugShort.success, false);
});

test('Validator: Plan Schema hanya menerima free atau pro', () => {
  assert.equal(updatePlanSchema.safeParse({ plan: 'free' }).success, true);
  assert.equal(updatePlanSchema.safeParse({ plan: 'pro' }).success, true);
  assert.equal(updatePlanSchema.safeParse({ plan: 'enterprise' }).success, false);
  assert.equal(updatePlanSchema.safeParse({ plan: 'invalid' }).success, false);
});

// ============================================
// 3. PENGUJIAN SSRF GUARD
// ============================================
test('SSRF Guard: isPrivateIp menolak semua rentang IP terlarang', () => {
  // Loopback IPv4
  assert.equal(isPrivateIp('127.0.0.1'), true);
  assert.equal(isPrivateIp('127.255.255.255'), true);

  // 0.0.0.0 / unspecified
  assert.equal(isPrivateIp('0.0.0.0'), true);

  // Private Class A, B, C
  assert.equal(isPrivateIp('10.0.0.1'), true);
  assert.equal(isPrivateIp('10.254.0.1'), true);
  assert.equal(isPrivateIp('172.16.0.1'), true);
  assert.equal(isPrivateIp('172.31.255.255'), true);
  assert.equal(isPrivateIp('192.168.0.1'), true);
  assert.equal(isPrivateIp('192.168.1.1'), true);
  assert.equal(isPrivateIp('192.168.1.100'), true);

  // Link-local & Cloud Metadata (AWS, GCP, Azure, DO, etc.)
  assert.equal(isPrivateIp('169.254.169.254'), true);
  assert.equal(isPrivateIp('169.254.0.1'), true);

  // Loopback & Private IPv6
  assert.equal(isPrivateIp('::1'), true);
  assert.equal(isPrivateIp('::'), true);
  assert.equal(isPrivateIp('fe80::1'), true);
  assert.equal(isPrivateIp('fc00::1'), true);
  assert.equal(isPrivateIp('fd12:3456::1'), true);
  assert.equal(isPrivateIp('::ffff:127.0.0.1'), true);
  assert.equal(isPrivateIp('::ffff:169.254.169.254'), true);

  // IP Publik Valid (diterima)
  assert.equal(isPrivateIp('93.184.216.34'), false);
  assert.equal(isPrivateIp('8.8.8.8'), false);
  assert.equal(isPrivateIp('1.1.1.1'), false);
  assert.equal(isPrivateIp('2606:4700:4700::1111'), false);
});

test('SSRF Guard: validateUrlNotSSRF menolak localhost dan IP privat secara sinkron', () => {
  // localhost ditolak
  assert.throws(
    () => validateUrlNotSSRF('http://localhost'),
    (err) => err.code === 'SSRF_BLOCKED'
  );
  assert.throws(
    () => validateUrlNotSSRF('http://localhost:3000'),
    (err) => err.code === 'SSRF_BLOCKED'
  );
  assert.throws(
    () => validateUrlNotSSRF('http://app.localhost'),
    (err) => err.code === 'SSRF_BLOCKED'
  );

  // 127.0.0.1 ditolak
  assert.throws(
    () => validateUrlNotSSRF('http://127.0.0.1'),
    (err) => err.code === 'SSRF_BLOCKED'
  );
  assert.throws(
    () => validateUrlNotSSRF('http://127.0.0.1:8080'),
    (err) => err.code === 'SSRF_BLOCKED'
  );

  // 192.168.x.x ditolak
  assert.throws(
    () => validateUrlNotSSRF('http://192.168.1.1'),
    (err) => err.code === 'SSRF_BLOCKED'
  );
  assert.throws(
    () => validateUrlNotSSRF('https://192.168.0.254'),
    (err) => err.code === 'SSRF_BLOCKED'
  );

  // 10.x.x.x ditolak
  assert.throws(
    () => validateUrlNotSSRF('http://10.0.0.5'),
    (err) => err.code === 'SSRF_BLOCKED'
  );

  // 172.16-31.x.x ditolak
  assert.throws(
    () => validateUrlNotSSRF('http://172.16.0.1'),
    (err) => err.code === 'SSRF_BLOCKED'
  );

  // 169.254.169.254 (Cloud metadata) ditolak
  assert.throws(
    () => validateUrlNotSSRF('http://169.254.169.254/latest/meta-data/'),
    (err) => err.code === 'SSRF_BLOCKED'
  );

  // 0.0.0.0 ditolak
  assert.throws(
    () => validateUrlNotSSRF('http://0.0.0.0'),
    (err) => err.code === 'SSRF_BLOCKED'
  );

  // IPv6 loopback / local ditolak
  assert.throws(
    () => validateUrlNotSSRF('http://[::1]'),
    (err) => err.code === 'SSRF_BLOCKED'
  );

  // IPv6 ULA fc00::/7 ditolak
  assert.throws(
    () => validateUrlNotSSRF('http://[fc00::1]'),
    (err) => err.code === 'SSRF_BLOCKED'
  );

  // IPv6 Link-local fe80::/10 ditolak
  assert.throws(
    () => validateUrlNotSSRF('http://[fe80::1]'),
    (err) => err.code === 'SSRF_BLOCKED'
  );

  // IPv4-mapped IPv6 ::ffff:127.0.0.1 ditolak
  assert.throws(
    () => validateUrlNotSSRF('http://[::ffff:127.0.0.1]'),
    (err) => err.code === 'SSRF_BLOCKED'
  );

  // URL dengan userinfo kredensial ditolak
  assert.throws(
    () => validateUrlNotSSRF('http://user:pass@example.com'),
    (err) => err.code === 'SSRF_BLOCKED'
  );

  // Port non-standar (termasuk port 22 SSH) ditolak
  assert.throws(
    () => validateUrlNotSSRF('http://example.com:22'),
    (err) => err.code === 'SSRF_BLOCKED'
  );
  assert.throws(
    () => validateUrlNotSSRF('http://example.com:8080'),
    (err) => err.code === 'SSRF_BLOCKED'
  );

  // URL publik valid diterima
  assert.doesNotThrow(() => validateUrlNotSSRF('http://example.com'));
  assert.doesNotThrow(() => validateUrlNotSSRF('https://example.com'));
  assert.doesNotThrow(() => validateUrlNotSSRF('https://statuswatch.vercel.app/api'));
});

test('SSRF Guard: validateUrlNotSSRFAsync melakukan DNS check (tanpa request sungguhan ke metadata)', async () => {
  // Mock DNS: jika host me-resolve ke IP privat/metadata -> tolak
  const mockDnsPrivate = async () => ['169.254.169.254'];
  await assert.rejects(
    async () => validateUrlNotSSRFAsync('http://metadata.attacker.com', mockDnsPrivate),
    (err) => err.code === 'SSRF_BLOCKED'
  );

  // Mock DNS: jika salah satu IP dari multi-A record adalah privat -> tolak
  const mockDnsRebind = async () => ['93.184.216.34', '127.0.0.1'];
  await assert.rejects(
    async () => validateUrlNotSSRFAsync('http://rebind.attacker.com', mockDnsRebind),
    (err) => err.code === 'SSRF_BLOCKED'
  );

  // Mock DNS: resolve ke IP publik aman -> diterima
  const mockDnsPublic = async () => ['93.184.216.34'];
  const result = await validateUrlNotSSRFAsync('https://my-legit-site.com/health', mockDnsPublic);
  assert.equal(result.url.hostname, 'my-legit-site.com');
  assert.deepEqual(result.resolvedIps, ['93.184.216.34']);
});

test('SSRF Guard: validateRedirectUrl mencegah pengalihan menuju IP/host terlarang', async () => {
  const current = 'https://example.com/api';

  // Redirect menuju internal ditolak
  await assert.rejects(
    async () => validateRedirectUrl(current, 'http://localhost:3000/admin'),
    (err) => err.code === 'SSRF_BLOCKED'
  );

  await assert.rejects(
    async () => validateRedirectUrl(current, 'http://169.254.169.254/secret'),
    (err) => err.code === 'SSRF_BLOCKED'
  );

  // Redirect relatif yang aman (tetap di host yang sama dengan mock DNS publik)
  const mockDnsPublic = async () => ['93.184.216.34'];
  const safeRedirect = await validateRedirectUrl(current, '/new-location', mockDnsPublic);
  assert.equal(safeRedirect, 'https://example.com/new-location');
});
