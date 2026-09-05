import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { buatSesi } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const { email, password } = await req.json().catch(() => ({}));

  if (!email || !password) {
    return NextResponse.json({ ok: false, pesan: 'Email dan password wajib diisi' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: String(email).toLowerCase() } });
  if (!user || !user.aktif || !(await bcrypt.compare(String(password), user.password))) {
    return NextResponse.json({ ok: false, pesan: 'Email atau password salah' }, { status: 401 });
  }

  await buatSesi({ id: user.id, email: user.email, nama: user.nama, role: user.role });
  return NextResponse.json({ ok: true, user: { nama: user.nama, role: user.role } });
}
