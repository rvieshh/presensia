import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { ambilSesi } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest) {
  const sesi = await ambilSesi();
  if (!sesi) return NextResponse.json({ ok: false, pesan: 'Tidak diizinkan' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const user = await prisma.user.findUnique({ where: { id: sesi.id } });
  if (!user) return NextResponse.json({ ok: false, pesan: 'Akun tidak ditemukan' }, { status: 404 });

  if (body.passwordBaru) {
    if (!body.passwordLama || !(await bcrypt.compare(String(body.passwordLama), user.password))) {
      return NextResponse.json({ ok: false, pesan: 'Password lama salah' }, { status: 400 });
    }
    if (String(body.passwordBaru).length < 12) {
      return NextResponse.json({ ok: false, pesan: 'Password baru minimal 12 karakter' }, { status: 400 });
    }
  }

  const email = String(body.email || user.email).trim().toLowerCase();
  const username = String(body.username || '').trim().toLowerCase() || null;
  const nama = String(body.nama || user.nama).trim();

  const bentrok = await prisma.user.findFirst({
    where: { id: { not: user.id }, OR: [{ email }, ...(username ? [{ username }] : [])] },
  });
  if (bentrok) return NextResponse.json({ ok: false, pesan: 'Email atau username sudah dipakai' }, { status: 409 });

  await prisma.user.update({
    where: { id: user.id },
    data: {
      email, username, nama,
      ...(body.passwordBaru ? { password: await bcrypt.hash(String(body.passwordBaru), 12), sessionVersion: { increment: 1 } } : {}),
    },
  });
  return NextResponse.json({ ok: true, pesan: body.passwordBaru ? 'Profil dan password diperbarui; silakan login kembali' : 'Profil diperbarui' });
}
