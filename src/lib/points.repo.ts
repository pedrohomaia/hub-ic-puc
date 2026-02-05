// src/lib/points.repo.ts
import { prisma } from "@/lib/db";

export function startOfCurrentMonthUTC() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0));
}

export async function getPointsTotalByUser(userId: string) {
  const agg = await prisma.completion.aggregate({
    where: { userId },
    _sum: { pointsAwarded: true },
    _count: { id: true },
  });

  return {
    points: agg._sum.pointsAwarded ?? 0,
    completions: agg._count.id ?? 0,
  };
}

export async function getPointsSinceByUser(userId: string, since: Date) {
  const agg = await prisma.completion.aggregate({
    where: { userId, createdAt: { gte: since } },
    _sum: { pointsAwarded: true },
    _count: { id: true },
  });

  return {
    points: agg._sum.pointsAwarded ?? 0,
    completions: agg._count.id ?? 0,
  };
}
