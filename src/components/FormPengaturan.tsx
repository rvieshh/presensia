'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Loader2, CheckCircle2 } from 'lucide-react';
import { Select } from './Select';

const inp = 'mt-1.5 w-full rounded-btn bg-white px-3 py-2 text-[13.5px] text-ink-900 outline-none ring-1 ring-inset ring-ink-200 transition-shadow placeholder:text-ink-400 hover:ring-ink-400 focus:ring-[1.5px] focus:ring-brand-500';
const lbl = 'text-[12.5px] font-medium text-ink-700';

export function FormPengaturan({
  awal,
  bidang,
  catatan,
}: {
  awal: Record<string, string>;
  bidang: { key: string; label: string; tipe?: string; hint?: string; area?: boolean; opsi?: string[] }[];
  catatan?: string;
}) {
  const [f, setF] = useState<Record<string, string>>(awal);
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState('');
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setOk('');
    try {
      const r = await fetch('/api/admin/pengaturan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(f),
      });
      const d = await r.json();
      setOk(d.ok ? d.pesan : d.pesan || 'Gagal menyimpan');
      if (d.ok) router.refresh();
    } catch { setOk('Gagal terhubung ke server'); }
    finally { setLoading(false); }
  }

  return (
    <form onSubmit={submit} className="rounded-card border border-ink-200 bg-white p-5 shadow-soft">
      <div className="grid gap-4 sm:grid-cols-2">
        {bidang.map((b) => (
          <div key={b.key} className={b.area ? 'sm:col-span-2' : ''}>
            <label className={lbl} htmlFor={b.key}>{b.label}</label>
            {b.area ? (
              <textarea
                id={b.key} rows={2}
                value={f[b.key] ?? ''}
                onChange={(e) => setF({ ...f, [b.key]: e.target.value })}
                className={inp}
              />
            ) : b.tipe === 'pilih' ? (
              <div className="mt-1.5">
                <Select
                  id={b.key}
                  label={b.label}
                  nilai={f[b.key] ?? ''}
                  opsi={(b.opsi ?? []).map((o) => ({ nilai: o, label: o.charAt(0).toUpperCase() + o.slice(1) }))}
                  onPilih={(v) => setF({ ...f, [b.key]: v })}
                />
              </div>
            ) : b.tipe === 'toggle' ? (
              <button
                type="button"
                role="switch"
                aria-checked={f[b.key] === 'true'}
                onClick={() => setF({ ...f, [b.key]: f[b.key] === 'true' ? 'false' : 'true' })}
                className={[
                  'mt-1.5 flex w-full items-center justify-between rounded-btn border px-3 py-2 text-[13px] font-medium transition-colors',
                  f[b.key] === 'true'
                    ? 'border-ok-500/30 bg-ok-50 text-ok-700'
                    : 'border-ink-200 bg-ink-50 text-ink-500',
                ].join(' ')}
              >
                {f[b.key] === 'true' ? 'Aktif' : 'Nonaktif'}
                <span className={[
                  'h-5 w-9 rounded-full p-0.5 transition-colors',
                  f[b.key] === 'true' ? 'bg-ok-500' : 'bg-ink-200',
                ].join(' ')}>
                  <span className={[
                    'block h-4 w-4 rounded-full bg-white transition-transform',
                    f[b.key] === 'true' ? 'translate-x-4' : '',
                  ].join(' ')} />
                </span>
              </button>
            ) : (
              <input
                id={b.key}
                type={b.tipe || 'text'}
                value={f[b.key] ?? ''}
                onChange={(e) => setF({ ...f, [b.key]: e.target.value })}
                className={inp}
              />
            )}
            {b.hint && <p className="mt-1 text-[11px] text-ink-400">{b.hint}</p>}
          </div>
        ))}
      </div>

      {catatan && (
        <p className="mt-4 rounded-btn bg-brand-50 px-3 py-2 text-[11.5px] text-brand-700">{catatan}</p>
      )}

      {ok && (
        <p className="mt-3 inline-flex items-center gap-1.5 rounded-btn border border-ok-500/25 bg-ok-50 px-3 py-2 text-[12.5px] font-medium text-ok-700">
          <CheckCircle2 size={14} /> {ok}
        </p>
      )}

      <button
        type="submit" disabled={loading}
        className="mt-4 inline-flex items-center gap-2 rounded-btn bg-brand-600 px-4 py-2.5 text-[13.5px] font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} strokeWidth={2.3} />}
        {loading ? 'Menyimpan…' : 'Simpan Perubahan'}
      </button>
    </form>
  );
}
