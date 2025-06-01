/*
  Warnings:

  - You are about to drop the column `mediaId` on the `Comment` table. All the data in the column will be lost.
  - You are about to drop the column `caption` on the `Media` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_mediaId_fkey";

-- AlterTable
ALTER TABLE "Comment" DROP COLUMN "mediaId";

-- AlterTable
ALTER TABLE "Media" DROP COLUMN "caption";
