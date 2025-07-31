/*
  Warnings:

  - Added the required column `issuerAddress` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `issuerName` to the `Invoice` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "issuerAddress" TEXT NOT NULL,
ADD COLUMN     "issuerName" TEXT NOT NULL,
ADD COLUMN     "issuerSiret" TEXT,
ADD COLUMN     "issuerTva" TEXT;
