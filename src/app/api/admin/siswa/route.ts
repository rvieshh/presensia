import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { ambilSesi } from '@/lib/auth';
import { generateQrToken } from '@/lib/qr';
import { normalWa } from '@/lib/wa';

export const dynamic = 'force-dynamic';

const Schema = z.object({
  nis: z.string().trim().min(1, 'NIS wajib diisi'),
  nama: z.string().trim().min(1, 'Nama wajib diisi'),
  kelas: z.string().trim().min(1, 'Kelas wajib diisi'),
  nisn: z.string().trim().optional().nullable(),
  jenisKel: z.enum(['L', 'P']).optional().nullable(),
  tempatLahir: z.string().trim().optional().nullable(),
  tanggalLahir: z.string().trim().optional().nullable(),
  alamat: z.string().trim().optional().nullable(),
  noHp: z.string().trim().optional().nullable(),
  agama: z.string().trim().optional().nullable(),
  namaOrtu: z.string().trim().optional().nullable(),
  waOrtu: z.string().trim().optional().nullable(),
});

const nn = (v?: string | null) => { const t = (v ?? '').trim(); return t === '' ? null : t; };

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
      nisn: nn(d.nisn),
      jenisKel: d.jenisKel || null,
      tempatLahir: nn(d.tempatLahir),
      tanggalLahir: d.tanggalLahir ? new Date(d.tanggalLahir) : null,
      alamat: nn(d.alamat),
      noHp: normalWa(d.noHp),
      agama: nn(d.agama),
      namaOrtu: nn(d.namaOrtu),
      waOrtu: normalWa(d.waOrtu),
      qrToken: generateQrToken(d.nis),
    },
    include: { kelas: true },
  });

  return NextResponse.json({
    ok: true,
    siswa: { id: siswa.id, nis: siswa.nis, nama: siswa.nama, kelas: siswa.kelas.nama },
  });
}
