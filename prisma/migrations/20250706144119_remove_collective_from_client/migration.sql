/*
  Warnings:

  - You are about to drop the column `collectiveId` on the `Client` table. All the data in the column will be lost.
  - Added the required column `userId` to the `Client` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Client" DROP CONSTRAINT "Client_collectiveId_fkey";

-- AlterTable
ALTER TABLE "Client" DROP COLUMN "collectiveId",
ADD COLUMN     "userId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
