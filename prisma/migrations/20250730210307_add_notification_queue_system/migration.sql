-- CreateEnum
CREATE TYPE "DeclarationFrequency" AS ENUM ('monthly', 'quarterly');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('URSSAF_REMINDER', 'TVA_THRESHOLD_WARNING', 'TVA_THRESHOLD_EXCEEDED', 'GENERAL');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "declarationFrequency" "DeclarationFrequency";

-- CreateTable
CREATE TABLE "CollectivePayout" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "status" "PayoutStatus" NOT NULL DEFAULT 'pending',
    "stripeTransferId" TEXT,
    "errorMessage" TEXT,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "CollectivePayout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "actionUrl" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationQueue" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "actionUrl" TEXT,
    "metadata" JSONB,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,
    "nextRetryAt" TIMESTAMP(3),
    "lastAttemptAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "notificationId" TEXT,

    CONSTRAINT "NotificationQueue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CollectivePayout_stripeTransferId_key" ON "CollectivePayout"("stripeTransferId");

-- CreateIndex
CREATE UNIQUE INDEX "CollectivePayout_invoiceId_userId_key" ON "CollectivePayout"("invoiceId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationQueue_notificationId_key" ON "NotificationQueue"("notificationId");

-- CreateIndex
CREATE INDEX "NotificationQueue_status_nextRetryAt_idx" ON "NotificationQueue"("status", "nextRetryAt");

-- CreateIndex
CREATE INDEX "NotificationQueue_userId_createdAt_idx" ON "NotificationQueue"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "CollectivePayout" ADD CONSTRAINT "CollectivePayout_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectivePayout" ADD CONSTRAINT "CollectivePayout_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationQueue" ADD CONSTRAINT "NotificationQueue_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationQueue" ADD CONSTRAINT "NotificationQueue_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "Notification"("id") ON DELETE SET NULL ON UPDATE CASCADE;
