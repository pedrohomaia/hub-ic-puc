export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function startOfCurrentMonthUTC() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0));
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const period = (url.searchParams.get("period") ?? "month").toLowerCase();

    let since: Date;

    if (period === "week") {
      since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === "30d" || period === "30days") {
      since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    } else if (period === "month") {
      since = startOfCurrentMonthUTC();
    } else {
      return NextResponse.json({ ok: false, error: "INVALID_PERIOD" }, { status: 400 });
    }

    const grouped = await prisma.completion.groupBy({
      by: ["userId"],
      where: { createdAt: { gte: since } },
      _sum: { pointsAwarded: true },
      _count: { _all: true },
      orderBy: { _sum: { pointsAwarded: "desc" } },
      take: 50,
    });

    const userIds = grouped.map((g) => g.userId);

    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    const items = grouped.map((g, idx) => {
      const u = userMap.get(g.userId);
      return {
        rank: idx + 1,
        userId: g.userId,
        name: u?.name ?? "Sem nome",
        email: u?.email ?? "",
        points: g._sum.pointsAwarded ?? 0,
        completions: g._count._all,
      };
    });

    return NextResponse.json({
      ok: true,
      period,
      since: since.toISOString(),
      items,
    });
  } catch (err) {
    console.error("[GET /api/leaderboard]", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
