import { redirect } from 'next/navigation';
import { ambilSesi } from './auth';

/** Wajib login; kembalikan sesi atau lempar ke /masuk */
export async function wajibLogin() {
  const sesi = await ambilSesi();
  if (!sesi) redirect('/masuk');
  return sesi;
}

/** Wajib ADMIN */
export async function wajibAdmin() {
  const sesi = await wajibLogin();
  if (sesi.role !== 'ADMIN') redirect('/admin?ditolak=1');
  return sesi;
}
