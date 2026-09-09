import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ambilSesi } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sesi = await ambilSesi();
  if (!sesi || sesi.role !== 'ADMIN') return NextResponse.json({ ok: false, pesan: 'Hanya admin' }, { status: 403 });
  const { id } = await params;
  if (id === sesi.id) return NextResponse.json({ ok: false, pesan: 'Ubah akun sendiri lewat menu Accounts' }, { status: 400 });
  const b = await req.json().catch(() => ({}));
  const user = await prisma.user.update({ where: { id }, data: { aktif: Boolean(b.aktif), sessionVersion: { increment: 1 } } });
  return NextResponse.json({ ok: true, user: { id: user.id, aktif: user.aktif } });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sesi = await ambilSesi();
  if (!sesi || sesi.role !== 'ADMIN') return NextResponse.json({ ok: false, pesan: 'Hanya admin' }, { status: 403 });
  const { id } = await params;
  if (id === sesi.id) return NextResponse.json({ ok: false, pesan: 'Akun sendiri tidak dapat dihapus' }, { status: 400 });
  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
