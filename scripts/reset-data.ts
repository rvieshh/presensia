import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const emailEnv = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const utama = emailEnv
    ? await prisma.user.findUnique({ where: { email: emailEnv } })
    : await prisma.user.findFirst({ where: { role: 'ADMIN' }, orderBy: { createdAt: 'asc' } });

  // Urutan aman mengikuti foreign key. Migration history dan struktur
  // tabel tidak disentuh. Satu admin utama dipertahankan agar instalasi
  // lokal tidak terkunci setelah reset.
  await prisma.$transaction([
    prisma.user.deleteMany({ where: utama ? { id: { not: utama.id } } : {} }),
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

  console.log(`Data operasional dibersihkan; admin dipertahankan=${utama?.email ?? 'tidak ada'}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
