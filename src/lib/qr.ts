import { createHmac, timingSafeEqual, randomBytes } from 'crypto';

const SECRET = process.env.QR_SECRET || 'dev_qr_secret';

/**
 * Format payload QR: PRS1.<nis>.<nonce>.<sig>
 *
 * Sengaja dibikin pendek + ASCII aman, karena scanner keyboard-wedge
 * "mengetikkan" isi QR sebagai keystroke. Karakter aneh bisa
 * ke-mangle sama layout keyboard (mis. ; jadi : di layout tertentu).
 * Titik + alfanumerik = paling aman lintas device.
 */
const PREFIX = 'PRS1';

function sign(data: string): string {
  return createHmac('sha256', SECRET).update(data).digest('base64url').slice(0, 16);
}

export function generateQrToken(nis: string): string {
  const nonce = randomBytes(6).toString('base64url');
  const body = `${PREFIX}.${nis}.${nonce}`;
  return `${body}.${sign(body)}`;
}

export interface QrVerifyResult {
  valid: boolean;
  nis?: string;
  alasan?: string;
}

export function verifyQrToken(token: string): QrVerifyResult {
  const raw = token.trim();
  if (!raw) return { valid: false, alasan: 'QR kosong' };

  const parts = raw.split('.');
  if (parts.length !== 4) return { valid: false, alasan: 'Format QR tidak dikenal' };

  const [prefix, nis, nonce, sig] = parts;
  if (prefix !== PREFIX) return { valid: false, alasan: 'Bukan QR Presensia' };
  if (!nis) return { valid: false, alasan: 'NIS kosong' };

  const expected = sign(`${prefix}.${nis}.${nonce}`);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { valid: false, alasan: 'Tanda tangan QR tidak valid' };
  }

  return { valid: true, nis };
}
