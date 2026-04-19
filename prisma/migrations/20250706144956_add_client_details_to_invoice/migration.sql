/*
  Warnings:

  - You are about to drop the column `userId` on the `Invoice` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Invoice" DROP COLUMN "userId",
ADD COLUMN     "clientAddress" TEXT,
ADD COLUMN     "clientContactName" TEXT,
ADD COLUMN     "clientEmail" TEXT,
ADD COLUMN     "clientLegalStatus" TEXT,
ADD COLUMN     "clientName" TEXT,
ADD COLUMN     "clientPhone" TEXT,
ADD COLUMN     "clientShareCapital" TEXT,
ADD COLUMN     "clientSiret" TEXT,
ADD COLUMN     "clientTvaNumber" TEXT;
