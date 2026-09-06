'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2, User, Search, X } from 'lucide-react';
import { EditSiswa, type SiswaData } from './EditSiswa';
import { Select } from './Select';

export function TabelSiswa({
  siswa,
  kelasTersedia,
}: {
  siswa: SiswaData[];
  kelasTersedia: string[];
}) {
  const [edit, setEdit] = useState<SiswaData | null>(null);
  const [cari, setCari] = useState('');
  const [kelasFilter, setKelasFilter] = useState('');
  const [pilih, setPilih] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const q = cari.trim().toLowerCase();
  const tampil = siswa.filter(
    (s) =>
      (!kelasFilter || s.kelas === kelasFilter) &&
      (!q || s.nama.toLowerCase().includes(q) || s.nis.includes(q) || (s.nisn ?? '').includes(q))
  );

  const idTampil = tampil.map((s) => s.id);
  const terpilihTampil = idTampil.filter((id) => pilih.has(id));
  const semuaTerpilih = idTampil.length > 0 && terpilihTampil.length === idTampil.length;
  const sebagian = terpilihTampil.length > 0 && !semuaTerpilih;

  function toggleSemua() {
    const baru = new Set(pilih);
    if (semuaTerpilih) idTampil.forEach((id) => baru.delete(id));
    else idTampil.forEach((id) => baru.add(id));
    setPilih(baru);
  }

  function toggleSatu(id: string) {
    const baru = new Set(pilih);
    if (baru.has(id)) baru.delete(id);
    else baru.add(id);
    setPilih(baru);
  }

  async function hapusMassal() {
    const n = terpilihTampil.length;
    if (!confirm(`Hapus ${n} siswa terpilih?\n\nSeluruh riwayat absensi mereka ikut terhapus dan tidak bisa dikembalikan.`)) return;
    setBusy(true);
    try {
      const r = await fetch('/api/admin/siswa/hapus-massal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: terpilihTampil }),
      });
      const d = await r.json();
      if (!d.ok) alert(d.pesan);
      else { setPilih(new Set()); router.refresh(); }
    } finally { setBusy(false); }
  }

  async function hapusSatu(s: SiswaData) {
    if (!confirm(`Hapus ${s.nama} (${s.nis})?\n\nSeluruh riwayat absensinya ikut terhapus.`)) return;
    setBusy(true);
    try {
      const r = await fetch(`/api/admin/siswa/${s.id}`, { method: 'DELETE' });
      const d = await r.json();
      if (!d.ok) alert(d.pesan);
      else router.refresh();
    } finally { setBusy(false); }
  }

  return (
    <>
      <div className="mt-4 flex flex-wrap gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            placeholder="Cari nama, NIS, atau NISN…"
            aria-label="Cari siswa"
            className="w-full rounded-btn border border-ink-200 bg-white py-2 pl-9 pr-3 text-[13.5px] outline-none transition-colors focus:border-brand-500"
          />
        </div>
        <div className="w-44">
          <Select
            label="Saring kelas"
            nilai={kelasFilter}
            opsi={[{ nilai: '', label: 'Semua kelas' }, ...kelasTersedia.map((k) => ({ nilai: k, label: k }))]}
            onPilih={setKelasFilter}
            placeholder="Semua kelas"
          />
        </div>
      </div>

      {terpilihTampil.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-3 rounded-card border border-brand-500/25 bg-brand-50 px-4 py-2.5">
          <span className="text-[13px] font-semibold text-brand-700">
            {terpilihTampil.length} siswa dipilih
          </span>
          <button onClick={() => setPilih(new Set())}
            className="inline-flex items-center gap-1 text-[12.5px] font-medium text-brand-700 hover:underline">
            <X size={13} strokeWidth={2.4} /> Batal pilih
          </button>
          <button onClick={hapusMassal} disabled={busy}
            className="ml-auto inline-flex items-center gap-1.5 rounded-btn bg-bad-500 px-3 py-1.5 text-[12.5px] font-semibold text-white transition-colors hover:bg-bad-700 disabled:opacity-60">
            <Trash2 size={13} strokeWidth={2.3} />
            {busy ? 'Menghapus…' : `Hapus ${terpilihTampil.length} siswa`}
          </button>
        </div>
      )}

      <section className="mt-3 overflow-hidden rounded-card border border-ink-200 bg-white shadow-soft">
        {tampil.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <User size={30} strokeWidth={1.6} className="mx-auto text-ink-400" />
            <p className="mt-2 text-[13.5px] font-medium text-ink-700">
              {siswa.length === 0 ? 'Belum ada data siswa' : 'Tidak ada yang cocok'}
            </p>
            <p className="mt-1 text-[12.5px] text-ink-400">
              {siswa.length === 0 ? 'Tambah satu per satu, atau impor massal lewat CSV.' : 'Coba kata kunci lain.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
              <thead>
                <tr className="border-b border-ink-200 bg-ink-50">
                  <th className="w-10 px-3 py-2.5">
                    <input
                      type="checkbox"
                      aria-label="Pilih semua"
                      checked={semuaTerpilih}
                      ref={(el) => { if (el) el.indeterminate = sebagian; }}
                      onChange={toggleSemua}
                      className="h-3.5 w-3.5 cursor-pointer accent-brand-600"
                    />
                  </th>
                  {['Foto', 'NIS', 'Nama', 'Kelas', 'WhatsApp Ortu', 'Status', ''].map((h, i) => (
                    <th key={i} className="px-4 py-2.5 text-[11.5px] font-semibold uppercase tracking-wide text-ink-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-200">
                {tampil.map((s) => {
                  const dipilih = pilih.has(s.id);
                  return (
                    <tr key={s.id} className={`transition-colors ${dipilih ? 'bg-brand-50' : 'hover:bg-ink-50'}`}>
                      <td className="px-3 py-2.5">
                        <input
                          type="checkbox"
                          aria-label={`Pilih ${s.nama}`}
                          checked={dipilih}
                          onChange={() => toggleSatu(s.id)}
                          className="h-3.5 w-3.5 cursor-pointer accent-brand-600"
                        />
                      </td>
                      <td className="py-2 pl-4 pr-2">
                        <span className="grid h-9 w-7 place-items-center overflow-hidden rounded-chip border border-ink-200 bg-ink-100">
                          {s.adaFoto ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={`/api/foto/${s.nis}`} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <User size={13} className="text-ink-400" />
                          )}
                        </span>
                      </td>
                      <td className="tnum px-4 py-2.5 text-[13px] text-ink-700">{s.nis}</td>
                      <td className="px-4 py-2.5">
                        <p className="text-[13.5px] font-medium">{s.nama}</p>
                        {s.nisn && <p className="tnum text-[11px] text-ink-400">NISN {s.nisn}</p>}
                      </td>
                      <td className="px-4 py-2.5 text-[13px] text-ink-500">{s.kelas}</td>
                      <td className="tnum px-4 py-2.5 text-[13px] text-ink-500">
                        {s.waOrtu || <span className="text-ink-400">—</span>}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={['rounded-chip px-2 py-0.5 text-[11.5px] font-semibold',
                          s.aktif ? 'bg-ok-50 text-ok-700' : 'bg-ink-100 text-ink-500'].join(' ')}>
                          {s.aktif ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => setEdit(s)} aria-label={`Ubah ${s.nama}`}
                            className="grid h-7 w-7 place-items-center rounded-chip text-ink-400 transition-colors hover:bg-brand-50 hover:text-brand-700">
                            <Pencil size={14} strokeWidth={2.2} />
                          </button>
                          <button onClick={() => hapusSatu(s)} disabled={busy} aria-label={`Hapus ${s.nama}`}
                            className="grid h-7 w-7 place-items-center rounded-chip text-ink-400 transition-colors hover:bg-bad-50 hover:text-bad-700 disabled:opacity-40">
                            <Trash2 size={14} strokeWidth={2.2} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {tampil.length > 0 && (
        <p className="mt-2 text-[11.5px] text-ink-400">
          Menampilkan {tampil.length} dari {siswa.length} siswa
        </p>
      )}

      {edit && <EditSiswa siswa={edit} kelasTersedia={kelasTersedia} tutup={() => setEdit(null)} />}
    </>
  );
}
