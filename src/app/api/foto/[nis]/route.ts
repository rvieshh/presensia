import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/foto/[nis]
 * Menyajikan foto siswa langsung dari basis data.
 * Bila belum ada foto, balas 404 agar antarmuka memakai placeholder.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ nis: string }> }
) {
  const { nis } = await params;

  const siswa = await prisma.siswa.findUnique({
    where: { nis },
    select: { fotoData: true, fotoMime: true, updatedAt: true },
  });

  if (!siswa?.fotoData) {
    return new NextResponse(null, { status: 404 });
  }

  const buf = Buffer.from(siswa.fotoData);

  return new NextResponse(new Uint8Array(buf), {
    headers: {
      'Content-Type': siswa.fotoMime || 'image/jpeg',
      'Content-Length': String(buf.length),
      'Cache-Control': 'private, max-age=60',
      ETag: `"${siswa.updatedAt.getTime()}"`,
    },
  });
}
