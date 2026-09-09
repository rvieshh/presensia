import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { buatSesi, buatTantangan2fa } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const { login, email, password } = await req.json().catch(() => ({}));
  const identitas = String(login || email || '').trim().toLowerCase();

  if (!identitas || !password) {
    return NextResponse.json({ ok: false, pesan: 'Email/username dan password wajib diisi' }, { status: 400 });
  }

  const user = await prisma.user.findFirst({
    where: { OR: [{ email: identitas }, { username: identitas }] },
  });
  if (!user || !user.aktif || !(await bcrypt.compare(String(password), user.password))) {
    return NextResponse.json({ ok: false, pesan: 'Email/username atau password salah' }, { status: 401 });
  }

  if (user.totpEnabled && user.totpSecretEnc) {
    await buatTantangan2fa(user.id);
    return NextResponse.json({ ok: true, perlu2fa: true });
  }

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await buatSesi({ id: user.id, email: user.email, nama: user.nama, role: user.role, sessionVersion: user.sessionVersion });
  return NextResponse.json({ ok: true, perlu2fa: false, user: { nama: user.nama, role: user.role } });
}
