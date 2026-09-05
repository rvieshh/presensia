import type { LucideIcon } from 'lucide-react';

type Nada = 'netral' | 'ok' | 'warn' | 'bad';

const NADA: Record<Nada, { chip: string; ikon: string }> = {
  netral: { chip: 'bg-ink-100 text-ink-700', ikon: 'bg-ink-100 text-ink-700' },
  ok: { chip: 'bg-ok-50 text-ok-700', ikon: 'bg-ok-50 text-ok-700' },
  warn: { chip: 'bg-warn-50 text-warn-700', ikon: 'bg-warn-50 text-warn-700' },
  bad: { chip: 'bg-bad-50 text-bad-700', ikon: 'bg-bad-50 text-bad-700' },
};

export function StatCard({
  label,
  nilai,
  sub,
  ikon: Ikon,
  nada = 'netral',
}: {
  label: string;
  nilai: number | string;
  sub?: string;
  ikon: LucideIcon;
  nada?: Nada;
}) {
  return (
    <div className="flex h-full flex-col rounded-card border border-ink-200 bg-white p-4 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <span className="text-[12.5px] font-medium text-ink-500">{label}</span>
        <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-chip ${NADA[nada].ikon}`}>
          <Ikon size={15} strokeWidth={2.2} />
        </span>
      </div>
      <p className="tnum mt-3 text-[30px] font-semibold leading-none text-ink-900">{nilai}</p>
      <p className="mt-auto pt-2 text-[12px] text-ink-400">{sub ?? '\u00A0'}</p>
    </div>
  );
}
