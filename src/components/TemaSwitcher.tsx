'use client';

import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

type Tema = 'terang' | 'gelap';

/**
 * Pengalih tema. Pilihan disimpan di localStorage; bila belum pernah
 * memilih, preferensi sistem yang dipakai. Skrip di layout menerapkan
 * tema sebelum halaman tampil agar tidak ada kedipan putih.
 */
export function TemaSwitcher({ ringkas = false }: { ringkas?: boolean }) {
  const [tema, setTema] = useState<Tema>('terang');
  const [siap, setSiap] = useState(false);

  useEffect(() => {
    const aktif = (document.documentElement.dataset.tema as Tema) || 'terang';
    setTema(aktif);
    setSiap(true);
  }, []);

  function ganti(t: Tema) {
    setTema(t);
    document.documentElement.dataset.tema = t;
    try { localStorage.setItem('presensia-tema', t); } catch { /* mode privat */ }
  }

  if (!siap) {
    return <div className={ringkas ? 'h-8 w-8' : 'h-8 w-[70px]'} aria-hidden />;
  }

  if (ringkas) {
    const lawan: Tema = tema === 'gelap' ? 'terang' : 'gelap';
    return (
      <button
        type="button"
        onClick={() => ganti(lawan)}
        aria-label={tema === 'gelap' ? 'Beralih ke mode terang' : 'Beralih ke mode gelap'}
        title={tema === 'gelap' ? 'Mode terang' : 'Mode gelap'}
        className="grid h-8 w-8 place-items-center rounded-btn border border-ink-200 bg-white text-ink-500 transition-colors hover:bg-ink-50 hover:text-ink-900"
      >
        {tema === 'gelap' ? <Sun size={15} strokeWidth={2.2} /> : <Moon size={15} strokeWidth={2.2} />}
      </button>
    );
  }

  return (
    <div
      role="group"
      aria-label="Pilih tema tampilan"
      className="inline-flex items-center gap-0.5 rounded-btn border border-ink-200 bg-white p-0.5"
    >
      {([
        { nilai: 'terang' as Tema, ikon: Sun, label: 'Terang' },
        { nilai: 'gelap' as Tema, ikon: Moon, label: 'Gelap' },
      ]).map(({ nilai, ikon: Ikon, label }) => {
        const aktif = tema === nilai;
        return (
          <button
            key={nilai}
            type="button"
            onClick={() => ganti(nilai)}
            aria-pressed={aktif}
            className={[
              'inline-flex items-center gap-1.5 rounded-[7px] px-2.5 py-1 text-[12.5px] font-medium transition-colors',
              aktif ? 'bg-ink-100 text-ink-900' : 'text-ink-500 hover:text-ink-900',
            ].join(' ')}
          >
            <Ikon size={13} strokeWidth={2.3} />
            {label}
          </button>
        );
      })}
    </div>
  );
}
