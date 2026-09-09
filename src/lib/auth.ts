import { SignJWT, jwtVerify } from 'jose';
import { cookies, headers } from 'next/headers';
import { prisma } from './prisma';
import { durasiSesiDetik } from './auth-core';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'dev_jwt_secret');
const COOKIE = 'presensia_session';
const LOGIN_2FA = 'presensia_2fa_pending';

export interface SessionUser {
  id: string;
  email: string;
  nama: string;
  role: string;
  sessionVersion: number;
}

async function pakaiSecure(): Promise<boolean> {
  const paksa = process.env.COOKIE_SECURE;
  if (paksa === '1' || paksa === 'true') return true;
  if (paksa === '0' || paksa === 'false') return false;
  const h = await headers();
  return h.get('x-forwarded-proto')?.split(',')[0].trim() === 'https';
}

export async function buatSesi(user: SessionUser) {
  const ttl = durasiSesiDetik(process.env.ADMIN_SESSION_MINUTES);
  const token = await new SignJWT({ ...user, tipe: 'session' })
    .setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime(`${ttl}s`).sign(secret);
  const jar = await cookies();
  jar.set(COOKIE, token, { httpOnly: true, sameSite: 'lax', secure: await pakaiSecure(), maxAge: ttl, path: '/' });
  jar.delete(LOGIN_2FA);
}

export async function buatTantangan2fa(userId: string) {
  const token = await new SignJWT({ userId, tipe: '2fa' })
    .setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('5m').sign(secret);
  const jar = await cookies();
  jar.set(LOGIN_2FA, token, { httpOnly: true, sameSite: 'strict', secure: await pakaiSecure(), maxAge: 300, path: '/' });
}

export async function ambilTantangan2fa(): Promise<string | null> {
  const token = (await cookies()).get(LOGIN_2FA)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload.tipe === '2fa' ? String(payload.userId) : null;
  } catch { return null; }
}

export async function ambilSesi(): Promise<SessionUser | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    if (payload.tipe !== 'session') return null;
    const user = await prisma.user.findUnique({ where: { id: String(payload.id) } });
    if (!user?.aktif || user.sessionVersion !== Number(payload.sessionVersion)) return null;
    return { id: user.id, email: user.email, nama: user.nama, role: user.role, sessionVersion: user.sessionVersion };
  } catch { return null; }
}

export async function hapusSesi() {
  const jar = await cookies();
  jar.delete(COOKIE);
  jar.delete(LOGIN_2FA);
}
