export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createCompletionSimple } from "@/lib/completions.repo";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: researchId } = await ctx.params;

    const result = await createCompletionSimple(user.id, researchId);

    return NextResponse.json(result);
  } catch (err) {
    const code =
      err instanceof Error ? err.message : (typeof err === "string" ? err : "UNKNOWN");


    if (code === "UNAUTHENTICATED")
      return NextResponse.json({ ok: false, error: "UNAUTHENTICATED" }, { status: 401 });

    if (code === "NOT_FOUND")
      return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });

    if (code === "RESEARCH_NOT_VISIBLE")
      return NextResponse.json({ ok: false, error: "RESEARCH_NOT_VISIBLE" }, { status: 403 });

    // ✅ agora faz sentido: SIMPLE já foi registrado antes
    if (code === "ALREADY_COMPLETED")
      return NextResponse.json({ ok: false, error: "ALREADY_COMPLETED" }, { status: 409 });

    console.error("[POST /api/research/:id/complete]", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
