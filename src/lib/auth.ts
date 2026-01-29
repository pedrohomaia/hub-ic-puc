import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export type SessionUser = {
  id: string;
  email: string;
  name?: string | null;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);

  const user = session?.user;
  if (!user?.email) return null;

  const userWithId = user as { id?: unknown };

  const id =
    typeof userWithId.id === "string" && userWithId.id.trim().length > 0
      ? userWithId.id.trim()
      : "";

  // ✅ sem id real = sem auth (evita RBAC quebrando)
  if (!id) return null;

  return {
    id,
    email: String(user.email),
    name: user.name ?? null,
  };
}

export async function requireAuth(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new Error("UNAUTHENTICATED");

  console.log("[AUTH] requireAuth user:", user);
  return user;
}
