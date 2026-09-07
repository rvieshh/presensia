import { Settings, Sun, Moon, CalendarClock, Building2, ScanLine, Palette } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { ambilSettings } from '@/lib/settings';
import { UnggahLogo } from '@/components/UnggahLogo';
import { FormPengaturan } from '@/components/FormPengaturan';
import { TemaSwitcher } from '@/components/TemaSwitcher';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Pengaturan — Admin Presensia' };

export default async function PengaturanPage() {
  const [st, logo] = await Promise.all([
    ambilSettings(),
    prisma.aset.findUnique({ where: { key: 'logo' }, select: { key: true } }),
  ]);

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

      <div className="mt-5 max-w-2xl space-y-5">
        <section>
          <div className="mb-2 flex items-center gap-2">
            <Building2 size={15} strokeWidth={2.2} className="text-ink-400" />
            <h2 className="text-[13.5px] font-semibold">Identitas Sekolah</h2>
          </div>
          <FormPengaturan
            awal={{ nama_sekolah: st.nama_sekolah }}
            bidang={[
              { key: 'nama_sekolah', label: 'Nama Sekolah', area: true, hint: 'Tampil di layar absensi, kartu QR, dan pesan WhatsApp' },
            ]}
          />

          <div className="mt-3">
            <UnggahLogo adaLogo={Boolean(logo)} sekolah={st.nama_sekolah} />
          </div>
        </section>

        <section>
          <div className="mb-2 flex items-center gap-2">
            <ScanLine size={15} strokeWidth={2.2} className="text-ink-400" />
            <h2 className="text-[13.5px] font-semibold">Metode Absensi</h2>
          </div>
          <FormPengaturan
            awal={{ manual_input_aktif: st.manual_input_aktif ?? 'true' }}
            bidang={[
              { key: 'manual_input_aktif', label: 'Input Manual Kode QR', tipe: 'toggle', hint: 'Matikan bila absensi wajib memakai alat pemindai' },
            ]}
            catatan="Saat dimatikan, kolom pengetikan kode hilang dari layar absensi sehingga siswa tidak dapat menitipkan kode kepada temannya. Pemindai tetap bekerja karena mengirim data seperti papan tikan, dan seluruh percobaan scan tetap terekam untuk pemantauan."
          />
        </section>

        <section>
          <div className="mb-2 flex items-center gap-2">
            <Palette size={15} strokeWidth={2.2} className="text-ink-400" />
            <h2 className="text-[13.5px] font-semibold">Tampilan</h2>
          </div>
          <div className="rounded-card border border-ink-200 bg-white p-5 shadow-soft">
            <p className="text-[12.5px] font-medium text-ink-700">Tema Panel Admin</p>
            <p className="mt-0.5 text-[11.5px] text-ink-400">
              Berlaku pada peramban ini saja, tidak memengaruhi pengguna lain.
            </p>
            <div className="mt-3">
              <TemaSwitcher />
            </div>
          </div>

          <div className="mt-3">
            <FormPengaturan
              awal={{ kiosk_tema: st.kiosk_tema ?? 'terang' }}
              bidang={[
                { key: 'kiosk_tema', label: 'Tema Layar Absensi', tipe: 'pilih', opsi: ['terang', 'gelap'], hint: 'Berlaku untuk semua perangkat di gerbang' },
              ]}
              catatan="Layar absensi sengaja tidak diberi tombol tema agar tampilannya bersih dan tidak bisa diubah orang yang lewat. Setelan ini yang menentukannya."
            />
          </div>
        </section>

        <section>
          <div className="mb-2 flex items-center gap-2">
            <Sun size={15} strokeWidth={2.2} className="text-ink-400" />
            <h2 className="text-[13.5px] font-semibold">Sesi Pagi</h2>
          </div>
          <FormPengaturan
            awal={{
              jam_masuk: st.jam_masuk,
              jam_telat: st.jam_telat,
              jam_pulang: st.jam_pulang,
            }}
            bidang={[
              { key: 'jam_masuk', label: 'Jam Masuk', tipe: 'time' },
              { key: 'jam_telat', label: 'Batas Terlambat', tipe: 'time', hint: 'Scan setelah jam ini dihitung terlambat' },
              { key: 'jam_pulang', label: 'Jam Pulang', tipe: 'time', hint: 'Scan setelah jam ini dianggap absen pulang' },
            ]}
          />
        </section>

        <section>
          <div className="mb-2 flex items-center gap-2">
            <Moon size={15} strokeWidth={2.2} className="text-ink-400" />
            <h2 className="text-[13.5px] font-semibold">Sesi Siang</h2>
            <span className="rounded-chip bg-ink-100 px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide text-ink-500">
              Lanjutan
            </span>
          </div>
          <FormPengaturan
            awal={{
              sesi_siang_aktif: st.sesi_siang_aktif ?? 'false',
              sesi_siang_masuk: st.sesi_siang_masuk ?? '12:50',
              sesi_siang_telat: st.sesi_siang_telat ?? '13:05',
              sesi_siang_pulang: st.sesi_siang_pulang ?? '17:30',
            }}
            bidang={[
              { key: 'sesi_siang_aktif', label: 'Sesi Siang', tipe: 'toggle', hint: 'Nyalakan bila sekolah punya rombongan belajar siang' },
              { key: 'sesi_siang_masuk', label: 'Jam Masuk Siang', tipe: 'time' },
              { key: 'sesi_siang_telat', label: 'Batas Terlambat Siang', tipe: 'time' },
              { key: 'sesi_siang_pulang', label: 'Jam Pulang Siang', tipe: 'time' },
            ]}
            catatan="Siswa yang scan mendekati jam masuk siang otomatis dinilai memakai jadwal siang, tanpa perlu perangkat atau kartu terpisah."
          />
        </section>

        <section>
          <div className="mb-2 flex items-center gap-2">
            <CalendarClock size={15} strokeWidth={2.2} className="text-ink-400" />
            <h2 className="text-[13.5px] font-semibold">Dispensasi Salat Jumat</h2>
            <span className="rounded-chip bg-ink-100 px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide text-ink-500">
              Lanjutan
            </span>
          </div>
          <FormPengaturan
            awal={{
              jumat_dispensasi_aktif: st.jumat_dispensasi_aktif ?? 'false',
              jumat_batas_masuk: st.jumat_batas_masuk ?? '13:30',
            }}
            bidang={[
              { key: 'jumat_dispensasi_aktif', label: 'Dispensasi Jumat', tipe: 'toggle', hint: 'Hanya berlaku hari Jumat, sesi siang, siswa beragama Islam' },
              { key: 'jumat_batas_masuk', label: 'Batas Datang Jumat', tipe: 'time', hint: 'Datang sampai jam ini tidak dihitung terlambat' },
            ]}
            catatan="Siswa muslim umumnya baru selesai salat Jumat sekitar pukul 13.00-13.30. Tanpa pengaturan ini mereka tercatat terlambat setiap pekan. Aturan tidak berlaku bagi siswa beragama lain, dan tidak berlaku di hari selain Jumat - keterlambatan di hari biasa tetap tercatat sebagaimana mestinya."
          />
        </section>
      </div>
    </main>
  );
}
