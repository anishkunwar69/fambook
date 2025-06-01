/*
  Warnings:

  - A unique constraint covering the columns `[externalId]` on the table `FamilyMember` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `externalId` to the `FamilyMember` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "FamilyMember" ADD COLUMN     "externalId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "FamilyMember_externalId_key" ON "FamilyMember"("externalId");
