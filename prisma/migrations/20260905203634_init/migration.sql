-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'GURU', 'OPERATOR');

-- CreateEnum
CREATE TYPE "StatusHadir" AS ENUM ('HADIR', 'TERLAMBAT', 'IZIN', 'SAKIT', 'ALPA');

-- CreateEnum
CREATE TYPE "TipeScan" AS ENUM ('MASUK', 'PULANG');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'OPERATOR',
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kelas" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "tingkat" TEXT NOT NULL,
    "jurusan" TEXT,
    "waliKelas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kelas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "siswa" (
    "id" TEXT NOT NULL,
    "nis" TEXT NOT NULL,
    "nisn" TEXT,
    "nama" TEXT NOT NULL,
    "kelasId" TEXT NOT NULL,
    "jenisKel" TEXT,
    "waOrtu" TEXT,
    "namaOrtu" TEXT,
    "qrToken" TEXT NOT NULL,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "siswa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "devices" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "lokasi" TEXT,
    "apiKey" TEXT NOT NULL,
    "tipe" "TipeScan" NOT NULL DEFAULT 'MASUK',
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "lastSeenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "absensi" (
    "id" TEXT NOT NULL,
    "siswaId" TEXT NOT NULL,
    "tanggal" DATE NOT NULL,
    "jamMasuk" TIMESTAMP(3),
    "jamPulang" TIMESTAMP(3),
    "status" "StatusHadir" NOT NULL DEFAULT 'ALPA',
    "menitTelat" INTEGER NOT NULL DEFAULT 0,
    "keterangan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "absensi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scan_logs" (
    "id" TEXT NOT NULL,
    "siswaId" TEXT,
    "deviceId" TEXT,
    "rawInput" TEXT NOT NULL,
    "sukses" BOOLEAN NOT NULL DEFAULT false,
    "alasan" TEXT,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scan_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wa_outbox" (
    "id" TEXT NOT NULL,
    "tujuan" TEXT NOT NULL,
    "pesan" TEXT NOT NULL,
    "terkirim" BOOLEAN NOT NULL DEFAULT false,
    "percobaan" INTEGER NOT NULL DEFAULT 0,
    "errorMsg" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wa_outbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "kelas_nama_key" ON "kelas"("nama");

-- CreateIndex
CREATE UNIQUE INDEX "siswa_nis_key" ON "siswa"("nis");

-- CreateIndex
CREATE UNIQUE INDEX "siswa_nisn_key" ON "siswa"("nisn");

-- CreateIndex
CREATE UNIQUE INDEX "siswa_qrToken_key" ON "siswa"("qrToken");

-- CreateIndex
CREATE INDEX "siswa_kelasId_idx" ON "siswa"("kelasId");

-- CreateIndex
CREATE INDEX "siswa_nis_idx" ON "siswa"("nis");

-- CreateIndex
CREATE UNIQUE INDEX "devices_apiKey_key" ON "devices"("apiKey");

-- CreateIndex
CREATE INDEX "absensi_tanggal_idx" ON "absensi"("tanggal");

-- CreateIndex
CREATE UNIQUE INDEX "absensi_siswaId_tanggal_key" ON "absensi"("siswaId", "tanggal");

-- CreateIndex
CREATE INDEX "scan_logs_createdAt_idx" ON "scan_logs"("createdAt");

-- CreateIndex
CREATE INDEX "wa_outbox_terkirim_idx" ON "wa_outbox"("terkirim");

-- AddForeignKey
ALTER TABLE "siswa" ADD CONSTRAINT "siswa_kelasId_fkey" FOREIGN KEY ("kelasId") REFERENCES "kelas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "absensi" ADD CONSTRAINT "absensi_siswaId_fkey" FOREIGN KEY ("siswaId") REFERENCES "siswa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scan_logs" ADD CONSTRAINT "scan_logs_siswaId_fkey" FOREIGN KEY ("siswaId") REFERENCES "siswa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scan_logs" ADD CONSTRAINT "scan_logs_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "devices"("id") ON DELETE SET NULL ON UPDATE CASCADE;
