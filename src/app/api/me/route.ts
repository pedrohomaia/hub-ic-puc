export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import {
  getPointsSinceByUser,
  getPointsTotalByUser,
  startOfCurrentMonthUTC,
} from "@/lib/points.repo";

export async function GET() {
  const user = await getSessionUser();
  if (!user?.id) {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, email: true, name: true },
  });

  const total = await getPointsTotalByUser(user.id);
  const since = startOfCurrentMonthUTC();
  const month = await getPointsSinceByUser(user.id, since);

  const badges = await prisma.userBadge.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: { code: true, createdAt: true },
  });

  const completions = await prisma.completion.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 30,
    select: {
      createdAt: true,
      pointsAwarded: true,
      type: true,
      research: { select: { id: true, title: true } },
    },
  });

  return NextResponse.json({
    ok: true,
    user: dbUser,
    points: { total, month, since: since.toISOString() },
    badges,
    completions,
  });
}
