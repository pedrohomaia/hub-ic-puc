// src/app/api/groups/[id]/stats/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { getUserGroupRole } from "@/lib/rbac";
import { asErrorCode, AppError } from "@/lib/appError";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id: groupId } = await ctx.params;
    if (!groupId) return NextResponse.json({ error: "MISSING_GROUP_ID" }, { status: 400 });

    const user = await requireAuth();

    const role = await getUserGroupRole(user.id, groupId);
    if (role !== "ADMIN" && role !== "MEMBER") {
      throw new AppError("FORBIDDEN_GROUP_MEMBER", 403);
    }

    // total de pesquisas do grupo
    const totalResearch = await prisma.research.count({
      where: { groupId, isHidden: false },
    });

    // completions do grupo
    const completions = await prisma.completion.findMany({
      where: { research: { groupId } },
      select: { type: true },
    });

    const simple = completions.filter((c) => c.type === "SIMPLE").length;
    const verified = completions.filter((c) => c.type === "VERIFIED").length;

    // ranking do grupo (top 5)
    const topUsers = await prisma.$queryRaw<
      Array<{ userId: string; points: number; name: string | null }>
    >`
      SELECT
        c."userId",
        SUM(c."pointsAwarded")::int as "points",
        u."name"
      FROM "Completion" c
      JOIN "Research" r ON r."id" = c."researchId"
      JOIN "User" u ON u."id" = c."userId"
      WHERE r."groupId" = ${groupId}
      GROUP BY c."userId", u."name"
      ORDER BY "points" DESC
      LIMIT 5;
    `;

    return NextResponse.json(
      {
        ok: true,
        totalResearch,
        completions: {
          total: completions.length,
          simple,
          verified,
        },
        topUsers,
      },
      { status: 200 }
    );
  } catch (err) {
    const { code, status } = asErrorCode(err);
    if (typeof status === "number") {
      return NextResponse.json({ error: code }, { status });
    }
    console.error("[GET /api/groups/:id/stats]", err);
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
