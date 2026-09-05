import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { ambilSesi } from '@/lib/auth';
import { generateQrToken } from '@/lib/qr';

export const dynamic = 'force-dynamic';

const Schema = z.object({
  nis: z.string().trim().min(1, 'NIS wajib diisi'),
  nama: z.string().trim().min(1, 'Nama wajib diisi'),
  kelas: z.string().trim().min(1, 'Kelas wajib diisi'),
  waOrtu: z.string().trim().optional().nullable(),
  namaOrtu: z.string().trim().optional().nullable(),
  fotoUrl: z.string().trim().optional().nullable(),
});

/** Normalisasi nomor WA Indonesia -> 62xxxx */
function normalWa(raw?: string | null): string | null {
  if (!raw) return null;
  const d = raw.replace(/[^0-9]/g, '');
  if (!d) return null;
  if (d.startsWith('62')) return d;
  if (d.startsWith('0')) return '62' + d.slice(1);
  if (d.startsWith('8')) return '62' + d;
  return d;
}

export async function POST(req: NextRequest) {
  const sesi = await ambilSesi();
  if (!sesi) return NextResponse.json({ ok: false, pesan: 'Tidak diizinkan' }, { status: 401 });

  const parsed = Schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, pesan: parsed.error.issues[0]?.message ?? 'Data tidak valid' },
      { status: 400 }
    );
  }
  const d = parsed.data;

  const bentrok = await prisma.siswa.findUnique({ where: { nis: d.nis } });
  if (bentrok) {
    return NextResponse.json({ ok: false, pesan: `NIS ${d.nis} sudah terdaftar` }, { status: 409 });
  }

  const kelas = await prisma.kelas.upsert({
    where: { nama: d.kelas },
    update: {},
    create: { nama: d.kelas, tingkat: d.kelas.split(' ')[0] || '-' },
  });

  const siswa = await prisma.siswa.create({
    data: {
      nis: d.nis,
      nama: d.nama,
      kelasId: kelas.id,
      waOrtu: normalWa(d.waOrtu),
      namaOrtu: d.namaOrtu || null,
      fotoUrl: d.fotoUrl || null,
      qrToken: generateQrToken(d.nis),
    },
    include: { kelas: true },
  });

  return NextResponse.json({ ok: true, siswa: { nis: siswa.nis, nama: siswa.nama, kelas: siswa.kelas.nama } });
}
