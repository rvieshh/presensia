import { prisma } from './prisma';
import { tanggalHariIni } from './waktu';

export const RENTANG = [
  { hari: 1, label: 'Hari ini' },
  { hari: 7, label: '7 hari' },
  { hari: 14, label: '14 hari' },
  { hari: 30, label: '30 hari' },
  { hari: 90, label: '90 hari' },
  { hari: 180, label: '180 hari' },
  { hari: 365, label: '365 hari' },
] as const;

export function rentangValid(n: number): number {
  return RENTANG.some((r) => r.hari === n) ? n : 30;
}

/** Tanggal mulai untuk rentang N hari, termasuk hari ini */
export function mulaiDari(hari: number): Date {
  const akhir = tanggalHariIni();
  const mulai = new Date(akhir);
  mulai.setDate(mulai.getDate() - (hari - 1));
  return mulai;
}

export interface BarisRekap {
  id: string;
  nis: string;
  nama: string;
  kelas: string;
  hadir: number;
  terlambat: number;
  izin: number;
  sakit: number;
  alpa: number;
  totalMenitTelat: number;
  hariTercatat: number;
  persen: number;
}

export interface HasilRekap {
  baris: BarisRekap[];
  mulai: Date;
  akhir: Date;
  hariEfektif: number;
  ringkas: { hadir: number; terlambat: number; izin: number; sakit: number; alpa: number };
}

/**
 * Rekap kehadiran per siswa dalam rentang tertentu.
 *
 * "Hari efektif" dihitung dari tanggal yang benar-benar punya catatan
 * absensi, bukan jumlah hari kalender. Akhir pekan dan hari libur tidak
 * menghasilkan catatan, sehingga persentase tidak tergerus tanpa alasan.
 */
export async function hitungRekap(hari: number, kelasNama?: string): Promise<HasilRekap> {
  const mulai = mulaiDari(hari);
  const akhir = tanggalHariIni();

  const filterKelas = kelasNama ? { kelas: { nama: kelasNama } } : {};

  const [siswa, absensi, tanggalUnik] = await Promise.all([
    prisma.siswa.findMany({
      where: { aktif: true, ...filterKelas },
      select: { id: true, nis: true, nama: true, kelas: { select: { nama: true } } },
      orderBy: [{ kelas: { nama: 'asc' } }, { nis: 'asc' }],
    }),
    prisma.absensi.findMany({
      where: {
        tanggal: { gte: mulai, lte: akhir },
        ...(kelasNama ? { siswa: { kelas: { nama: kelasNama } } } : {}),
      },
      select: { siswaId: true, status: true, menitTelat: true, tanggal: true },
    }),
    prisma.absensi.findMany({
      where: { tanggal: { gte: mulai, lte: akhir } },
      select: { tanggal: true },
      distinct: ['tanggal'],
    }),
  ]);

  const hariEfektif = tanggalUnik.length;

  const peta = new Map<string, BarisRekap>();
  for (const s of siswa) {
    peta.set(s.id, {
      id: s.id,
      nis: s.nis,
      nama: s.nama,
      kelas: s.kelas.nama,
      hadir: 0, terlambat: 0, izin: 0, sakit: 0, alpa: 0,
      totalMenitTelat: 0, hariTercatat: 0, persen: 0,
    });
  }

  const ringkas = { hadir: 0, terlambat: 0, izin: 0, sakit: 0, alpa: 0 };

  for (const a of absensi) {
    const b = peta.get(a.siswaId);
    if (!b) continue;
    b.hariTercatat++;
    if (a.status === 'HADIR') { b.hadir++; ringkas.hadir++; }
    else if (a.status === 'TERLAMBAT') { b.terlambat++; b.totalMenitTelat += a.menitTelat; ringkas.terlambat++; }
    else if (a.status === 'IZIN') { b.izin++; ringkas.izin++; }
    else if (a.status === 'SAKIT') { b.sakit++; ringkas.sakit++; }
    else { b.alpa++; ringkas.alpa++; }
  }

  const baris = Array.from(peta.values()).map((b) => {
    const masuk = b.hadir + b.terlambat;
    const alpaTersirat = Math.max(0, hariEfektif - b.hariTercatat);
    b.alpa += alpaTersirat;
    b.persen = hariEfektif > 0 ? Math.round((masuk / hariEfektif) * 100) : 0;
    return b;
  });

  return { baris, mulai, akhir, hariEfektif, ringkas };
}
