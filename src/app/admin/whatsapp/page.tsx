import { MessageSquare, Send, Clock3, CheckCircle2, XCircle } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { ambilSettings } from '@/lib/settings';
import { FormPengaturan } from '@/components/FormPengaturan';
import { StatCard } from '@/components/StatCard';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'WhatsApp — Admin Presensia' };

export default async function WhatsAppPage() {
  const [st, antre, terkirim, gagal, riwayat] = await Promise.all([
    ambilSettings(),
    prisma.waOutbox.count({ where: { terkirim: false, percobaan: { lt: 3 } } }),
    prisma.waOutbox.count({ where: { terkirim: true } }),
    prisma.waOutbox.count({ where: { terkirim: false, percobaan: { gte: 3 } } }),
    prisma.waOutbox.findMany({ orderBy: { createdAt: 'desc' }, take: 10 }),
  ]);

  return (
    <main className="px-5 py-6 lg:px-8">
      <div className="flex items-center gap-2.5">
        <span className="grid h-9 w-9 place-items-center rounded-chip bg-brand-50 text-brand-600">
          <MessageSquare size={19} strokeWidth={2.2} />
        </span>
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight">Integrasi WhatsApp</h1>
          <p className="text-[12.5px] text-ink-500">
            Notifikasi otomatis ke orang tua saat siswa absen atau terlambat
          </p>
        </div>
      </div>

      <section className="mt-5 grid grid-cols-3 gap-3">
        <StatCard label="Menunggu Kirim" nilai={antre} sub="dalam antrean" ikon={Clock3} nada={antre > 0 ? 'warn' : 'netral'} />
        <StatCard label="Terkirim" nilai={terkirim} sub="total" ikon={CheckCircle2} nada="ok" />
        <StatCard label="Gagal" nilai={gagal} sub="3× percobaan" ikon={XCircle} nada={gagal > 0 ? 'bad' : 'netral'} />
      </section>

      <div className="mt-5">
        <FormPengaturan
          awal={{
            wa_enabled: st.wa_enabled ?? 'false',
            wa_gateway_url: st.wa_gateway_url ?? '',
            wa_gateway_token: st.wa_gateway_token ?? '',
            wa_template_telat: st.wa_template_telat ?? '',
            wa_template_hadir: st.wa_template_hadir ?? '',
          }}
          bidang={[
            { key: 'wa_enabled', label: 'Status Notifikasi', tipe: 'toggle', hint: 'Nyalakan untuk mulai mengantre pesan' },
            { key: 'wa_gateway_url', label: 'URL Gateway', hint: 'Endpoint Baileys / Fonnte / Wablas' },
            { key: 'wa_gateway_token', label: 'Token Gateway', tipe: 'password', hint: 'Dikirim sebagai Bearer token' },
            { key: 'wa_template_hadir', label: 'Template Pesan Hadir', area: true, hint: 'Variabel: {nama} {kelas} {jam} {sekolah}' },
            { key: 'wa_template_telat', label: 'Template Pesan Terlambat', area: true, hint: 'Variabel tambahan: {menit}' },
          ]}
          catatan="Pesan tidak dikirim langsung saat scan, melainkan diantrekan agar proses absensi tetap cepat. Worker scripts/cron-wa.ts yang mengirimnya (jalankan lewat cron tiap 2 menit)."
        />
      </div>

      <section className="mt-5 overflow-hidden rounded-card border border-ink-200 bg-white shadow-soft">
        <div className="flex items-center justify-between border-b border-ink-200 px-5 py-3.5">
          <h2 className="text-[14px] font-semibold">Antrean Terbaru</h2>
          <span className="inline-flex items-center gap-1.5 text-[12px] text-ink-400">
            <Send size={13} /> 10 terakhir
          </span>
        </div>

        {riwayat.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-[13.5px] font-medium text-ink-700">Antrean masih kosong</p>
            <p className="mt-1 text-[12.5px] text-ink-400">
              Pesan muncul di sini setelah ada siswa yang absen.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-ink-200">
            {riwayat.map((w) => (
              <li key={w.id} className="flex items-start gap-3 px-5 py-3">
                <span className={[
                  'mt-1 h-1.5 w-1.5 shrink-0 rounded-full',
                  w.terkirim ? 'bg-ok-500' : w.percobaan >= 3 ? 'bg-bad-500' : 'bg-warn-500',
                ].join(' ')} />
                <div className="min-w-0 flex-1">
                  <p className="tnum text-[12.5px] font-semibold text-ink-700">{w.tujuan}</p>
                  <p className="mt-0.5 line-clamp-2 text-[12px] text-ink-500">{w.pesan}</p>
                </div>
                <span className={[
                  'shrink-0 rounded-chip px-2 py-0.5 text-[11px] font-semibold',
                  w.terkirim ? 'bg-ok-50 text-ok-700'
                    : w.percobaan >= 3 ? 'bg-bad-50 text-bad-700'
                    : 'bg-warn-50 text-warn-700',
                ].join(' ')}>
                  {w.terkirim ? 'Terkirim' : w.percobaan >= 3 ? 'Gagal' : 'Antre'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
