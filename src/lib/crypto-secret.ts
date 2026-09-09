import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';

function kunci(): Buffer {
  const sumber = process.env.TOTP_ENCRYPTION_KEY || process.env.JWT_SECRET || '';
  if (!sumber) throw new Error('TOTP_ENCRYPTION_KEY atau JWT_SECRET wajib diisi');
  return createHash('sha256').update(sumber).digest();
}

export function enkripsiTotp(secret: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', kunci(), iv);
  const isi = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, isi].map((b) => b.toString('base64url')).join('.');
}

export function dekripsiTotp(payload: string): string {
  const [iv, tag, isi] = payload.split('.').map((x) => Buffer.from(x, 'base64url'));
  if (!iv || !tag || !isi) throw new Error('Secret 2FA rusak');
  const decipher = createDecipheriv('aes-256-gcm', kunci(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(isi), decipher.final()]).toString('utf8');
}
