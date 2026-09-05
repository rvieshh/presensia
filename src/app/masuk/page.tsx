import { redirect } from 'next/navigation';
import { ambilSesi } from '@/lib/auth';
import MasukClient from './MasukClient';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Masuk — Presensia' };

export default async function MasukPage() {
  const sesi = await ambilSesi();
  if (sesi) redirect('/admin');
  return <MasukClient />;
}
