// src/app/api/groups/[id]/research/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { asErrorCode, AppError } from "@/lib/appError";
import { getUserGroupRole } from "@/lib/rbac";
import { createResearch, validateResearchPayload } from "@/lib/research.repo";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id: groupId } = await ctx.params;
    if (!groupId) return NextResponse.json({ error: "MISSING_GROUP_ID" }, { status: 400 });

    const user = await requireAuth();

    // ✅ API guard
    const role = await getUserGroupRole(user.id, groupId);
    if (role !== "ADMIN") throw new AppError("FORBIDDEN", 403);

    const body = await req.json().catch(() => ({}));
    const payload = validateResearchPayload(body);

    const created = await createResearch(user.id, groupId, payload);

    return NextResponse.json({ ok: true, research: created }, { status: 200 });
  } catch (err) {
    const { code, status } = asErrorCode(err);

    if (typeof status === "number") {
      return NextResponse.json({ error: code }, { status });
    }

    // fallback de validateResearchPayload (throw new Error)
    if (code === "INVALID_TITLE") return NextResponse.json({ error: code }, { status: 400 });

    console.error("[GROUP_RESEARCH_CREATE][POST] error:", err);
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
