import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
import QRCode from 'qrcode';
import { prisma } from '@/lib/prisma';
import { ambilSesi } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/kartu/zip?kelas=<nama>
 * Unduh seluruh QR siswa sebagai ZIP.
 * Nama berkas mengikuti NIS: 2024001.png
 */
export async function GET(req: NextRequest) {
  const sesi = await ambilSesi();
  if (!sesi) return NextResponse.json({ ok: false, pesan: 'Tidak diizinkan' }, { status: 401 });

  const kelas = req.nextUrl.searchParams.get('kelas');

  const siswa = await prisma.siswa.findMany({
    where: { aktif: true, ...(kelas ? { kelas: { nama: kelas } } : {}) },
    include: { kelas: true },
    orderBy: { nis: 'asc' },
  });

  if (siswa.length === 0) {
    return NextResponse.json({ ok: false, pesan: 'Tidak ada siswa untuk diunduh' }, { status: 404 });
  }

  const zip = new JSZip();
  const daftar: string[] = ['nis,nama,kelas,berkas'];

  for (const s of siswa) {
    const buf = await QRCode.toBuffer(s.qrToken, { width: 600, margin: 1, type: 'png' });
    const folder = s.kelas.nama.replace(/[^A-Za-z0-9 _-]/g, '');
    zip.file(`${folder}/${s.nis}.png`, buf);
    daftar.push(`${s.nis},"${s.nama}","${s.kelas.nama}",${folder}/${s.nis}.png`);
  }

  zip.file('daftar.csv', daftar.join('\n'));

  const isi = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  const stamp = new Date().toISOString().slice(0, 10);
  const nama = kelas ? `qr-${kelas.replace(/\s+/g, '-')}-${stamp}.zip` : `qr-semua-siswa-${stamp}.zip`;

  return new NextResponse(new Uint8Array(isi), {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${nama}"`,
      'Content-Length': String(isi.length),
    },
  });
}
