import { prisma } from './prisma';
import { verifyQrToken } from './qr';
import { ambilSettings } from './settings';
import { menitDariDate, tanggalHariIni } from './waktu';
import { tentukanJadwal } from './jadwal';
import type { StatusHadir } from '@prisma/client';

export interface HasilScan {
  ok: boolean;
  pesan: string;
  siswa?: { nama: string; nis: string; kelas: string };
  status?: StatusHadir;
  jam?: string;
  tipe?: 'MASUK' | 'PULANG';
}

interface OpsiScan {
  rawInput: string;
  apiKey?: string | null;
  ip?: string | null;
}

export async function prosesScan(opsi: OpsiScan): Promise<HasilScan> {
  const { rawInput, apiKey, ip } = opsi;
  const now = new Date();

  // Bila input manual dimatikan, hanya perangkat pemindai terdaftar yang
  // boleh mengirim. Tanpa penjagaan ini, menyembunyikan kolom di layar
  // saja masih bisa dilewati dengan memanggil endpoint langsung.
  const pengaturan = await ambilSettings();
  if ((pengaturan.manual_input_aktif ?? 'true') !== 'true' && !apiKey) {
    await prisma.scanLog.create({
      data: { rawInput, sukses: false, alasan: 'Input manual dinonaktifkan', ip },
    });
    return { ok: false, pesan: 'Input manual dinonaktifkan, gunakan alat pemindai' };
  }

  // 1. Resolusi device (opsional; kalau tanpa apiKey dianggap web station)
  let device = null;
  if (apiKey) {
    device = await prisma.device.findUnique({ where: { apiKey } });
    if (!device || !device.aktif) {
      await prisma.scanLog.create({
        data: { rawInput, sukses: false, alasan: 'Device tidak dikenal/nonaktif', ip },
      });
      return { ok: false, pesan: 'Device tidak dikenal atau nonaktif' };
    }
    await prisma.device.update({
      where: { id: device.id },
      data: { lastSeenAt: now },
    });
  }

  // 2. Verifikasi tanda tangan QR
  const cek = verifyQrToken(rawInput);
  if (!cek.valid || !cek.nis) {
    await prisma.scanLog.create({
      data: { deviceId: device?.id ?? null, rawInput, sukses: false, alasan: cek.alasan, ip },
    });
    return { ok: false, pesan: cek.alasan || 'QR tidak valid' };
  }

  // 3. Cari siswa + cocokkan token utuh (bukan cuma NIS)
  const siswa = await prisma.siswa.findUnique({
    where: { nis: cek.nis },
    include: { kelas: true },
  });

  if (!siswa || !siswa.aktif) {
    await prisma.scanLog.create({
      data: { deviceId: device?.id ?? null, rawInput, sukses: false, alasan: 'Siswa tidak ditemukan/nonaktif', ip },
    });
    return { ok: false, pesan: 'Siswa tidak ditemukan atau nonaktif' };
  }

  if (siswa.qrToken !== rawInput.trim()) {
    await prisma.scanLog.create({
      data: { siswaId: siswa.id, deviceId: device?.id ?? null, rawInput, sukses: false, alasan: 'Kartu kadaluarsa (token dicabut)', ip },
    });
    return { ok: false, pesan: 'Kartu sudah tidak berlaku, minta cetak ulang' };
  }

  // 4. Tentukan MASUK / PULANG
  const st = await ambilSettings();
  const menitSkrg = menitDariDate(now);
  const jadwal = tentukanJadwal(st, now, siswa.agama);
  const batasPulang = jadwal.batasPulang;
  const tanggal = tanggalHariIni(now);

  const existing = await prisma.absensi.findUnique({
    where: { siswaId_tanggal: { siswaId: siswa.id, tanggal } },
  });

  const tipeDevice = device?.tipe;
  const tipe: 'MASUK' | 'PULANG' =
    tipeDevice === 'PULANG' ? 'PULANG'
    : tipeDevice === 'MASUK' ? 'MASUK'
    : existing?.jamMasuk ? (menitSkrg >= batasPulang ? 'PULANG' : 'MASUK')
    : 'MASUK';

  const jamStr = now.toTimeString().slice(0, 5);
  const infoSiswa = { nama: siswa.nama, nis: siswa.nis, kelas: siswa.kelas.nama };

  // 5. PULANG
  if (tipe === 'PULANG') {
    if (!existing) {
      await prisma.scanLog.create({
        data: { siswaId: siswa.id, deviceId: device?.id ?? null, rawInput, sukses: false, alasan: 'Scan pulang tanpa scan masuk', ip },
      });
      return { ok: false, pesan: 'Belum ada absen masuk hari ini', siswa: infoSiswa };
    }
    if (existing.jamPulang) {
      return {
        ok: false,
        pesan: `Sudah absen pulang jam ${existing.jamPulang.toTimeString().slice(0, 5)}`,
        siswa: infoSiswa,
      };
    }
    await prisma.absensi.update({
      where: { id: existing.id },
      data: { jamPulang: now },
    });
    await prisma.scanLog.create({
      data: { siswaId: siswa.id, deviceId: device?.id ?? null, rawInput, sukses: true, alasan: 'PULANG', ip },
    });
    return { ok: true, pesan: 'Absen pulang tercatat', siswa: infoSiswa, jam: jamStr, tipe: 'PULANG', status: existing.status };
  }

  // 6. MASUK (anti dobel-scan)
  if (existing?.jamMasuk) {
    return {
      ok: false,
      pesan: `Sudah absen masuk jam ${existing.jamMasuk.toTimeString().slice(0, 5)}`,
      siswa: infoSiswa,
      status: existing.status,
    };
  }

  const batasTelat = jadwal.batasTelat;
  const telat = menitSkrg > batasTelat;
  const status: StatusHadir = telat ? 'TERLAMBAT' : 'HADIR';
  const menitTelat = telat ? menitSkrg - batasTelat : 0;

  await prisma.absensi.upsert({
    where: { siswaId_tanggal: { siswaId: siswa.id, tanggal } },
    update: { jamMasuk: now, status, menitTelat },
    create: { siswaId: siswa.id, tanggal, jamMasuk: now, status, menitTelat },
  });

  await prisma.scanLog.create({
    data: { siswaId: siswa.id, deviceId: device?.id ?? null, rawInput, sukses: true, alasan: status, ip },
  });

  // 7. Antre notifikasi WA ke ortu (dikirim worker terpisah, mirip cron_wa.php)
  if (st.wa_enabled === 'true' && siswa.waOrtu) {
    const pesan = telat
      ? `[${st.nama_sekolah}] Ananda ${siswa.nama} (${siswa.kelas.nama}) TERLAMBAT ${menitTelat} menit, tiba pukul ${jamStr}.`
      : `[${st.nama_sekolah}] Ananda ${siswa.nama} (${siswa.kelas.nama}) hadir pukul ${jamStr}.`;
    await prisma.waOutbox.create({ data: { tujuan: siswa.waOrtu, pesan } });
  }

  return {
    ok: true,
    pesan: telat ? `Terlambat ${menitTelat} menit` : 'Absen masuk tercatat',
    siswa: infoSiswa,
    jam: jamStr,
    tipe: 'MASUK',
    status,
  };
}
