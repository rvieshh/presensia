import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { prisma } from '@/lib/prisma';
import { ambilSesi } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const MAKS = 4 * 1024 * 1024;
const DIIZINKAN = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']);

/** POST /api/admin/logo — unggah logo sekolah */
export async function POST(req: NextRequest) {
  const sesi = await ambilSesi();
  if (!sesi) return NextResponse.json({ ok: false, pesan: 'Tidak diizinkan' }, { status: 401 });

  const form = await req.formData().catch(() => null);
  const file = form?.get('logo');
  if (!file || typeof file === 'string') {
    return NextResponse.json({ ok: false, pesan: 'Berkas logo tidak ditemukan' }, { status: 400 });
  }
  if (file.size > MAKS) {
    return NextResponse.json({ ok: false, pesan: 'Ukuran maksimal 4 MB' }, { status: 413 });
  }
  if (file.type && !DIIZINKAN.has(file.type)) {
    return NextResponse.json({ ok: false, pesan: 'Format harus PNG, JPG, WebP, atau SVG' }, { status: 415 });
  }

  const masuk = Buffer.from(await file.arrayBuffer());
  let data = masuk;
  let mime = file.type || 'image/png';
  let info = 'svg';

  // SVG disimpan apa adanya; raster diperkecil agar ringan dan
  // dipertahankan sebagai PNG supaya latar transparan tidak menghitam.
  if (mime !== 'image/svg+xml') {
    try {
      const img = sharp(masuk, { failOn: 'none' });
      const meta = await img.metadata();
      if (!meta.width || !meta.height) throw new Error('bukan gambar');

      data = await img
        .resize(512, 256, { fit: 'inside', withoutEnlargement: true })
        .png({ compressionLevel: 9 })
        .toBuffer();
      mime = 'image/png';
      info = `${meta.width}x${meta.height} -> maks 512x256 png ${Math.round(data.length / 1024)}KB`;
    } catch {
      return NextResponse.json({ ok: false, pesan: 'Berkas rusak atau bukan gambar' }, { status: 422 });
    }
  }

  await prisma.aset.upsert({
    where: { key: 'logo' },
    update: { data: new Uint8Array(data), mime },
    create: { key: 'logo', data: new Uint8Array(data), mime },
  });

  return NextResponse.json({
    ok: true,
    pesan: 'Logo tersimpan',
    ukuranKb: Math.round(data.length / 1024),
    info,
  });
}

/** DELETE /api/admin/logo — kembali memakai judul teks */
export async function DELETE() {
  const sesi = await ambilSesi();
  if (!sesi) return NextResponse.json({ ok: false, pesan: 'Tidak diizinkan' }, { status: 401 });

  await prisma.aset.deleteMany({ where: { key: 'logo' } });
  return NextResponse.json({ ok: true, pesan: 'Logo dihapus, judul teks dipakai kembali' });
}
