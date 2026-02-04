export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { asErrorCode, AppError } from "@/lib/appError";
import { prisma } from "@/lib/db";
import { getResearchById } from "@/lib/research.repo";
import { getUserGroupRole } from "@/lib/rbac";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id: researchId } = await ctx.params;
    if (!researchId) return NextResponse.json({ error: "MISSING_ID" }, { status: 400 });

    const user = await requireAuth();

    const research = await getResearchById(researchId);
    if (!research) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

    // ✅ Só membros podem ver stats (ADMIN vê tudo, MEMBER vê placeholder na UI)
    const role = await getUserGroupRole(user.id, research.groupId);
    if (role !== "ADMIN" && role !== "MEMBER") throw new AppError("FORBIDDEN", 403);

    const [completionsCount, verifiedCount, tokensUsedCount, tokensTotalCount] =
      await Promise.all([
        prisma.completion.count({ where: { researchId } }),
        prisma.completion.count({ where: { researchId, type: "VERIFIED" } }),
        prisma.researchVerifyToken.count({ where: { researchId, usedAt: { not: null } } }),
        prisma.researchVerifyToken.count({ where: { researchId } }),
      ]);

    return NextResponse.json(
      {
        ok: true,
        researchId,
        completionsCount,
        verifiedCount,
        tokensUsedCount,
        tokensTotalCount,
      },
      { status: 200 }
    );
  } catch (err) {
    const { code, status } = asErrorCode(err);

    if (typeof status === "number") {
      return NextResponse.json({ error: code }, { status });
    }

    console.error("[RESEARCH_STATS][GET] error:", err);
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
