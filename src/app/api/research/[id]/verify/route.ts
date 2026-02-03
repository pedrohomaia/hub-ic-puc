export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { verifyTokenAndCreateVerifiedCompletion } from "@/lib/researchTokens.repo";
import { asErrorCode } from "@/lib/appError";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id: researchId } = await ctx.params;
    const user = await requireAuth();

    const body = await req.json().catch(() => ({} as any));
    const token = String(body?.token ?? "").trim();

    if (!researchId) {
      return NextResponse.json({ ok: false, error: "MISSING_RESEARCH_ID" }, { status: 400 });
    }
    if (!token) {
      return NextResponse.json({ ok: false, error: "MISSING_TOKEN" }, { status: 400 });
    }

    const completion = await verifyTokenAndCreateVerifiedCompletion(user.id, researchId, token);
    return NextResponse.json({ ok: true, completion }, { status: 200 });
  } catch (err: unknown) {
    const { code, status } = asErrorCode(err);

    if (code === "NOT_FOUND") return NextResponse.json({ ok: false, error: code }, { status: 404 });
    if (code === "FORBIDDEN") return NextResponse.json({ ok: false, error: code }, { status: 403 });

    if (code === "MISSING_TOKEN" || code === "TOKEN_INVALID" || code === "TOKEN_EXPIRED") {
      return NextResponse.json({ ok: false, error: code }, { status: 400 });
    }

    if (code === "TOKEN_USED" || code === "ALREADY_COMPLETED") {
      return NextResponse.json({ ok: false, error: code }, { status: 409 });
    }

    console.error("[POST /api/research/:id/verify]", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: status ?? 500 });
  }
}
