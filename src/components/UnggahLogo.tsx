'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ImagePlus, Trash2, Loader2, QrCode } from 'lucide-react';

/**
 * Pengunggah logo sekolah. Bila logo terpasang, judul dan anak judul di
 * layar absensi digantikan gambar ini.
 */
export function UnggahLogo({ adaLogo, sekolah }: { adaLogo: boolean; sekolah: string }) {
  const [ada, setAda] = useState(adaLogo);
  const [versi, setVersi] = useState(Date.now());
  const [pratinjau, setPratinjau] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pesan, setPesan] = useState('');
  const [err, setErr] = useState('');
  const berkas = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function unggah(f: File) {
    setBusy(true); setErr(''); setPesan('');
    setPratinjau(URL.createObjectURL(f));
    try {
      const fd = new FormData();
      fd.append('logo', f);
      const r = await fetch('/api/admin/logo', { method: 'POST', body: fd });
      const d = await r.json();
      if (!d.ok) { setErr(d.pesan); setPratinjau(null); return; }
      setAda(true);
      setVersi(Date.now());
      setPratinjau(null);
      setPesan(`${d.pesan} (${d.ukuranKb} KB)`);
      router.refresh();
    } catch {
      setErr('Gagal mengunggah logo');
      setPratinjau(null);
    } finally { setBusy(false); }
  }

  async function hapus() {
    if (!confirm('Hapus logo? Layar absensi kembali memakai judul teks.')) return;
    setBusy(true); setErr(''); setPesan('');
    try {
      const r = await fetch('/api/admin/logo', { method: 'DELETE' });
      const d = await r.json();
      setAda(false);
      setPratinjau(null);
      setVersi(Date.now());
      setPesan(d.pesan);
      router.refresh();
    } finally { setBusy(false); }
  }

  const src = pratinjau || (ada ? `/api/aset/logo?v=${versi}` : null);

  return (
    <div className="rounded-card border border-ink-200 bg-white p-5 shadow-soft">
      <p className="text-[12.5px] font-medium text-ink-700">Logo Sekolah</p>
      <p className="mt-0.5 text-[11.5px] text-ink-400">
        Bila diunggah, logo menggantikan judul dan anak judul pada layar absensi.
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-4">
        <div className="grid h-20 w-44 shrink-0 place-items-center overflow-hidden rounded-card border border-ink-200 bg-ink-50 px-3">
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt="Logo sekolah" className="max-h-16 max-w-full object-contain" />
          ) : (
            <div className="flex items-center gap-2 text-ink-400">
              <QrCode size={16} strokeWidth={2.2} />
              <span className="truncate text-[11px] font-medium">Presensi Murid {sekolah}</span>
            </div>
          )}
        </div>

        <div>
          <input
            ref={berkas}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) unggah(f); }}
          />
          <div className="flex gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => berkas.current?.click()}
              className="inline-flex items-center gap-2 rounded-btn border border-ink-200 bg-white px-3 py-2 text-[12.5px] font-semibold text-ink-700 transition-colors hover:bg-ink-50 disabled:opacity-60"
            >
              {busy ? <Loader2 size={14} className="animate-spin" /> : <ImagePlus size={14} strokeWidth={2.3} />}
              {ada ? 'Ganti Logo' : 'Unggah Logo'}
            </button>
            {ada && (
              <button
                type="button"
                disabled={busy}
                onClick={hapus}
                className="inline-flex items-center gap-1.5 rounded-btn border border-ink-200 bg-white px-3 py-2 text-[12.5px] font-semibold text-ink-500 transition-colors hover:bg-bad-50 hover:text-bad-700 disabled:opacity-60"
              >
                <Trash2 size={14} strokeWidth={2.2} />
                Hapus
              </button>
            )}
          </div>
          <p className="mt-1.5 text-[11px] text-ink-400">
            PNG, JPG, WebP, atau SVG. Maksimal 4 MB, tinggi tampil 56 piksel.
          </p>
        </div>
      </div>

      {pesan && (
        <p className="mt-3 rounded-btn border border-ok-500/25 bg-ok-50 px-3 py-2 text-[12px] font-medium text-ok-700">
          {pesan}
        </p>
      )}
      {err && (
        <p className="mt-3 rounded-btn border border-bad-500/25 bg-bad-50 px-3 py-2 text-[12px] font-medium text-bad-700">
          {err}
        </p>
      )}
    </div>
  );
}
