import { Settings } from 'lucide-react';
import { ambilSettings } from '@/lib/settings';
import { FormPengaturan } from '@/components/FormPengaturan';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Pengaturan — Admin Presensia' };

export default async function PengaturanPage() {
  const st = await ambilSettings();

  return (
    <main className="px-5 py-6 lg:px-8">
      <div className="flex items-center gap-2.5">
        <span className="grid h-9 w-9 place-items-center rounded-chip bg-brand-50 text-brand-600">
          <Settings size={19} strokeWidth={2.2} />
        </span>
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight">Pengaturan</h1>
          <p className="text-[12.5px] text-ink-500">Identitas sekolah dan jam operasional absensi</p>
        </div>
      </div>

      <div className="mt-5 max-w-2xl">
        <FormPengaturan
          awal={{
            nama_sekolah: st.nama_sekolah,
            jam_masuk: st.jam_masuk,
            jam_telat: st.jam_telat,
            jam_pulang: st.jam_pulang,
          }}
          bidang={[
            { key: 'nama_sekolah', label: 'Nama Sekolah', area: true, hint: 'Tampil di layar absensi dan pesan WhatsApp' },
            { key: 'jam_masuk', label: 'Jam Masuk', tipe: 'time' },
            { key: 'jam_telat', label: 'Batas Terlambat', tipe: 'time', hint: 'Scan setelah jam ini dihitung terlambat' },
            { key: 'jam_pulang', label: 'Jam Pulang', tipe: 'time', hint: 'Scan setelah jam ini dianggap absen pulang' },
          ]}
          catatan="Perubahan langsung berlaku pada scan berikutnya tanpa perlu memuat ulang layar absensi."
        />
      </div>
    </main>
  );
}
