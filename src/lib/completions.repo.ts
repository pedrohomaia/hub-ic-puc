// src/lib/completions.repo.ts
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

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

  if (!research) throw new Error("NOT_FOUND");
  if (!research.isApproved || research.isHidden) throw new Error("RESEARCH_NOT_VISIBLE");

  try {
    // ✅ cria SIMPLE + soma pontos atomicamente
    await prisma.$transaction([
      prisma.completion.create({
        data: {
          userId,
          researchId,
          type: "SIMPLE",
          pointsAwarded: SIMPLE_POINTS,
        },
      }),
      prisma.user.update({
        where: { id: userId },
        data: { points: { increment: SIMPLE_POINTS } },
      }),
    ]);
  } catch (e: any) {
    // ✅ agora o unique é @@unique([userId, researchId, type])
    // então isso significa: "já existe SIMPLE pra esse user+research"
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      throw new Error("ALREADY_COMPLETED");
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
