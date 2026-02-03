// src/app/api/research/[id]/tokens/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { generateVerifyTokensForResearch } from "@/lib/researchTokens.repo";

type TokensBody = {
  count?: unknown;
  expiresInDays?: unknown;
};

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id: researchId } = await ctx.params;

    if (!researchId) {
      return NextResponse.json({ error: "MISSING_RESEARCH_ID" }, { status: 400 });
    }

    const user = await requireAuth();

    const body: unknown = await req.json().catch(() => ({} as unknown));
    const obj = (typeof body === "object" && body !== null ? body : {}) as TokensBody;

    const count = Number(obj.count ?? 0);

    const expiresInDaysRaw = obj.expiresInDays;
    const expiresInDays =
      expiresInDaysRaw == null ? undefined : Number(expiresInDaysRaw);

    if (!Number.isFinite(count) || count < 1 || count > 500) {
      return NextResponse.json(
        { error: "INVALID_COUNT", hint: "count must be between 1 and 500" },
        { status: 400 }
      );
    }

    if (
      expiresInDays !== undefined &&
      (!Number.isFinite(expiresInDays) || expiresInDays < 1 || expiresInDays > 365)
    ) {
      return NextResponse.json(
        { error: "INVALID_EXPIRES_IN_DAYS", hint: "expiresInDays must be 1..365" },
        { status: 400 }
      );
    }

    const result = await generateVerifyTokensForResearch(user.id, researchId, count, {
      expiresInDays,
    });

    return NextResponse.json(
      {
        ok: true,
        researchId: result.researchId,
        count: result.count,
        expiresAt: result.expiresAt ?? null,
        tokens: result.tokens, // ⚠️ retorna tokens puros UMA vez
      },
      { status: 200 }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err ?? "");

    if (msg === "UNAUTHENTICATED") {
      return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
    }

    if (msg === "FORBIDDEN" || msg.includes("FORBIDDEN")) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    if (msg === "NOT_FOUND") {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }

    if (msg === "INVALID_COUNT") {
      return NextResponse.json({ error: "INVALID_COUNT" }, { status: 400 });
    }

    console.error("[TOKENS][POST] error:", err);
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
