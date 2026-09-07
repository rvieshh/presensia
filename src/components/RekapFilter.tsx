'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { FileDown } from 'lucide-react';
import { Select } from './Select';

const RENTANG = [
  { hari: 1, label: 'Hari ini' },
  { hari: 7, label: '7 hari terakhir' },
  { hari: 14, label: '14 hari terakhir' },
  { hari: 30, label: '30 hari terakhir' },
  { hari: 90, label: '90 hari terakhir' },
  { hari: 180, label: '180 hari terakhir' },
  { hari: 365, label: '365 hari terakhir' },
];

export function RekapFilter({
  hari,
  kelas,
  kelasTersedia,
}: {
  hari: number;
  kelas: string;
  kelasTersedia: string[];
}) {
  const router = useRouter();
  const params = useSearchParams();

  function ubah(kunci: string, nilai: string) {
    const p = new URLSearchParams(params.toString());
    if (nilai) p.set(kunci, nilai);
    else p.delete(kunci);
    router.push(`/admin/rekap?${p.toString()}`);
  }

  const unduh = `/api/admin/rekap/csv?hari=${hari}${kelas ? `&kelas=${encodeURIComponent(kelas)}` : ''}`;

  return (
    <div className="flex flex-wrap items-end gap-2">
      <div className="w-48">
        <label className="text-[12px] font-medium text-ink-500">Rentang</label>
        <div className="mt-1.5">
          <Select
            label="Rentang waktu"
            nilai={String(hari)}
            opsi={RENTANG.map((r) => ({ nilai: String(r.hari), label: r.label }))}
            onPilih={(v) => ubah('hari', v)}
          />
        </div>
      </div>

      <div className="w-44">
        <label className="text-[12px] font-medium text-ink-500">Kelas</label>
        <div className="mt-1.5">
          <Select
            label="Saring kelas"
            nilai={kelas}
            opsi={[{ nilai: '', label: 'Semua kelas' }, ...kelasTersedia.map((k) => ({ nilai: k, label: k }))]}
            onPilih={(v) => ubah('kelas', v)}
            placeholder="Semua kelas"
          />
        </div>
      </div>

      <a
        href={unduh}
        className="inline-flex items-center gap-2 rounded-btn bg-brand-600 px-3.5 py-2 text-[13.5px] font-semibold text-white shadow-soft transition-colors hover:bg-brand-700"
      >
        <FileDown size={16} strokeWidth={2.3} />
        Unduh CSV
      </a>
    </div>
  );
}
