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

## Fitur

- Scan masuk dan pulang, deteksi otomatis berdasarkan jam
- Penentuan status: `HADIR`, `TERLAMBAT` (dengan hitungan menit), `IZIN`, `SAKIT`, `ALPA`
- Anti dobel-scan: satu siswa satu baris absensi per hari (`@@unique([siswaId, tanggal])`)
- Multi-device: tiap scanner punya `apiKey` dan peran `MASUK`/`PULANG`
- Audit trail lengkap di `scan_logs`
- Antrean notifikasi WhatsApp ke orang tua (pola outbox)
- Halaman cetak kartu QR massal

---

## Instalasi

```bash
git clone https://github.com/rvieshh/presensia.git
cd presensia
npm install

cp .env.example .env
# sesuaikan DATABASE_URL, JWT_SECRET, QR_SECRET

npx prisma migrate deploy
npm run seed

npm run dev     # http://localhost:3900
```

Akun contoh dari seed: `admin@presensia.test` / `admin123`

---

## Struktur

```
src/
  app/
    api/scan/route.ts        # endpoint scan (web + perangkat fisik)
    api/auth/login/route.ts  # login operator
    scan/                    # stasiun scan, input fokus otomatis
    kartu/                   # cetak kartu QR massal
  lib/
    qr.ts                    # generate & verifikasi HMAC
    scan.ts                  # logika absensi
    auth.ts                  # sesi JWT httpOnly
    waktu.ts                 # util jam & tanggal
scripts/
  cron-wa.ts                 # worker notifikasi WhatsApp
prisma/
  schema.prisma              # 8 model
  seed.ts
```

---

## API

### `POST /api/scan`

```bash
curl -X POST http://localhost:3900/api/scan \
  -H 'Content-Type: application/json' \
  -H 'x-api-key: dev-scanner-gerbang-utama' \
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
