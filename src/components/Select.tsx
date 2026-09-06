'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface Opsi {
  nilai: string;
  label: string;
}

/**
 * Dropdown bergaya sendiri, menggantikan <select> bawaan peramban
 * yang tampilannya mengikuti sistem operasi dan tidak bisa ditata.
 * Tetap dapat diakses lewat papan ketik: panah, Enter, Escape.
 */
export function Select({
  nilai,
  opsi,
  onPilih,
  placeholder = 'Pilih…',
  id,
  label,
}: {
  nilai: string;
  opsi: Opsi[];
  onPilih: (v: string) => void;
  placeholder?: string;
  id?: string;
  label?: string;
}) {
  const [buka, setBuka] = useState(false);
  const [sorot, setSorot] = useState(0);
  const kotak = useRef<HTMLDivElement>(null);

  const terpilih = opsi.find((o) => o.nilai === nilai);

  useEffect(() => {
    if (!buka) return;
    const luar = (e: MouseEvent) => {
      if (kotak.current && !kotak.current.contains(e.target as Node)) setBuka(false);
    };
    document.addEventListener('mousedown', luar);
    return () => document.removeEventListener('mousedown', luar);
  }, [buka]);

  useEffect(() => {
    if (buka) setSorot(Math.max(0, opsi.findIndex((o) => o.nilai === nilai)));
  }, [buka, nilai, opsi]);

  function tombol(e: React.KeyboardEvent) {
    if (!buka && (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown')) {
      e.preventDefault();
      setBuka(true);
      return;
    }
    if (!buka) return;

    if (e.key === 'Escape') { e.preventDefault(); setBuka(false); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); setSorot((i) => Math.min(i + 1, opsi.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSorot((i) => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      const o = opsi[sorot];
      if (o) { onPilih(o.nilai); setBuka(false); }
    }
  }

  return (
    <div ref={kotak} className="relative">
      <button
        type="button"
        id={id}
        aria-haspopup="listbox"
        aria-expanded={buka}
        aria-label={label}
        onClick={() => setBuka((v) => !v)}
        onKeyDown={tombol}
        className={[
          'flex w-full items-center justify-between gap-2 rounded-btn border bg-ink-50 px-3 py-2 text-left text-[13.5px] transition-colors',
          buka ? 'border-brand-500 bg-white' : 'border-ink-200 hover:bg-white',
        ].join(' ')}
      >
        <span className={terpilih ? 'text-ink-900' : 'text-ink-400'}>
          {terpilih ? terpilih.label : placeholder}
        </span>
        <ChevronDown
          size={15}
          strokeWidth={2.2}
          className={`shrink-0 text-ink-400 transition-transform ${buka ? 'rotate-180' : ''}`}
        />
      </button>

      {buka && (
        <ul
          role="listbox"
          className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-card border border-ink-200 bg-white py-1 shadow-lift"
        >
          {opsi.map((o, i) => {
            const aktif = o.nilai === nilai;
            return (
              <li key={o.nilai || '_'} role="option" aria-selected={aktif}>
                <button
                  type="button"
                  onMouseEnter={() => setSorot(i)}
                  onClick={() => { onPilih(o.nilai); setBuka(false); }}
                  className={[
                    'flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-[13px] transition-colors',
                    i === sorot ? 'bg-brand-50 text-brand-700' : 'text-ink-700',
                  ].join(' ')}
                >
                  <span className={aktif ? 'font-semibold' : ''}>{o.label}</span>
                  {aktif && <Check size={14} strokeWidth={2.6} className="shrink-0 text-brand-600" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
