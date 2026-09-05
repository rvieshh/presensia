import { NextRequest, NextResponse } from 'next/server';
import { prosesScan } from '@/lib/scan';

export const dynamic = 'force-dynamic';

/**
 * POST /api/scan
 * Body: { "qr": "PRS1.2024001.xxx.yyy" }
 * Header opsional: x-api-key  (buat device scanner fisik)
 *
 * Dipakai oleh:
 *  - Scan station web (keyboard wedge / kamera HP)
 *  - Scanner fisik / ESP32 yang POST langsung
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

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    null;

  const hasil = await prosesScan({
    rawInput: qr,
    apiKey: req.headers.get('x-api-key'),
    ip,
  });

  return NextResponse.json(hasil, { status: hasil.ok ? 200 : 422 });
}
