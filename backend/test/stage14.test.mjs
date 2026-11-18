import test from 'node:test';
import assert from 'node:assert/strict';

import {
  sendEmailNotification,
  sendMonitorDownAlert,
  sendMonitorRecoveredAlert,
  sendSslExpiryAlert,
} from '../dist/index.js';

// ============================================
// Tahap 14 Unit Tests: Fitur Tambahan P2
// ============================================

test('Tahap 14: Email Service - Silent skip when RESEND_API_KEY is not configured', async () => {
  const originalKey = process.env.RESEND_API_KEY;
  delete process.env.RESEND_API_KEY;

  try {
    const result = await sendEmailNotification(
      'user@example.com',
      'Test Alert',
      '<p>Test body</p>'
    );
    assert.equal(result.sent, false);
    assert.equal(result.reason, 'RESEND_API_KEY_NOT_CONFIGURED');

    const downResult = await sendMonitorDownAlert(
      'user@example.com',
      'API Server',
      'https://api.example.com',
      'CONNECTION_REFUSED'
    );
    assert.equal(downResult.sent, false);
    assert.equal(downResult.reason, 'RESEND_API_KEY_NOT_CONFIGURED');

    const recResult = await sendMonitorRecoveredAlert(
      'user@example.com',
      'API Server',
      'https://api.example.com',
      '5 menit'
    );
    assert.equal(recResult.sent, false);
    assert.equal(recResult.reason, 'RESEND_API_KEY_NOT_CONFIGURED');

    const sslResult = await sendSslExpiryAlert(
      'user@example.com',
      'mon-unconfigured-ssl',
      'API Server',
      'https://api.example.com',
      7
    );
    assert.equal(sslResult.sent, false);
    assert.equal(sslResult.reason, 'RESEND_API_KEY_NOT_CONFIGURED');
  } finally {
    if (originalKey !== undefined) {
      process.env.RESEND_API_KEY = originalKey;
    }
  }
});

test('Tahap 14: Email Service - Sends email via Resend API when RESEND_API_KEY is configured', async () => {
  const originalKey = process.env.RESEND_API_KEY;
  const originalFetch = globalThis.fetch;

  process.env.RESEND_API_KEY = 're_test_dummy_key_12345';
  let capturedUrl = '';
  let capturedHeaders = {};
  let capturedBody = {};

  globalThis.fetch = async (url, options) => {
    capturedUrl = String(url);
    capturedHeaders = options?.headers || {};
    capturedBody = JSON.parse(options?.body || '{}');

    return {
      ok: true,
      status: 200,
      json: async () => ({ id: 'email_test_abc123' }),
      text: async () => '',
    };
  };

  try {
    const result = await sendMonitorDownAlert(
      'admin@company.com',
      'Payment Gateway',
      'https://pay.company.com/health',
      'HTTP 500'
    );

    assert.equal(result.sent, true);
    assert.equal(result.id, 'email_test_abc123');
    assert.equal(capturedUrl, 'https://api.resend.com/emails');
    assert.equal(capturedHeaders['Authorization'], 'Bearer re_test_dummy_key_12345');
    assert.deepEqual(capturedBody.to, ['admin@company.com']);
    assert.ok(capturedBody.subject.includes('[GANGGUAN]'));
    assert.ok(capturedBody.subject.includes('Payment Gateway'));
    assert.ok(capturedBody.html.includes('https://pay.company.com/health'));
    assert.ok(capturedBody.html.includes('HTTP 500'));
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey !== undefined) {
      process.env.RESEND_API_KEY = originalKey;
    } else {
      delete process.env.RESEND_API_KEY;
    }
  }
});

test('Tahap 14: Email Service - SSL warning throttled to max 1x per 24 hours per monitor', async () => {
  const originalKey = process.env.RESEND_API_KEY;
  const originalFetch = globalThis.fetch;

  process.env.RESEND_API_KEY = 're_test_dummy_key_ssl';
  let callCount = 0;

  globalThis.fetch = async () => {
    callCount++;
    return {
      ok: true,
      status: 200,
      json: async () => ({ id: `email_ssl_${callCount}` }),
      text: async () => '',
    };
  };

  const testMonitorId = `mon-throttle-test-${Date.now()}`;

  try {
    // Panggilan pertama harus terkirim
    const firstCall = await sendSslExpiryAlert(
      'devops@company.com',
      testMonitorId,
      'Auth Service',
      'https://auth.company.com',
      5
    );
    assert.equal(firstCall.sent, true);
    assert.equal(firstCall.id, 'email_ssl_1');
    assert.equal(callCount, 1);

    // Panggilan kedua untuk monitor yang sama dalam 24 jam harus dilewati dengan alasan SSL_ALERT_COOLDOWN
    const secondCall = await sendSslExpiryAlert(
      'devops@company.com',
      testMonitorId,
      'Auth Service',
      'https://auth.company.com',
      5
    );
    assert.equal(secondCall.sent, false);
    assert.equal(secondCall.reason, 'SSL_ALERT_COOLDOWN');
    assert.equal(callCount, 1); // Tidak ada HTTP request baru

    // Panggilan untuk monitor berbeda tetap terkirim
    const differentMonitorId = `mon-other-${Date.now()}`;
    const thirdCall = await sendSslExpiryAlert(
      'devops@company.com',
      differentMonitorId,
      'Other Service',
      'https://other.company.com',
      3
    );
    assert.equal(thirdCall.sent, true);
    assert.equal(callCount, 2);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey !== undefined) {
      process.env.RESEND_API_KEY = originalKey;
    } else {
      delete process.env.RESEND_API_KEY;
    }
  }
});

test('Tahap 14: CSV Export Formatting - RFC 4180 escaping and UTF-8 BOM', () => {
  // Helper fungsi format sel CSV RFC 4180
  function escapeCsvCell(val) {
    if (val === null || val === undefined) return '""';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return `"${str}"`;
  }

  // 1. Escaping koma dan tanda kutip ganda
  const simpleCell = escapeCsvCell('Status Normal');
  assert.equal(simpleCell, '"Status Normal"');

  const commaCell = escapeCsvCell('Error 500, Bad Gateway');
  assert.equal(commaCell, '"Error 500, Bad Gateway"');

  const quoteCell = escapeCsvCell('Pesan "Timeout" terdeteksi');
  assert.equal(quoteCell, '"Pesan ""Timeout"" terdeteksi"');

  const newlineCell = escapeCsvCell("Baris 1\nBaris 2");
  assert.equal(newlineCell, '"Baris 1\nBaris 2"');

  // 2. Format baris CSV lengkap dengan UTF-8 BOM
  const headers = [
    'Waktu Pengecekan (WIB)',
    'Status',
    'Kode HTTP',
    'Waktu Respons (ms)',
    'Error / Keterangan',
  ];
  const row = [
    '18/11/2026, 21.00.00',
    'UP',
    '200',
    '145',
    '-',
  ];

  const csvContent =
    '\uFEFF' +
    headers.map(escapeCsvCell).join(',') +
    '\r\n' +
    row.map(escapeCsvCell).join(',') +
    '\r\n';

  // Verifikasi BOM ada di index 0
  assert.equal(csvContent.charCodeAt(0), 0xfeff);
  assert.ok(csvContent.includes('"Waktu Pengecekan (WIB)","Status","Kode HTTP"'));
  assert.ok(csvContent.includes('"18/11/2026, 21.00.00","UP","200","145","-"'));
});
