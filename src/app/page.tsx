import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { tanggalHariIni } from '@/lib/waktu';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const tanggal = tanggalHariIni();
  const [totalSiswa, hadir, telat] = await Promise.all([
    prisma.siswa.count({ where: { aktif: true } }),
    prisma.absensi.count({ where: { tanggal, status: 'HADIR' } }),
    prisma.absensi.count({ where: { tanggal, status: 'TERLAMBAT' } }),
  ]);

  const stat = [
    { label: 'Total Siswa', nilai: totalSiswa },
    { label: 'Hadir Hari Ini', nilai: hadir },
    { label: 'Terlambat', nilai: telat },
    { label: 'Belum Absen', nilai: Math.max(0, totalSiswa - hadir - telat) },
  ];

  return (
    <main style={{ minHeight: '100vh', padding: '3rem 1rem', maxWidth: 860, margin: '0 auto' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>Presensia</h1>
      <p style={{ color: 'var(--muted)', marginBottom: '2rem' }}>
        Absensi sekolah berbasis QR — kompatibel scanner keyboard-wedge.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '.8rem', marginBottom: '2rem' }}>
        {stat.map((s) => (
          <div key={s.label} className="card" style={{ padding: '1rem' }}>
            <p style={{ fontSize: '1.8rem', fontWeight: 700 }}>{s.nilai}</p>
            <p style={{ color: 'var(--muted)', fontSize: '.85rem' }}>{s.label}</p>
          </div>
        ))}
      </div>

      <nav style={{ display: 'flex', gap: '.7rem', flexWrap: 'wrap' }}>
        <Link href="/scan" className="btn btn-primary">Buka Stasiun Scan</Link>
        <Link href="/kartu" className="btn" style={{ border: '1px solid var(--line)' }}>Kartu QR Siswa</Link>
      </nav>
    </main>
  );
}
