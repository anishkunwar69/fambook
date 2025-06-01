/*
  Warnings:

  - You are about to drop the column `externalId` on the `FamilyMember` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "FamilyMember_externalId_key";

-- AlterTable
ALTER TABLE "FamilyMember" DROP COLUMN "externalId";
