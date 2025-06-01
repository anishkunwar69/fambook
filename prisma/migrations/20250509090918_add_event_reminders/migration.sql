/*
  Warnings:

  - You are about to drop the `ProfileTabVisibility` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[userId,albumId]` on the table `Memory` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,postId]` on the table `Memory` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "ReminderType" AS ENUM ('ONE_MONTH', 'ONE_WEEK', 'ONE_DAY');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'REMINDER';

-- DropForeignKey
ALTER TABLE "ProfileTabVisibility" DROP CONSTRAINT "ProfileTabVisibility_userId_fkey";

-- DropTable
DROP TABLE "ProfileTabVisibility";

-- DropEnum
DROP TYPE "ProfileTabKey";

-- DropEnum
DROP TYPE "VisibilityType";

-- CreateTable
CREATE TABLE "EventReminder" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "reminderType" "ReminderType" NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventReminder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EventReminder_eventId_reminderType_key" ON "EventReminder"("eventId", "reminderType");

-- CreateIndex
CREATE UNIQUE INDEX "Memory_userId_albumId_key" ON "Memory"("userId", "albumId");

-- CreateIndex
CREATE UNIQUE INDEX "Memory_userId_postId_key" ON "Memory"("userId", "postId");

-- AddForeignKey
ALTER TABLE "EventReminder" ADD CONSTRAINT "EventReminder_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "SpecialDay"("id") ON DELETE CASCADE ON UPDATE CASCADE;
