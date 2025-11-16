-- CreateTable
CREATE TABLE "PasswordChangeOTP" (
    "id" SERIAL NOT NULL,
    "otp" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "email" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordChangeOTP_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PasswordChangeOTP_email_idx" ON "PasswordChangeOTP"("email");

-- CreateIndex
CREATE INDEX "PasswordChangeOTP_otp_idx" ON "PasswordChangeOTP"("otp");

-- CreateIndex
CREATE INDEX "PasswordChangeOTP_userId_idx" ON "PasswordChangeOTP"("userId");
