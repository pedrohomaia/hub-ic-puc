/*
  Warnings:

  - A unique constraint covering the columns `[userId,researchId,type]` on the table `Completion` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Completion_userId_researchId_key";

-- CreateIndex
CREATE UNIQUE INDEX "Completion_userId_researchId_type_key" ON "Completion"("userId", "researchId", "type");
