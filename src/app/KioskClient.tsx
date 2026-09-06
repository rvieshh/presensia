'use client';

import { useEffect, useRef, useState } from 'react';
import { QrCode, CheckCircle2, XCircle, ScanLine, User } from 'lucide-react';

interface Data {
  ada: boolean;
  sekolah?: string;
  id?: string;
  sukses?: boolean;
  alasan?: string | null;
  siswa?: { nama: string; nis: string; nisn: string | null; kelas: string; fotoUrl: string | null } | null;
  absensi?: { jamMasuk: string | null; jamPulang: string | null; status: string; menitTelat: number } | null;
}

const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli',
  'Agustus', 'September', 'Oktober', 'November', 'Desember'];

export default function KioskClient({ sekolah }: { sekolah: string }) {
  const [buf, setBuf] = useState('');
  const [data, setData] = useState<Data>({ ada: false });
  const [jam, setJam] = useState('');
  const [tgl, setTgl] = useState('');
  const [proses, setProses] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastId = useRef<string | null>(null);

  // Jam berjalan
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setJam(d.toTimeString().slice(0, 8));
      setTgl(`${HARI[d.getDay()]}, ${String(d.getDate()).padStart(2, '0')} ${BULAN[d.getMonth()]} ${d.getFullYear()}`);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  // Kunci fokus: scanner keyboard-wedge mengetik ke elemen aktif
  useEffect(() => {
    const fokus = () => inputRef.current?.focus();
    fokus();
    const t = setInterval(fokus, 700);
    document.addEventListener('click', fokus);
    return () => { clearInterval(t); document.removeEventListener('click', fokus); };
  }, []);

  // Polling: tangkap scan dari perangkat lain (scanner fisik / ESP32)
  useEffect(() => {
    let stop = false;
    const poll = async () => {
      try {
        const r = await fetch('/api/kiosk/terakhir', { cache: 'no-store' });
        const d: Data = await r.json();
        if (!stop && d.ada && d.id && d.id !== lastId.current) {
          lastId.current = d.id;
          setData(d);
        }
      } catch { /* diam saja, coba lagi */ }
    };
    const t = setInterval(poll, 2500);
    return () => { stop = true; clearInterval(t); };
  }, []);

  async function kirim(qr: string) {
    if (!qr.trim() || proses) return;
    setProses(true);
    try {
      await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qr }),
      });
      const r = await fetch('/api/kiosk/terakhir', { cache: 'no-store' });
      const d: Data = await r.json();
      lastId.current = d.id ?? null;
      setData(d);
      if (navigator.vibrate) navigator.vibrate(d.sukses ? 60 : [60, 50, 60]);
    } catch {
      setData({ ada: true, sukses: false, alasan: 'Gagal terhubung ke server', siswa: null });
    } finally {
      setProses(false);
      setBuf('');
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }

  const belum = !data.ada || (!data.siswa && !data.alasan);
  const ok = data.sukses === true;
  const s = data.siswa;
  const a = data.absensi;

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="border-b border-ink-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-card bg-brand-600 text-white">
              <QrCode size={22} strokeWidth={2.3} />
            </span>
            <div>
              <h1 className="text-[17px] font-semibold leading-tight tracking-tight">
                Presensi Murid {sekolah}
              </h1>
              <p className="text-[12.5px] text-ink-500">
                Pindai kartu QR untuk mencatat kehadiran
              </p>
            </div>
          </div>

          <div className="text-right">
            <p className="tnum text-[26px] font-semibold leading-none">{jam || '--:--:--'}</p>
            <p className="mt-1 text-[12px] text-ink-500">{tgl || '\u00A0'}</p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-6">
        {/* Banner status scanner */}
        <div className="flex items-center gap-2.5 rounded-card border border-ok-500/25 bg-ok-50 px-4 py-3">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ok-500 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-ok-500" />
          </span>
          <p className="text-[13.5px] font-semibold text-ok-700">
            {proses ? 'Memproses scan…' : 'Scanner siap menerima data'}
          </p>
          <span className="ml-auto text-[12px] text-ok-700/70">Sesi aktif</span>
        </div>

        {/* Input tersembunyi untuk keyboard-wedge */}
        <form onSubmit={(e) => { e.preventDefault(); kirim(buf); }} className="mt-3">
          <label htmlFor="qr" className="sr-only">Input kode QR</label>
          <input
            id="qr"
            ref={inputRef}
            value={buf}
            onChange={(e) => setBuf(e.target.value)}
            placeholder="Tembakkan QR ke scanner, atau ketik kode lalu Enter"
            autoComplete="off"
            className="w-full rounded-btn bg-white px-4 py-2.5 text-center font-mono text-[13.5px] outline-none ring-1 ring-inset ring-ink-200 transition-shadow placeholder:font-sans placeholder:text-ink-400 focus:ring-[1.5px] focus:ring-brand-500"
          />
        </form>

        {/* Panel informasi kehadiran */}
        <section className="mt-4 overflow-hidden rounded-card border border-ink-200 bg-white shadow-soft">
          <div className="border-b border-ink-200 px-5 py-3">
            <h2 className="text-[13.5px] font-semibold">Informasi Kehadiran</h2>
          </div>

          <div className="grid gap-5 p-5 sm:grid-cols-[200px_1fr]">
            {/* Foto siswa */}
            <div className="mx-auto w-full max-w-[200px]">
              <div className="aspect-[3/4] w-full overflow-hidden rounded-card border border-ink-200 bg-ink-50">
                {s?.fotoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.fotoUrl} alt={`Foto ${s.nama}`} className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full place-items-center text-center">
                    <div>
                      <User size={38} strokeWidth={1.5} className="mx-auto text-ink-400" />
                      <p className="mt-2 text-[11px] font-medium uppercase tracking-wide text-ink-400">
                        Foto Siswa
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Data siswa */}
            <div className="flex flex-col">
              <dl className="grid gap-x-5 gap-y-3 sm:grid-cols-2">
                <Baris label="Nama Lengkap" nilai={s?.nama} lebar />
                <Baris label="NIS" nilai={s?.nis} mono />
                {s?.nisn && <Baris label="NISN" nilai={s.nisn} mono />}
                <Baris label="Kelas" nilai={s?.kelas} />
                <Baris label="Waktu Datang" nilai={a?.jamMasuk} mono />
                <Baris label="Waktu Pulang" nilai={a?.jamPulang} mono />
              </dl>

              {/* Status */}
              <div
                className={[
                  'mt-5 flex items-center gap-3 rounded-card border px-4 py-3.5',
                  belum ? 'border-dashed border-ink-200 bg-ink-50'
                    : ok ? 'border-ok-500/25 bg-ok-50'
                    : 'border-bad-500/25 bg-bad-50',
                ].join(' ')}
              >
                {belum ? (
                  <ScanLine size={22} strokeWidth={2} className="text-ink-400" />
                ) : ok ? (
                  <CheckCircle2 size={22} strokeWidth={2.1} className="text-ok-500" />
                ) : (
                  <XCircle size={22} strokeWidth={2.1} className="text-bad-500" />
                )}

                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
                    Status
                  </p>
                  <p
                    className={[
                      'truncate text-[14.5px] font-semibold',
                      belum ? 'text-ink-500' : ok ? 'text-ok-700' : 'text-bad-700',
                    ].join(' ')}
                  >
                    {belum ? 'Menunggu scan'
                      : ok ? (a?.status === 'TERLAMBAT'
                          ? `Terlambat ${a.menitTelat} menit`
                          : data.alasan === 'PULANG' ? 'Absen pulang tercatat' : 'Hadir tepat waktu')
                      : data.alasan || 'Scan ditolak'}
                  </p>
                </div>

                {!belum && ok && a?.status && (
                  <span
                    className={[
                      'ml-auto shrink-0 rounded-chip px-2.5 py-1 text-[11.5px] font-semibold',
                      a.status === 'TERLAMBAT' ? 'bg-warn-50 text-warn-700' : 'bg-white text-ok-700',
                    ].join(' ')}
                  >
                    {a.status}
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

        <p className="mt-4 text-center text-[11.5px] text-ink-400">
          Presensia &middot; layar ini menyegarkan otomatis
        </p>
      </div>
    </main>
  );
}

function Baris({
  label, nilai, mono, lebar,
}: { label: string; nilai?: string | null; mono?: boolean; lebar?: boolean }) {
  const kosong = !nilai;
  return (
    <div className={lebar ? 'sm:col-span-2' : ''}>
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">{label}</dt>
      <dd
        className={[
          'mt-0.5 truncate',
          lebar ? 'text-[19px] font-semibold tracking-tight' : 'text-[14px] font-medium',
          mono ? 'tnum' : '',
          kosong ? 'text-ink-400' : 'text-ink-900',
        ].join(' ')}
      >
        {nilai || (lebar ? 'Belum ada data' : '\u2013')}
      </dd>
    </div>
  );
}
