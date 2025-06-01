/*
  Warnings:

  - The values [UNCLE_AUNT,OTHER] on the enum `RelationType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `userAId` on the `Relationship` table. All the data in the column will be lost.
  - You are about to drop the column `userBId` on the `Relationship` table. All the data in the column will be lost.
  - Added the required column `requesterId` to the `Relationship` table without a default value. This is not possible if the table is not empty.
  - Added the required column `responderId` to the `Relationship` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "RelationType_new" AS ENUM ('PARENT', 'CHILD', 'SIBLING', 'SPOUSE', 'GRANDPARENT', 'GRANDCHILD', 'COUSIN', 'NIECE_NEPHEW', 'AUNT_UNCLE');
ALTER TABLE "Relationship" ALTER COLUMN "type" TYPE "RelationType_new" USING ("type"::text::"RelationType_new");
ALTER TYPE "RelationType" RENAME TO "RelationType_old";
ALTER TYPE "RelationType_new" RENAME TO "RelationType";
DROP TYPE "RelationType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "Relationship" DROP CONSTRAINT "Relationship_userAId_fkey";

-- DropForeignKey
ALTER TABLE "Relationship" DROP CONSTRAINT "Relationship_userBId_fkey";

-- DropIndex
DROP INDEX "Relationship_userAId_userBId_familyId_key";

-- AlterTable
ALTER TABLE "Relationship" DROP COLUMN "userAId",
DROP COLUMN "userBId",
ADD COLUMN     "requesterId" TEXT NOT NULL,
ADD COLUMN     "responderId" TEXT NOT NULL,
ADD COLUMN     "status" "Status" NOT NULL DEFAULT 'PENDING';

-- RenameForeignKey
ALTER TABLE "FamilyMember" RENAME CONSTRAINT "FamilyMember_userId_fkey" TO "FamilyMember_userId_members_fkey";

-- AddForeignKey
ALTER TABLE "FamilyMember" ADD CONSTRAINT "FamilyMember_userId_families_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Relationship" ADD CONSTRAINT "Relationship_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Relationship" ADD CONSTRAINT "Relationship_responderId_fkey" FOREIGN KEY ("responderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
