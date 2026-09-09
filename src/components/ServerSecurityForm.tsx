'use client';

import { useState } from 'react';
import { ShieldCheck, Save, Loader2, AlertTriangle, KeyRound, Network } from 'lucide-react';

const inp = 'mt-1.5 w-full rounded-btn bg-white px-3 py-2 text-[13.5px] text-ink-900 outline-none ring-1 ring-inset ring-ink-200 transition-shadow placeholder:text-ink-400 hover:ring-ink-400 focus:ring-[1.5px] focus:ring-brand-500';

function Toggle({ aktif, setAktif, label }: { aktif: boolean; setAktif: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={aktif}
      onClick={() => setAktif(!aktif)}
      className={[
        'flex w-full items-center justify-between rounded-btn border px-3 py-2 text-[13px] font-medium transition-colors',
        aktif ? 'border-ok-500/30 bg-ok-50 text-ok-700' : 'border-ink-200 bg-ink-50 text-ink-500',
      ].join(' ')}
    >
      {label}
      <span className={`h-5 w-9 rounded-full p-0.5 transition-colors ${aktif ? 'bg-ok-500' : 'bg-ink-200'}`}>
        <span className={`block h-4 w-4 rounded-full bg-white transition-transform ${aktif ? 'translate-x-4' : ''}`} />
      </span>
    </button>
  );
}

export function ServerSecurityForm({
  awal,
  ipTerdeteksi,
  devices,
}: {
  awal: Record<string, string>;
  ipTerdeteksi: string;
  devices: { id: string; nama: string; lokasi: string | null; aktif: boolean; lastSeenAt: string | null }[];
}) {
  const [deviceWajib, setDeviceWajib] = useState((awal.scan_device_wajib ?? 'false') === 'true');
  const [allowAktif, setAllowAktif] = useState((awal.scan_ip_allowlist_aktif ?? 'false') === 'true');
  const [allow, setAllow] = useState(awal.scan_ip_allowlist ?? '');
  const [proxy, setProxy] = useState(awal.trusted_proxy_cidrs ?? '127.0.0.1/32\n::1/128');
  const [rate, setRate] = useState(awal.scan_rate_limit_per_minute ?? '120');
  const [busy, setBusy] = useState(false);
  const [pesan, setPesan] = useState('');
  const [err, setErr] = useState('');

  async function simpan(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setPesan(''); setErr('');
    try {
      const r = await fetch('/api/admin/server-security', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scan_device_wajib: String(deviceWajib),
          scan_ip_allowlist_aktif: String(allowAktif),
          scan_ip_allowlist: allow,
          trusted_proxy_cidrs: proxy,
          scan_rate_limit_per_minute: rate,
        }),
      });
      const d = await r.json();
      if (!d.ok) { setErr(d.pesan); return; }
      setPesan(d.pesan);
      setAllow(d.data.scan_ip_allowlist);
      setProxy(d.data.trusted_proxy_cidrs);
    } catch {
      setErr('Gagal terhubung ke server');
    } finally { setBusy(false); }
  }

  return (
    <form onSubmit={simpan} className="space-y-4">
      <section className="rounded-card border border-ink-200 bg-white p-5 shadow-soft">
        <div className="flex items-start gap-3">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-chip bg-brand-50 text-brand-600">
            <KeyRound size={16} strokeWidth={2.3} />
          </span>
          <div className="flex-1">
            <p className="text-[13.5px] font-semibold">Autentikasi Perangkat</p>
            <p className="mt-0.5 text-[11.5px] text-ink-400">Lebih kuat daripada IP saja. Setiap pemindai wajib membawa x-api-key yang terdaftar.</p>
            <div className="mt-3">
              <Toggle aktif={deviceWajib} setAktif={setDeviceWajib} label="Wajibkan kunci perangkat pada endpoint scan" />
            </div>

            <div className="mt-4 overflow-hidden rounded-btn border border-ink-200">
              <div className="bg-ink-50 px-3 py-2 text-[11.5px] font-semibold uppercase tracking-wide text-ink-400">
                Perangkat Terdaftar ({devices.length})
              </div>
              {devices.length === 0 ? (
                <p className="px-3 py-3 text-[12px] text-ink-400">Belum ada perangkat terdaftar.</p>
              ) : (
                <ul className="divide-y divide-ink-200">
                  {devices.map((d) => (
                    <li key={d.id} className="flex items-center gap-3 px-3 py-2.5">
                      <span className={`h-2 w-2 shrink-0 rounded-full ${d.aktif ? 'bg-ok-500' : 'bg-ink-400'}`} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12.5px] font-medium text-ink-700">{d.nama}</p>
                        <p className="truncate text-[11px] text-ink-400">{d.lokasi || 'Lokasi belum diisi'}</p>
                      </div>
                      <span className="text-[10.5px] text-ink-400">
                        {d.lastSeenAt ? `Aktif ${new Date(d.lastSeenAt).toLocaleString('id-ID')}` : 'Belum pernah terhubung'}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-card border border-ink-200 bg-white p-5 shadow-soft">
        <div className="flex items-start gap-3">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-chip bg-brand-50 text-brand-600">
            <Network size={16} strokeWidth={2.3} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13.5px] font-semibold">Allowlist IP / CIDR</p>
            <p className="mt-0.5 text-[11.5px] text-ink-400">Lapisan tambahan untuk membatasi asal request. Mendukung IPv4, IPv6, dan CIDR.</p>
            <div className="mt-3">
              <Toggle aktif={allowAktif} setAktif={setAllowAktif} label="Batasi endpoint scan ke daftar IP" />
            </div>

            <label htmlFor="allow" className="mt-4 block text-[12.5px] font-medium text-ink-700">IP yang Diizinkan</label>
            <div className="mt-1 flex items-center justify-between gap-2 rounded-btn bg-ink-50 px-3 py-2 text-[11.5px] text-ink-500">
              <span>IP request admin saat ini: <code className="font-mono font-semibold text-ink-700">{ipTerdeteksi}</code></span>
              <button
                type="button"
                onClick={() => setAllow((v) => {
                  const isi = v.split(/[\n,;]+/).map((x) => x.trim()).filter(Boolean);
                  return isi.includes(ipTerdeteksi) ? v : [...isi, ipTerdeteksi].join('\n');
                })}
                className="shrink-0 rounded-chip px-2 py-1 font-semibold text-brand-600 hover:bg-brand-50"
              >
                Tambahkan
              </button>
            </div>
            <textarea id="allow" rows={4} value={allow} onChange={(e) => setAllow(e.target.value)}
              placeholder={'203.0.113.10\n192.168.10.0/24'} className={inp + ' font-mono text-[12.5px]'} />
            <p className="mt-1 text-[11px] text-ink-400">Satu per baris. Jangan aktifkan sebelum IP scanner/server benar-benar diketahui.</p>

            <label htmlFor="proxy" className="mt-4 block text-[12.5px] font-medium text-ink-700">Reverse Proxy Tepercaya</label>
            <textarea id="proxy" rows={3} value={proxy} onChange={(e) => setProxy(e.target.value)} className={inp + ' font-mono text-[12.5px]'} />
            <p className="mt-1 text-[11px] text-ink-400">Hanya proxy ini yang boleh menentukan x-forwarded-for. Default loopback untuk nginx satu server.</p>
          </div>
        </div>
      </section>

      <section className="rounded-card border border-ink-200 bg-white p-5 shadow-soft">
        <label htmlFor="rate" className="text-[12.5px] font-medium text-ink-700">Batas Request Scan per IP / Menit</label>
        <input id="rate" type="number" min="10" max="600" value={rate} onChange={(e) => setRate(e.target.value)} className={inp + ' max-w-40'} />
        <p className="mt-1 text-[11px] text-ink-400">Default 120. Request berlebih dibalas HTTP 429 dan dicatat di log.</p>
      </section>

      <div className="rounded-card border border-warn-500/25 bg-warn-50 px-4 py-3 text-[12px] text-warn-700">
        <div className="flex gap-2">
          <AlertTriangle size={15} className="mt-0.5 shrink-0" />
          <p><strong>Rekomendasi:</strong> aktifkan kunci perangkat dulu. IP allowlist cocok sebagai lapisan kedua, tapi IP sekolah bisa berubah karena ISP/CGNAT. Konfigurasi salah dapat mengunci seluruh scanner.</p>
        </div>
      </div>

      {pesan && <p className="rounded-btn border border-ok-500/25 bg-ok-50 px-3 py-2 text-[12.5px] font-medium text-ok-700">{pesan}</p>}
      {err && <p className="rounded-btn border border-bad-500/25 bg-bad-50 px-3 py-2 text-[12.5px] font-medium text-bad-700">{err}</p>}

      <button type="submit" disabled={busy}
        className="inline-flex items-center gap-2 rounded-btn bg-brand-600 px-4 py-2.5 text-[13.5px] font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-60">
        {busy ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} strokeWidth={2.3} />}
        {busy ? 'Menyimpan…' : 'Simpan Keamanan Server'}
      </button>
    </form>
  );
}
