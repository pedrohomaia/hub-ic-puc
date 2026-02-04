// src/app/api/research/[id]/verify/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { verifyTokenAndCreateVerifiedCompletion } from "@/lib/researchTokens.repo";
import { asErrorCode } from "@/lib/appError";

type VerifyBody = { token?: unknown };

function pickToken(req: Request, body: VerifyBody) {
  // body.token
  if (typeof body.token === "string") return body.token;

  // query ?token=
  const url = new URL(req.url);
  const q = url.searchParams.get("token");
  if (q) return q;

  // header x-verification-token
  const h = req.headers.get("x-verification-token");
  if (h) return h;

  return "";
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
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
      return NextResponse.json({ error: "TOKEN_REQUIRED" }, { status: 400 });
    }

    const completion = await verifyTokenAndCreateVerifiedCompletion(user.id, researchId, token);

    return NextResponse.json({ ok: true, completion }, { status: 200 });
  } catch (err) {
    const { code, status } = asErrorCode(err);
    if (typeof status === "number") {
      return NextResponse.json({ error: code }, { status });
    }

    if (code === "UNAUTHENTICATED") return NextResponse.json({ error: code }, { status: 401 });
    if (code === "FORBIDDEN") return NextResponse.json({ error: code }, { status: 403 });

    console.error("[VERIFY][POST] error:", err);
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
