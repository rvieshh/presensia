'use client';

import { useEffect, useRef, useState } from 'react';

interface Hasil {
  ok: boolean;
  pesan: string;
  siswa?: { nama: string; nis: string; kelas: string };
  status?: string;
  jam?: string;
  tipe?: string;
}

export default function ScanClient() {
  const [buf, setBuf] = useState('');
  const [hasil, setHasil] = useState<Hasil | null>(null);
  const [loading, setLoading] = useState(false);
  const [riwayat, setRiwayat] = useState<Hasil[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Kunci fokus ke input: scanner keyboard-wedge "mengetik" ke elemen aktif,
  // jadi input HARUS selalu fokus walau operator klik di mana pun.
  useEffect(() => {
    const fokus = () => inputRef.current?.focus();
    fokus();
    const t = setInterval(fokus, 800);
    document.addEventListener('click', fokus);
    return () => {
      clearInterval(t);
      document.removeEventListener('click', fokus);
    };
  }, []);

  async function kirim(qr: string) {
    if (!qr.trim() || loading) return;
    setLoading(true);
    try {
      const r = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qr }),
      });
      const data: Hasil = await r.json();
      setHasil(data);
      setRiwayat((p) => [data, ...p].slice(0, 8));
      if (navigator.vibrate) navigator.vibrate(data.ok ? 60 : [60, 50, 60]);
    } catch {
      setHasil({ ok: false, pesan: 'Gagal terhubung ke server' });
    } finally {
      setLoading(false);
      setBuf('');
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }

  const warna = hasil ? (hasil.ok ? '#059669' : '#dc2626') : '#94a3b8';

  return (
    <main style={{ minHeight: '100vh', padding: '2rem 1rem', maxWidth: 720, margin: '0 auto' }}>
      <header style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 700 }}>Stasiun Scan</h1>
        <p style={{ color: 'var(--muted)', fontSize: '.9rem' }}>
          Tembakkan QR ke scanner, atau tempel kode lalu tekan Enter.
        </p>
      </header>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          kirim(buf);
        }}
        className="card"
        style={{ padding: '1rem', marginBottom: '1.25rem' }}
      >
        <label htmlFor="qr-input" style={{ display: 'block', fontSize: '.8rem', color: 'var(--muted)', marginBottom: '.4rem' }}>
          Input QR (fokus otomatis)
        </label>
        <input
          id="qr-input"
          ref={inputRef}
          value={buf}
          onChange={(e) => setBuf(e.target.value)}
          placeholder="PRS1..."
          autoComplete="off"
          aria-label="Input kode QR"
          style={{
            width: '100%', padding: '.75rem', fontFamily: 'monospace',
            fontSize: '1rem', border: '1px solid var(--line)', borderRadius: 10,
          }}
        />
      </form>

      <section
        className="card"
        aria-live="polite"
        style={{ padding: '1.5rem', textAlign: 'center', borderLeft: `5px solid ${warna}`, marginBottom: '1.5rem' }}
      >
        {loading ? (
          <p style={{ color: 'var(--muted)' }}>Memproses…</p>
        ) : hasil ? (
          <>
            <p style={{ fontSize: '1.15rem', fontWeight: 700, color: warna }}>
              {hasil.ok ? '✓' : '✕'} {hasil.pesan}
            </p>
            {hasil.siswa && (
              <p style={{ marginTop: '.5rem', fontSize: '1.05rem' }}>
                <strong>{hasil.siswa.nama}</strong>
                <br />
                <span style={{ color: 'var(--muted)', fontSize: '.9rem' }}>
                  {hasil.siswa.nis} · {hasil.siswa.kelas}
                  {hasil.jam ? ` · ${hasil.jam}` : ''}
                  {hasil.tipe ? ` · ${hasil.tipe}` : ''}
                </span>
              </p>
            )}
          </>
        ) : (
          <p style={{ color: 'var(--muted)' }}>Menunggu scan…</p>
        )}
      </section>

      {riwayat.length > 0 && (
        <section>
          <h2 style={{ fontSize: '.85rem', color: 'var(--muted)', marginBottom: '.5rem', textTransform: 'uppercase' }}>
            Riwayat Terakhir
          </h2>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
            {riwayat.map((r, i) => (
              <li key={i} className="card" style={{ padding: '.6rem .8rem', fontSize: '.85rem', display: 'flex', justifyContent: 'space-between' }}>
                <span>{r.siswa ? `${r.siswa.nama} · ${r.siswa.kelas}` : r.pesan}</span>
                <span style={{ color: r.ok ? '#059669' : '#dc2626', fontWeight: 600 }}>
                  {r.ok ? r.jam || 'OK' : 'DITOLAK'}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
