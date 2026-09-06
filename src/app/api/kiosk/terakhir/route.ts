import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ambilSettings } from '@/lib/settings';
import { tanggalHariIni } from '@/lib/waktu';

export const dynamic = 'force-dynamic';

/**
 * GET /api/kiosk/terakhir
 * Dipakai layar kiosk untuk menampilkan hasil scan terbaru.
 * Mengembalikan scan terakhir (sukses maupun gagal) beserta data siswa.
 */
export async function GET() {
  const [log, st] = await Promise.all([
    prisma.scanLog.findFirst({
      orderBy: { createdAt: 'desc' },
      include: { siswa: { include: { kelas: true } } },
    }),
    ambilSettings(),
  ]);

  if (!log) {
    return NextResponse.json({ ada: false, sekolah: st.nama_sekolah });
  }

  let absensi = null;
  if (log.siswaId && log.sukses) {
    absensi = await prisma.absensi.findUnique({
      where: { siswaId_tanggal: { siswaId: log.siswaId, tanggal: tanggalHariIni() } },
      select: { jamMasuk: true, jamPulang: true, status: true, menitTelat: true },
    });
  }

  return NextResponse.json({
    ada: true,
    sekolah: st.nama_sekolah,
    id: log.id,
    sukses: log.sukses,
    alasan: log.alasan,
    waktu: log.createdAt,
    siswa: log.siswa
      ? {
          nama: log.siswa.nama,
          nis: log.siswa.nis,
          nisn: log.siswa.nisn,
          kelas: log.siswa.kelas.nama,
          fotoUrl: log.siswa.fotoMime ? `/api/foto/${log.siswa.nis}` : log.siswa.fotoUrl,
        }
      : null,
    absensi: absensi
      ? {
          jamMasuk: absensi.jamMasuk?.toTimeString().slice(0, 5) ?? null,
          jamPulang: absensi.jamPulang?.toTimeString().slice(0, 5) ?? null,
          status: absensi.status,
          menitTelat: absensi.menitTelat,
        }
      : null,
  });
}
