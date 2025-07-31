-- CreateEnum
CREATE TYPE "MicroEntrepreneurType" AS ENUM ('COMMERCANT', 'PRESTATAIRE', 'LIBERAL');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "microEntrepreneurType" "MicroEntrepreneurType";
