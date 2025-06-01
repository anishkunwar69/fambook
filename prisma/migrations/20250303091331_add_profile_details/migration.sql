-- CreateTable
CREATE TABLE "ProfileDetails" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "birthPlace" TEXT,
    "currentPlace" TEXT,
    "relationshipStatus" TEXT,
    "languages" JSONB,
    "education" JSONB,
    "work" JSONB,
    "interests" JSONB,
    "customFields" JSONB,
    "privacySettings" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfileDetails_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProfileDetails_userId_key" ON "ProfileDetails"("userId");

-- AddForeignKey
ALTER TABLE "ProfileDetails" ADD CONSTRAINT "ProfileDetails_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
