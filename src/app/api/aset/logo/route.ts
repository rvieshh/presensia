import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/aset/logo
 * Menyajikan logo sekolah dari basis data. Balas 404 bila belum diunggah
 * agar antarmuka kembali memakai judul teks.
 */
export async function GET() {
  const aset = await prisma.aset.findUnique({ where: { key: 'logo' } });
  if (!aset) return new NextResponse(null, { status: 404 });

  const buf = Buffer.from(aset.data);
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      'Content-Type': aset.mime,
      'Content-Length': String(buf.length),
      'Cache-Control': 'public, max-age=300',
      ETag: `"${aset.updatedAt.getTime()}"`,
    },
  });
}
