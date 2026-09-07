/** Kerangka baris tabel selama data dimuat, agar tinggi tabel tidak melompat */
export function SkeletonBaris({ jumlah = 10 }: { jumlah?: number }) {
  return (
    <>
      {Array.from({ length: jumlah }).map((_, i) => (
        <tr key={i} className="animate-pulse">
          <td className="px-3 py-2.5">
            <div className="h-3.5 w-3.5 rounded-[4px] bg-ink-100" />
          </td>
          <td className="py-2 pl-4 pr-2">
            <div className="h-9 w-7 rounded-chip bg-ink-100" />
          </td>
          <td className="px-4 py-2.5">
            <div className="h-3 w-16 rounded bg-ink-100" />
          </td>
          <td className="px-4 py-2.5">
            <div className="h-3 w-32 rounded bg-ink-100" />
            <div className="mt-1.5 h-2 w-20 rounded bg-ink-100/70" />
          </td>
          <td className="px-4 py-2.5">
            <div className="h-3 w-20 rounded bg-ink-100" />
          </td>
          <td className="px-4 py-2.5">
            <div className="h-3 w-24 rounded bg-ink-100" />
          </td>
          <td className="px-4 py-2.5">
            <div className="h-4 w-12 rounded-chip bg-ink-100" />
          </td>
          <td className="px-3 py-2.5">
            <div className="ml-auto flex w-14 justify-end gap-1">
              <div className="h-7 w-7 rounded-chip bg-ink-100" />
              <div className="h-7 w-7 rounded-chip bg-ink-100" />
            </div>
          </td>
        </tr>
      ))}
    </>
  );
}
