// src/app/api/leaderboard/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { asErrorCode } from "@/lib/appError";

function startOfCurrentMonthUTC() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0));
}

// ✅ ISO week começa na segunda 00:00 UTC
function startOfISOWeekUTC(d: Date) {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0));
  const day = date.getUTCDay(); // 0..6 (Sun..Sat)
  const isoDay = day === 0 ? 7 : day; // Sun -> 7
  date.setUTCDate(date.getUTCDate() - (isoDay - 1)); // volta pra segunda
  return date;
}

type Period = "month" | "week" | "30d";

function parsePeriod(raw: string | null): Period | null {
  const p = (raw ?? "month").toLowerCase();
  if (p === "month") return "month";
  if (p === "week") return "week";
  if (p === "30d" || p === "30days") return "30d";
  return null;
}

function clampInt(v: string | null, def: number, min: number, max: number) {
  const n = Number(v);
  if (!Number.isFinite(n)) return def;
  const i = Math.floor(n);
  return Math.max(min, Math.min(max, i));
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);

    const period = parsePeriod(url.searchParams.get("period"));
    if (!period) {
      return NextResponse.json({ ok: false, error: "INVALID_PERIOD" }, { status: 400 });
    }

    // paginação
    const page = clampInt(url.searchParams.get("page"), 1, 1, 10000);
    const pageSize = clampInt(url.searchParams.get("pageSize"), 10, 5, 50);
    const offset = (page - 1) * pageSize;

    // since
    let since: Date;
    if (period === "week") since = startOfISOWeekUTC(new Date()); // ✅ mudou aqui
    else if (period === "30d") since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    else since = startOfCurrentMonthUTC();

    // usuário atual (para "minha posição") — opcional (testes não têm request scope)
    let meId: string | null = null;
    try {
      const me = await getSessionUser();
      meId = me?.id ?? null;
    } catch {
      meId = null;
    }

    /**
     * CTE: agrega por usuário dentro do período
     * - points = SUM(pointsAwarded)
     * - completions = COUNT(*)
     * - rank: usa janela, desempate estável por userId
     */
    const pageRows = await prisma.$queryRaw<
      Array<{
        rank: number;
        userId: string;
        points: number;
        completions: number;
        name: string | null;
        email: string | null;
      }>
    >`
      WITH agg AS (
        SELECT
          c."userId" as "userId",
          COALESCE(SUM(c."pointsAwarded"), 0)::int as "points",
          COUNT(*)::int as "completions"
        FROM "Completion" c
        WHERE c."createdAt" >= ${since}
        GROUP BY c."userId"
      ),
      ranked AS (
        SELECT
          rank() OVER (ORDER BY a."points" DESC, a."completions" DESC, a."userId" ASC)::int as "rank",
          a."userId",
          a."points",
          a."completions"
        FROM agg a
      )
      SELECT
        r."rank",
        r."userId",
        r."points",
        r."completions",
        u."name",
        u."email"
      FROM ranked r
      JOIN "User" u ON u."id" = r."userId"
      ORDER BY r."rank" ASC
      LIMIT ${pageSize} OFFSET ${offset};
    `;

    const totalUsersRow = await prisma.$queryRaw<Array<{ total: number }>>`
      WITH agg AS (
        SELECT c."userId"
        FROM "Completion" c
        WHERE c."createdAt" >= ${since}
        GROUP BY c."userId"
      )
      SELECT COUNT(*)::int as "total" FROM agg;
    `;

    const totalUsers = totalUsersRow[0]?.total ?? 0;

    const meRow = meId
      ? await prisma.$queryRaw<
          Array<{ rank: number; userId: string; points: number; completions: number; name: string | null; email: string | null }>
        >`
          WITH agg AS (
            SELECT
              c."userId" as "userId",
              COALESCE(SUM(c."pointsAwarded"), 0)::int as "points",
              COUNT(*)::int as "completions"
            FROM "Completion" c
            WHERE c."createdAt" >= ${since}
            GROUP BY c."userId"
          ),
          ranked AS (
            SELECT
              rank() OVER (ORDER BY a."points" DESC, a."completions" DESC, a."userId" ASC)::int as "rank",
              a."userId",
              a."points",
              a."completions"
            FROM agg a
          )
          SELECT
            r."rank",
            r."userId",
            r."points",
            r."completions",
            u."name",
            u."email"
          FROM ranked r
          JOIN "User" u ON u."id" = r."userId"
          WHERE r."userId" = ${meId}
          LIMIT 1;
        `
      : null;

    const meItem = meRow && meRow.length ? meRow[0] : null;

    return NextResponse.json(
      {
        ok: true,
        period,
        since: since.toISOString(),
        page,
        pageSize,
        totalUsers,
        items: pageRows,
        me: meItem,
      },
      { status: 200 }
    );
  } catch (err) {
    const { code, status } = asErrorCode(err);
    if (typeof status === "number") {
      return NextResponse.json({ ok: false, error: code }, { status });
    }
    console.error("[GET /api/leaderboard]", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
