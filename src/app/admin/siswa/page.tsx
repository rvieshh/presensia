import { Users } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { SiswaAksi } from '@/components/SiswaAksi';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Data Siswa — Admin Presensia' };

export default async function SiswaPage() {
  const [siswa, kelas] = await Promise.all([
    prisma.siswa.findMany({
      include: { kelas: true },
      orderBy: [{ kelas: { nama: 'asc' } }, { nis: 'asc' }],
      take: 300,
    }),
    prisma.kelas.findMany({ orderBy: { nama: 'asc' } }),
  ]);

  return (
    <main className="px-5 py-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-semibold tracking-tight">Data Siswa</h1>
          <p className="mt-1 text-[13px] text-ink-500">
            {siswa.length} siswa &middot; {kelas.length} kelas
          </p>
        </div>
        <SiswaAksi kelasTersedia={kelas.map((k) => k.nama)} />
      </div>

      <section className="mt-5 overflow-hidden rounded-card border border-ink-200 bg-white shadow-soft">
        {siswa.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <Users size={30} strokeWidth={1.6} className="mx-auto text-ink-400" />
            <p className="mt-2 text-[13.5px] font-medium text-ink-700">Belum ada data siswa</p>
            <p className="mt-1 text-[12.5px] text-ink-400">
              Tambah satu per satu, atau impor massal lewat CSV.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left">
              <thead>
                <tr className="border-b border-ink-200 bg-ink-50">
                  {['NIS', 'Nama', 'Kelas', 'WhatsApp Ortu', 'Status'].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-[11.5px] font-semibold uppercase tracking-wide text-ink-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-200">
                {siswa.map((s) => (
                  <tr key={s.id} className="transition-colors hover:bg-ink-50">
                    <td className="tnum px-4 py-2.5 text-[13px] text-ink-700">{s.nis}</td>
                    <td className="px-4 py-2.5 text-[13.5px] font-medium">{s.nama}</td>
                    <td className="px-4 py-2.5 text-[13px] text-ink-500">{s.kelas.nama}</td>
                    <td className="tnum px-4 py-2.5 text-[13px] text-ink-500">
                      {s.waOrtu || <span className="text-ink-400">—</span>}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={[
                        'rounded-chip px-2 py-0.5 text-[11.5px] font-semibold',
                        s.aktif ? 'bg-ok-50 text-ok-700' : 'bg-ink-100 text-ink-500',
                      ].join(' ')}>
                        {s.aktif ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
