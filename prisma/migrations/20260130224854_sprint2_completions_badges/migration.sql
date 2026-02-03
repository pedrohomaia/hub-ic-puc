-- CreateEnum
CREATE TYPE "CompletionType" AS ENUM ('SIMPLE', 'VERIFIED');

-- CreateEnum
CREATE TYPE "BadgeCode" AS ENUM ('BRONZE_1', 'BRONZE_2', 'BRONZE_3');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "points" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Completion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "researchId" TEXT NOT NULL,
    "type" "CompletionType" NOT NULL DEFAULT 'SIMPLE',
    "pointsAwarded" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Completion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserBadge" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "code" "BadgeCode" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserBadge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Completion_createdAt_idx" ON "Completion"("createdAt");

-- CreateIndex
CREATE INDEX "Completion_researchId_createdAt_idx" ON "Completion"("researchId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Completion_userId_researchId_key" ON "Completion"("userId", "researchId");

-- CreateIndex
CREATE INDEX "UserBadge_createdAt_idx" ON "UserBadge"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserBadge_userId_code_key" ON "UserBadge"("userId", "code");

-- AddForeignKey
ALTER TABLE "Completion" ADD CONSTRAINT "Completion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Completion" ADD CONSTRAINT "Completion_researchId_fkey" FOREIGN KEY ("researchId") REFERENCES "Research"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBadge" ADD CONSTRAINT "UserBadge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
