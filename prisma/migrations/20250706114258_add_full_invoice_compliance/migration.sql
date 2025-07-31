-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "issuerApeCode" TEXT,
ADD COLUMN     "issuerLegalStatus" TEXT,
ADD COLUMN     "issuerRcs" TEXT,
ADD COLUMN     "issuerShareCapital" TEXT,
ADD COLUMN     "latePenaltyRate" TEXT,
ADD COLUMN     "legalMentions" TEXT,
ADD COLUMN     "paymentTerms" TEXT,
ADD COLUMN     "recoveryIndemnity" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "address" TEXT,
ADD COLUMN     "apeCode" TEXT,
ADD COLUMN     "legalStatus" TEXT,
ADD COLUMN     "rcsNumber" TEXT,
ADD COLUMN     "shareCapital" TEXT;
