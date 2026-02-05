export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { requireModerator } from "@/lib/rbac";
import { listPendingResearch } from "@/lib/research.repo";

async function moderate(id: string, action: "APPROVE" | "HIDE") {
  "use server";

  const res = await fetch(`${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/api/research/${id}/moderate`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action }),
    cache: "no-store",
  });

  if (!res.ok) {
    const raw = await res.json().catch(() => ({}));
    const err = typeof raw?.error === "string" ? raw.error : "REQUEST_FAILED";
    throw new Error(err);
  }
}

export default async function ModerationPage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/signin");

  // ✅ só moderador
  requireModerator(user.email);

  const items = await listPendingResearch(80);

  return (
    <main style={{ padding: 24, maxWidth: 900 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div>
          <h1 style={{ marginBottom: 6 }}>Moderação</h1>
          <p style={{ opacity: 0.75, marginTop: 0 }}>Pesquisas pendentes de aprovação.</p>
        </div>

        <Link href="/research" style={{ textDecoration: "none" }}>
          ← Voltar para pesquisas
        </Link>
      </div>

      {items.length === 0 ? (
        <p style={{ opacity: 0.8 }}>Nenhuma pendência 🎉</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: 10 }}>
          {items.map((r) => (
            <li key={r.id} style={{ border: "1px solid #eee", borderRadius: 12, padding: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <strong>{r.title}</strong>
                  <div style={{ opacity: 0.8, marginTop: 6 }}>{r.description ?? "Sem descrição"}</div>
                  <div style={{ opacity: 0.65, fontSize: 12, marginTop: 6 }}>
                    {new Date(r.createdAt).toLocaleString()} • groupId: {r.groupId}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <form
                    action={async () => {
                      "use server";
                      await moderate(r.id, "APPROVE");
                    }}
                  >
                    <button
                      type="submit"
                      style={{
                        height: 36,
                        padding: "0 10px",
                        borderRadius: 10,
                        border: "1px solid #ddd",
                        background: "transparent",
                        cursor: "pointer",
                      }}
                    >
                      Aprovar
                    </button>
                  </form>

                  <form
                    action={async () => {
                      "use server";
                      await moderate(r.id, "HIDE");
                    }}
                  >
                    <button
                      type="submit"
                      style={{
                        height: 36,
                        padding: "0 10px",
                        borderRadius: 10,
                        border: "1px solid #ddd",
                        background: "transparent",
                        cursor: "pointer",
                        opacity: 0.8,
                      }}
                    >
                      Ocultar
                    </button>
                  </form>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
