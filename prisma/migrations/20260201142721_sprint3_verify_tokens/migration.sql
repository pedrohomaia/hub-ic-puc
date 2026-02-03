-- AlterEnum
ALTER TYPE "BadgeCode" ADD VALUE 'VERIFIED_1';

-- CreateTable
CREATE TABLE "ResearchVerifyToken" (
    "id" TEXT NOT NULL,
    "researchId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usedAt" TIMESTAMP(3),
    "usedByUserId" TEXT,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "ResearchVerifyToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ResearchVerifyToken_tokenHash_key" ON "ResearchVerifyToken"("tokenHash");

-- CreateIndex
CREATE INDEX "ResearchVerifyToken_researchId_createdAt_idx" ON "ResearchVerifyToken"("researchId", "createdAt");

-- CreateIndex
CREATE INDEX "ResearchVerifyToken_researchId_usedAt_idx" ON "ResearchVerifyToken"("researchId", "usedAt");

-- AddForeignKey
ALTER TABLE "ResearchVerifyToken" ADD CONSTRAINT "ResearchVerifyToken_researchId_fkey" FOREIGN KEY ("researchId") REFERENCES "Research"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchVerifyToken" ADD CONSTRAINT "ResearchVerifyToken_usedByUserId_fkey" FOREIGN KEY ("usedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
