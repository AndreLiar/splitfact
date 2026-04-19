-- CreateEnum
CREATE TYPE "WorkflowStatus" AS ENUM (
    'triggered',
    'collecting_data',
    'blocked',
    'ready_for_review',
    'ready_to_issue',
    'issued'
);

-- CreateEnum
CREATE TYPE "FacturxStatus" AS ENUM (
    'not_started',
    'generating',
    'generated',
    'validation_failed'
);

-- AlterTable
ALTER TABLE "Invoice"
ADD COLUMN "workflowStatus" "WorkflowStatus" NOT NULL DEFAULT 'triggered',
ADD COLUMN "issuedAt" TIMESTAMP(3),
ADD COLUMN "facturxPdfUrl" TEXT,
ADD COLUMN "facturxXmlUrl" TEXT,
ADD COLUMN "facturxStatus" "FacturxStatus" NOT NULL DEFAULT 'not_started',
ADD COLUMN "facturxGeneratedAt" TIMESTAMP(3),
ADD COLUMN "facturxValidationErrors" JSONB;
