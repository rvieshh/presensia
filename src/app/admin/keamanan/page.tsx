import { ShieldCheck } from 'lucide-react';
import { ambilSettings } from '@/lib/settings';
import { DEFAULT_SECURITY, konteksIpRequest } from '@/lib/security';
import { prisma } from '@/lib/prisma';
import { ServerSecurityForm } from '@/components/ServerSecurityForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Keamanan Server — Admin Presensia' };

export default async function KeamananPage() {
  const st = await ambilSettings();
  const [ctx, devices] = await Promise.all([
    konteksIpRequest(st.trusted_proxy_cidrs ?? DEFAULT_SECURITY.trusted_proxy_cidrs),
    prisma.device.findMany({
      orderBy: { nama: 'asc' },
      select: { id: true, nama: true, lokasi: true, aktif: true, lastSeenAt: true },
    }),
  ]);

  return (
    <main className="px-5 py-6 lg:px-8">
      <div className="flex items-center gap-2.5">
        <span className="grid h-9 w-9 place-items-center rounded-chip bg-brand-50 text-brand-600">
          <ShieldCheck size={19} strokeWidth={2.2} />
        </span>
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight">Keamanan Server</h1>
          <p className="text-[12.5px] text-ink-500">Lindungi endpoint scan dari request palsu dan penyalahgunaan.</p>
        </div>
      </div>

      <div className="mt-5 max-w-2xl">
        <ServerSecurityForm
          awal={{
            scan_device_wajib: st.scan_device_wajib ?? DEFAULT_SECURITY.scan_device_wajib,
            scan_ip_allowlist_aktif: st.scan_ip_allowlist_aktif ?? DEFAULT_SECURITY.scan_ip_allowlist_aktif,
            scan_ip_allowlist: st.scan_ip_allowlist ?? DEFAULT_SECURITY.scan_ip_allowlist,
            trusted_proxy_cidrs: st.trusted_proxy_cidrs ?? DEFAULT_SECURITY.trusted_proxy_cidrs,
            scan_rate_limit_per_minute: st.scan_rate_limit_per_minute ?? DEFAULT_SECURITY.scan_rate_limit_per_minute,
          }}
          ipTerdeteksi={ctx.ip}
          devices={devices.map((d) => ({
            ...d,
            lastSeenAt: d.lastSeenAt?.toISOString() ?? null,
          }))}
        />
      </div>
    </main>
  );
}
