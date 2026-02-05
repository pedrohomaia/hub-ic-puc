// src/app/api/research/[id]/verify/route.ts
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { verifyTokenAndCreateVerifiedCompletion } from "@/lib/researchTokens.repo";
import { asErrorCode } from "@/lib/appError";

type VerifyBody = { token?: unknown };

function pickToken(req: Request, body: VerifyBody) {
  if (typeof body.token === "string") return body.token;

  const url = new URL(req.url);
  const q = url.searchParams.get("token");
  if (q) return q;

  const h = req.headers.get("x-verification-token");
  if (h) return h;

  return "";
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const startedAt = Date.now();

  try {
    const { id: researchId } = await ctx.params;
    if (!researchId) {
      return NextResponse.json({ error: "MISSING_RESEARCH_ID" }, { status: 400 });
    }

    const user = await requireAuth();

    const rawBody: unknown = await req.json().catch(() => ({} as unknown));
    const body = (typeof rawBody === "object" && rawBody !== null ? rawBody : {}) as VerifyBody;

    const tokenRaw = pickToken(req, body);
    const token = typeof tokenRaw === "string" ? tokenRaw.trim() : "";

    if (!token) {
      logger.warn("VERIFY", "token missing", { researchId, userId: user.id });
      return NextResponse.json({ error: "TOKEN_REQUIRED" }, { status: 400 });
    }

    const completion = await verifyTokenAndCreateVerifiedCompletion(user.id, researchId, token);

    logger.info("VERIFY", "ok", {
      researchId,
      userId: user.id,
      ms: Date.now() - startedAt,
    });

    return NextResponse.json({ ok: true, completion }, { status: 200 });
  } catch (err) {
    const { code, status } = asErrorCode(err);

    // ✅ Normalização: MISSING_TOKEN -> TOKEN_REQUIRED
    const normalizedCode = code === "MISSING_TOKEN" ? "TOKEN_REQUIRED" : code;
    const normalizedStatus =
      normalizedCode === "TOKEN_REQUIRED" ? 400 : status;

    // erros "esperados"
    if (typeof normalizedStatus === "number") {
      logger.warn("VERIFY", "expected error", { code: normalizedCode, status: normalizedStatus });
      return NextResponse.json({ error: normalizedCode }, { status: normalizedStatus });
    }

    if (normalizedCode === "UNAUTHENTICATED") {
      logger.warn("VERIFY", "unauthenticated", { code: normalizedCode });
      return NextResponse.json({ error: normalizedCode }, { status: 401 });
    }
    if (normalizedCode === "FORBIDDEN") {
      logger.warn("VERIFY", "forbidden", { code: normalizedCode });
      return NextResponse.json({ error: normalizedCode }, { status: 403 });
    }

    // erro inesperado
    logger.error("VERIFY", "internal error", { code: normalizedCode });
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
