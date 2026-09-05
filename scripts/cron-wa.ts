/**
 * Worker pengirim notifikasi WhatsApp.
 * Padanan cron_wa.php pada sistem absensi sekolah berbasis PHP.
 *
 * Jalankan lewat cron, misal tiap 2 menit:
 *   *&#47;2 * * * * cd /path/presensia && npx tsx scripts/cron-wa.ts >> /var/log/presensia-wa.log 2>&1
 *
 * Kirim aktual dilakukan lewat WA_GATEWAY_URL (mis. Baileys/Fonnte/Wablas).
 * Bila belum diset, worker berjalan dalam mode DRY-RUN dan hanya mencetak antrean.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const GATEWAY = process.env.WA_GATEWAY_URL || '';
const TOKEN = process.env.WA_GATEWAY_TOKEN || '';
const BATCH = 20;
const MAX_PERCOBAAN = 3;

async function kirimWa(tujuan: string, pesan: string): Promise<void> {
  if (!GATEWAY) {
    console.log(`[DRY-RUN] -> ${tujuan}: ${pesan}`);
    return;
  }
  const res = await fetch(GATEWAY, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
    },
    body: JSON.stringify({ target: tujuan, message: pesan }),
  });
  if (!res.ok) throw new Error(`Gateway HTTP ${res.status}`);
}

async function main() {
  const antre = await prisma.waOutbox.findMany({
    where: { terkirim: false, percobaan: { lt: MAX_PERCOBAAN } },
    orderBy: { createdAt: 'asc' },
    take: BATCH,
  });

  if (antre.length === 0) {
    console.log('Antrean kosong.');
    return;
  }

  let sukses = 0;
  let gagal = 0;

  for (const item of antre) {
    try {
      await kirimWa(item.tujuan, item.pesan);
      await prisma.waOutbox.update({
        where: { id: item.id },
        data: { terkirim: true, sentAt: new Date(), percobaan: { increment: 1 }, errorMsg: null },
      });
      sukses++;
    } catch (err) {
      await prisma.waOutbox.update({
        where: { id: item.id },
        data: { percobaan: { increment: 1 }, errorMsg: String(err) },
      });
      gagal++;
    }
    // jeda antar pesan supaya gateway tidak menganggap spam
    await new Promise((r) => setTimeout(r, 1200));
  }

  console.log(`Selesai. sukses=${sukses} gagal=${gagal} total=${antre.length}`);
}

main()
  .catch((e) => {
    console.error('Worker error:', e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
