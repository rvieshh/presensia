import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ambilSesi } from '@/lib/auth';
import { parseDaftarCidr } from '@/lib/ip';

export const dynamic = 'force-dynamic';

/** Validasi pengaturan keamanan sebelum disimpan. */
export async function POST(req: NextRequest) {
  const sesi = await ambilSesi();
  if (!sesi || sesi.role !== 'ADMIN') {
    return NextResponse.json({ ok: false, pesan: 'Hanya admin yang diizinkan' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const allowAktif = String(body.scan_ip_allowlist_aktif ?? 'false') === 'true';
  const allow = parseDaftarCidr(String(body.scan_ip_allowlist ?? ''));
  const proxy = parseDaftarCidr(String(body.trusted_proxy_cidrs ?? '127.0.0.1/32,::1/128'));
  const rate = Number(body.scan_rate_limit_per_minute ?? 120);

  if (allow.invalid.length) {
    return NextResponse.json({ ok: false, pesan: `IP/CIDR tidak valid: ${allow.invalid.join(', ')}` }, { status: 400 });
  }
  if (allowAktif && allow.valid.length === 0) {
    return NextResponse.json({ ok: false, pesan: 'Isi minimal satu IP sebelum mengaktifkan allowlist' }, { status: 400 });
  }
  if (proxy.invalid.length) {
    return NextResponse.json({ ok: false, pesan: `Proxy CIDR tidak valid: ${proxy.invalid.join(', ')}` }, { status: 400 });
  }
  if (!Number.isInteger(rate) || rate < 10 || rate > 600) {
    return NextResponse.json({ ok: false, pesan: 'Rate limit harus 10 sampai 600 per menit' }, { status: 400 });
  }

  const entri = {
    scan_device_wajib: String(body.scan_device_wajib ?? 'false'),
    scan_ip_allowlist_aktif: String(body.scan_ip_allowlist_aktif ?? 'false'),
    scan_ip_allowlist: allow.valid.join('\n'),
    trusted_proxy_cidrs: proxy.valid.join('\n'),
    scan_rate_limit_per_minute: String(rate),
  };

  await prisma.$transaction(
    Object.entries(entri).map(([key, value]) =>
      prisma.setting.upsert({ where: { key }, update: { value }, create: { key, value } })
    )
  );

  return NextResponse.json({ ok: true, pesan: 'Pengaturan keamanan disimpan', data: entri });
}
