-- CreateTable
CREATE TABLE "CollectiveClient" (
    "id" TEXT NOT NULL,
    "collectiveId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,

    CONSTRAINT "CollectiveClient_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CollectiveClient_collectiveId_clientId_key" ON "CollectiveClient"("collectiveId", "clientId");

-- AddForeignKey
ALTER TABLE "CollectiveClient" ADD CONSTRAINT "CollectiveClient_collectiveId_fkey" FOREIGN KEY ("collectiveId") REFERENCES "Collective"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectiveClient" ADD CONSTRAINT "CollectiveClient_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
