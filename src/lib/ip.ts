import * as ipaddr from 'ipaddr.js';

export interface KonteksIp {
  ip: string;
  peerIp: string;
  dariProxyTepercaya: boolean;
  sumber: 'peer' | 'x-real-ip' | 'x-forwarded-for';
}

/** Bersihkan bentuk ::ffff:127.0.0.1 dan hapus zona IPv6 */
export function normalIp(raw?: string | null): string | null {
  if (!raw) return null;
  let s = raw.trim();
  if (!s) return null;

  // Forwarded kadang menyertakan port: 203.0.113.7:443
  if (/^\d+\.\d+\.\d+\.\d+:\d+$/.test(s)) s = s.slice(0, s.lastIndexOf(':'));
  if (s.startsWith('[') && s.includes(']')) s = s.slice(1, s.indexOf(']'));
  if (s.includes('%')) s = s.split('%')[0];

  try {
    const a = ipaddr.parse(s);
    if (a.kind() === 'ipv6' && (a as ipaddr.IPv6).isIPv4MappedAddress()) {
      return (a as ipaddr.IPv6).toIPv4Address().toString();
    }
    return a.toNormalizedString();
  } catch {
    return null;
  }
}

/** Ubah teks baris/koma menjadi CIDR terverifikasi */
export function parseDaftarCidr(teks?: string | null): { valid: string[]; invalid: string[] } {
  const valid: string[] = [];
  const invalid: string[] = [];
  const entri = (teks || '')
    .split(/[\n,;]+/)
    .map((x) => x.trim())
    .filter(Boolean);

  for (const e of entri) {
    try {
      if (e.includes('/')) {
        const [alamat, n] = e.split('/');
        const a = ipaddr.parse(alamat);
        const prefix = Number(n);
        const max = a.kind() === 'ipv4' ? 32 : 128;
        if (!Number.isInteger(prefix) || prefix < 0 || prefix > max) throw new Error('prefix');
        valid.push(`${a.toNormalizedString()}/${prefix}`);
      } else {
        const a = ipaddr.parse(e);
        valid.push(`${a.toNormalizedString()}/${a.kind() === 'ipv4' ? 32 : 128}`);
      }
    } catch {
      invalid.push(e);
    }
  }

  return { valid: Array.from(new Set(valid)), invalid };
}

export function ipMasukCidr(ip: string, cidr: string): boolean {
  try {
    let alamat = ipaddr.parse(ip);
    const [jaringan, prefix] = ipaddr.parseCIDR(cidr);

    // Samakan mapped IPv4 dengan jaringan IPv4
    if (alamat.kind() === 'ipv6' && (alamat as ipaddr.IPv6).isIPv4MappedAddress()) {
      alamat = (alamat as ipaddr.IPv6).toIPv4Address();
    }
    if (jaringan.kind() !== alamat.kind()) return false;
    return alamat.match(jaringan, prefix);
  } catch {
    return false;
  }
}

export function ipDiizinkan(ip: string, daftar: string[]): boolean {
  return daftar.some((cidr) => ipMasukCidr(ip, cidr));
}

/**
 * Tentukan alamat klien tanpa mempercayai header buatan penyerang.
 * x-forwarded-for / x-real-ip hanya dibaca jika peer TCP berada dalam
 * daftar proxy tepercaya (umumnya 127.0.0.1 saat nginx satu mesin).
 */
export function tentukanIpKlien(
  peerRaw: string | null,
  xffRaw: string | null,
  xRealRaw: string | null,
  proxyCidr: string[]
): KonteksIp {
  const peerIp = normalIp(peerRaw) || '0.0.0.0';
  const dariProxyTepercaya = ipDiizinkan(peerIp, proxyCidr);

  if (dariProxyTepercaya) {
    const xReal = normalIp(xRealRaw);
    if (xReal) return { ip: xReal, peerIp, dariProxyTepercaya, sumber: 'x-real-ip' };

    const pertama = normalIp(xffRaw?.split(',')[0] || null);
    if (pertama) return { ip: pertama, peerIp, dariProxyTepercaya, sumber: 'x-forwarded-for' };
  }

  return { ip: peerIp, peerIp, dariProxyTepercaya, sumber: 'peer' };
}
