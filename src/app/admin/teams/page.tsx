import { UsersRound } from 'lucide-react';
import { wajibAdmin } from '@/lib/guard';
import { prisma } from '@/lib/prisma';
import { TeamsClient } from '@/components/TeamsClient';

export const dynamic='force-dynamic';
export const metadata={title:'Teams — Admin Presensia'};
export default async function TeamsPage(){const sesi=await wajibAdmin();const users=await prisma.user.findMany({orderBy:{createdAt:'asc'},select:{id:true,nama:true,email:true,username:true,aktif:true,totpEnabled:true,lastLoginAt:true}});return <main className="px-5 py-6 lg:px-8"><div className="flex items-center gap-2.5"><span className="grid h-9 w-9 place-items-center rounded-chip bg-brand-50 text-brand-600"><UsersRound size={19}/></span><div><h1 className="text-[22px] font-semibold tracking-tight">Teams</h1><p className="text-[12.5px] text-ink-500">Buat dan kelola akun administrator lain.</p></div></div><div className="mt-5 max-w-3xl"><TeamsClient currentId={sesi.id} teams={users.map(u=>({...u,lastLoginAt:u.lastLoginAt?.toISOString()||null}))}/></div></main>}
