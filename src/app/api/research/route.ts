export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { requireGroupAdmin } from "@/lib/rbac";
import {
  getResearchById,
  hideResearch,
  updateResearch,
  validateResearchUpdatePayload,
} from "@/lib/research.repo";

type Ctx = { params: { id: string } }; // ✅ NÃO é Promise

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const user = await requireAuth();

    const id = String(ctx.params.id ?? "").trim(); // ✅ sem await
    if (!id) return NextResponse.json({ error: "MISSING_ID" }, { status: 400 });

    const research = await getResearchById(id);
    if (!research) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }

    await requireGroupAdmin(user.id, research.groupId);

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
    }

    const patch = validateResearchUpdatePayload(body);
    const updated = await updateResearch(user.id, id, patch);

    return NextResponse.json({ ok: true, research: updated });
  } catch (err: any) {
    const code = String(err?.message ?? "UNKNOWN");

    if (code === "UNAUTHORIZED") {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }
    if (code === "FORBIDDEN_GROUP_ADMIN") {
      return NextResponse.json({ error: "FORBIDDEN_GROUP_ADMIN" }, { status: 403 });
    }
    if (
      code === "INVALID_TITLE" ||
      code === "INVALID_EMPTY_PATCH" ||
      code === "MISSING_ID" ||
      code === "INVALID_JSON"
    ) {
      return NextResponse.json({ error: code }, { status: 400 });
    }

    console.error("[PATCH /api/research/:id] error:", err);
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  try {
    const user = await requireAuth();

    const id = String(ctx.params.id ?? "").trim(); // ✅ sem await
    if (!id) return NextResponse.json({ error: "MISSING_ID" }, { status: 400 });

    const research = await getResearchById(id);
    if (!research) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }

    await requireGroupAdmin(user.id, research.groupId);

    const hidden = await hideResearch(id);
    return NextResponse.json({ ok: true, research: hidden });
  } catch (err: any) {
    const code = String(err?.message ?? "UNKNOWN");

    if (code === "UNAUTHORIZED") {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }
    if (code === "FORBIDDEN_GROUP_ADMIN") {
      return NextResponse.json({ error: "FORBIDDEN_GROUP_ADMIN" }, { status: 403 });
    }
    if (code === "MISSING_ID") {
      return NextResponse.json({ error: "MISSING_ID" }, { status: 400 });
    }

    console.error("[DELETE /api/research/:id] error:", err);
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
