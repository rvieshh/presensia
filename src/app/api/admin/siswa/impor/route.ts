import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ambilSesi } from '@/lib/auth';
import { generateQrToken } from '@/lib/qr';

export const dynamic = 'force-dynamic';

function normalWa(raw?: string | null): string | null {
  if (!raw) return null;
  const d = raw.replace(/[^0-9]/g, '');
  if (!d) return null;
  if (d.startsWith('62')) return d;
  if (d.startsWith('0')) return '62' + d.slice(1);
  if (d.startsWith('8')) return '62' + d;
  return d;
}

/** Pecah satu baris CSV, hormati tanda kutip ganda */
function pecahBaris(baris: string): string[] {
  const out: string[] = [];
  let cur = '';
  let dalamKutip = false;
  for (let i = 0; i < baris.length; i++) {
    const c = baris[i];
    if (c === '"') {
      if (dalamKutip && baris[i + 1] === '"') { cur += '"'; i++; }
      else dalamKutip = !dalamKutip;
    } else if ((c === ',' || c === ';') && !dalamKutip) {
      out.push(cur.trim()); cur = '';
    } else cur += c;
  }
  out.push(cur.trim());
  return out;
}

export async function POST(req: NextRequest) {
  const sesi = await ambilSesi();
  if (!sesi) return NextResponse.json({ ok: false, pesan: 'Tidak diizinkan' }, { status: 401 });

  const form = await req.formData().catch(() => null);
  const file = form?.get('file');
  if (!file || typeof file === 'string') {
    return NextResponse.json({ ok: false, pesan: 'File CSV tidak ditemukan' }, { status: 400 });
  }

  const teks = (await file.text()).replace(/^\uFEFF/, '');
  const baris = teks.split(/\r?\n/).filter((b) => b.trim());
  if (baris.length < 2) {
    return NextResponse.json({ ok: false, pesan: 'CSV kosong atau hanya berisi header' }, { status: 400 });
  }

  const header = pecahBaris(baris[0]).map((h) => h.toLowerCase().replace(/[^a-z]/g, ''));
  const idx = {
    nis: header.findIndex((h) => h === 'nis'),
    nama: header.findIndex((h) => h === 'nama' || h === 'namalengkap'),
    kelas: header.findIndex((h) => h === 'kelas'),
    wa: header.findIndex((h) => h.includes('wa') || h.includes('ortu') || h.includes('telepon')),
    foto: header.findIndex((h) => h.includes('foto')),
  };

  if (idx.nis < 0 || idx.nama < 0 || idx.kelas < 0) {
    return NextResponse.json(
      { ok: false, pesan: 'Header wajib: nis, nama, kelas (opsional: wa_ortu, foto_url)' },
      { status: 400 }
    );
  }

  const cacheKelas = new Map<string, string>();
  let masuk = 0, lewat = 0;
  const galat: string[] = [];

  for (let i = 1; i < baris.length; i++) {
    const kol = pecahBaris(baris[i]);
    const nis = kol[idx.nis]?.trim();
    const nama = kol[idx.nama]?.trim();
    const namaKelas = kol[idx.kelas]?.trim();

    if (!nis || !nama || !namaKelas) { galat.push(`Baris ${i + 1}: kolom wajib kosong`); continue; }

    try {
      if (await prisma.siswa.findUnique({ where: { nis } })) { lewat++; continue; }

      let kelasId = cacheKelas.get(namaKelas);
      if (!kelasId) {
        const k = await prisma.kelas.upsert({
          where: { nama: namaKelas },
          update: {},
          create: { nama: namaKelas, tingkat: namaKelas.split(' ')[0] || '-' },
        });
        kelasId = k.id;
        cacheKelas.set(namaKelas, kelasId);
      }

      await prisma.siswa.create({
        data: {
          nis, nama, kelasId,
          waOrtu: idx.wa >= 0 ? normalWa(kol[idx.wa]) : null,
          fotoUrl: idx.foto >= 0 ? (kol[idx.foto]?.trim() || null) : null,
          qrToken: generateQrToken(nis),
        },
      });
      masuk++;
    } catch (e) {
      galat.push(`Baris ${i + 1} (${nis}): ${e instanceof Error ? e.message.slice(0, 60) : 'gagal'}`);
    }
  }

  return NextResponse.json({
    ok: true,
    masuk,
    lewat,
    galat: galat.slice(0, 10),
    totalGalat: galat.length,
    pesan: `${masuk} siswa ditambahkan, ${lewat} dilewati (NIS sudah ada)${galat.length ? `, ${galat.length} gagal` : ''}`,
  });
}
