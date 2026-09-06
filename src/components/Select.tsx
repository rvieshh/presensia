'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Check, Plus, CornerDownLeft } from 'lucide-react';

export interface Opsi {
  nilai: string;
  label: string;
}

/**
 * Dropdown bergaya sendiri, menggantikan <select> bawaan peramban.
 * Dapat dioperasikan lewat papan ketik: panah, Enter, Escape.
 *
 * Bila onTambah diisi, baris "tambah baru" muncul paling atas dan
 * berubah menjadi kolom isian saat ditekan; Enter langsung memakai
 * nilai tersebut tanpa menutup alur kerja pengguna.
 */
export function Select({
  nilai,
  opsi,
  onPilih,
  onTambah,
  labelTambah = 'Tambah baru',
  placeholder = 'Pilih…',
  id,
  label,
}: {
  nilai: string;
  opsi: Opsi[];
  onPilih: (v: string) => void;
  onTambah?: (v: string) => void;
  labelTambah?: string;
  placeholder?: string;
  id?: string;
  label?: string;
}) {
  const [buka, setBuka] = useState(false);
  const [sorot, setSorot] = useState(0);
  const [modeTambah, setModeTambah] = useState(false);
  const [nilaiBaru, setNilaiBaru] = useState('');
  const kotak = useRef<HTMLDivElement>(null);
  const inputBaru = useRef<HTMLInputElement>(null);

  const terpilih = opsi.find((o) => o.nilai === nilai);

  useEffect(() => {
    if (!buka) return;
    const luar = (e: MouseEvent) => {
      if (kotak.current && !kotak.current.contains(e.target as Node)) tutup();
    };
    document.addEventListener('mousedown', luar);
    return () => document.removeEventListener('mousedown', luar);
  }, [buka]);

  useEffect(() => {
    if (buka) setSorot(Math.max(0, opsi.findIndex((o) => o.nilai === nilai)));
  }, [buka, nilai, opsi]);

  useEffect(() => {
    if (modeTambah) inputBaru.current?.focus();
  }, [modeTambah]);

  function tutup() {
    setBuka(false);
    setModeTambah(false);
    setNilaiBaru('');
  }

  function simpanBaru() {
    const v = nilaiBaru.trim();
    if (!v) return;
    onTambah?.(v);
    onPilih(v);
    tutup();
  }

  function tombolUtama(e: React.KeyboardEvent) {
    if (!buka && (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown')) {
      e.preventDefault();
      setBuka(true);
      return;
    }
    if (!buka || modeTambah) return;

    if (e.key === 'Escape') { e.preventDefault(); tutup(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); setSorot((i) => Math.min(i + 1, opsi.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSorot((i) => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      const o = opsi[sorot];
      if (o) { onPilih(o.nilai); tutup(); }
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
        onClick={() => (buka ? tutup() : setBuka(true))}
        onKeyDown={tombolUtama}
        className={[
          'flex w-full items-center justify-between gap-2 rounded-btn border px-3 py-2 text-left text-[13.5px] transition-colors',
          buka ? 'border-brand-500 bg-white' : 'border-ink-200 bg-ink-50 hover:border-ink-400 hover:bg-white',
        ].join(' ')}
      >
        <span className={terpilih ? 'text-ink-900' : 'text-ink-400'}>
          {terpilih ? terpilih.label : placeholder}
        </span>
        <ChevronDown
          size={15}
          strokeWidth={2.2}
          className={`shrink-0 text-ink-400 transition-transform duration-150 ${buka ? 'rotate-180' : ''}`}
        />
      </button>

      {buka && (
        <div className="absolute z-50 mt-1.5 w-full overflow-hidden rounded-card border border-ink-200 bg-white shadow-lift">
          {onTambah && (
            <div className="border-b border-ink-200 p-1">
              {modeTambah ? (
                <div className="flex items-center gap-1.5 rounded-btn bg-brand-50 px-2 py-1">
                  <Plus size={14} strokeWidth={2.6} className="shrink-0 text-brand-600" />
                  <input
                    ref={inputBaru}
                    value={nilaiBaru}
                    onChange={(e) => setNilaiBaru(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { e.preventDefault(); simpanBaru(); }
                      else if (e.key === 'Escape') { e.preventDefault(); setModeTambah(false); setNilaiBaru(''); }
                    }}
                    placeholder="Ketik lalu tekan Enter"
                    className="min-w-0 flex-1 bg-transparent text-[13px] text-ink-900 outline-none placeholder:text-brand-700/50"
                  />
                  <button
                    type="button"
                    onClick={simpanBaru}
                    aria-label="Simpan"
                    className="grid h-6 w-6 shrink-0 place-items-center rounded-chip text-brand-600 transition-colors hover:bg-white"
                  >
                    <CornerDownLeft size={13} strokeWidth={2.4} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setModeTambah(true)}
                  className="flex w-full items-center gap-2 rounded-btn px-2.5 py-1.5 text-left text-[13px] font-medium text-brand-600 transition-colors hover:bg-brand-50 active:bg-brand-100"
                >
                  <Plus size={14} strokeWidth={2.6} className="shrink-0" />
                  {labelTambah}
                </button>
              )}
            </div>
          )}

          <ul role="listbox" className="scroll-halus max-h-56 overflow-y-auto p-1">
            {opsi.length === 0 ? (
              <li className="px-2.5 py-2 text-[12.5px] text-ink-400">Belum ada pilihan</li>
            ) : (
              opsi.map((o, i) => {
                const aktif = o.nilai === nilai;
                return (
                  <li key={o.nilai || '_kosong'} role="option" aria-selected={aktif}>
                    <button
                      type="button"
                      onMouseEnter={() => setSorot(i)}
                      onClick={() => { onPilih(o.nilai); tutup(); }}
                      className={[
                        'flex w-full items-center justify-between gap-2 rounded-btn px-2.5 py-1.5 text-left text-[13px] transition-colors',
                        i === sorot ? 'bg-ink-100 text-ink-900' : 'text-ink-700',
                        aktif ? 'font-semibold' : '',
                        'hover:bg-ink-100 active:bg-ink-200',
                      ].join(' ')}
                    >
                      <span className="truncate">{o.label}</span>
                      {aktif && <Check size={14} strokeWidth={2.6} className="shrink-0 text-brand-600" />}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
