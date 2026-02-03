// src/app/api/research/[id]/verify/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { verifyTokenAndCreateVerifiedCompletion } from "@/lib/researchTokens.repo";
import { asErrorCode } from "@/lib/appError";

type VerifyBody = { token?: unknown };

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id: researchId } = await ctx.params;

    if (!researchId) {
      return NextResponse.json({ error: "MISSING_RESEARCH_ID" }, { status: 400 });
    }

    const user = await requireAuth();

    const body: unknown = await req.json().catch(() => ({} as unknown));
    const obj = (typeof body === "object" && body !== null ? body : {}) as VerifyBody;
    const token = typeof obj.token === "string" ? obj.token : "";

    if (!token) {
      return NextResponse.json({ error: "MISSING_TOKEN" }, { status: 400 });
    }

    const completion = await verifyTokenAndCreateVerifiedCompletion(user.id, researchId, token);

    return NextResponse.json({ ok: true, completion }, { status: 200 });
  } catch (err) {
    const { code, status } = asErrorCode(err);

    // Se vier status do AppError, respeita
    if (typeof status === "number") {
      return NextResponse.json({ error: code }, { status });
    }

    // fallback (erros antigos via throw new Error("CODE"))
    if (code === "UNAUTHENTICATED") return NextResponse.json({ error: code }, { status: 401 });
    if (code === "FORBIDDEN") return NextResponse.json({ error: code }, { status: 403 });

    // defaults
    console.error("[VERIFY][POST] error:", err);
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
