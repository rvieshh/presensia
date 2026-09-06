import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { ambilSesi } from '@/lib/auth';
import { generateQrToken } from '@/lib/qr';
import { normalWa } from '@/lib/wa';

export const dynamic = 'force-dynamic';

const Ubah = z.object({
  nis: z.string().trim().min(1).optional(),
  nisn: z.string().trim().optional().nullable(),
  nama: z.string().trim().min(1).optional(),
  kelas: z.string().trim().min(1).optional(),
  jenisKel: z.enum(['L', 'P']).optional().nullable(),
  tempatLahir: z.string().trim().optional().nullable(),
  tanggalLahir: z.string().trim().optional().nullable(),
  alamat: z.string().trim().optional().nullable(),
  noHp: z.string().trim().optional().nullable(),
  agama: z.string().trim().optional().nullable(),
  namaOrtu: z.string().trim().optional().nullable(),
  waOrtu: z.string().trim().optional().nullable(),
  aktif: z.boolean().optional(),
  regenerasiQr: z.boolean().optional(),
});

function kosongJadiNull(v: string | null | undefined) {
  const t = (v ?? '').trim();
  return t === '' ? null : t;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sesi = await ambilSesi();
  if (!sesi) return NextResponse.json({ ok: false, pesan: 'Tidak diizinkan' }, { status: 401 });

  const { id } = await params;
  const ada = await prisma.siswa.findUnique({ where: { id } });
  if (!ada) return NextResponse.json({ ok: false, pesan: 'Siswa tidak ditemukan' }, { status: 404 });

  const parsed = Ubah.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, pesan: parsed.error.issues[0]?.message ?? 'Data tidak valid' },
      { status: 400 }
    );
  }
  const d = parsed.data;

  // NIS berubah -> pastikan tidak bentrok, dan QR wajib dibuat ulang
  if (d.nis && d.nis !== ada.nis) {
    const bentrok = await prisma.siswa.findUnique({ where: { nis: d.nis } });
    if (bentrok) {
      return NextResponse.json({ ok: false, pesan: `NIS ${d.nis} sudah dipakai siswa lain` }, { status: 409 });
    }
  }

  const nisn = kosongJadiNull(d.nisn);
  if (nisn && nisn !== ada.nisn) {
    const bentrok = await prisma.siswa.findFirst({ where: { nisn, NOT: { id } } });
    if (bentrok) {
      return NextResponse.json({ ok: false, pesan: `NISN ${nisn} sudah dipakai siswa lain` }, { status: 409 });
    }
  }

  let kelasId: string | undefined;
  if (d.kelas) {
    const k = await prisma.kelas.upsert({
      where: { nama: d.kelas },
      update: {},
      create: { nama: d.kelas, tingkat: d.kelas.split(' ')[0] || '-' },
    });
    kelasId = k.id;
  }

  const nisBaru = d.nis ?? ada.nis;
  const perluQrBaru = d.regenerasiQr === true || (d.nis && d.nis !== ada.nis);

  const siswa = await prisma.siswa.update({
    where: { id },
    data: {
      ...(d.nis ? { nis: d.nis } : {}),
      ...(d.nisn !== undefined ? { nisn } : {}),
      ...(d.nama ? { nama: d.nama } : {}),
      ...(kelasId ? { kelasId } : {}),
      ...(d.jenisKel !== undefined ? { jenisKel: d.jenisKel || null } : {}),
      ...(d.tempatLahir !== undefined ? { tempatLahir: kosongJadiNull(d.tempatLahir) } : {}),
      ...(d.tanggalLahir !== undefined
        ? { tanggalLahir: d.tanggalLahir ? new Date(d.tanggalLahir) : null }
        : {}),
      ...(d.alamat !== undefined ? { alamat: kosongJadiNull(d.alamat) } : {}),
      ...(d.noHp !== undefined ? { noHp: normalWa(d.noHp) } : {}),
      ...(d.agama !== undefined ? { agama: kosongJadiNull(d.agama) } : {}),
      ...(d.namaOrtu !== undefined ? { namaOrtu: kosongJadiNull(d.namaOrtu) } : {}),
      ...(d.waOrtu !== undefined ? { waOrtu: normalWa(d.waOrtu) } : {}),
      ...(d.aktif !== undefined ? { aktif: d.aktif } : {}),
      ...(perluQrBaru ? { qrToken: generateQrToken(nisBaru) } : {}),
    },
    include: { kelas: true },
  });

  return NextResponse.json({
    ok: true,
    pesan: perluQrBaru ? 'Data tersimpan, QR dibuat ulang (kartu lama tidak berlaku)' : 'Data tersimpan',
    siswa: { id: siswa.id, nis: siswa.nis, nama: siswa.nama, kelas: siswa.kelas.nama },
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sesi = await ambilSesi();
  if (!sesi) return NextResponse.json({ ok: false, pesan: 'Tidak diizinkan' }, { status: 401 });
  if (sesi.role !== 'ADMIN') {
    return NextResponse.json({ ok: false, pesan: 'Hanya admin yang boleh menghapus' }, { status: 403 });
  }

  const { id } = await params;
  const ada = await prisma.siswa.findUnique({ where: { id } });
  if (!ada) return NextResponse.json({ ok: false, pesan: 'Siswa tidak ditemukan' }, { status: 404 });

  await prisma.siswa.delete({ where: { id } });
  return NextResponse.json({ ok: true, pesan: `${ada.nama} dihapus beserta riwayat absensinya` });
}
