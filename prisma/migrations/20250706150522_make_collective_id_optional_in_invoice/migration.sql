-- DropForeignKey
ALTER TABLE "Invoice" DROP CONSTRAINT "Invoice_collectiveId_fkey";

-- AlterTable
ALTER TABLE "Invoice" ALTER COLUMN "collectiveId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_collectiveId_fkey" FOREIGN KEY ("collectiveId") REFERENCES "Collective"("id") ON DELETE SET NULL ON UPDATE CASCADE;
