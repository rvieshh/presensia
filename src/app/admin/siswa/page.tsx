import { prisma } from '@/lib/prisma';
import { SiswaAksi } from '@/components/SiswaAksi';
import { TabelSiswa } from '@/components/TabelSiswa';
import type { SiswaData } from '@/components/EditSiswa';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Data Siswa — Admin Presensia' };

export default async function SiswaPage() {
  const [rows, kelas] = await Promise.all([
    prisma.siswa.findMany({
      select: {
        id: true, nis: true, nisn: true, nama: true, jenisKel: true,
        tempatLahir: true, tanggalLahir: true, alamat: true, noHp: true,
        agama: true, namaOrtu: true, waOrtu: true, aktif: true, fotoMime: true,
        kelas: { select: { nama: true } },
      },
      orderBy: [{ kelas: { nama: 'asc' } }, { nis: 'asc' }],
      take: 500,
    }),
    prisma.kelas.findMany({ orderBy: { nama: 'asc' } }),
  ]);

  const siswa: SiswaData[] = rows.map((s) => ({
    id: s.id,
    nis: s.nis,
    nisn: s.nisn,
    nama: s.nama,
    kelas: s.kelas.nama,
    jenisKel: s.jenisKel,
    tempatLahir: s.tempatLahir,
    tanggalLahir: s.tanggalLahir ? s.tanggalLahir.toISOString().slice(0, 10) : null,
    alamat: s.alamat,
    noHp: s.noHp,
    agama: s.agama,
    namaOrtu: s.namaOrtu,
    waOrtu: s.waOrtu,
    aktif: s.aktif,
    adaFoto: Boolean(s.fotoMime),
  }));

  const berfoto = siswa.filter((s) => s.adaFoto).length;

  return (
    <main className="px-5 py-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-semibold tracking-tight">Data Siswa</h1>
          <p className="mt-1 text-[13px] text-ink-500">
            {siswa.length} siswa &middot; {kelas.length} kelas &middot; {berfoto} berfoto
          </p>
        </div>
        <SiswaAksi kelasTersedia={kelas.map((k) => k.nama)} />
      </div>

      <TabelSiswa siswa={siswa} kelasTersedia={kelas.map((k) => k.nama)} />
    </main>
  );
}
