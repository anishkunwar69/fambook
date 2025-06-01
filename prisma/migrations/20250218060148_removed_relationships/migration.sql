/*
  Warnings:

  - The values [RELATIONSHIP_REQUEST] on the enum `NotificationType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the `Relationship` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "NotificationType_new" AS ENUM ('NEW_POST', 'NEW_COMMENT', 'NEW_LIKE', 'JOIN_REQUEST', 'REQUEST_APPROVED', 'REQUEST_REJECTED', 'NEW_MEMBER', 'NEW_ALBUM', 'SPECIAL_DAY');
ALTER TABLE "Notification" ALTER COLUMN "type" TYPE "NotificationType_new" USING ("type"::text::"NotificationType_new");
ALTER TYPE "NotificationType" RENAME TO "NotificationType_old";
ALTER TYPE "NotificationType_new" RENAME TO "NotificationType";
DROP TYPE "NotificationType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "Relationship" DROP CONSTRAINT "Relationship_familyId_fkey";

-- DropForeignKey
ALTER TABLE "Relationship" DROP CONSTRAINT "Relationship_requesterId_fkey";

-- DropForeignKey
ALTER TABLE "Relationship" DROP CONSTRAINT "Relationship_responderId_fkey";

-- DropTable
DROP TABLE "Relationship";

-- DropEnum
DROP TYPE "RelationType";
