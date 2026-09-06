import { wajibLogin } from '@/lib/guard';
import { Sidebar } from '@/components/Sidebar';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const sesi = await wajibLogin();
  return (
    <div className="flex min-h-screen flex-col lg:flex-row lg:items-start">
      <Sidebar nama={sesi.nama} role={sesi.role} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
