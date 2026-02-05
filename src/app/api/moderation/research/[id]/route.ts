export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { requireModerator } from "@/lib/rbac";
import { moderateResearch } from "@/lib/research.repo";

function asObj(v: unknown): Record<string, unknown> {
  return typeof v === "object" && v !== null ? (v as Record<string, unknown>) : {};
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;

    const user = await getSessionUser();
    requireModerator(user?.email);

    const raw = await req.json().catch(() => ({}));
    const body = asObj(raw);
    const action = body.action;

    if (action !== "APPROVE" && action !== "HIDE") {
      return NextResponse.json({ error: "INVALID_ACTION" }, { status: 400 });
    }

    const updated = await moderateResearch(id, action);

    return NextResponse.json({ ok: true, research: updated });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "UNKNOWN_ERROR";

    if (msg === "FORBIDDEN_MODERATOR") {
      return NextResponse.json({ error: msg }, { status: 403 });
    }

    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
