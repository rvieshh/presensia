import { buatTotp, cekTotp, durasiSesiDetik } from '../src/lib/auth-core';

let lolos = 0;
function cek(nama: string, kondisi: boolean) {
  console.log(`${kondisi ? 'LOLOS' : 'GAGAL'} ${nama}`);
  if (kondisi) lolos++;
}

const rahasia = 'JBSWY3DPEHPK3PXP';
const sekarang = 1788796800000;
const kode = buatTotp(rahasia, sekarang);

cek('kode TOTP terdiri dari 6 digit', /^\d{6}$/.test(kode));
cek('kode TOTP valid pada waktu yang sama', cekTotp(rahasia, kode, sekarang));
cek('kode salah ditolak', !cekTotp(rahasia, '000000', sekarang));
cek('sesi default 60 menit', durasiSesiDetik(undefined) === 3600);
cek('sesi minimum 15 menit', durasiSesiDetik('1') === 900);
cek('sesi maksimum 24 jam', durasiSesiDetik('99999') === 86400);

console.log(`TOTAL ${lolos}/6`);
process.exit(lolos === 6 ? 0 : 1);
