/*
  Warnings:

  - You are about to drop the column `endDate` on the `WorkHistory` table. All the data in the column will be lost.
  - You are about to drop the column `startDate` on the `WorkHistory` table. All the data in the column will be lost.
  - Added the required column `startYear` to the `WorkHistory` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "WorkHistory" DROP COLUMN "endDate",
DROP COLUMN "startDate",
ADD COLUMN     "endYear" INTEGER,
ADD COLUMN     "startYear" INTEGER NOT NULL;
