import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { ambilSesi } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const sesi = await ambilSesi();
  if (!sesi || sesi.role !== 'ADMIN') return NextResponse.json({ ok: false, pesan: 'Hanya admin' }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  const email = String(b.email || '').trim().toLowerCase();
  const username = String(b.username || '').trim().toLowerCase() || null;
  const nama = String(b.nama || '').trim();
  const password = String(b.password || '');
  if (!email || !nama || password.length < 12) return NextResponse.json({ ok: false, pesan: 'Nama, email, dan password minimal 12 karakter wajib diisi' }, { status: 400 });
  const bentrok = await prisma.user.findFirst({ where: { OR: [{ email }, ...(username ? [{ username }] : [])] } });
  if (bentrok) return NextResponse.json({ ok: false, pesan: 'Email atau username sudah dipakai' }, { status: 409 });
  const user = await prisma.user.create({ data: { email, username, nama, password: await bcrypt.hash(password, 12), role: 'ADMIN' } });
  return NextResponse.json({ ok: true, user: { id: user.id, nama: user.nama, email: user.email } });
}
