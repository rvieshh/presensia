import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ambilSesi } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const DIIZINKAN = new Set([
  'jam_masuk', 'jam_telat', 'jam_pulang', 'nama_sekolah',
  'wa_enabled', 'wa_gateway_url', 'wa_gateway_token', 'wa_template_telat', 'wa_template_hadir',
  'sesi_siang_aktif', 'sesi_siang_masuk', 'sesi_siang_telat', 'sesi_siang_pulang',
  'jumat_dispensasi_aktif', 'jumat_batas_masuk',
  'manual_input_aktif',
]);

export async function POST(req: NextRequest) {
  const sesi = await ambilSesi();
  if (!sesi) return NextResponse.json({ ok: false, pesan: 'Tidak diizinkan' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const entri = Object.entries(body as Record<string, unknown>)
    .filter(([k]) => DIIZINKAN.has(k))
    .map(([k, v]) => ({ key: k, value: String(v ?? '') }));

  if (entri.length === 0) {
    return NextResponse.json({ ok: false, pesan: 'Tidak ada pengaturan yang dikenali' }, { status: 400 });
  }

  for (const e of entri) {
    await prisma.setting.upsert({
      where: { key: e.key },
      update: { value: e.value },
      create: { key: e.key, value: e.value },
    });
  }

  return NextResponse.json({ ok: true, pesan: `${entri.length} pengaturan disimpan` });
}
