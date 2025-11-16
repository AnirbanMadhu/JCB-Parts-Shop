-- AlterTable
ALTER TABLE "User" ADD COLUMN     "lastPasswordChange" TIMESTAMP(3),
ADD COLUMN     "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;
