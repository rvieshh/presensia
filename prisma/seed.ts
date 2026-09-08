import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { createHmac, randomBytes } from 'crypto';

const prisma = new PrismaClient();
const SECRET = process.env.QR_SECRET || 'dev_qr_secret';

function genQr(nis: string) {
  const nonce = randomBytes(6).toString('base64url');
  const body = `PRS1.${nis}.${nonce}`;
  const sig = createHmac('sha256', SECRET).update(body).digest('base64url').slice(0, 16);
  return `${body}.${sig}`;
}

// Nama contoh sengaja bersifat umum, bukan nama orang sungguhan
const NAMA = [
  'Siswa Contoh Satu', 'Siswa Contoh Dua', 'Siswa Contoh Tiga',
  'Siswa Contoh Empat', 'Siswa Contoh Lima', 'Siswa Contoh Enam',
  'Siswa Contoh Tujuh', 'Siswa Contoh Delapan', 'Siswa Contoh Sembilan',
  'Siswa Contoh Sepuluh',
];

async function main() {
  await prisma.setting.createMany({
    data: [
      { key: 'jam_masuk', value: '07:00' },
      { key: 'jam_telat', value: '07:15' },
      { key: 'jam_pulang', value: '15:30' },
      { key: 'nama_sekolah', value: 'Sekolah Contoh' },
      { key: 'wa_enabled', value: 'false' },
    ],
    skipDuplicates: true,
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@presensia.test' },
    update: {},
    create: {
      email: 'admin@presensia.test',
      nama: 'Administrator',
      password: await bcrypt.hash('admin123', 10),
      role: 'ADMIN',
    },
  });

  const kelas = await prisma.kelas.upsert({
    where: { nama: 'XI RPL 1' },
    update: {},
    create: { nama: 'XI RPL 1', tingkat: 'XI', jurusan: 'RPL', waliKelas: 'Wali Kelas Contoh' },
  });

  for (let i = 0; i < NAMA.length; i++) {
    const nis = `2024${String(i + 1).padStart(3, '0')}`;
    await prisma.siswa.upsert({
      where: { nis },
      update: {},
      create: {
        nis,
        nama: NAMA[i],
        kelasId: kelas.id,
        waOrtu: `62812${String(10000000 + i)}`,
        qrToken: genQr(nis),
      },
    });
  }

  await prisma.device.upsert({
    where: { apiKey: 'dev-scanner-gerbang-utama' },
    update: {},
    create: { nama: 'Scanner Gerbang Utama', lokasi: 'Gerbang Depan', apiKey: 'dev-scanner-gerbang-utama', tipe: 'MASUK' },
  });

  const total = await prisma.siswa.count();
  console.log(`Seed OK -> admin:${admin.email} kelas:${kelas.nama} siswa:${total}`);
}

main().finally(() => prisma.$disconnect());
