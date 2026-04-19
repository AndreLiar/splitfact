-- CreateTable
CREATE TABLE "UrssafReport" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reportData" JSONB NOT NULL,
    "periodStartDate" TIMESTAMP(3) NOT NULL,
    "periodEndDate" TIMESTAMP(3) NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isAutomatic" BOOLEAN NOT NULL DEFAULT false,
    "paidInvoicesDisclaimer" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UrssafReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UrssafReport_userId_periodStartDate_periodEndDate_key" ON "UrssafReport"("userId", "periodStartDate", "periodEndDate");

-- AddForeignKey
ALTER TABLE "UrssafReport" ADD CONSTRAINT "UrssafReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
