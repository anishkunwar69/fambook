-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "RelationType" AS ENUM ('PARENT', 'CHILD', 'SPOUSE', 'SIBLING');

-- CreateTable
CREATE TABLE "FamilyRoot" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "familyId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FamilyRoot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RootNode" (
    "id" TEXT NOT NULL,
    "rootId" TEXT NOT NULL,
    "userId" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "dateOfDeath" TIMESTAMP(3),
    "gender" "Gender" NOT NULL,
    "isAlive" BOOLEAN NOT NULL DEFAULT true,
    "profileImage" TEXT,
    "occupation" TEXT,
    "birthPlace" TEXT,
    "currentPlace" TEXT,
    "biography" TEXT,
    "customFields" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RootNode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RootRelation" (
    "id" TEXT NOT NULL,
    "rootId" TEXT NOT NULL,
    "fromNodeId" TEXT NOT NULL,
    "toNodeId" TEXT NOT NULL,
    "relationType" "RelationType" NOT NULL,
    "marriageDate" TIMESTAMP(3),
    "divorceDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RootRelation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RootRelation_fromNodeId_toNodeId_relationType_key" ON "RootRelation"("fromNodeId", "toNodeId", "relationType");

-- AddForeignKey
ALTER TABLE "FamilyRoot" ADD CONSTRAINT "FamilyRoot_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyRoot" ADD CONSTRAINT "FamilyRoot_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RootNode" ADD CONSTRAINT "RootNode_rootId_fkey" FOREIGN KEY ("rootId") REFERENCES "FamilyRoot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RootNode" ADD CONSTRAINT "RootNode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RootRelation" ADD CONSTRAINT "RootRelation_rootId_fkey" FOREIGN KEY ("rootId") REFERENCES "FamilyRoot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RootRelation" ADD CONSTRAINT "RootRelation_fromNodeId_fkey" FOREIGN KEY ("fromNodeId") REFERENCES "RootNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RootRelation" ADD CONSTRAINT "RootRelation_toNodeId_fkey" FOREIGN KEY ("toNodeId") REFERENCES "RootNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
