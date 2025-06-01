/*
  Warnings:

  - You are about to drop the column `creatorId` on the `Family` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Family" DROP CONSTRAINT "Family_creatorId_fkey";

-- AlterTable
ALTER TABLE "Family" DROP COLUMN "creatorId";
