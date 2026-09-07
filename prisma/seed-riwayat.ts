/**
 * Isi data absensi contoh untuk beberapa hari ke belakang,
 * supaya halaman rekap bisa diuji dengan angka yang masuk akal.
 * Hanya untuk pengembangan.
 */
import { PrismaClient, type StatusHadir } from '@prisma/client';

const prisma = new PrismaClient();
const HARI_MUNDUR = 120;

function acak(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
  const siswa = await prisma.siswa.findMany({ where: { aktif: true }, select: { id: true } });
  if (siswa.length === 0) {
    console.log('Tidak ada siswa. Jalankan seed utama dulu.');
    return;
  }

  const hariIni = new Date();
  hariIni.setHours(0, 0, 0, 0);

  let dibuat = 0;
  let dilewati = 0;

  for (let i = 0; i < HARI_MUNDUR; i++) {
    const tanggal = new Date(hariIni);
    tanggal.setDate(tanggal.getDate() - i);

    // Sabtu dan Minggu tidak ada kegiatan
    const h = tanggal.getDay();
    if (h === 0 || h === 6) { dilewati++; continue; }

    for (const s of siswa) {
      const undi = Math.random();
      let status: StatusHadir;
      let menitTelat = 0;

      if (undi < 0.78) status = 'HADIR';
      else if (undi < 0.90) { status = 'TERLAMBAT'; menitTelat = acak(1, 45); }
      else if (undi < 0.94) status = 'IZIN';
      else if (undi < 0.97) status = 'SAKIT';
      else continue; // sisanya tidak scan sama sekali -> alpa tersirat

      const jamMasuk = new Date(tanggal);
      jamMasuk.setHours(7, status === 'TERLAMBAT' ? 15 + menitTelat : acak(0, 14));

      const jamPulang = new Date(tanggal);
      jamPulang.setHours(15, acak(30, 55));

      try {
        await prisma.absensi.upsert({
          where: { siswaId_tanggal: { siswaId: s.id, tanggal } },
          update: {},
          create: {
            siswaId: s.id,
            tanggal,
            jamMasuk: status === 'IZIN' || status === 'SAKIT' ? null : jamMasuk,
            jamPulang: status === 'IZIN' || status === 'SAKIT' ? null : jamPulang,
            status,
            menitTelat,
          },
        });
        dibuat++;
      } catch { /* lewati bentrok */ }
    }
  }

  console.log(`Selesai. ${dibuat} catatan absensi dibuat, ${dilewati} akhir pekan dilewati.`);
}

main().finally(() => prisma.$disconnect());
