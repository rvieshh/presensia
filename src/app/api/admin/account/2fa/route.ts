import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import QRCode from 'qrcode';
import { prisma } from '@/lib/prisma';
import { ambilSesi } from '@/lib/auth';
import { encodeBase32, cekTotp } from '@/lib/auth-core';
import { enkripsiTotp, dekripsiTotp } from '@/lib/crypto-secret';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const sesi = await ambilSesi();
  if (!sesi) return NextResponse.json({ ok: false, pesan: 'Tidak diizinkan' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const user = await prisma.user.findUnique({ where: { id: sesi.id } });
  if (!user) return NextResponse.json({ ok: false, pesan: 'Akun tidak ditemukan' }, { status: 404 });

  if (body.aksi === 'setup') {
    const secret = encodeBase32(randomBytes(20));
    await prisma.user.update({ where: { id: user.id }, data: { totpSecretEnc: enkripsiTotp(secret), totpEnabled: false } });
    const issuer = encodeURIComponent('Presensia');
    const label = encodeURIComponent(`Presensia:${user.email}`);
    const uri = `otpauth://totp/${label}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;
    const qr = await QRCode.toDataURL(uri, { width: 240, margin: 1 });
    return NextResponse.json({ ok: true, secret, qr });
  }

  if (body.aksi === 'aktifkan') {
    if (!user.totpSecretEnc || !cekTotp(dekripsiTotp(user.totpSecretEnc), String(body.kode || ''))) {
      return NextResponse.json({ ok: false, pesan: 'Kode 2FA salah' }, { status: 400 });
    }
    await prisma.user.update({ where: { id: user.id }, data: { totpEnabled: true, sessionVersion: { increment: 1 } } });
    return NextResponse.json({ ok: true, pesan: '2FA diaktifkan; silakan login kembali' });
  }

  if (body.aksi === 'nonaktifkan') {
    if (!user.totpSecretEnc || !cekTotp(dekripsiTotp(user.totpSecretEnc), String(body.kode || ''))) {
      return NextResponse.json({ ok: false, pesan: 'Kode 2FA salah' }, { status: 400 });
    }
    await prisma.user.update({ where: { id: user.id }, data: { totpEnabled: false, totpSecretEnc: null, sessionVersion: { increment: 1 } } });
    return NextResponse.json({ ok: true, pesan: '2FA dinonaktifkan; silakan login kembali' });
  }

  return NextResponse.json({ ok: false, pesan: 'Aksi tidak dikenali' }, { status: 400 });
}
