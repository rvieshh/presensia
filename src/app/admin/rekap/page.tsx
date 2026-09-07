import { Suspense } from 'react';
import { CalendarRange, CheckCircle2, Clock, XCircle, TrendingUp } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { hitungRekap, rentangValid } from '@/lib/rekap';
import { ambilSettings } from '@/lib/settings';
import { StatCard } from '@/components/StatCard';
import { RekapFilter } from '@/components/RekapFilter';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Rekap Kehadiran — Admin Presensia' };

const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const fmt = (d: Date) => `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`;

export default async function RekapPage({
  searchParams,
}: {
  searchParams: Promise<{ hari?: string; kelas?: string }>;
}) {
  const sp = await searchParams;
  const hari = rentangValid(Number(sp.hari) || 30);
  const kelas = sp.kelas || '';

  const [r, st, daftarKelas] = await Promise.all([
    hitungRekap(hari, kelas || undefined),
    ambilSettings(),
    prisma.kelas.findMany({ orderBy: { nama: 'asc' }, select: { nama: true } }),
  ]);

  const totalMasuk = r.ringkas.hadir + r.ringkas.terlambat;
  const slotIdeal = r.baris.length * r.hariEfektif;
  const persenTotal = slotIdeal > 0 ? Math.round((totalMasuk / slotIdeal) * 100) : 0;

  const seringTelat = [...r.baris]
    .filter((b) => b.terlambat > 0)
    .sort((a, b) => b.terlambat - a.terlambat || b.totalMenitTelat - a.totalMenitTelat)
    .slice(0, 5);

  return (
    <main className="px-5 py-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-chip bg-brand-50 text-brand-600">
            <CalendarRange size={19} strokeWidth={2.2} />
          </span>
          <div>
            <h1 className="text-[22px] font-semibold tracking-tight">Rekap Kehadiran</h1>
            <p className="text-[12.5px] text-ink-500">
              {fmt(r.mulai)} – {fmt(r.akhir)} &middot; {r.hariEfektif} hari efektif &middot; {st.nama_sekolah}
            </p>
          </div>
        </div>
        <Suspense fallback={null}>
          <RekapFilter hari={hari} kelas={kelas} kelasTersedia={daftarKelas.map((k) => k.nama)} />
        </Suspense>
      </div>

      <section className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Kehadiran Keseluruhan" nilai={`${persenTotal}%`} sub={`${r.baris.length} siswa`} ikon={TrendingUp} nada={persenTotal >= 85 ? 'ok' : persenTotal >= 70 ? 'warn' : 'bad'} />
        <StatCard label="Hadir Tepat Waktu" nilai={r.ringkas.hadir} sub="total catatan" ikon={CheckCircle2} nada="ok" />
        <StatCard label="Terlambat" nilai={r.ringkas.terlambat} sub="total catatan" ikon={Clock} nada={r.ringkas.terlambat > 0 ? 'warn' : 'netral'} />
        <StatCard label="Tanpa Keterangan" nilai={r.ringkas.alpa} sub="termasuk tidak scan" ikon={XCircle} nada={r.ringkas.alpa > 0 ? 'bad' : 'netral'} />
      </section>

      {seringTelat.length > 0 && (
        <section className="mt-4 rounded-card border border-ink-200 bg-white p-5 shadow-soft">
          <h2 className="text-[14px] font-semibold">Paling Sering Terlambat</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {seringTelat.map((b) => (
              <li key={b.id} className="flex items-center gap-2 rounded-btn border border-ink-200 px-3 py-1.5">
                <span className="text-[13px] font-medium">{b.nama}</span>
                <span className="text-[11.5px] text-ink-400">{b.kelas}</span>
                <span className="tnum rounded-chip bg-warn-50 px-2 py-0.5 text-[11.5px] font-semibold text-warn-700">
                  {b.terlambat}× &middot; {b.totalMenitTelat}m
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-4 overflow-hidden rounded-card border border-ink-200 bg-white shadow-soft">
        <div className="border-b border-ink-200 px-5 py-3.5">
          <h2 className="text-[14px] font-semibold">Rincian per Siswa</h2>
          <p className="mt-0.5 text-[12px] text-ink-400">
            Persentase dihitung dari hari yang benar-benar ada catatan absensi, bukan hari kalender.
          </p>
        </div>

        {r.baris.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <p className="text-[13.5px] font-medium text-ink-700">Belum ada data</p>
            <p className="mt-1 text-[12.5px] text-ink-400">Tambah siswa terlebih dahulu, atau ganti rentang waktu.</p>
          </div>
        ) : (
          <div className="scroll-halus scroll-x overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead>
                <tr className="border-b border-ink-200 bg-ink-50">
                  {['NIS', 'Nama', 'Kelas', 'Hadir', 'Telat', 'Izin', 'Sakit', 'Alpa', 'Kehadiran'].map((h, i) => (
                    <th key={i} className={`px-4 py-2.5 text-[11.5px] font-semibold uppercase tracking-wide text-ink-500 ${i >= 3 ? 'text-center' : ''}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-200">
                {r.baris.map((b) => (
                  <tr key={b.id} className="transition-colors hover:bg-ink-50">
                    <td className="tnum px-4 py-2.5 text-[13px] text-ink-700">{b.nis}</td>
                    <td className="px-4 py-2.5 text-[13.5px] font-medium">{b.nama}</td>
                    <td className="px-4 py-2.5 text-[13px] text-ink-500">{b.kelas}</td>
                    <td className="tnum px-4 py-2.5 text-center text-[13px] font-semibold text-ok-700">{b.hadir}</td>
                    <td className="tnum px-4 py-2.5 text-center text-[13px]">
                      {b.terlambat > 0 ? (
                        <span className="font-semibold text-warn-700">{b.terlambat}</span>
                      ) : <span className="text-ink-400">0</span>}
                    </td>
                    <td className="tnum px-4 py-2.5 text-center text-[13px] text-ink-500">{b.izin}</td>
                    <td className="tnum px-4 py-2.5 text-center text-[13px] text-ink-500">{b.sakit}</td>
                    <td className="tnum px-4 py-2.5 text-center text-[13px]">
                      {b.alpa > 0 ? (
                        <span className="font-semibold text-bad-700">{b.alpa}</span>
                      ) : <span className="text-ink-400">0</span>}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-1.5 w-14 overflow-hidden rounded-full bg-ink-100">
                          <div
                            className={`h-full rounded-full ${b.persen >= 85 ? 'bg-ok-500' : b.persen >= 70 ? 'bg-warn-500' : 'bg-bad-500'}`}
                            style={{ width: `${b.persen}%` }}
                          />
                        </div>
                        <span className="tnum w-9 text-right text-[12.5px] font-semibold">{b.persen}%</span>
                      </div>
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
