import { createHmac, timingSafeEqual } from 'crypto';

const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function decodeBase32(input: string): Buffer {
  const clean = input.toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = '';
  for (const c of clean) bits += B32.indexOf(c).toString(2).padStart(5, '0');
  const out: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) out.push(parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(out);
}

export function buatTotp(secret: string, waktu = Date.now(), step = 30): string {
  const counter = Math.floor(waktu / 1000 / step);
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(counter));
  const digest = createHmac('sha1', decodeBase32(secret)).update(msg).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const angka = (digest.readUInt32BE(offset) & 0x7fffffff) % 1_000_000;
  return String(angka).padStart(6, '0');
}

export function cekTotp(secret: string, kode: string, waktu = Date.now()): boolean {
  if (!/^\d{6}$/.test(kode)) return false;
  for (const geser of [-30_000, 0, 30_000]) {
    const benar = Buffer.from(buatTotp(secret, waktu + geser));
    const masuk = Buffer.from(kode);
    if (benar.length === masuk.length && timingSafeEqual(benar, masuk)) return true;
  }
  return false;
}

export function durasiSesiDetik(raw?: string): number {
  const menit = Number(raw ?? '60');
  const aman = Number.isFinite(menit) ? Math.min(1440, Math.max(15, Math.round(menit))) : 60;
  return aman * 60;
}

export function encodeBase32(buf: Buffer): string {
  let bits = '';
  for (const b of Array.from(buf)) bits += b.toString(2).padStart(8, '0');
  let out = '';
  for (let i = 0; i < bits.length; i += 5) {
    out += B32[parseInt(bits.slice(i, i + 5).padEnd(5, '0'), 2)];
  }
  return out;
}
