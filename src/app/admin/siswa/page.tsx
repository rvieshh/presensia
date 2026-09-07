import { prisma } from '@/lib/prisma';
import { SiswaAksi } from '@/components/SiswaAksi';
import { TabelSiswa } from '@/components/TabelSiswa';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Data Siswa — Admin Presensia' };

export default async function SiswaPage() {
  // Ringkasan saja; daftar siswa diambil bertahap oleh tabel
  const [totalSiswa, berfoto, kelas] = await Promise.all([
    prisma.siswa.count(),
    prisma.siswa.count({ where: { NOT: { fotoMime: null } } }),
    prisma.kelas.findMany({ orderBy: { nama: 'asc' }, select: { nama: true } }),
  ]);

  return (
    <main className="px-5 py-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-semibold tracking-tight">Data Siswa</h1>
          <p className="mt-1 text-[13px] text-ink-500">
            {totalSiswa} siswa &middot; {kelas.length} kelas &middot; {berfoto} berfoto
          </p>
        </div>
        <SiswaAksi kelasTersedia={kelas.map((k) => k.nama)} />
      </div>

      <TabelSiswa kelasTersedia={kelas.map((k) => k.nama)} />
    </main>
  );
}
