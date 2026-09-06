import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { ambilSesi } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const Skema = z.object({
  ids: z.array(z.string().min(1)).min(1, 'Tidak ada siswa yang dipilih').max(500),
});

/** POST /api/admin/siswa/hapus-massal — hapus beberapa siswa sekaligus */
export async function POST(req: NextRequest) {
  const sesi = await ambilSesi();
  if (!sesi) return NextResponse.json({ ok: false, pesan: 'Tidak diizinkan' }, { status: 401 });
  if (sesi.role !== 'ADMIN') {
    return NextResponse.json({ ok: false, pesan: 'Hanya admin yang boleh menghapus' }, { status: 403 });
  }

  const parsed = Skema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, pesan: parsed.error.issues[0]?.message ?? 'Permintaan tidak valid' },
      { status: 400 }
    );
  }

  const { count } = await prisma.siswa.deleteMany({
    where: { id: { in: parsed.data.ids } },
  });

  return NextResponse.json({
    ok: true,
    dihapus: count,
    pesan: `${count} siswa dihapus beserta riwayat absensinya`,
  });
}
