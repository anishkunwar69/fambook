/*
  Warnings:

  - You are about to drop the `LifeEvent` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_EventMedia` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "LifeEvent" DROP CONSTRAINT "LifeEvent_userId_fkey";

-- DropForeignKey
ALTER TABLE "_EventMedia" DROP CONSTRAINT "_EventMedia_A_fkey";

-- DropForeignKey
ALTER TABLE "_EventMedia" DROP CONSTRAINT "_EventMedia_B_fkey";

-- DropTable
DROP TABLE "LifeEvent";

-- DropTable
DROP TABLE "_EventMedia";
