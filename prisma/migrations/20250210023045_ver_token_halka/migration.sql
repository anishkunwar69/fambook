-- DropIndex
DROP INDEX "VerificationToken_identifier_token_idx";

-- CreateIndex
CREATE INDEX "VerificationToken_identifier_idx" ON "VerificationToken"("identifier");
