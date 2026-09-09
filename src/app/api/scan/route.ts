import { NextRequest, NextResponse } from 'next/server';
import { prosesScan } from '@/lib/scan';
import { ambilSettings } from '@/lib/settings';
import { parseDaftarCidr, ipDiizinkan } from '@/lib/ip';
import { DEFAULT_SECURITY, konteksIpRequest, angkaBatas, lewatBatasRate } from '@/lib/security';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

async function tolak(qr: string, ip: string, alasan: string, pesan: string, status: number) {
  await prisma.scanLog.create({
    data: { rawInput: qr.slice(0, 500), sukses: false, alasan, ip },
  });
  return NextResponse.json({ ok: false, pesan }, { status });
}

/**
 * POST /api/scan
 * Body: { "qr": "PRS1.2024001.xxx.yyy" }
 * Header perangkat: x-api-key
 *
 * Urutan pertahanan: IP tepercaya -> rate limit -> device key -> QR HMAC.
 */
export async function POST(req: NextRequest) {
  let qr = '';
  try {
    const body = await req.json();
    qr = typeof body?.qr === 'string' ? body.qr : '';
  } catch {
    return NextResponse.json({ ok: false, pesan: 'Body JSON tidak valid' }, { status: 400 });
  }

  if (!qr.trim()) {
    return NextResponse.json({ ok: false, pesan: 'QR kosong' }, { status: 400 });
  }

  const st = await ambilSettings();
  const ctx = await konteksIpRequest(
    st.trusted_proxy_cidrs || DEFAULT_SECURITY.trusted_proxy_cidrs
  );

  const batas = angkaBatas(st.scan_rate_limit_per_minute, 120);
  if (lewatBatasRate(ctx.ip, batas)) {
    return tolak(qr, ctx.ip, 'Rate limit scan terlampaui', 'Terlalu banyak permintaan scan', 429);
  }

  if ((st.scan_ip_allowlist_aktif ?? 'false') === 'true') {
    const daftar = parseDaftarCidr(st.scan_ip_allowlist).valid;
    if (daftar.length === 0 || !ipDiizinkan(ctx.ip, daftar)) {
      return tolak(qr, ctx.ip, 'IP tidak diizinkan', 'Sumber scan tidak diizinkan', 403);
    }
  }

  const apiKey = req.headers.get('x-api-key');
  if ((st.scan_device_wajib ?? 'false') === 'true' && !apiKey) {
    return tolak(qr, ctx.ip, 'Kunci perangkat wajib', 'Perangkat tidak terautentikasi', 401);
  }

  const hasil = await prosesScan({ rawInput: qr, apiKey, ip: ctx.ip });
  return NextResponse.json(hasil, { status: hasil.ok ? 200 : 422 });
}
