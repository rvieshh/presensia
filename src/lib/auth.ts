import { SignJWT, jwtVerify } from 'jose';
import { cookies, headers } from 'next/headers';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'dev_jwt_secret');
const COOKIE = 'presensia_session';

export interface SessionUser {
  id: string;
  email: string;
  nama: string;
  role: string;
}

/**
 * Cookie hanya boleh diberi flag Secure bila koneksinya memang HTTPS.
 * Menyalakan Secure di atas HTTP polos membuat browser MENOLAK menyimpan
 * cookie, sehingga login tampak berhasil tetapi pengguna langsung
 * terlempar kembali ke halaman masuk.
 *
 * COOKIE_SECURE=1 memaksa aktif (mis. di belakang proxy TLS),
 * COOKIE_SECURE=0 memaksa nonaktif.
 */
async function pakaiSecure(): Promise<boolean> {
  const paksa = process.env.COOKIE_SECURE;
  if (paksa === '1' || paksa === 'true') return true;
  if (paksa === '0' || paksa === 'false') return false;

  const h = await headers();
  const proto = h.get('x-forwarded-proto');
  if (proto) return proto.split(',')[0].trim() === 'https';

  return false;
}

export async function buatSesi(user: SessionUser) {
  const token = await new SignJWT({ ...user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);

  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: await pakaiSecure(),
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });
}

export async function ambilSesi(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return {
      id: payload.id as string,
      email: payload.email as string,
      nama: payload.nama as string,
      role: payload.role as string,
    };
  } catch {
    return null;
  }
}

export async function hapusSesi() {
  const jar = await cookies();
  jar.delete(COOKIE);
}
