import { prisma } from "@/lib/db";
import type { MemberRole } from "@prisma/client";

export async function getUserGroupRole(
  userId: string,
  groupId: string
): Promise<MemberRole | null> {
  const m = await prisma.groupMember.findUnique({
    where: { userId_groupId: { userId, groupId } },
    select: { role: true },
  });

  console.log("[RBAC] membership row:", m, { userId, groupId });

  return m?.role ?? null;
}

export async function requireGroupAdmin(userId: string, groupId: string) {
  console.log("[RBAC] requireGroupAdmin", { userId, groupId });

  const role = await getUserGroupRole(userId, groupId);

  if (role !== "ADMIN") {
    throw new Error("FORBIDDEN_GROUP_ADMIN");
  }
}

export async function canGroupAdmin(userId: string, groupId: string) {
  const role = await getUserGroupRole(userId, groupId);
  return role === "ADMIN";
}

/** =========================
 *  MODERAÇÃO GLOBAL (US1.6)
 *  ========================= */
export function isGlobalModerator(email?: string | null) {
  const e = String(email ?? "").trim().toLowerCase();
  if (!e) return false;

  const raw = process.env.MODERATOR_EMAILS ?? "";
  const allow = raw
    .split(";")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  return allow.includes(e);
}

export function requireModerator(email?: string | null) {
  if (!isGlobalModerator(email)) {
    throw new Error("FORBIDDEN_MODERATOR");
  }
}
