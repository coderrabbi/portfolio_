ALTER TABLE "ContactMessage"
 ADD COLUMN "emailStatus" TEXT NOT NULL DEFAULT 'not_requested',
 ADD COLUMN "emailAttempts" INTEGER NOT NULL DEFAULT 0,
 ADD COLUMN "emailNextAttemptAt" TIMESTAMP(3),
 ADD COLUMN "emailProviderId" TEXT,
 ADD COLUMN "emailError" TEXT,
 ADD COLUMN "emailFirstAttemptAt" TIMESTAMP(3);
CREATE INDEX "ContactMessage_emailStatus_emailNextAttemptAt_idx" ON "ContactMessage"("emailStatus", "emailNextAttemptAt");
