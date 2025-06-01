/*
  Warnings:

  - The values [REMINDER] on the enum `NotificationType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the `EventReminder` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `createdById` to the `Family` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "NotificationType_new" AS ENUM ('NEW_POST', 'NEW_COMMENT', 'NEW_LIKE', 'JOIN_REQUEST', 'REQUEST_APPROVED', 'REQUEST_REJECTED', 'NEW_MEMBER', 'NEW_ALBUM', 'SPECIAL_DAY', 'NEW_ROOT');
ALTER TABLE "Notification" ALTER COLUMN "type" TYPE "NotificationType_new" USING ("type"::text::"NotificationType_new");
ALTER TYPE "NotificationType" RENAME TO "NotificationType_old";
ALTER TYPE "NotificationType_new" RENAME TO "NotificationType";
DROP TYPE "NotificationType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "EventReminder" DROP CONSTRAINT "EventReminder_eventId_fkey";

-- AlterTable
ALTER TABLE "Family" ADD COLUMN     "createdById" TEXT NOT NULL;

-- DropTable
DROP TABLE "EventReminder";

-- DropEnum
DROP TYPE "ReminderType";

-- AddForeignKey
ALTER TABLE "Family" ADD CONSTRAINT "Family_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
