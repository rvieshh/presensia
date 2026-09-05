'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { QrCode, LogIn } from 'lucide-react';

export default function MasukClient() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      const r = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const d = await r.json();
      if (!d.ok) { setErr(d.pesan || 'Gagal masuk'); return; }
      router.push('/admin');
      router.refresh();
    } catch {
      setErr('Gagal terhubung ke server');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-card bg-brand-600 text-white">
            <QrCode size={24} strokeWidth={2.3} />
          </span>
          <h1 className="mt-3 text-[20px] font-semibold tracking-tight">Masuk Panel Admin</h1>
          <p className="mt-1 text-[13px] text-ink-500">Presensia — sistem absensi QR</p>
        </div>

        <form onSubmit={submit} className="rounded-card border border-ink-200 bg-white p-5 shadow-soft">
          <label htmlFor="email" className="text-[12.5px] font-medium text-ink-700">Email</label>
          <input
            id="email" type="email" required value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@sekolah.sch.id"
            className="mt-1.5 w-full rounded-btn border border-ink-200 bg-ink-50 px-3.5 py-2.5 text-[14px] outline-none transition-colors focus:border-brand-500 focus:bg-white"
          />

          <label htmlFor="pw" className="mt-4 block text-[12.5px] font-medium text-ink-700">Kata Sandi</label>
          <input
            id="pw" type="password" required value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="mt-1.5 w-full rounded-btn border border-ink-200 bg-ink-50 px-3.5 py-2.5 text-[14px] outline-none transition-colors focus:border-brand-500 focus:bg-white"
          />

          {err && (
            <p className="mt-3 rounded-btn border border-bad-500/25 bg-bad-50 px-3 py-2 text-[12.5px] font-medium text-bad-700">
              {err}
            </p>
          )}

          <button
            type="submit" disabled={loading}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-btn bg-brand-600 px-4 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
          >
            <LogIn size={16} strokeWidth={2.3} />
            {loading ? 'Memproses…' : 'Masuk'}
          </button>
        </form>

        <p className="mt-4 text-center text-[12px] text-ink-400">
          Layar absensi publik ada di <a href="/" className="font-medium text-brand-600 hover:underline">halaman utama</a>
        </p>
      </div>
    </main>
  );
}
