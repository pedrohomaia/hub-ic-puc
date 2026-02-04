// src/app/api/research/[id]/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { asErrorCode, AppError } from "@/lib/appError";
import { getUserGroupRole } from "@/lib/rbac";
import { getResearchById, updateResearch, validateResearchUpdatePayload } from "@/lib/research.repo";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id: researchId } = await ctx.params;
    if (!researchId) return NextResponse.json({ error: "MISSING_ID" }, { status: 400 });

    const user = await requireAuth();

    const existing = await getResearchById(researchId);
    if (!existing) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

    const role = await getUserGroupRole(user.id, existing.groupId);
    if (role !== "ADMIN") throw new AppError("FORBIDDEN", 403);

    const body = await req.json().catch(() => ({}));
    const patch = validateResearchUpdatePayload(body);

    const updated = await updateResearch(user.id, researchId, patch);

    return NextResponse.json({ ok: true, research: updated }, { status: 200 });
  } catch (err) {
    const { code, status } = asErrorCode(err);

    if (typeof status === "number") {
      return NextResponse.json({ error: code }, { status });
    }

    if (code === "INVALID_TITLE") return NextResponse.json({ error: code }, { status: 400 });
    if (code === "INVALID_EMPTY_PATCH") return NextResponse.json({ error: code }, { status: 400 });

    console.error("[RESEARCH_PATCH][PATCH] error:", err);
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
