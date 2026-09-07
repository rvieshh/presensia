import { NextRequest, NextResponse } from 'next/server';
import { ambilSesi } from '@/lib/auth';
import { hitungRekap, rentangValid } from '@/lib/rekap';
import { ambilSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';

const tgl = (d: Date) => d.toISOString().slice(0, 10);

/** Bungkus sel agar aman dibuka Excel (koma, kutip, dan NIS berawalan nol) */
function sel(v: string | number): string {
  const s = String(v);
  return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * GET /api/admin/rekap/csv?hari=30&kelas=XI RPL 1
 * Berkas CSV siap dibuka di Excel maupun Google Sheets.
 */
export async function GET(req: NextRequest) {
  const sesi = await ambilSesi();
  if (!sesi) return NextResponse.json({ ok: false, pesan: 'Tidak diizinkan' }, { status: 401 });

  const hari = rentangValid(Number(req.nextUrl.searchParams.get('hari')) || 30);
  const kelas = req.nextUrl.searchParams.get('kelas') || undefined;

  const [r, st] = await Promise.all([hitungRekap(hari, kelas), ambilSettings()]);

  const baris: string[] = [];
  baris.push(sel(`Rekap Kehadiran - ${st.nama_sekolah}`));
  baris.push(sel(`Periode: ${tgl(r.mulai)} sampai ${tgl(r.akhir)} (${hari} hari, ${r.hariEfektif} hari efektif)`));
  if (kelas) baris.push(sel(`Kelas: ${kelas}`));
  baris.push('');
  baris.push(['NIS', 'Nama', 'Kelas', 'Hadir', 'Terlambat', 'Izin', 'Sakit', 'Alpa',
    'Total Menit Telat', 'Hari Tercatat', 'Persen Kehadiran'].map(sel).join(','));

  for (const b of r.baris) {
    baris.push([
      b.nis, b.nama, b.kelas, b.hadir, b.terlambat, b.izin, b.sakit, b.alpa,
      b.totalMenitTelat, b.hariTercatat, `${b.persen}%`,
    ].map(sel).join(','));
  }

  // BOM agar Excel membaca UTF-8 dengan benar
  const isi = '\uFEFF' + baris.join('\r\n');
  const nama = `rekap-${hari}hari-${tgl(r.akhir)}${kelas ? '-' + kelas.replace(/\s+/g, '-') : ''}.csv`;

  return new NextResponse(isi, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${nama}"`,
    },
  });
}
