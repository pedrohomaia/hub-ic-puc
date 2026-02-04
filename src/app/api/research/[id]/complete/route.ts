export const runtime = "nodejs";

import { asErrorCode } from "@/lib/appError";
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

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
  const { code, status } = asErrorCode(err);

  if (typeof status === "number") {
    return NextResponse.json({ ok: false, error: code }, { status });
  }

  console.error("[POST /api/research/:id/complete]", err);
  return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
}

}
