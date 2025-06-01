/*
  Warnings:

  - You are about to drop the column `occupation` on the `RootNode` table. All the data in the column will be lost.
  - Made the column `dateOfBirth` on table `RootNode` required. This step will fail if there are existing NULL values in that column.
  - Made the column `birthPlace` on table `RootNode` required. This step will fail if there are existing NULL values in that column.
  - Made the column `currentPlace` on table `RootNode` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "RootNode" DROP COLUMN "occupation",
ALTER COLUMN "dateOfBirth" SET NOT NULL,
ALTER COLUMN "birthPlace" SET NOT NULL,
ALTER COLUMN "currentPlace" SET NOT NULL;
