// src/lib/researchTokens.repo.ts
import { prisma } from "@/lib/db";
import { generateTokenPair, hashToken, normalizeToken } from "@/lib/researchTokens";
import { BadgeCode, Prisma } from "@prisma/client";
import { AppError } from "@/lib/appError";

const VERIFIED_POINTS = 30;

// DTOs leves
export type GenerateVerifyTokensResult = {
  researchId: string;
  count: number;
  expiresAt?: Date;
  tokens: string[];
};

export type VerifiedCompletionResult = {
  id: string;
  type: "VERIFIED" | string;
  pointsAwarded: number;
  createdAt: Date;
};

export async function generateVerifyTokensForResearch(
  userId: string,
  researchId: string,
  count: number,
  opts?: { expiresInDays?: number }
): Promise<GenerateVerifyTokensResult> {
  const expiresInDays =
    opts?.expiresInDays != null && Number.isFinite(opts.expiresInDays)
      ? Math.floor(opts.expiresInDays)
      : undefined;

  const now = new Date();
  const expiresAt =
    expiresInDays && expiresInDays > 0
      ? new Date(now.getTime() + expiresInDays * 24 * 60 * 60 * 1000)
      : null;

  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const research = await tx.research.findUnique({
      where: { id: researchId },
      select: { id: true, groupId: true },
    });
    if (!research) throw new AppError("NOT_FOUND", 404);

    const membership = await tx.groupMember.findUnique({
      where: { userId_groupId: { userId, groupId: research.groupId } },
      select: { role: true },
    });

    if (!membership || membership.role !== "ADMIN") throw new AppError("FORBIDDEN", 403);

    const pairs = Array.from({ length: count }, () => generateTokenPair());

    await tx.researchVerifyToken.createMany({
      data: pairs.map((p) => ({
        researchId,
        tokenHash: p.tokenHash,
        expiresAt,
      })),
    });

    return {
      researchId,
      count,
      expiresAt: expiresAt ?? undefined,
      tokens: pairs.map((p) => p.token),
    };
  });
}

export async function verifyTokenAndCreateVerifiedCompletion(
  userId: string,
  researchId: string,
  tokenPlain: string
): Promise<VerifiedCompletionResult> {
  const token = normalizeToken(String(tokenPlain ?? ""));
  if (!token) throw new AppError("MISSING_TOKEN", 400);

  const tokenHash = hashToken(token);
  const now = new Date();

  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const row = await tx.researchVerifyToken.findUnique({
      where: { tokenHash },
      select: { id: true, researchId: true, usedAt: true, expiresAt: true },
    });

    if (!row) throw new AppError("TOKEN_INVALID", 400);
    if (row.researchId !== researchId) throw new AppError("TOKEN_INVALID", 400);

    if (row.expiresAt && row.expiresAt.getTime() < now.getTime()) {
      throw new AppError("TOKEN_EXPIRED", 400);
    }

    const consumed = await tx.researchVerifyToken.updateMany({
      where: { id: row.id, usedAt: null },
      data: { usedAt: now, usedByUserId: userId },
    });
    if (consumed.count !== 1) throw new AppError("TOKEN_USED", 409);

    try {
      // ✅ cria completion VERIFIED (ledger)
      const completion = await tx.completion.create({
        data: {
          userId,
          researchId,
          type: "VERIFIED",
          pointsAwarded: VERIFIED_POINTS,
        },
        select: { id: true, type: true, pointsAwarded: true, createdAt: true },
      });

      // ✅ Badge automático
      await tx.userBadge.upsert({
        where: { userId_code: { userId, code: BadgeCode.VERIFIED_1 } },
        update: {},
        create: { userId, code: BadgeCode.VERIFIED_1 },
      });

      // ❌ NÃO atualiza User.points aqui (pontos vêm do ledger)
      return completion;
    } catch (e: unknown) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        throw new AppError("ALREADY_COMPLETED", 409);
      }
      throw e;
    }
  });
}
