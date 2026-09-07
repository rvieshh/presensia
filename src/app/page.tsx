import { ambilSettings } from '@/lib/settings';
import KioskClient from './KioskClient';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const st = await ambilSettings();
  return (
    <KioskClient
      sekolah={st.nama_sekolah}
      manualAktif={(st.manual_input_aktif ?? 'true') === 'true'}
    />
  );
}
