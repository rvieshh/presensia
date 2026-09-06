/** Normalisasi nomor WhatsApp Indonesia menjadi format 62xxxx */
export function normalWa(raw?: string | null): string | null {
  if (!raw) return null;
  const d = raw.replace(/[^0-9]/g, '');
  if (!d) return null;
  if (d.startsWith('62')) return d;
  if (d.startsWith('0')) return '62' + d.slice(1);
  if (d.startsWith('8')) return '62' + d;
  return d;
}

/** Isi variabel template pesan WhatsApp */
export function isiTemplate(
  tpl: string,
  v: { nama: string; kelas: string; jam: string; sekolah: string; menit?: number }
): string {
  return tpl
    .replace(/\{nama\}/g, v.nama)
    .replace(/\{kelas\}/g, v.kelas)
    .replace(/\{jam\}/g, v.jam)
    .replace(/\{sekolah\}/g, v.sekolah)
    .replace(/\{menit\}/g, String(v.menit ?? 0));
}
