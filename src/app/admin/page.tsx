import Link from 'next/link';
import { Users, CheckCircle2, Clock, AlertTriangle, ArrowRight, UserPlus } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { tanggalHariIni } from '@/lib/waktu';
import { ambilSettings } from '@/lib/settings';
import { StatCard } from '@/components/StatCard';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Dasbor — Admin Presensia' };

const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli',
  'Agustus', 'September', 'Oktober', 'November', 'Desember'];

export default async function AdminDashboard() {
  const tanggal = tanggalHariIni();
  const now = new Date();

  const [totalSiswa, hadir, telat, st, terbaru, totalKelas, antreWa] = await Promise.all([
    prisma.siswa.count({ where: { aktif: true } }),
    prisma.absensi.count({ where: { tanggal, status: 'HADIR' } }),
    prisma.absensi.count({ where: { tanggal, status: 'TERLAMBAT' } }),
    ambilSettings(),
    prisma.absensi.findMany({
      where: { tanggal },
      include: { siswa: { include: { kelas: true } } },
      orderBy: { jamMasuk: 'desc' },
      take: 8,
    }),
    prisma.kelas.count(),
    prisma.waOutbox.count({ where: { terkirim: false } }),
  ]);

  const sudah = hadir + telat;
  const belum = Math.max(0, totalSiswa - sudah);
  const persen = totalSiswa ? Math.round((sudah / totalSiswa) * 100) : 0;
  const tglStr = `${HARI[now.getDay()]}, ${now.getDate()} ${BULAN[now.getMonth()]} ${now.getFullYear()}`;

  return (
    <main className="px-5 py-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-semibold tracking-tight">Dasbor</h1>
          <p className="mt-1 text-[13px] text-ink-500">{st.nama_sekolah} &middot; {tglStr}</p>
        </div>
        <Link
          href="/admin/siswa"
          className="inline-flex items-center gap-2 rounded-btn bg-brand-600 px-3.5 py-2 text-[13.5px] font-semibold text-white shadow-soft transition-colors hover:bg-brand-700"
        >
          <UserPlus size={16} strokeWidth={2.3} />
          Kelola Siswa
        </Link>
      </div>

      <section className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Siswa Aktif" nilai={totalSiswa} sub={`${totalKelas} kelas`} ikon={Users} />
        <StatCard label="Hadir Tepat Waktu" nilai={hadir} sub={`sebelum ${st.jam_telat}`} ikon={CheckCircle2} nada="ok" />
        <StatCard label="Terlambat" nilai={telat} sub={`setelah ${st.jam_telat}`} ikon={Clock} nada="warn" />
        <StatCard label="Belum Absen" nilai={belum} sub="hari ini" ikon={AlertTriangle} nada={belum > 0 ? 'bad' : 'netral'} />
      </section>

      <section className="mt-4 rounded-card border border-ink-200 bg-white p-5 shadow-soft">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-[14px] font-semibold">Kehadiran Hari Ini</h2>
            <p className="mt-0.5 text-[12.5px] text-ink-500">
              {sudah} dari {totalSiswa} siswa sudah tercatat
              {antreWa > 0 && <> &middot; {antreWa} notifikasi WA menunggu</>}
            </p>
          </div>
          <span className="tnum text-[22px] font-semibold text-brand-600">{persen}%</span>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-ink-100">
          <div className="h-full rounded-full bg-brand-600" style={{ width: `${persen}%` }} />
        </div>
      </section>

      <section className="mt-4 overflow-hidden rounded-card border border-ink-200 bg-white shadow-soft">
        <div className="flex items-center justify-between border-b border-ink-200 px-5 py-3.5">
          <h2 className="text-[14px] font-semibold">Aktivitas Terbaru</h2>
          <Link href="/admin/siswa" className="inline-flex items-center gap-1 text-[12.5px] font-medium text-brand-600 hover:text-brand-700">
            Data siswa <ArrowRight size={13} strokeWidth={2.4} />
          </Link>
        </div>

        {terbaru.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-[13.5px] font-medium text-ink-700">Belum ada absensi hari ini</p>
            <p className="mt-1 text-[12.5px] text-ink-400">Scan pertama akan muncul di sini.</p>
          </div>
        ) : (
          <ul className="divide-y divide-ink-200">
            {terbaru.map((a) => {
              const telatRow = a.status === 'TERLAMBAT';
              return (
                <li key={a.id} className="flex items-center gap-3 px-5 py-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-chip bg-ink-100 text-[12px] font-semibold text-ink-700">
                    {a.siswa.nama.slice(0, 1)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-medium">{a.siswa.nama}</p>
                    <p className="truncate text-[12px] text-ink-400">{a.siswa.nis} &middot; {a.siswa.kelas.nama}</p>
                  </div>
                  <span className={['rounded-chip px-2 py-1 text-[11.5px] font-semibold',
                    telatRow ? 'bg-warn-50 text-warn-700' : 'bg-ok-50 text-ok-700'].join(' ')}>
                    {telatRow ? `Telat ${a.menitTelat}m` : 'Hadir'}
                  </span>
                  <span className="tnum w-11 text-right text-[12.5px] text-ink-500">
                    {a.jamMasuk ? a.jamMasuk.toTimeString().slice(0, 5) : '--:--'}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
