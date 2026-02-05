export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { requireModerator } from "@/lib/rbac";
import { listPendingResearch } from "@/lib/research.repo";
import ModerationActions from "./ModerationActions";

export default async function ModerationPage() {
  const user = await getSessionUser();
  requireModerator(user?.email);

  const items = await listPendingResearch(80);

  return (
    <main style={{ padding: 24, maxWidth: 1000 }}>
      <h1 style={{ marginBottom: 8 }}>Moderação</h1>
      <p style={{ opacity: 0.8, marginBottom: 16 }}>
        Pendentes de aprovação ({items.length})
      </p>

      {items.length === 0 ? (
        <p style={{ opacity: 0.8 }}>Nada pendente ✅</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: 10 }}>
          {items.map((r) => (
            <li key={r.id} style={{ border: "1px solid #eee", borderRadius: 12, padding: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600 }}>{r.title}</div>

                  <div style={{ opacity: 0.85, marginTop: 6 }}>
                    {r.description ?? <span style={{ opacity: 0.7 }}>Sem descrição</span>}
                  </div>

                  <div style={{ fontSize: 12, opacity: 0.7, marginTop: 8 }}>
                    <span>ID: {r.id}</span>{" "}
                    <span style={{ margin: "0 6px" }}>•</span>
                    <span>Group: {r.groupId}</span>{" "}
                    <span style={{ margin: "0 6px" }}>•</span>
                    <Link href={`/group/${r.groupId}/research/${r.id}`} style={{ textDecoration: "none" }}>
                      Abrir no grupo →
                    </Link>
                  </div>
                </div>

                <ModerationActions researchId={r.id} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
