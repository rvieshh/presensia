import QRCode from 'qrcode';
import { IdCard, Printer, Download } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { ambilSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Kartu QR Siswa — Presensia' };

export default async function KartuPage() {
  const [siswa, st] = await Promise.all([
    prisma.siswa.findMany({
      where: { aktif: true },
      include: { kelas: true },
      orderBy: { nis: 'asc' },
      take: 60,
    }),
    ambilSettings(),
  ]);

  const kartu = await Promise.all(
    siswa.map(async (s) => ({
      nama: s.nama,
      nis: s.nis,
      kelas: s.kelas.nama,
      png: await QRCode.toDataURL(s.qrToken, { width: 300, margin: 0 }),
    }))
  );

  return (
    <main className="px-5 py-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-chip bg-brand-50 text-brand-600">
              <IdCard size={19} strokeWidth={2.2} />
            </span>
            <div>
              <h1 className="text-[20px] font-semibold tracking-tight">Kartu QR Siswa</h1>
              <p className="text-[12.5px] text-ink-500">
                {kartu.length} kartu &middot; cetak, potong, tempel di kartu pelajar
              </p>
            </div>
          </div>
          <div className="no-print flex flex-wrap items-center gap-2"><p className="inline-flex items-center gap-1.5 rounded-btn border border-ink-200 bg-white px-3 py-2 text-[12.5px] font-medium text-ink-500 shadow-soft">
            <Printer size={14} strokeWidth={2.2} />
            Tekan Ctrl+P untuk mencetak
          </p>
          <a href="/api/admin/kartu/zip" className="no-print inline-flex items-center gap-1.5 rounded-btn bg-brand-600 px-3 py-2 text-[12.5px] font-semibold text-white shadow-soft transition-colors hover:bg-brand-700">
            <Download size={14} strokeWidth={2.3} /> Unduh ZIP
          </a></div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {kartu.map((k) => (
            <div
              key={k.nis}
              className="flex flex-col items-center rounded-card border border-ink-200 bg-white p-3.5 text-center shadow-soft"
            >
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-brand-600">
                {st.nama_sekolah}
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={k.png} alt={`QR ${k.nama}`} className="aspect-square w-full max-w-[128px]" />
              <p className="mt-2.5 line-clamp-2 min-h-[34px] text-[13px] font-semibold leading-tight">
                {k.nama}
              </p>
              <p className="tnum mt-auto pt-1 text-[11px] text-ink-400">
                {k.nis} &middot; {k.kelas}
              </p>
            </div>
          ))}
        </div>
    </main>
  );
}
