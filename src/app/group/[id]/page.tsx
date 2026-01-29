export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { getUserGroupRole } from "@/lib/rbac";
import { getGroupById, listResearchByGroup } from "@/lib/research.repo";

type Props = { params: Promise<{ id: string }> };

export default async function GroupPage({ params }: Props) {
  const { id: groupId } = await params;

  const group = await getGroupById(groupId);
  if (!group) {
    return (
      <main style={{ padding: 24, maxWidth: 900 }}>
        <h1>Grupo não encontrado</h1>
      </main>
    );
  }

  let role: "ADMIN" | "MEMBER" | null = null;

  try {
    const user = await getSessionUser();
    if (user?.id) {
      role = (await getUserGroupRole(user.id, groupId)) as any;
    }
  } catch {
    role = null;
  }

  const isAdmin = role === "ADMIN";
  const isMember = role === "MEMBER" || isAdmin;

  const items = await listResearchByGroup(groupId);

  return (
    <main style={{ padding: 24, maxWidth: 900 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h1 style={{ marginBottom: 6 }}>{group.name}</h1>
          <div style={{ fontSize: 12, opacity: 0.75 }}>
            {group.area.course.name} • {group.area.name}
          </div>
          <div style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>
            GroupId: {group.id}
          </div>
        </div>

        {isAdmin ? (
          <Link
            href={`/group/${groupId}/research/new`}
            style={{
              height: 40,
              alignSelf: "flex-start",
              padding: "10px 12px",
              border: "1px solid #ddd",
              borderRadius: 10,
              textDecoration: "none",
            }}
          >
            + Nova pesquisa
          </Link>
        ) : null}
      </div>

      <div
        style={{
          marginTop: 16,
          border: "1px solid #eee",
          borderRadius: 12,
          padding: 12,
          opacity: 0.85,
        }}
      >
        Views: — • Completions: — <span style={{ opacity: 0.7 }}>(Em breve)</span>
      </div>

      <h2 style={{ marginTop: 18, marginBottom: 10 }}>Pesquisas do grupo</h2>

      {!isMember ? (
        <p style={{ opacity: 0.7 }}>
          Você não é membro deste grupo (ou não está logado).
        </p>
      ) : null}

      {items.length === 0 ? (
        <p style={{ opacity: 0.8 }}>Nenhuma pesquisa neste grupo ainda.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: 10 }}>
          {items.map((r) => (
            <li
              key={r.id}
              style={{
                border: "1px solid #eee",
                borderRadius: 12,
                padding: 12,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <strong>{r.title}</strong>
                  <div style={{ opacity: 0.8, marginTop: 6 }}>
                    {r.description ?? "Sem descrição"}
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.65, marginTop: 6 }}>
                    ID: {r.id}
                  </div>
                </div>

                <Link
                  href={`/research/${r.id}`}
                  style={{
                    padding: 8,
                    border: "1px solid #ddd",
                    borderRadius: 10,
                    textDecoration: "none",
                  }}
                >
                  Ver
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
