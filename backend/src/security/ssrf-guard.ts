// ============================================
// Security: Proteksi SSRF (sesuai PRD Bagian 12)
// ============================================

import net from 'node:net';
import dns from 'node:dns/promises';
import { AppError } from '../lib/errors.js';
import { ErrorCode } from '../lib/types.js';

export type DnsLookupFn = (hostname: string) => Promise<string[]>;

/**
 * Memeriksa apakah sebuah alamat IP adalah IP privat, loopback, link-local,
 * metadata cloud, atau reserved.
 */
export function isPrivateIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const parts = ip.split('.').map(Number);
    if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
      return true; // format invalid -> tolak demi keamanan
    }
    const [a, b, c, d] = parts;

    // 0.0.0.0/8 (Current network)
    if (a === 0) return true;

    // 10.0.0.0/8 (Private Class A)
    if (a === 10) return true;

    // 127.0.0.0/8 (Loopback)
    if (a === 127) return true;

    // 169.254.0.0/16 (Link-local & Cloud Metadata, mis. 169.254.169.254)
    if (a === 169 && b === 254) return true;

    // 172.16.0.0/12 (Private Class B: 172.16.0.0 - 172.31.255.255)
    if (a === 172 && b >= 16 && b <= 31) return true;

    // 192.168.0.0/16 (Private Class C)
    if (a === 192 && b === 168) return true;

    // 100.64.0.0/10 (Carrier-Grade NAT / Cloud Internal)
    if (a === 100 && b >= 64 && b <= 127) return true;

    // 192.0.0.0/24 (IETF Protocol Assignments)
    if (a === 192 && b === 0 && c === 0) return true;

    // 192.0.2.0/24 (TEST-NET-1)
    if (a === 192 && b === 0 && c === 2) return true;

    // 198.18.0.0/15 (Benchmarking)
    if (a === 198 && (b === 18 || b === 19)) return true;

    // 198.51.100.0/24 (TEST-NET-2)
    if (a === 198 && b === 51 && c === 100) return true;

    // 203.0.113.0/24 (TEST-NET-3)
    if (a === 203 && b === 0 && c === 113) return true;

    // 224.0.0.0/4 (Multicast)
    if (a >= 224 && a <= 239) return true;

    // 240.0.0.0/4 (Reserved / Future use)
    if (a >= 240) return true;

    // 255.255.255.255 (Broadcast)
    if (a === 255 && b === 255 && c === 255 && d === 255) return true;

    return false;
  }

  if (net.isIPv6(ip)) {
    const clean = ip.toLowerCase();

    // :: / unspecified dan ::1 / loopback
    if (clean === '::' || clean === '::1' || clean === '0:0:0:0:0:0:0:1') return true;

    // IPv4-mapped IPv6 (::ffff:127.0.0.1 atau format hex URL standar seperti ::ffff:7f00:1)
    if (clean.startsWith('::ffff:')) {
      const rest = clean.slice(7);
      if (/^\d+\.\d+\.\d+\.\d+$/.test(rest)) {
        return isPrivateIp(rest);
      }
      const hexParts = rest.split(':');
      if (hexParts.length === 2) {
        const high = parseInt(hexParts[0], 16);
        const low = parseInt(hexParts[1], 16);
        if (!isNaN(high) && !isNaN(low)) {
          const a = (high >> 8) & 0xff;
          const b = high & 0xff;
          const c = (low >> 8) & 0xff;
          const d = low & 0xff;
          return isPrivateIp(`${a}.${b}.${c}.${d}`);
        }
      }
      return true; // format invalid dalam ::ffff: ditolak demi keamanan
    }

    // ULA fc00::/7 (fc atau fd)
    if (/^f[cd][0-9a-f]{2}:/i.test(clean) || /^f[cd]:/i.test(clean)) return true;

    // Link-local fe80::/10 (fe8, fe9, fea, feb)
    if (/^fe[89ab][0-9a-f]:/i.test(clean) || /^fe[89ab]:/i.test(clean)) return true;

    // Site-local (fec0::/10)
    if (/^fec[0-9a-f]:/i.test(clean) || /^fe[c-f]:/i.test(clean)) return true;

    // Discard prefix 100::/64
    if (/^100::/i.test(clean)) return true;

    // Documentation 2001:db8::/32
    if (/^2001:db8:/i.test(clean)) return true;

    return false;
  }

  // Jika bukan IPv4 maupun IPv6 valid, tolak demi keamanan
  return true;
}

/**
 * Validasi sintaks URL awal secara sinkron (skema, port, hostname, dan literal IP).
 */
export function validateUrlNotSSRF(urlString: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(urlString);
  } catch {
    throw new AppError(400, ErrorCode.SSRF_BLOCKED, 'Format URL tidak valid');
  }

  // Hanya http dan https yang diizinkan
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new AppError(
      400,
      ErrorCode.SSRF_BLOCKED,
      'Hanya protokol http:// dan https:// yang diizinkan'
    );
  }

  // Tolak userinfo (kredensial di URL)
  if (parsed.username || parsed.password) {
    throw new AppError(
      400,
      ErrorCode.SSRF_BLOCKED,
      'URL dengan kredensial autentikasi (userinfo) tidak diizinkan'
    );
  }

  const rawHostname = parsed.hostname.toLowerCase();
  // Hilangkan kurung siku pada IPv6 (contoh [::1] -> ::1)
  const hostname =
    rawHostname.startsWith('[') && rawHostname.endsWith(']')
      ? rawHostname.slice(1, -1)
      : rawHostname;

  // Tolak hostname kosong
  if (!hostname) {
    throw new AppError(400, ErrorCode.SSRF_BLOCKED, 'Hostname tidak boleh kosong');
  }

  // Tolak localhost dan domain lokal internal
  if (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    hostname.endsWith('.lan') ||
    hostname.endsWith('.home') ||
    hostname.endsWith('.corp')
  ) {
    throw new AppError(400, ErrorCode.SSRF_BLOCKED, 'URL ke localhost atau domain lokal tidak diizinkan');
  }

  // Tolak port selain 80 dan 443 (atau port default kosong)
  if (parsed.port && !['80', '443'].includes(parsed.port)) {
    throw new AppError(
      400,
      ErrorCode.SSRF_BLOCKED,
      `Port ${parsed.port} tidak diizinkan. Hanya port standar 80 dan 443 yang diperbolehkan.`
    );
  }

  // Jika hostname adalah literal IP (IPv4 atau IPv6), validasi langsung
  if (net.isIP(hostname)) {
    if (isPrivateIp(hostname)) {
      throw new AppError(
        400,
        ErrorCode.SSRF_BLOCKED,
        `Akses ke IP privat/internal (${hostname}) tidak diizinkan`
      );
    }
  }

  return parsed;
}

/**
 * Resolusi DNS default menggunakan dns/promises bawaan Node.js.
 */
async function defaultDnsLookup(hostname: string): Promise<string[]> {
  try {
    const results = await dns.lookup(hostname, { all: true });
    return results.map((r) => r.address);
  } catch (error: unknown) {
    const errObj = error as { code?: string; message?: string };
    throw new AppError(
      400,
      ErrorCode.SSRF_BLOCKED,
      `Gagal menyelesaikan DNS untuk ${hostname}: ${errObj.code || errObj.message || String(error)}`
    );
  }
}

/**
 * Validasi asinkron lengkap termasuk resolusi DNS dan pemeriksaan seluruh IP yang dihasilkan.
 */
export async function validateUrlNotSSRFAsync(
  urlString: string,
  customDnsLookup?: DnsLookupFn
): Promise<{ url: URL; resolvedIps: string[] }> {
  const parsed = validateUrlNotSSRF(urlString);
  const rawHostname = parsed.hostname.toLowerCase();
  const hostname =
    rawHostname.startsWith('[') && rawHostname.endsWith(']')
      ? rawHostname.slice(1, -1)
      : rawHostname;

  let resolvedIps: string[] = [];

  // Jika literal IP, sudah lolos di validateUrlNotSSRF
  if (net.isIP(hostname)) {
    resolvedIps = [hostname];
  } else {
    const lookupFn = customDnsLookup || defaultDnsLookup;
    resolvedIps = await lookupFn(hostname);

    if (!resolvedIps || resolvedIps.length === 0) {
      throw new AppError(
        400,
        ErrorCode.SSRF_BLOCKED,
        `Tidak ada alamat IP yang ditemukan untuk host ${hostname}`
      );
    }

    // Periksa setiap IP hasil resolusi DNS (mencegah DNS rebinding / multi-A record)
    for (const ip of resolvedIps) {
      if (isPrivateIp(ip)) {
        throw new AppError(
          400,
          ErrorCode.SSRF_BLOCKED,
          `Resolusi DNS untuk ${hostname} menghasilkan alamat IP privat/terlarang (${ip})`
        );
      }
    }
  }

  return { url: parsed, resolvedIps };
}

/**
 * Memvalidasi URL target pengalihan (redirect) untuk mencegah SSRF via HTTP Redirect.
 */
export async function validateRedirectUrl(
  currentUrl: string,
  locationHeader: string,
  customDnsLookup?: DnsLookupFn
): Promise<string> {
  let nextUrl: URL;
  try {
    nextUrl = new URL(locationHeader, currentUrl);
  } catch {
    throw new AppError(400, ErrorCode.SSRF_BLOCKED, 'Target redirect tidak valid');
  }

  await validateUrlNotSSRFAsync(nextUrl.toString(), customDnsLookup);
  return nextUrl.toString();
}
