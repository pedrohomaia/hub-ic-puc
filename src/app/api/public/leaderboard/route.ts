export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { asErrorCode } from "@/lib/appError";
import { rateLimit, rateHeaders } from "@/lib/rateLimit";

type Period = "month" | "week" | "30d";

function parsePeriod(raw: string | null): Period | null {
  const p = (raw ?? "week").toLowerCase();
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

function startOfCurrentMonthUTC() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0));
}

function startOfISOWeekUTC(d: Date) {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0));
  const day = date.getUTCDay();
  const isoDay = day === 0 ? 7 : day;
  date.setUTCDate(date.getUTCDate() - (isoDay - 1));
  return date;
}

function getClientIp(req: Request) {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  const xrip = req.headers.get("x-real-ip");
  if (xrip) return xrip.trim();
  return "unknown";
}

function safeName(name: string | null, userId: string) {
  if (!name || !name.trim()) return `Aluno ${userId.slice(-4)}`;
  const parts = name.trim().split(/\s+/);
  const first = parts[0];
  const lastInitial = parts.length > 1 ? parts[parts.length - 1][0]?.toUpperCase() : "";
  return lastInitial ? `${first} ${lastInitial}.` : first;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);

    const period = parsePeriod(url.searchParams.get("period"));
    if (!period) return NextResponse.json({ ok: false, error: "INVALID_PERIOD" }, { status: 400 });

    const page = clampInt(url.searchParams.get("page"), 1, 1, 10000);
    const pageSize = clampInt(url.searchParams.get("pageSize"), 10, 5, 50);
    const offset = (page - 1) * pageSize;

    // rate limit público (mais alto)
    const ip = getClientIp(req);
    const rl = rateLimit(`public-leaderboard:${ip}:${period}`, { windowMs: 60_000, max: 60 });

    const headers = rateHeaders(rl);

    if (!rl.ok) {
      return NextResponse.json({ ok: false, error: "RATE_LIMITED" }, { status: 429, headers });
    }

    // since
    let since: Date;
    if (period === "week") since = startOfISOWeekUTC(new Date());
    else if (period === "30d") since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    else since = startOfCurrentMonthUTC();

    const items = await prisma.$queryRaw<
      Array<{ rank: number; userId: string; points: number; completions: number; name: string | null }>
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
        u."name"
      FROM ranked r
      JOIN "User" u ON u."id" = r."userId"
      ORDER BY r."rank" ASC
      LIMIT ${pageSize} OFFSET ${offset};
    `;

    const safeItems = items.map((it) => ({
      rank: it.rank,
      userId: it.userId, // se você quiser ocultar depois, dá pra trocar por hash curto
      points: it.points,
      completions: it.completions,
      name: safeName(it.name, it.userId),
      top10: it.rank <= 10,
    }));

    return NextResponse.json(
      { ok: true, period, since: since.toISOString(), page, pageSize, items: safeItems },
      { status: 200, headers }
    );
  } catch (err) {
    const { code, status } = asErrorCode(err);
    if (typeof status === "number") return NextResponse.json({ ok: false, error: code }, { status });
    console.error("[GET /api/public/leaderboard]", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
