-- CreateTable
CREATE TABLE "aset" (
    "key" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "mime" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "aset_pkey" PRIMARY KEY ("key")
);
