-- AlterTable
ALTER TABLE "siswa" ADD COLUMN     "fotoUrl" TEXT;

-- CreateTable
CREATE TABLE "jurusan" (
    "id" TEXT NOT NULL,
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,

    CONSTRAINT "jurusan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "jurusan_kode_key" ON "jurusan"("kode");
