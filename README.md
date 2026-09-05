# Presensia

Sistem absensi sekolah berbasis QR code, dirancang agar kompatibel dengan
**scanner barcode USB murah** tanpa driver tambahan.

Dibangun dengan Next.js 15 (App Router), Prisma, dan PostgreSQL.

---

## Kenapa scanner apa pun bisa dipakai

Scanner QR USB bekerja sebagai **keyboard wedge**: perangkat ini mengemulasi
keyboard, "mengetikkan" isi QR sebagai keystroke lalu menekan Enter.

```
Scanner baca QR  ->  ketik "PRS1.2024001.qP9J8MGa.hldc..."  ->  Enter
```

Konsekuensinya aplikasi cukup menyediakan satu input yang selalu fokus.
Tidak ada driver, tidak ada SDK, tidak ada konfigurasi vendor.

### Rekomendasi perangkat

Wajib **2D imager** — scanner laser 1D (garis merah) tidak bisa membaca QR.

| Model | Kisaran harga | Catatan |
|---|---|---|
| Symcode MJ-2877 | Rp 250–350 rb | Paling ekonomis, mudah didapat |
| Netum NT-1228BC | Rp 400–550 rb | Tersedia varian wireless 2.4G |
| Zebra DS2208 | Rp 1,2–1,8 jt | Kelas industri, tahan lama |
| Honeywell Voyager 1450g | Rp 1,5 jt+ | Standar korporat |

Alternatif tanpa membeli perangkat:

- **Kamera HP** — buka `/scan` di browser ponsel
- **ESP32-CAM** (~Rp 80 rb) — POST langsung ke `/api/scan` dengan header `x-api-key`

---

## Keamanan QR

Setiap kartu memuat token bertanda tangan **HMAC-SHA256**:

```
PRS1.<nis>.<nonce>.<signature>
```

- Tanda tangan diverifikasi dengan `timingSafeEqual` (anti timing attack)
- Token disimpan utuh di basis data; mengganti `qrToken` siswa otomatis
  membatalkan kartu lama (berguna saat kartu hilang)
- Nonce acak 6 byte membuat dua siswa dengan NIS berurutan tidak
  menghasilkan pola token yang bisa ditebak
- Semua percobaan scan dicatat di tabel `scan_logs`, termasuk yang gagal

Memalsukan kartu berarti harus menebak `QR_SECRET` di server.

---

## Arsitektur

Aplikasi terbagi dua wilayah dengan tujuan berbeda:

**Layar Absensi (`/`)** — publik, tanpa login. Dipasang di layar dekat gerbang.
Hanya menampilkan foto siswa, status scan, dan data kehadiran. Tidak ada
statistik atau menu yang bisa disalahgunakan. Layar menyegarkan sendiri lewat
polling, sehingga scan dari perangkat lain (scanner fisik, ESP32) tetap muncul.

**Panel Admin (`/admin`)** — wajib login, dijaga guard sesi JWT.
Berisi statistik, data siswa, kartu QR, dan pengaturan.

## Fitur

Layar absensi:

- Jam dan tanggal berjalan
- Indikator kesiapan scanner
- Foto siswa, nama, NIS, kelas, waktu datang, waktu pulang
- Status besar: hadir, terlambat beserta menitnya, atau alasan penolakan

Panel admin:

- Statistik kehadiran harian dan progres kelas
- Tambah siswa satu per satu; QR dibuat otomatis saat disimpan
- Impor massal CSV dengan pelaporan galat per baris
- Unduh seluruh QR sebagai ZIP, nama berkas mengikuti NIS, dikelompokkan per kelas
- Cetak kartu QR langsung dari peramban
- Pengaturan integrasi WhatsApp beserta monitor antrean
- Pengaturan jam masuk, batas terlambat, dan jam pulang

Mesin absensi:

- Deteksi otomatis scan masuk atau pulang
- Anti dobel-scan lewat `@@unique([siswaId, tanggal])`
- Multi-perangkat dengan `apiKey` dan peran `MASUK`/`PULANG`
- Audit trail seluruh percobaan scan di `scan_logs`

## Impor CSV

```csv
nis,nama,kelas,wa_ortu,foto_url
2025001,Putu Ariana Dewi,X RPL 1,081234567001,
2025002,"Ni Made Ayu, S.",X RPL 2,081234567002,
```

Tiga kolom pertama wajib. Pemisah koma atau titik koma, nama bertanda kutip
aman. Nomor `08…` dinormalkan ke `62…` otomatis. NIS ganda dilewati, bukan
menggagalkan seluruh berkas; setiap baris bermasalah dilaporkan nomornya.

## Unduh QR massal

`GET /api/admin/kartu/zip` menghasilkan:

```
XI RPL 1/2024001.png     600x600 px
XI RPL 1/2024002.png
X RPL 2/2025003.png
daftar.csv               indeks nis -> berkas
```

Tambahkan `?kelas=XI RPL 1` untuk membatasi satu kelas.

## Struktur

```
src/
  app/
    page.tsx                 # layar absensi (publik)
    KioskClient.tsx
    masuk/                   # halaman login
    admin/
      page.tsx               # dasbor statistik
      siswa/                 # data siswa + impor CSV
      kartu/                 # cetak & unduh QR
      whatsapp/              # integrasi + antrean
      pengaturan/            # jam sekolah
    api/
      scan/                  # endpoint scan
      kiosk/terakhir/        # polling layar absensi
      admin/siswa/           # tambah siswa
      admin/siswa/impor/     # impor CSV
      admin/kartu/zip/       # unduh QR massal
      admin/pengaturan/      # simpan setelan
      auth/login, auth/keluar
  components/                # Sidebar, StatCard, SiswaAksi, FormPengaturan
  lib/                       # qr, scan, auth, guard, settings, waktu
scripts/cron-wa.ts           # worker notifikasi WhatsApp
prisma/schema.prisma         # 9 model
```

## API

### `POST /api/scan`

```bash
curl -X POST http://localhost:3900/api/scan \
  -H 'Content-Type: application/json' \
  -H 'x-api-key: dev-sc...ama' \
  -d '{"qr":"PRS1.2024001.qP9J8MGa.hldcA5sWNcr-GpFt"}'
```

Header `x-api-key` bersifat opsional. Bila diisi, peran perangkat
(`MASUK`/`PULANG`) menentukan jenis scan; bila kosong, sistem menebak
dari jam dan riwayat absensi hari itu.

Respons sukses:

```json
{
  "ok": true,
  "pesan": "Absen masuk tercatat",
  "siswa": { "nama": "Randika Putra", "nis": "2024001", "kelas": "XI RPL 1" },
  "jam": "07:02",
  "tipe": "MASUK",
  "status": "HADIR"
}
```

Respons gagal memakai status HTTP `422` dengan alasan yang bisa ditampilkan
langsung ke operator, misalnya `Tanda tangan QR tidak valid`,
`Sudah absen masuk jam 07:02`, atau `Kartu sudah tidak berlaku, minta cetak ulang`.

---

## Notifikasi WhatsApp

Mengikuti pola `cron_wa.php` yang lazim pada sistem absensi sekolah:
proses scan hanya menulis ke tabel antrean `wa_outbox`, pengiriman
dilakukan worker terpisah agar scan tetap cepat.

```bash
# tiap 2 menit
*/2 * * * * cd /path/presensia && npx tsx scripts/cron-wa.ts >> /var/log/presensia-wa.log 2>&1
```

Tanpa `WA_GATEWAY_URL`, worker berjalan dalam mode dry-run dan hanya
mencetak antrean. Kompatibel dengan gateway berbasis Baileys, Fonnte,
atau Wablas.

---

## Lisensi

MIT
