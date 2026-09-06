'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlus, Upload, X, FileDown, Loader2, Camera, Trash2, User } from 'lucide-react';

interface Props { kelasTersedia: string[] }

export function SiswaAksi({ kelasTersedia }: Props) {
  const [modal, setModal] = useState<'tambah' | 'impor' | null>(null);
  const router = useRouter();

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setModal('tambah')}
          className="inline-flex items-center gap-2 rounded-btn bg-brand-600 px-3.5 py-2 text-[13.5px] font-semibold text-white shadow-soft transition-colors hover:bg-brand-700"
        >
          <UserPlus size={16} strokeWidth={2.3} /> Tambah Siswa
        </button>
        <button
          onClick={() => setModal('impor')}
          className="inline-flex items-center gap-2 rounded-btn border border-ink-200 bg-white px-3.5 py-2 text-[13.5px] font-semibold text-ink-700 shadow-soft transition-colors hover:bg-ink-50"
        >
          <Upload size={16} strokeWidth={2.2} /> Impor CSV
        </button>
        <a
          href="/api/admin/kartu/zip"
          className="inline-flex items-center gap-2 rounded-btn border border-ink-200 bg-white px-3.5 py-2 text-[13.5px] font-semibold text-ink-700 shadow-soft transition-colors hover:bg-ink-50"
        >
          <FileDown size={16} strokeWidth={2.2} /> Unduh QR (ZIP)
        </a>
      </div>

      {modal && (
        <Modal judul={modal === 'tambah' ? 'Tambah Siswa' : 'Impor Data Siswa'} lebar={modal === 'tambah' ? 'max-w-2xl' : 'max-w-md'} tutup={() => setModal(null)}>
          {modal === 'tambah'
            ? <FormTambah kelasTersedia={kelasTersedia} selesai={() => { setModal(null); router.refresh(); }} />
            : <FormImpor selesai={() => { setModal(null); router.refresh(); }} />}
        </Modal>
      )}
    </>
  );
}

function Modal({ judul, tutup, lebar, children }: { judul: string; tutup: () => void; lebar?: string; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-ink-950/40 p-4" onClick={tutup}>
      <div
        className={`w-full ${lebar ?? "max-w-md"} rounded-card border border-ink-200 bg-white shadow-lift`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-ink-200 px-5 py-3.5">
          <h2 className="text-[14.5px] font-semibold">{judul}</h2>
          <button onClick={tutup} aria-label="Tutup" className="grid h-7 w-7 place-items-center rounded-chip text-ink-400 hover:bg-ink-50 hover:text-ink-900">
            <X size={16} strokeWidth={2.3} />
          </button>
        </div>
        <div className="max-h-[78vh] overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

const inp = 'mt-1.5 w-full rounded-btn border border-ink-200 bg-ink-50 px-3 py-2 text-[13.5px] outline-none transition-colors focus:border-brand-500 focus:bg-white';
const lbl = 'text-[12.5px] font-medium text-ink-700';

function FormTambah({ kelasTersedia, selesai }: { kelasTersedia: string[]; selesai: () => void }) {
  const [f, setF] = useState({
    nis: '', nisn: '', nama: '', kelas: kelasTersedia[0] || '',
    jenisKel: '', tempatLahir: '', tanggalLahir: '', alamat: '',
    agama: '', noHp: '', namaOrtu: '', waOrtu: '',
  });
  const [file, setFile] = useState<File | null>(null);
  const [pratinjau, setPratinjau] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function pilihFoto(x: File) {
    setFile(x);
    setPratinjau(URL.createObjectURL(x));
  }

  function buangFoto() {
    setFile(null);
    setPratinjau(null);
    if (fileRef.current) fileRef.current.value = '';
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(''); setLoading(true);
    try {
      const r = await fetch('/api/admin/siswa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(f),
      });
      const d = await r.json();
      if (!d.ok) { setErr(d.pesan || 'Gagal menyimpan'); return; }

      // Unggah foto setelah siswa terbentuk (butuh id dari server)
      if (file && d.siswa?.id) {
        const fd = new FormData();
        fd.append('foto', file);
        const rf = await fetch(`/api/admin/siswa/${d.siswa.id}/foto`, { method: 'POST', body: fd });
        const df = await rf.json();
        if (!df.ok) { setErr(`Siswa tersimpan, tetapi foto gagal: ${df.pesan}`); return; }
      }
      selesai();
    } catch { setErr('Gagal terhubung ke server'); }
    finally { setLoading(false); }
  }

  return (
    <form onSubmit={submit}>
      <div className="grid gap-5 sm:grid-cols-[150px_1fr]">
        {/* Foto */}
        <div>
          <div className="aspect-[3/4] w-full overflow-hidden rounded-card border border-ink-200 bg-ink-50">
            {pratinjau ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={pratinjau} alt="Pratinjau foto" className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full place-items-center text-center">
                <div>
                  <User size={28} strokeWidth={1.5} className="mx-auto text-ink-400" />
                  <p className="mt-1.5 text-[10px] font-medium uppercase tracking-wide text-ink-400">
                    Belum ada foto
                  </p>
                </div>
              </div>
            )}
          </div>

          <input ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => { const x = e.target.files?.[0]; if (x) pilihFoto(x); }} />

          <div className="mt-2 flex gap-1.5">
            <button type="button" onClick={() => fileRef.current?.click()}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-btn border border-ink-200 bg-white px-2 py-1.5 text-[12px] font-semibold text-ink-700 transition-colors hover:bg-ink-50">
              <Camera size={13} strokeWidth={2.3} />
              {file ? 'Ganti' : 'Pilih Foto'}
            </button>
            {file && (
              <button type="button" onClick={buangFoto} aria-label="Buang foto"
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
            <label className={lbl} htmlFor="f-nis">NIS *</label>
            <input id="f-nis" required value={f.nis} onChange={(e) => setF({ ...f, nis: e.target.value })} className={inp} placeholder="2024001" />
          </div>
          <div>
            <label className={lbl} htmlFor="f-nisn">NISN</label>
            <input id="f-nisn" value={f.nisn} onChange={(e) => setF({ ...f, nisn: e.target.value })} className={inp} placeholder="0071234567" />
          </div>

          <div className="sm:col-span-2">
            <label className={lbl} htmlFor="f-nama">Nama Lengkap *</label>
            <input id="f-nama" required value={f.nama} onChange={(e) => setF({ ...f, nama: e.target.value })} className={inp} placeholder="Randika Putra" />
          </div>

          <div>
            <label className={lbl} htmlFor="f-kelas">Kelas *</label>
            <input id="f-kelas" required list="dl-kelas" value={f.kelas} onChange={(e) => setF({ ...f, kelas: e.target.value })} className={inp} placeholder="XI RPL 1" />
            <datalist id="dl-kelas">{kelasTersedia.map((k) => <option key={k} value={k} />)}</datalist>
          </div>
          <div>
            <label className={lbl} htmlFor="f-jk">Jenis Kelamin</label>
            <select id="f-jk" value={f.jenisKel} onChange={(e) => setF({ ...f, jenisKel: e.target.value })} className={inp}>
              <option value="">—</option>
              <option value="L">Laki-laki</option>
              <option value="P">Perempuan</option>
            </select>
          </div>

          <div>
            <label className={lbl} htmlFor="f-tl">Tempat Lahir</label>
            <input id="f-tl" value={f.tempatLahir} onChange={(e) => setF({ ...f, tempatLahir: e.target.value })} className={inp} placeholder="Denpasar" />
          </div>
          <div>
            <label className={lbl} htmlFor="f-tgl">Tanggal Lahir</label>
            <input id="f-tgl" type="date" value={f.tanggalLahir} onChange={(e) => setF({ ...f, tanggalLahir: e.target.value })} className={inp} />
          </div>

          <div>
            <label className={lbl} htmlFor="f-agama">Agama</label>
            <input id="f-agama" value={f.agama} onChange={(e) => setF({ ...f, agama: e.target.value })} className={inp} placeholder="Hindu" />
          </div>
          <div>
            <label className={lbl} htmlFor="f-hp">No. HP Siswa</label>
            <input id="f-hp" value={f.noHp} onChange={(e) => setF({ ...f, noHp: e.target.value })} className={inp} placeholder="08123456789" />
          </div>

          <div className="sm:col-span-2">
            <label className={lbl} htmlFor="f-alamat">Alamat</label>
            <input id="f-alamat" value={f.alamat} onChange={(e) => setF({ ...f, alamat: e.target.value })} className={inp} placeholder="Jl. Contoh No. 1" />
          </div>

          <div>
            <label className={lbl} htmlFor="f-ortu">Nama Orang Tua</label>
            <input id="f-ortu" value={f.namaOrtu} onChange={(e) => setF({ ...f, namaOrtu: e.target.value })} className={inp} placeholder="I Wayan Sudana" />
          </div>
          <div>
            <label className={lbl} htmlFor="f-wa">WhatsApp Orang Tua</label>
            <input id="f-wa" value={f.waOrtu} onChange={(e) => setF({ ...f, waOrtu: e.target.value })} className={inp} placeholder="08123456789" />
            <p className="mt-1 text-[11px] text-ink-400">Otomatis diubah ke format 62…</p>
          </div>
        </div>
      </div>

      {err && <p className="mt-4 rounded-btn border border-bad-500/25 bg-bad-50 px-3 py-2 text-[12.5px] font-medium text-bad-700">{err}</p>}

      <p className="mt-4 rounded-btn bg-brand-50 px-3 py-2 text-[11.5px] text-brand-700">
        QR code dibuat otomatis saat disimpan dan langsung siap dicetak.
      </p>

      <div className="mt-4 flex gap-2 border-t border-ink-200 pt-4">
        <button type="submit" disabled={loading}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-btn bg-brand-600 px-4 py-2.5 text-[13.5px] font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-60">
          {loading ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} strokeWidth={2.3} />}
          {loading ? 'Menyimpan…' : 'Simpan Siswa'}
        </button>
      </div>
    </form>
  );
}

function FormImpor({ selesai }: { selesai: () => void }) {
  const [loading, setLoading] = useState(false);
  const [hasil, setHasil] = useState<{ ok: boolean; pesan: string; galat?: string[] } | null>(null);
  const ref = useRef<HTMLInputElement>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const file = ref.current?.files?.[0];
    if (!file) return;
    setLoading(true); setHasil(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const r = await fetch('/api/admin/siswa/impor', { method: 'POST', body: fd });
      setHasil(await r.json());
    } catch { setHasil({ ok: false, pesan: 'Gagal mengunggah berkas' }); }
    finally { setLoading(false); }
  }

  return (
    <form onSubmit={submit}>
      <div className="rounded-btn border border-ink-200 bg-ink-50 p-3">
        <p className="text-[12px] font-semibold text-ink-700">Format kolom</p>
        <code className="mt-1 block font-mono text-[11.5px] text-ink-500">nis,nama,kelas,wa_ortu,foto_url</code>
        <p className="mt-1.5 text-[11px] text-ink-400">
          Tiga kolom pertama wajib. Pemisah koma atau titik koma. NIS ganda otomatis dilewati.
        </p>
      </div>

      <input ref={ref} type="file" accept=".csv,text/csv" required
        className="mt-3 w-full rounded-btn border border-ink-200 bg-white px-3 py-2 text-[12.5px] file:mr-3 file:rounded-chip file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-[12px] file:font-semibold file:text-brand-700" />

      {hasil && (
        <div className={`mt-3 rounded-btn border px-3 py-2 ${hasil.ok ? 'border-ok-500/25 bg-ok-50' : 'border-bad-500/25 bg-bad-50'}`}>
          <p className={`text-[12.5px] font-semibold ${hasil.ok ? 'text-ok-700' : 'text-bad-700'}`}>{hasil.pesan}</p>
          {hasil.galat?.length ? (
            <ul className="mt-1 space-y-0.5">
              {hasil.galat.map((g, i) => <li key={i} className="text-[11px] text-ink-500">{g}</li>)}
            </ul>
          ) : null}
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <button type="submit" disabled={loading}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-btn bg-brand-600 px-4 py-2.5 text-[13.5px] font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-60">
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} strokeWidth={2.3} />}
          {loading ? 'Mengimpor…' : 'Unggah & Impor'}
        </button>
        {hasil?.ok && (
          <button type="button" onClick={selesai}
            className="rounded-btn border border-ink-200 bg-white px-4 py-2.5 text-[13.5px] font-semibold text-ink-700 hover:bg-ink-50">
            Selesai
          </button>
        )}
      </div>
    </form>
  );
}
