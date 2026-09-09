import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Urutan aman mengikuti foreign key. Akun admin, migration history,
  // dan struktur tabel tidak disentuh.
  await prisma.$transaction([
    prisma.waOutbox.deleteMany(),
    prisma.scanLog.deleteMany(),
    prisma.absensi.deleteMany(),
    prisma.siswa.deleteMany(),
    prisma.kelas.deleteMany(),
    prisma.jurusan.deleteMany(),
    prisma.device.deleteMany(),
    prisma.aset.deleteMany(),
    prisma.setting.deleteMany(),
  ]);

  console.log('Data operasional dibersihkan: siswa, absensi, log, kelas, device, aset, setting, dan antrean WA = 0');
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
