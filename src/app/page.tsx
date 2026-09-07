import { prisma } from '@/lib/prisma';
import { ambilSettings } from '@/lib/settings';
import KioskClient from './KioskClient';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const [st, logo] = await Promise.all([
    ambilSettings(),
    prisma.aset.findUnique({ where: { key: 'logo' }, select: { updatedAt: true } }),
  ]);

  return (
    <KioskClient
      sekolah={st.nama_sekolah}
      manualAktif={(st.manual_input_aktif ?? 'true') === 'true'}
      logoUrl={logo ? `/api/aset/logo?v=${logo.updatedAt.getTime()}` : null}
    />
  );
}
