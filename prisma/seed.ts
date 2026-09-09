import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function wajib(nama: string): string {
  const nilai = process.env[nama]?.trim();
  if (!nilai) throw new Error(`${nama} wajib diisi di .env sebelum menjalankan seed`);
  return nilai;
}

async function main() {
  const email = wajib('ADMIN_EMAIL').toLowerCase();
  const password = wajib('ADMIN_PASSWORD');
  const nama = process.env.ADMIN_NAME?.trim() || 'Administrator';

  if (password.length < 12) {
    throw new Error('ADMIN_PASSWORD minimal 12 karakter');
  }

  const settings = [
    ['nama_sekolah', process.env.SCHOOL_NAME?.trim() || 'Nama Sekolah'],
    ['jam_masuk', '07:00'],
    ['jam_telat', '07:15'],
    ['jam_pulang', '15:30'],
    ['manual_input_aktif', 'true'],
    ['kiosk_tema', 'terang'],
    ['wa_enabled', 'false'],
    ['sesi_siang_aktif', 'false'],
    ['sesi_siang_masuk', '12:50'],
    ['sesi_siang_telat', '13:05'],
    ['sesi_siang_pulang', '17:30'],
    ['jumat_dispensasi_aktif', 'false'],
    ['jumat_batas_masuk', '13:30'],
    ['scan_device_wajib', 'false'],
    ['scan_ip_allowlist_aktif', 'false'],
    ['scan_ip_allowlist', ''],
    ['trusted_proxy_cidrs', '127.0.0.1/32\n::1/128'],
    ['scan_rate_limit_per_minute', '120'],
  ];

  for (const [key, value] of settings) {
    await prisma.setting.upsert({ where: { key }, update: {}, create: { key, value } });
  }

  const admin = await prisma.user.upsert({
    where: { email },
    update: { nama, password: await bcrypt.hash(password, 12), role: 'ADMIN', aktif: true },
    create: { email, nama, password: await bcrypt.hash(password, 12), role: 'ADMIN' },
  });

  const deviceKey = process.env.DEVICE_API_KEY?.trim();
  if (deviceKey) {
    if (deviceKey.length < 24) throw new Error('DEVICE_API_KEY minimal 24 karakter');
    await prisma.device.upsert({
      where: { apiKey: deviceKey },
      update: { aktif: true },
      create: {
        nama: process.env.DEVICE_NAME?.trim() || 'Scanner Utama',
        lokasi: process.env.DEVICE_LOCATION?.trim() || 'Gerbang Utama',
        apiKey: deviceKey,
        tipe: 'MASUK',
      },
    });
  }

  console.log(`Bootstrap selesai: admin=${admin.email}, siswa=0, device=${deviceKey ? 1 : 0}`);
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
