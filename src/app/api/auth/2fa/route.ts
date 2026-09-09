import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ambilTantangan2fa, buatSesi } from '@/lib/auth';
import { cekTotp } from '@/lib/auth-core';
import { dekripsiTotp } from '@/lib/crypto-secret';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const userId = await ambilTantangan2fa();
  if (!userId) return NextResponse.json({ ok: false, pesan: 'Tantangan 2FA kedaluwarsa' }, { status: 401 });

  const { kode } = await req.json().catch(() => ({}));
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.aktif || !user.totpEnabled || !user.totpSecretEnc) {
    return NextResponse.json({ ok: false, pesan: '2FA tidak tersedia' }, { status: 401 });
  }

  let valid = false;
  try { valid = cekTotp(dekripsiTotp(user.totpSecretEnc), String(kode || '')); } catch { valid = false; }
  if (!valid) return NextResponse.json({ ok: false, pesan: 'Kode autentikator salah atau kedaluwarsa' }, { status: 401 });

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await buatSesi({ id: user.id, email: user.email, nama: user.nama, role: user.role, sessionVersion: user.sessionVersion });
  return NextResponse.json({ ok: true, user: { nama: user.nama, role: user.role } });
}
