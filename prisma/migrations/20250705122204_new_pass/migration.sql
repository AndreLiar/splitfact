/*
  Warnings:

  - A unique constraint covering the columns `[stripePaymentIntentId]` on the table `Invoice` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[stripePaymentIntentId]` on the table `SubInvoice` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[stripeAccountId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'paid', 'failed', 'refunded');

-- CreateEnum
CREATE TYPE "FiscalRegime" AS ENUM ('MicroBIC', 'BNC', 'SASU', 'EI', 'Other');

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'pending',
ADD COLUMN     "stripePaymentIntentId" TEXT;

-- AlterTable
ALTER TABLE "SubInvoice" ADD COLUMN     "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'pending',
ADD COLUMN     "stripePaymentIntentId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "fiscalRegime" "FiscalRegime",
ADD COLUMN     "password" TEXT,
ADD COLUMN     "siret" TEXT,
ADD COLUMN     "stripeAccountId" TEXT,
ADD COLUMN     "tvaNumber" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_stripePaymentIntentId_key" ON "Invoice"("stripePaymentIntentId");

-- CreateIndex
CREATE UNIQUE INDEX "SubInvoice_stripePaymentIntentId_key" ON "SubInvoice"("stripePaymentIntentId");

-- CreateIndex
CREATE UNIQUE INDEX "User_stripeAccountId_key" ON "User"("stripeAccountId");
