/** Uji aturan sesi siang dan dispensasi salat Jumat */
import { tentukanJadwal } from '../src/lib/jadwal';

const ST = {
  jam_masuk: '07:00', jam_telat: '07:15', jam_pulang: '15:30',
  sesi_siang_aktif: 'true', sesi_siang_masuk: '12:50',
  sesi_siang_telat: '13:05', sesi_siang_pulang: '17:30',
  jumat_dispensasi_aktif: 'true', jumat_batas_masuk: '13:30',
};

// 2026-09-11 = Jumat, 2026-09-07 = Senin
const JUMAT = (h: number, m: number) => new Date(2026, 8, 11, h, m);
const SENIN = (h: number, m: number) => new Date(2026, 8, 7, h, m);

const jm = (n: number) => `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`;

interface Kasus {
  nama: string;
  waktu: Date;
  agama: string;
  telatDiharap: boolean;
}

const KASUS: Kasus[] = [
  { nama: 'Jumat, Islam, datang 13:20', waktu: JUMAT(13, 20), agama: 'Islam', telatDiharap: false },
  { nama: 'Jumat, Islam, datang 13:29', waktu: JUMAT(13, 29), agama: 'Islam', telatDiharap: false },
  { nama: 'Jumat, Islam, datang 13:45 (lewat batas)', waktu: JUMAT(13, 45), agama: 'Islam', telatDiharap: true },
  { nama: 'Jumat, Hindu, datang 13:20', waktu: JUMAT(13, 20), agama: 'Hindu', telatDiharap: true },
  { nama: 'Jumat, Kristen, datang 13:20', waktu: JUMAT(13, 20), agama: 'Kristen', telatDiharap: true },
  { nama: 'Senin, Islam, datang 13:20', waktu: SENIN(13, 20), agama: 'Islam', telatDiharap: true },
  { nama: 'Senin, Islam, datang 12:55', waktu: SENIN(12, 55), agama: 'Islam', telatDiharap: false },
  { nama: 'Jumat, Islam, datang 12:45 (sebelum batas)', waktu: JUMAT(12, 45), agama: 'Islam', telatDiharap: false },
];

let lolos = 0;
console.log('KASUS                                          BATAS   TELAT  HARAP  HASIL');
for (const k of KASUS) {
  const j = tentukanJadwal(ST, k.waktu, k.agama);
  const menit = k.waktu.getHours() * 60 + k.waktu.getMinutes();
  const telat = menit > j.batasTelat;
  const ok = telat === k.telatDiharap;
  if (ok) lolos++;
  console.log(
    `${k.nama.padEnd(46)} ${jm(j.batasTelat)}   ${String(telat).padEnd(6)} ${String(k.telatDiharap).padEnd(6)} ${ok ? 'LOLOS' : 'GAGAL'}`
  );
}

// Dispensasi mati -> Jumat pun tetap terlambat
const mati = { ...ST, jumat_dispensasi_aktif: 'false' };
const j2 = tentukanJadwal(mati, JUMAT(13, 20), 'Islam');
const telat2 = 13 * 60 + 20 > j2.batasTelat;
console.log(`\nDispensasi DIMATIKAN, Jumat Islam 13:20 -> telat=${telat2} (harus true) ${telat2 ? 'LOLOS' : 'GAGAL'}`);
if (telat2) lolos++;

// Sesi siang mati -> pakai jadwal pagi
const pagi = { ...ST, sesi_siang_aktif: 'false' };
const j3 = tentukanJadwal(pagi, JUMAT(13, 20), 'Islam');
const okPagi = j3.sesi === 'PAGI' && j3.batasTelat === 7 * 60 + 15;
console.log(`Sesi siang DIMATIKAN -> sesi=${j3.sesi} batas=${jm(j3.batasTelat)} ${okPagi ? 'LOLOS' : 'GAGAL'}`);
if (okPagi) lolos++;

console.log(`\nTOTAL: ${lolos}/${KASUS.length + 2} lolos`);
