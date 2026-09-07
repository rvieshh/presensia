export const DEFAULT_SETTINGS = {
  jam_masuk: '07:00',
  jam_telat: '07:15',
  jam_pulang: '15:30',
  nama_sekolah: 'SMK Contoh',
  wa_enabled: 'false',

  // Sesi siang: sebagian sekolah menjalankan rombongan belajar kedua
  sesi_siang_aktif: 'false',
  sesi_siang_masuk: '12:50',
  sesi_siang_telat: '13:05',
  sesi_siang_pulang: '17:30',

  // Dispensasi Jumat: siswa muslim baru selesai salat Jumat sekitar 13.00-13.30,
  // sehingga batas terlambat sesi siang perlu digeser khusus hari Jumat.
  jumat_dispensasi_aktif: 'false',
  jumat_batas_masuk: '13:30',
} as const;

export type SettingKey = keyof typeof DEFAULT_SETTINGS;

/** Enam agama yang diakui negara */
export const AGAMA = ['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Khonghucu'] as const;
export type Agama = (typeof AGAMA)[number];

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
