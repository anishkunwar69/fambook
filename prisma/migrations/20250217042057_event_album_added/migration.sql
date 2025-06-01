-- AlterTable
ALTER TABLE "Album" ADD COLUMN     "eventId" TEXT;

-- AddForeignKey
ALTER TABLE "Album" ADD CONSTRAINT "Album_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "SpecialDay"("id") ON DELETE SET NULL ON UPDATE CASCADE;
