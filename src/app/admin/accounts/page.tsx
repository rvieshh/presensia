import { UserCircle } from 'lucide-react';
import { wajibLogin } from '@/lib/guard';
import { prisma } from '@/lib/prisma';
import { AccountForm } from '@/components/AccountForm';

export const dynamic='force-dynamic';
export const metadata={title:'Accounts — Admin Presensia'};
export default async function AccountsPage(){const sesi=await wajibLogin();const user=await prisma.user.findUniqueOrThrow({where:{id:sesi.id}});return <main className="px-5 py-6 lg:px-8"><div className="flex items-center gap-2.5"><span className="grid h-9 w-9 place-items-center rounded-chip bg-brand-50 text-brand-600"><UserCircle size={19}/></span><div><h1 className="text-[22px] font-semibold tracking-tight">Accounts</h1><p className="text-[12.5px] text-ink-500">Profil, login, password, dan keamanan dua langkah.</p></div></div><div className="mt-5 max-w-2xl"><AccountForm user={{nama:user.nama,email:user.email,username:user.username,totpEnabled:user.totpEnabled}}/></div></main>}
