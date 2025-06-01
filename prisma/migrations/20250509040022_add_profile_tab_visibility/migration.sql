-- CreateEnum
CREATE TYPE "ProfileTabKey" AS ENUM ('OVERVIEW', 'MEMORIES', 'TIMELINE', 'DETAILS');

-- CreateEnum
CREATE TYPE "VisibilityType" AS ENUM ('EVERYONE', 'SPECIFIC_FAMILY');

-- DropIndex
DROP INDEX "Memory_userId_albumId_key";

-- DropIndex
DROP INDEX "Memory_userId_postId_key";

-- CreateTable
CREATE TABLE "ProfileTabVisibility" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tabKey" "ProfileTabKey" NOT NULL,
    "visibilityType" "VisibilityType" NOT NULL DEFAULT 'EVERYONE',
    "allowedFamilyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfileTabVisibility_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProfileTabVisibility_userId_tabKey_key" ON "ProfileTabVisibility"("userId", "tabKey");

-- AddForeignKey
ALTER TABLE "ProfileTabVisibility" ADD CONSTRAINT "ProfileTabVisibility_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
