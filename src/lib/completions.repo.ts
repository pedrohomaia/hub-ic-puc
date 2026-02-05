// src/lib/completions.repo.ts
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { AppError } from "@/lib/appError";

const SIMPLE_POINTS = 10;

// bronze por quantidade total de completions (MVP)
function bronzeCodesFromCount(total: number) {
  const out: ("BRONZE_1" | "BRONZE_2" | "BRONZE_3")[] = [];
  if (total >= 1) out.push("BRONZE_1");
  if (total >= 5) out.push("BRONZE_2");
  if (total >= 15) out.push("BRONZE_3");
  return out;
}

export async function createCompletionSimple(userId: string, researchId: string) {
  // só permite completar se a research estiver visível no feed
  const research = await prisma.research.findUnique({
    where: { id: researchId },
    select: { id: true, isApproved: true, isHidden: true },
  });

  if (!research) throw new AppError("NOT_FOUND", 404);
  if (!research.isApproved || research.isHidden) throw new AppError("RESEARCH_NOT_VISIBLE", 403);

  try {
    // ✅ cria SIMPLE (pontos = ledger: Completion.pointsAwarded)
    await prisma.completion.create({
      data: {
        userId,
        researchId,
        type: "SIMPLE",
        pointsAwarded: SIMPLE_POINTS,
      },
    });
  } catch (e) {
    // @@unique([userId, researchId, type]) => já existe SIMPLE p/ esse user+research
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      throw new AppError("ALREADY_COMPLETED", 409);
    }
    throw e;
  }

  // pós: calcula total e aplica badges (MVP ok fora da transaction)
  const total = await prisma.completion.count({ where: { userId } });
  const codes = bronzeCodesFromCount(total);

  for (const code of codes) {
    await prisma.userBadge.upsert({
      where: { userId_code: { userId, code } },
      update: {},
      create: { userId, code },
    });
  }

  return { ok: true as const, totalCompletions: total };
}
