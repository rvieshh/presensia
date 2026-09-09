import { headers } from 'next/headers';
import { tentukanIpKlien, parseDaftarCidr, type KonteksIp } from './ip';

export const DEFAULT_SECURITY = {
  scan_device_wajib: 'false',
  scan_ip_allowlist_aktif: 'false',
  scan_ip_allowlist: '',
  trusted_proxy_cidrs: '127.0.0.1/32,::1/128',
  scan_rate_limit_per_minute: '120',
} as const;

export async function konteksIpRequest(trustedProxyText: string): Promise<KonteksIp> {
  const h = await headers();
  const proxy = parseDaftarCidr(trustedProxyText).valid;
  const peer = h.get('x-presensia-peer') || '0.0.0.0';
  return tentukanIpKlien(peer, h.get('x-forwarded-for'), h.get('x-real-ip'), proxy);
}

export function angkaBatas(raw: string | undefined, bawaan = 120): number {
  const n = Number(raw);
  if (!Number.isFinite(n)) return bawaan;
  return Math.min(600, Math.max(10, Math.round(n)));
}

// Rate limit sederhana per proses. Cukup sebagai lapisan tambahan; nginx/WAF
// tetap dianjurkan untuk deployment publik multi-instance.
const bucket = new Map<string, { awal: number; jumlah: number }>();

export function lewatBatasRate(ip: string, batas: number): boolean {
  const sekarang = Date.now();
  const lama = bucket.get(ip);
  if (!lama || sekarang - lama.awal >= 60_000) {
    bucket.set(ip, { awal: sekarang, jumlah: 1 });
    if (bucket.size > 10_000) bucket.clear();
    return false;
  }
  lama.jumlah++;
  return lama.jumlah > batas;
}
