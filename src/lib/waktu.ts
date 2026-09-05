export const DEFAULT_SETTINGS = {
  jam_masuk: '07:00',
  jam_telat: '07:15',
  jam_pulang: '15:30',
  nama_sekolah: 'SMK Contoh',
  wa_enabled: 'false',
} as const;

export type SettingKey = keyof typeof DEFAULT_SETTINGS;

/** "07:15" -> menit sejak tengah malam */
export function jamKeMenit(jam: string): number {
  const [h, m] = jam.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

/** Date -> menit sejak tengah malam (waktu lokal server) */
export function menitDariDate(d: Date): number {
  return d.getHours() * 60 + d.getMinutes();
}

/** Tanggal tanpa jam, buat kolom @db.Date */
export function tanggalHariIni(d: Date = new Date()): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
