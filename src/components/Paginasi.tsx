'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

/** Deret nomor halaman dengan elipsis, maksimal tujuh slot */
function nomorHalaman(hal: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (hal <= 4) return [1, 2, 3, 4, 5, '…', total];
  if (hal >= total - 3) return [1, '…', total - 4, total - 3, total - 2, total - 1, total];
  return [1, '…', hal - 1, hal, hal + 1, '…', total];
}

export function Paginasi({
  hal,
  totalHal,
  total,
  per,
  jumlahTampil,
  onPindah,
}: {
  hal: number;
  totalHal: number;
  total: number;
  per: number;
  jumlahTampil: number;
  onPindah: (h: number) => void;
}) {
  const dari = total === 0 ? 0 : (hal - 1) * per + 1;
  const sampai = (hal - 1) * per + jumlahTampil;

  const tombol =
    'grid h-8 min-w-8 place-items-center rounded-btn px-2 text-[13px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40';

  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
      <p className="text-[12.5px] text-ink-500">
        Menampilkan <span className="tnum font-semibold text-ink-700">{dari}</span>–
        <span className="tnum font-semibold text-ink-700">{sampai}</span> dari{' '}
        <span className="tnum font-semibold text-ink-700">{total}</span> siswa
      </p>

      {totalHal > 1 && (
        <nav aria-label="Navigasi halaman" className="flex items-center gap-1">
          <button
            onClick={() => onPindah(hal - 1)}
            disabled={hal <= 1}
            aria-label="Halaman sebelumnya"
            className={`${tombol} border border-ink-200 bg-white text-ink-700 hover:bg-ink-50`}
          >
            <ChevronLeft size={15} strokeWidth={2.3} />
          </button>

          {nomorHalaman(hal, totalHal).map((n, i) =>
            n === '…' ? (
              <span key={`e${i}`} className="px-1 text-[13px] text-ink-400">
                …
              </span>
            ) : (
              <button
                key={n}
                onClick={() => onPindah(n)}
                aria-current={n === hal ? 'page' : undefined}
                className={[
                  tombol,
                  'tnum',
                  n === hal
                    ? 'bg-brand-600 text-white'
                    : 'border border-ink-200 bg-white text-ink-700 hover:bg-ink-50',
                ].join(' ')}
              >
                {n}
              </button>
            )
          )}

          <button
            onClick={() => onPindah(hal + 1)}
            disabled={hal >= totalHal}
            aria-label="Halaman berikutnya"
            className={`${tombol} border border-ink-200 bg-white text-ink-700 hover:bg-ink-50`}
          >
            <ChevronRight size={15} strokeWidth={2.3} />
          </button>
        </nav>
      )}
    </div>
  );
}
