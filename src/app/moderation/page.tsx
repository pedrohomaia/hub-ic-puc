// src/app/moderation/page.tsx
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { prisma } from "@/lib/db";
import { requireAuth, getSessionUser } from "@/lib/auth";
import { requireModerator } from "@/lib/rbac";
import ModerationControls from "./moderation-controls";



async function listPending() {
  return prisma.research.findMany({
    where: { isHidden: false, isApproved: false },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      title: true,
      description: true,
      groupId: true,
      createdAt: true,
    },
  });
}

export default async function ModerationPage() {
  await requireAuth();
  const u = await getSessionUser();
  requireModerator(u?.email);

  const items = await listPending();

  return (
    <main style={{ padding: 24, maxWidth: 900 }}>
      <h1 style={{ marginBottom: 12 }}>Moderação</h1>

      <p style={{ opacity: 0.75, marginBottom: 16 }}>
        Pendentes: {items.length}
      </p>

      {items.length === 0 ? (
        <p style={{ opacity: 0.8 }}>Nenhuma pendência 🎉</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: 10 }}>
          {items.map((r) => (
            <li
              key={r.id}
              style={{ border: "1px solid #eee", borderRadius: 12, padding: 12 }}
            >
              <strong>{r.title}</strong>

              <div style={{ opacity: 0.8, marginTop: 6 }}>
                {r.description ?? "Sem descrição"}
              </div>

              <div style={{ fontSize: 12, opacity: 0.65, marginTop: 6 }}>
                ID: {r.id} • Group: {r.groupId}
              </div>

              <div style={{ marginTop: 10 }}>
                <ModerationControls id={r.id} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
