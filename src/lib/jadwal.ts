import { jamKeMenit } from './waktu';

export interface JadwalTerpakai {
  sesi: 'PAGI' | 'SIANG';
  batasTelat: number;      // menit sejak tengah malam
  batasPulang: number;
  dispensasiJumat: boolean; // benar bila batas digeser karena salat Jumat
  keterangan: string;
}

/**
 * Tentukan jadwal yang berlaku untuk satu siswa pada satu waktu.
 *
 * Aturan dispensasi Jumat sengaja dipersempit ke tiga syarat sekaligus:
 * hari Jumat, siswa beragama Islam, dan sekolah memakai sesi siang.
 * Bila salah satu tidak terpenuhi, batas normal yang dipakai — sehingga
 * siswa non-muslim atau siswa muslim di hari Senin tetap tercatat
 * terlambat bila datang lewat batas.
 */
export function tentukanJadwal(
  st: Record<string, string>,
  waktu: Date,
  agama?: string | null
): JadwalTerpakai {
  const menit = waktu.getHours() * 60 + waktu.getMinutes();
  const hariJumat = waktu.getDay() === 5;

  const sesiSiangAktif = st.sesi_siang_aktif === 'true';
  const masukSiang = jamKeMenit(st.sesi_siang_masuk || '12:50');

  // Siswa dianggap masuk sesi siang bila sekolah mengaktifkannya dan
  // ia datang mendekati atau setelah jam masuk siang (toleransi 90 menit
  // ke belakang agar yang datang lebih awal tetap terhitung sesi siang).
  const sesiSiang = sesiSiangAktif && menit >= masukSiang - 90;

  if (!sesiSiang) {
    return {
      sesi: 'PAGI',
      batasTelat: jamKeMenit(st.jam_telat || '07:15'),
      batasPulang: jamKeMenit(st.jam_pulang || '15:30'),
      dispensasiJumat: false,
      keterangan: 'Sesi pagi',
    };
  }

  const batasNormal = jamKeMenit(st.sesi_siang_telat || '13:05');
  const batasPulang = jamKeMenit(st.sesi_siang_pulang || '17:30');

  const dispensasiAktif = st.jumat_dispensasi_aktif === 'true';
  const muslim = (agama || '').trim().toLowerCase() === 'islam';

  if (hariJumat && muslim && dispensasiAktif) {
    const batasJumat = jamKeMenit(st.jumat_batas_masuk || '13:30');
    return {
      sesi: 'SIANG',
      batasTelat: Math.max(batasNormal, batasJumat),
      batasPulang,
      dispensasiJumat: true,
      keterangan: 'Sesi siang, dispensasi salat Jumat',
    };
  }

  return {
    sesi: 'SIANG',
    batasTelat: batasNormal,
    batasPulang,
    dispensasiJumat: false,
    keterangan: 'Sesi siang',
  };
}
