import QRCode from 'qrcode';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Kartu QR Siswa — Presensia' };

export default async function KartuPage() {
  const siswa = await prisma.siswa.findMany({
    where: { aktif: true },
    include: { kelas: true },
    orderBy: { nis: 'asc' },
    take: 60,
  });

  const kartu = await Promise.all(
    siswa.map(async (s) => ({
      nama: s.nama,
      nis: s.nis,
      kelas: s.kelas.nama,
      png: await QRCode.toDataURL(s.qrToken, { width: 220, margin: 1 }),
    }))
  );

  return (
    <main style={{ padding: '2rem 1rem', maxWidth: 980, margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '.3rem' }}>Kartu QR Siswa</h1>
      <p style={{ color: 'var(--muted)', fontSize: '.9rem', marginBottom: '1.5rem' }}>
        Cetak halaman ini (Ctrl+P), potong per kartu, tempel di kartu pelajar.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: '1rem' }}>
        {kartu.map((k) => (
          <div key={k.nis} className="card" style={{ padding: '.9rem', textAlign: 'center' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={k.png} alt={`QR ${k.nama}`} style={{ width: '100%', maxWidth: 160, margin: '0 auto' }} />
            <p style={{ fontWeight: 700, fontSize: '.9rem', marginTop: '.4rem' }}>{k.nama}</p>
            <p style={{ color: 'var(--muted)', fontSize: '.78rem' }}>{k.nis} · {k.kelas}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
