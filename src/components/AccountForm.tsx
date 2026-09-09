'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, ShieldCheck, Loader2 } from 'lucide-react';

const inp='mt-1.5 w-full rounded-btn bg-white px-3 py-2 text-[13.5px] outline-none ring-1 ring-inset ring-ink-200 focus:ring-[1.5px] focus:ring-brand-500';

export function AccountForm({ user }: { user: { nama:string; email:string; username:string|null; totpEnabled:boolean } }) {
  const [f,setF]=useState({nama:user.nama,email:user.email,username:user.username||'',passwordLama:'',passwordBaru:''});
  const [busy,setBusy]=useState(false); const [msg,setMsg]=useState(''); const [err,setErr]=useState('');
  const [setup,setSetup]=useState<{secret:string;qr:string}|null>(null); const [kode,setKode]=useState('');
  const router=useRouter();
  async function profil(e:React.FormEvent){e.preventDefault();setBusy(true);setErr('');setMsg('');const r=await fetch('/api/admin/account',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(f)});const d=await r.json();setBusy(false);d.ok?setMsg(d.pesan):setErr(d.pesan);if(d.ok)router.refresh();}
  async function aksi2fa(aksi:string){setBusy(true);setErr('');const r=await fetch('/api/admin/account/2fa',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({aksi,kode})});const d=await r.json();setBusy(false);if(!d.ok){setErr(d.pesan);return;}if(d.qr)setSetup({secret:d.secret,qr:d.qr});else{setMsg(d.pesan);setSetup(null);router.refresh();}}
  return <div className="space-y-4">
    <form onSubmit={profil} className="rounded-card border border-ink-200 bg-white p-5 shadow-soft">
      <h2 className="text-[14px] font-semibold">Profil & Login</h2><div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="text-[12px]">Nama<input className={inp} value={f.nama} onChange={e=>setF({...f,nama:e.target.value})}/></label>
        <label className="text-[12px]">Username<input className={inp} value={f.username} onChange={e=>setF({...f,username:e.target.value})}/></label>
        <label className="text-[12px] sm:col-span-2">Email<input type="email" className={inp} value={f.email} onChange={e=>setF({...f,email:e.target.value})}/></label>
        <label className="text-[12px]">Password Lama<input type="password" className={inp} value={f.passwordLama} onChange={e=>setF({...f,passwordLama:e.target.value})}/></label>
        <label className="text-[12px]">Password Baru<input type="password" className={inp} placeholder="Minimal 12 karakter" value={f.passwordBaru} onChange={e=>setF({...f,passwordBaru:e.target.value})}/></label>
      </div><button disabled={busy} className="mt-4 inline-flex items-center gap-2 rounded-btn bg-brand-600 px-4 py-2 text-[13px] font-semibold text-white"><Save size={15}/>{busy?'Menyimpan…':'Simpan Akun'}</button>
    </form>
    <section className="rounded-card border border-ink-200 bg-white p-5 shadow-soft"><h2 className="text-[14px] font-semibold">Two-Factor Authentication</h2><p className="mt-1 text-[12px] text-ink-400">Gunakan Google Authenticator, Aegis, Authy, atau aplikasi TOTP lain.</p>
      {!setup && <button onClick={()=>aksi2fa(user.totpEnabled?'nonaktifkan':'setup')} disabled={busy} className="mt-3 inline-flex items-center gap-2 rounded-btn border border-ink-200 px-3 py-2 text-[13px] font-semibold"><ShieldCheck size={15}/>{user.totpEnabled?'Nonaktifkan 2FA':'Siapkan 2FA'}</button>}
      {(setup||user.totpEnabled) && <div className="mt-4">{setup&&<><img src={setup.qr} alt="QR setup 2FA" className="h-44 w-44"/><code className="mt-2 block break-all text-[11px] text-ink-500">{setup.secret}</code></>}<div className="mt-3 flex gap-2"><input className={inp+' mt-0 max-w-44'} inputMode="numeric" maxLength={6} placeholder="Kode 6 digit" value={kode} onChange={e=>setKode(e.target.value.replace(/\D/g,'').slice(0,6))}/><button onClick={()=>aksi2fa(setup?'aktifkan':'nonaktifkan')} disabled={busy||kode.length!==6} className="rounded-btn bg-brand-600 px-3 py-2 text-[13px] font-semibold text-white disabled:opacity-50">{busy?<Loader2 size={14} className="animate-spin"/>:setup?'Aktifkan':'Konfirmasi'}</button></div></div>}
    </section>{msg&&<p className="text-[12px] text-ok-700">{msg}</p>}{err&&<p className="text-[12px] text-bad-700">{err}</p>}
  </div>;
}
