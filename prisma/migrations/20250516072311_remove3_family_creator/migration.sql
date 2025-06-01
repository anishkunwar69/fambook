/*
  Warnings:

  - You are about to drop the column `createdById` on the `Family` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Family" DROP CONSTRAINT "Family_createdById_fkey";

-- AlterTable
ALTER TABLE "Family" DROP COLUMN "createdById";
