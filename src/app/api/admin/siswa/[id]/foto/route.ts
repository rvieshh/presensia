import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ambilSesi } from '@/lib/auth';
import { olahFoto, MAKS_UNGGAH } from '@/lib/foto';

export const dynamic = 'force-dynamic';

const DIIZINKAN = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']);

/** POST /api/admin/siswa/[id]/foto — unggah foto, disimpan ke basis data */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sesi = await ambilSesi();
  if (!sesi) return NextResponse.json({ ok: false, pesan: 'Tidak diizinkan' }, { status: 401 });

  const { id } = await params;
  const siswa = await prisma.siswa.findUnique({ where: { id }, select: { id: true, nis: true } });
  if (!siswa) return NextResponse.json({ ok: false, pesan: 'Siswa tidak ditemukan' }, { status: 404 });

  const form = await req.formData().catch(() => null);
  const file = form?.get('foto');
  if (!file || typeof file === 'string') {
    return NextResponse.json({ ok: false, pesan: 'Berkas foto tidak ditemukan' }, { status: 400 });
  }

  if (file.size > MAKS_UNGGAH) {
    return NextResponse.json(
      { ok: false, pesan: `Ukuran maksimal ${Math.round(MAKS_UNGGAH / 1024 / 1024)} MB` },
      { status: 413 }
    );
  }

  if (file.type && !DIIZINKAN.has(file.type)) {
    return NextResponse.json(
      { ok: false, pesan: 'Format harus JPG, PNG, WebP, atau HEIC' },
      { status: 415 }
    );
  }

  let hasil;
  try {
    hasil = await olahFoto(Buffer.from(await file.arrayBuffer()));
  } catch {
    return NextResponse.json({ ok: false, pesan: 'Berkas rusak atau bukan gambar' }, { status: 422 });
  }

  await prisma.siswa.update({
    where: { id },
    data: { fotoData: new Uint8Array(hasil.data), fotoMime: hasil.mime, fotoUrl: null },
  });

  return NextResponse.json({
    ok: true,
    pesan: 'Foto tersimpan',
    ukuranKb: Math.round(hasil.data.length / 1024),
    url: `/api/foto/${siswa.nis}`,
  });
}

/** DELETE /api/admin/siswa/[id]/foto — hapus foto */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sesi = await ambilSesi();
  if (!sesi) return NextResponse.json({ ok: false, pesan: 'Tidak diizinkan' }, { status: 401 });

  const { id } = await params;
  await prisma.siswa.update({
    where: { id },
    data: { fotoData: null, fotoMime: null, fotoUrl: null },
  });

  return NextResponse.json({ ok: true, pesan: 'Foto dihapus' });
}
