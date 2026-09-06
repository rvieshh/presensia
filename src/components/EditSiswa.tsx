'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Trash2, Loader2, Save, X, RefreshCw, User } from 'lucide-react';
import { Select } from './Select';

export interface SiswaData {
  id: string;
  nis: string;
  nisn: string | null;
  nama: string;
  kelas: string;
  waOrtu: string | null;
  aktif: boolean;
  adaFoto: boolean;
}

const inp =
  'mt-1.5 w-full rounded-btn bg-white px-3 py-2 text-[13.5px] text-ink-900 outline-none ring-1 ring-inset ring-ink-200 transition-shadow placeholder:text-ink-400 hover:ring-ink-400 focus:ring-[1.5px] focus:ring-brand-500';
const lbl = 'text-[12.5px] font-medium text-ink-700';

export function EditSiswa({
  siswa,
  kelasTersedia,
  tutup,
}: {
  siswa: SiswaData;
  kelasTersedia: string[];
  tutup: () => void;
}) {
  const [f, setF] = useState({ ...siswa });
  const [kelasLokal, setKelasLokal] = useState<string[]>(kelasTersedia);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');
  const [loading, setLoading] = useState(false);
  const [fotoBusy, setFotoBusy] = useState(false);
  const [fotoVer, setFotoVer] = useState(Date.now());
  const [adaFoto, setAdaFoto] = useState(siswa.adaFoto);
  const [pratinjau, setPratinjau] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function unggahFoto(file: File) {
    setFotoBusy(true);
    setErr('');
    setPratinjau(URL.createObjectURL(file));
    try {
      const fd = new FormData();
      fd.append('foto', file);
      const r = await fetch(`/api/admin/siswa/${siswa.id}/foto`, { method: 'POST', body: fd });
      const d = await r.json();
      if (!d.ok) { setErr(d.pesan); setPratinjau(null); return; }
      setAdaFoto(true);
      setFotoVer(Date.now());
      setPratinjau(null);
      setOk(`Foto tersimpan (${d.ukuranKb} KB)`);
      router.refresh();
    } catch {
      setErr('Gagal mengunggah foto');
      setPratinjau(null);
    } finally {
      setFotoBusy(false);
    }
  }

  async function hapusFoto() {
    setFotoBusy(true);
    try {
      await fetch(`/api/admin/siswa/${siswa.id}/foto`, { method: 'DELETE' });
      setAdaFoto(false);
      setPratinjau(null);
      setFotoVer(Date.now());
      router.refresh();
    } finally {
      setFotoBusy(false);
    }
  }

  async function simpan(e: React.FormEvent) {
    e.preventDefault();
    setErr(''); setOk(''); setLoading(true);
    try {
      const r = await fetch(`/api/admin/siswa/${siswa.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(f),
      });
      const d = await r.json();
      if (!d.ok) { setErr(d.pesan); return; }
      setOk(d.pesan);
      router.refresh();
      setTimeout(tutup, 700);
    } catch {
      setErr('Gagal terhubung ke server');
    } finally {
      setLoading(false);
    }
  }

  const src = pratinjau || (adaFoto ? `/api/foto/${siswa.nis}?v=${fotoVer}` : null);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-ink-950/40 p-4" onClick={tutup}>
      <div
        className="my-auto w-full max-w-2xl rounded-card border border-ink-200 bg-white shadow-lift"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-ink-200 px-5 py-3.5">
          <h2 className="text-[14.5px] font-semibold">Ubah Data Siswa</h2>
          <button onClick={tutup} aria-label="Tutup"
            className="grid h-7 w-7 place-items-center rounded-chip text-ink-400 hover:bg-ink-50 hover:text-ink-900">
            <X size={16} strokeWidth={2.3} />
          </button>
        </div>

        <form onSubmit={simpan} className="p-5">
          <div className="grid gap-5 sm:grid-cols-[150px_1fr]">
            {/* Foto */}
            <div>
              <div className="aspect-[3/4] w-full overflow-hidden rounded-card border border-ink-200 bg-ink-50">
                {src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={src} alt={`Foto ${f.nama}`} className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full place-items-center">
                    <User size={30} strokeWidth={1.5} className="text-ink-400" />
                  </div>
                )}
              </div>

              <input
                ref={fileRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => { const x = e.target.files?.[0]; if (x) unggahFoto(x); }}
              />

              <div className="mt-2 flex gap-1.5">
                <button type="button" disabled={fotoBusy} onClick={() => fileRef.current?.click()}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-btn border border-ink-200 bg-white px-2 py-1.5 text-[12px] font-semibold text-ink-700 transition-colors hover:bg-ink-50 disabled:opacity-60">
                  {fotoBusy ? <Loader2 size={13} className="animate-spin" /> : <Camera size={13} strokeWidth={2.3} />}
                  {adaFoto ? 'Ganti' : 'Unggah'}
                </button>
                {adaFoto && (
                  <button type="button" disabled={fotoBusy} onClick={hapusFoto} aria-label="Hapus foto"
                    className="grid h-[30px] w-8 place-items-center rounded-btn border border-ink-200 bg-white text-ink-400 transition-colors hover:bg-bad-50 hover:text-bad-700">
                    <Trash2 size={13} strokeWidth={2.2} />
                  </button>
                )}
              </div>
              <p className="mt-1.5 text-[10.5px] leading-tight text-ink-400">
                Otomatis dipotong 3:4 dan disimpan di basis data.
              </p>
            </div>

            {/* Data */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={lbl} htmlFor="e-nis">NIS *</label>
                <input id="e-nis" required value={f.nis} onChange={(e) => setF({ ...f, nis: e.target.value })} className={inp} />
              </div>
              <div>
                <label className={lbl} htmlFor="e-nisn">NISN</label>
                <input id="e-nisn" value={f.nisn ?? ''} onChange={(e) => setF({ ...f, nisn: e.target.value })} className={inp} placeholder="opsional" />
              </div>

              <div className="sm:col-span-2">
                <label className={lbl} htmlFor="e-nama">Nama Lengkap *</label>
                <input id="e-nama" required value={f.nama} onChange={(e) => setF({ ...f, nama: e.target.value })} className={inp} />
              </div>

              <div>
                <label className={lbl} htmlFor="e-kelas">Kelas *</label>
                <div className="mt-1.5">
                  <Select
                    id="e-kelas"
                    label="Kelas"
                    nilai={f.kelas}
                    opsi={kelasLokal.map((k) => ({ nilai: k, label: k }))}
                    onPilih={(v) => setF({ ...f, kelas: v })}
                    onTambah={(v) => setKelasLokal((p) => (p.includes(v) ? p : [...p, v]))}
                    labelTambah="Kelas baru"
                    placeholder="Pilih kelas"
                  />
                </div>
              </div>

              <div>
                <label className={lbl} htmlFor="e-wa">WhatsApp Orang Tua</label>
                <input id="e-wa" value={f.waOrtu ?? ''} onChange={(e) => setF({ ...f, waOrtu: e.target.value })} className={inp} placeholder="08123456789" />
                <p className="mt-1 text-[11px] text-ink-400">Hanya untuk notifikasi, tidak tampil di layar absensi.</p>
              </div>

              <div className="sm:col-span-2 flex flex-wrap gap-2 pt-1">
                <button type="button" onClick={() => setF({ ...f, aktif: !f.aktif })}
                  className={['inline-flex items-center gap-2 rounded-btn border px-3 py-1.5 text-[12.5px] font-semibold transition-colors',
                    f.aktif ? 'border-ok-500/30 bg-ok-50 text-ok-700' : 'border-ink-200 bg-ink-50 text-ink-500'].join(' ')}>
                  <span className={`h-1.5 w-1.5 rounded-full ${f.aktif ? 'bg-ok-500' : 'bg-ink-400'}`} />
                  {f.aktif ? 'Siswa Aktif' : 'Nonaktif'}
                </button>

                <button type="button"
                  onClick={() => setF({ ...f, regenerasiQr: !(f as Record<string, unknown>).regenerasiQr } as typeof f)}
                  className={['inline-flex items-center gap-1.5 rounded-btn border px-3 py-1.5 text-[12.5px] font-semibold transition-colors',
                    (f as Record<string, unknown>).regenerasiQr
                      ? 'border-warn-500/30 bg-warn-50 text-warn-700'
                      : 'border-ink-200 bg-white text-ink-500 hover:bg-ink-50'].join(' ')}>
                  <RefreshCw size={13} strokeWidth={2.2} />
                  Buat ulang QR
                </button>
              </div>
            </div>
          </div>

          {err && <p className="mt-4 rounded-btn border border-bad-500/25 bg-bad-50 px-3 py-2 text-[12.5px] font-medium text-bad-700">{err}</p>}
          {ok && <p className="mt-4 rounded-btn border border-ok-500/25 bg-ok-50 px-3 py-2 text-[12.5px] font-medium text-ok-700">{ok}</p>}

          <div className="mt-5 flex gap-2 border-t border-ink-200 pt-4">
            <button type="submit" disabled={loading}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-btn bg-brand-600 px-4 py-2.5 text-[13.5px] font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-60">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} strokeWidth={2.3} />}
              {loading ? 'Menyimpan…' : 'Simpan Perubahan'}
            </button>
            <button type="button" onClick={tutup}
              className="rounded-btn border border-ink-200 bg-white px-4 py-2.5 text-[13.5px] font-semibold text-ink-700 hover:bg-ink-50">
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
