ALTER TABLE "users" ADD COLUMN "username" TEXT,
ADD COLUMN "totpEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "totpSecretEnc" TEXT,
ADD COLUMN "sessionVersion" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "lastLoginAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
