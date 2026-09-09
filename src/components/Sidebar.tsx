'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, IdCard, CalendarRange, Settings, MessageSquare, LogOut, Monitor, ShieldCheck, UserCircle, UsersRound,
} from 'lucide-react';
import { TemaSwitcher } from './TemaSwitcher';

const MENU = [
  { href: '/admin', label: 'Dasbor', ikon: LayoutDashboard },
  { href: '/admin/siswa', label: 'Data Siswa', ikon: Users },
  { href: '/admin/kartu', label: 'Kartu QR', ikon: IdCard },
  { href: '/admin/rekap', label: 'Rekap', ikon: CalendarRange },
  { href: '/admin/whatsapp', label: 'WhatsApp', ikon: MessageSquare },
  { href: '/admin/keamanan', label: 'Keamanan Server', ikon: ShieldCheck },
  { href: '/admin/accounts', label: 'Accounts', ikon: UserCircle },
  { href: '/admin/teams', label: 'Teams', ikon: UsersRound },
  { href: '/admin/pengaturan', label: 'Pengaturan', ikon: Settings },
];

export function Sidebar({ nama, role }: { nama: string; role: string }) {
  const path = usePathname();

  return (
    <aside className="no-print sticky top-0 z-40 flex w-full shrink-0 flex-col border-b border-ink-200 bg-white lg:h-screen lg:w-60 lg:border-b-0 lg:border-r">
      <div className="flex items-center gap-2.5 border-ink-200 px-5 py-4 lg:border-b">
        <div className="min-w-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/presensia-logo.png" alt="Presensia" className="logo-marka h-5 w-auto object-contain" />
          <p className="mt-1 text-[11px] text-ink-400">Panel Admin</p>
        </div>
      </div>

      <nav className="scroll-halus scroll-x flex gap-1 overflow-x-auto px-3 py-3 lg:flex-col lg:overflow-visible">
        {MENU.map((m) => {
          const on = path === m.href || (m.href !== '/admin' && path.startsWith(m.href));
          const Ikon = m.ikon;
          return (
            <Link
              key={m.href}
              href={m.href}
              aria-current={on ? 'page' : undefined}
              className={[
                'flex shrink-0 items-center gap-2.5 rounded-btn px-3 py-2 text-[13.5px] font-medium transition-colors',
                on ? 'bg-brand-50 text-brand-700' : 'text-ink-500 hover:bg-ink-50 hover:text-ink-900',
              ].join(' ')}
            >
              <Ikon size={16} strokeWidth={2.2} />
              {m.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto hidden border-t border-ink-200 p-3 lg:block">
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-btn px-3 py-2 text-[13px] font-medium text-ink-500 transition-colors hover:bg-ink-50 hover:text-ink-900"
        >
          <Monitor size={16} strokeWidth={2.2} />
          Layar Absensi
        </Link>

        <div className="mt-2 flex items-center justify-between gap-2 px-1">
          <span className="text-[11.5px] font-medium text-ink-400">Tema</span>
          <TemaSwitcher ringkas />
        </div>

        <div className="mt-2 flex items-center gap-2.5 rounded-btn bg-ink-50 px-3 py-2.5">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-chip bg-white text-[11px] font-semibold text-ink-700 shadow-soft">
            {nama.slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12.5px] font-medium">{nama}</p>
            <p className="text-[10.5px] uppercase tracking-wide text-ink-400">{role}</p>
          </div>
          <form action="/api/auth/keluar" method="post">
            <button
              type="submit"
              aria-label="Keluar"
              className="grid h-7 w-7 place-items-center rounded-chip text-ink-400 transition-colors hover:bg-white hover:text-bad-700"
            >
              <LogOut size={14} strokeWidth={2.2} />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
