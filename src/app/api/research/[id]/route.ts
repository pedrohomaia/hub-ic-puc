// src/app/api/research/[id]/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, getSessionUser } from "@/lib/auth";
import { requireGroupAdmin, requireModerator } from "@/lib/rbac";


type PatchBody = {
  title?: string;
  description?: string;

  // ✅ US1.6
  approved?: boolean;
  hidden?: boolean;
};

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;

    const user = await requireAuth(); // garante user.id
    const sessionUser = await getSessionUser(); // pega email (moderação)

    const body = (await req.json().catch(() => ({}))) as PatchBody;

    const existing = await prisma.research.findUnique({
      where: { id },
      select: { id: true, groupId: true },
    });

    if (!existing) {
      return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    }

    // ✅ MODERAÇÃO GLOBAL: aprovar/ocultar
    if (typeof body.approved === "boolean" || typeof body.hidden === "boolean") {
      requireModerator(sessionUser?.email);

      const updated = await prisma.research.update({
        where: { id },
        data: {
          ...(typeof body.approved === "boolean" ? { isApproved: body.approved } : {}),
          ...(typeof body.hidden === "boolean" ? { isHidden: body.hidden } : {}),
        },
      });

      return NextResponse.json({ ok: true, research: updated });
    }

    // ✅ EDIÇÃO NORMAL: ADMIN do grupo
    await requireGroupAdmin(user.id, existing.groupId);

    const nextTitle = body.title?.trim();
    const nextDesc = body.description?.trim();

    const updated = await prisma.research.update({
      where: { id },
      data: {
        ...(nextTitle !== undefined ? { title: nextTitle } : {}),
        ...(nextDesc !== undefined ? { description: nextDesc } : {}),
      },
    });

    return NextResponse.json({ ok: true, research: updated });
  } catch (err) {
    const code =
      err instanceof Error ? err.message : (typeof err === "string" ? err : "UNKNOWN");


    if (code === "UNAUTHORIZED") return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    if (code === "FORBIDDEN_GROUP_ADMIN") return NextResponse.json({ error: "FORBIDDEN_GROUP_ADMIN" }, { status: 403 });
    if (code === "FORBIDDEN_MODERATOR") return NextResponse.json({ error: "FORBIDDEN_MODERATOR" }, { status: 403 });

    console.error("[PATCH /api/research/:id] error:", err);
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;

  const user = await requireAuth();

  const existing = await prisma.research.findUnique({
    where: { id },
    select: { id: true, groupId: true },
  });

  if (!existing) {
    return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
  }

  await requireGroupAdmin(user.id, existing.groupId);

  // MVP: "delete" = ocultar
  const updated = await prisma.research.update({
    where: { id },
    data: { isHidden: true },
  });
 
  return NextResponse.json({ ok: true, research: updated });
}
