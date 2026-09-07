import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ambilSesi } from '@/lib/auth';
import type { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

const UKURAN_HALAMAN = [10, 25, 50, 100] as const;

/**
 * GET /api/admin/siswa/daftar?hal=1&per=10&kelas=XI RPL 1&cari=budi
 *
 * Penyaringan dan pemenggalan dikerjakan basis data, bukan peramban.
 * Mengirim seluruh siswa lalu memotongnya di sisi klien akan berat
 * begitu jumlahnya ratusan.
 */
export async function GET(req: NextRequest) {
  const sesi = await ambilSesi();
  if (!sesi) return NextResponse.json({ ok: false, pesan: 'Tidak diizinkan' }, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const per = UKURAN_HALAMAN.includes(Number(sp.get('per')) as never)
    ? Number(sp.get('per'))
    : 10;
  const hal = Math.max(1, Number(sp.get('hal')) || 1);
  const kelas = (sp.get('kelas') || '').trim();
  const cari = (sp.get('cari') || '').trim();

  const where: Prisma.SiswaWhereInput = {
    ...(kelas ? { kelas: { nama: kelas } } : {}),
    ...(cari
      ? {
          OR: [
            { nama: { contains: cari, mode: 'insensitive' } },
            { nis: { contains: cari } },
            { nisn: { contains: cari } },
          ],
        }
      : {}),
  };

  const [total, rows] = await Promise.all([
    prisma.siswa.count({ where }),
    prisma.siswa.findMany({
      where,
      select: {
        id: true, nis: true, nisn: true, nama: true, agama: true,
        waOrtu: true, aktif: true, fotoMime: true,
        kelas: { select: { nama: true } },
      },
      orderBy: [{ kelas: { nama: 'asc' } }, { nis: 'asc' }],
      skip: (hal - 1) * per,
      take: per,
    }),
  ]);

  const totalHal = Math.max(1, Math.ceil(total / per));

  return NextResponse.json({
    ok: true,
    total,
    hal: Math.min(hal, totalHal),
    per,
    totalHal,
    siswa: rows.map((s) => ({
      id: s.id,
      nis: s.nis,
      nisn: s.nisn,
      nama: s.nama,
      kelas: s.kelas.nama,
      agama: s.agama,
      waOrtu: s.waOrtu,
      aktif: s.aktif,
      adaFoto: Boolean(s.fotoMime),
    })),
  });
}
