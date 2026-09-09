'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn, ShieldCheck } from 'lucide-react';

const input = 'mt-1.5 w-full rounded-btn bg-white px-3.5 py-2.5 text-[14px] outline-none ring-1 ring-inset ring-ink-200 transition-shadow placeholder:text-ink-400 hover:ring-ink-400 focus:ring-[1.5px] focus:ring-brand-500';

export default function MasukClient() {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [kode, setKode] = useState('');
  const [tahap2fa, setTahap2fa] = useState(false);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(''); setLoading(true);
    try {
      const r = await fetch(tahap2fa ? '/api/auth/2fa' : '/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tahap2fa ? { kode } : { login, password }),
      });
      const d = await r.json();
      if (!d.ok) { setErr(d.pesan || 'Gagal masuk'); return; }
      if (d.perlu2fa) { setTahap2fa(true); return; }
      router.push('/admin'); router.refresh();
    } catch { setErr('Gagal terhubung ke server'); }
    finally { setLoading(false); }
  }

  return (
    <main className="grid min-h-screen place-items-center px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/presensia-logo.png" alt="Presensia" className="logo-marka mx-auto h-8 w-auto" />
          <h1 className="mt-3 text-[20px] font-semibold tracking-tight">
            {tahap2fa ? 'Verifikasi Dua Langkah' : 'Masuk Panel Admin'}
          </h1>
          <p className="mt-1 text-[13px] text-ink-500">
            {tahap2fa ? 'Masukkan kode 6 digit dari aplikasi autentikator.' : 'Sesi admin berakhir otomatis setelah 60 menit.'}
          </p>
        </div>

        <form onSubmit={submit} className="rounded-card border border-ink-200 bg-white p-5 shadow-soft">
          {tahap2fa ? (
            <>
              <label htmlFor="kode" className="text-[12.5px] font-medium text-ink-700">Kode Autentikator</label>
              <input id="kode" inputMode="numeric" autoComplete="one-time-code" required maxLength={6}
                value={kode} onChange={(e) => setKode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000" className={`${input} tnum text-center text-[22px] tracking-[.35em]`} />
            </>
          ) : (
            <>
              <label htmlFor="login" className="text-[12.5px] font-medium text-ink-700">Email atau Username</label>
              <input id="login" required value={login} onChange={(e) => setLogin(e.target.value)}
                placeholder="admin atau admin@sekolah.sch.id" className={input} />
              <label htmlFor="pw" className="mt-4 block text-[12.5px] font-medium text-ink-700">Kata Sandi</label>
              <input id="pw" type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••" className={input} />
            </>
          )}

          {err && <p className="mt-3 rounded-btn border border-bad-500/25 bg-bad-50 px-3 py-2 text-[12.5px] font-medium text-bad-700">{err}</p>}

          <button type="submit" disabled={loading}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-btn bg-brand-600 px-4 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-60">
            {tahap2fa ? <ShieldCheck size={16} /> : <LogIn size={16} />}
            {loading ? 'Memproses…' : tahap2fa ? 'Verifikasi' : 'Masuk'}
          </button>
          {tahap2fa && <button type="button" onClick={() => { setTahap2fa(false); setKode(''); setErr(''); }} className="mt-2 w-full py-1.5 text-[12.5px] text-ink-500 hover:text-ink-900">Kembali ke login</button>}
        </form>
      </div>
    </main>
  );
}
