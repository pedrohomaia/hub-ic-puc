// src/app/group/[id]/research/[researchId]/page.tsx

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { getUserGroupRole } from "@/lib/rbac";
import { getGroupById, getResearchById } from "@/lib/research.repo";
import StatsBox from "./stats-box";
import VerifyForm from "@/app/components/VerifyForm";


type Props = { params: Promise<{ id: string; researchId: string }> };

export default async function GroupResearchPage({ params }: Props) {
  const { id: groupId, researchId } = await params;

  const group = await getGroupById(groupId);
  if (!group) {
    return (
      <main style={{ padding: 24, maxWidth: 900 }}>
        <h1>Grupo não encontrado</h1>
      </main>
    );
  }

  const research = await getResearchById(researchId);
  if (!research || research.groupId !== groupId) {
    return (
      <main style={{ padding: 24, maxWidth: 900 }}>
        <Link href={`/group/${groupId}`} style={{ textDecoration: "none" }}>
          ← Voltar ao grupo
        </Link>
        <h1 style={{ marginTop: 12 }}>Pesquisa não encontrada neste grupo</h1>
      </main>
    );
  }

  let role: "ADMIN" | "MEMBER" | null = null;

  try {
    const user = await getSessionUser();
    if (user?.id) {
      const r = await getUserGroupRole(user.id, groupId);
      role = r === "ADMIN" || r === "MEMBER" ? r : null;
    }
  } catch {
    role = null;
  }

  const isAdmin = role === "ADMIN";
  const isMember = role === "MEMBER" || isAdmin;

  if (!isMember) {
    return (
      <main style={{ padding: 24, maxWidth: 900 }}>
        <Link href={`/group/${groupId}`} style={{ textDecoration: "none" }}>
          ← Voltar ao grupo
        </Link>
        <h1 style={{ marginTop: 12 }}>{group.name}</h1>
        <p style={{ opacity: 0.75 }}>
          Você não é membro deste grupo (ou não está logado).
        </p>
      </main>
    );
  }

  return (
    <main style={{ padding: 24, maxWidth: 900 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div>
          <Link href={`/group/${groupId}`} style={{ textDecoration: "none" }}>
            ← Voltar ao grupo
          </Link>

          <h1 style={{ marginTop: 10, marginBottom: 6 }}>{research.title}</h1>

          <div style={{ fontSize: 12, opacity: 0.75 }}>
            {group.area.course.name} • {group.area.name} • {group.name}
          </div>

          <div style={{ fontSize: 12, opacity: 0.6, marginTop: 6 }}>
            ResearchId: {research.id}
          </div>
        </div>

        {isAdmin ? (
          <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
            <Link
              href={`/group/${groupId}/research/${researchId}/edit`}
              style={{
                padding: "10px 12px",
                border: "1px solid #ddd",
                borderRadius: 10,
                textDecoration: "none",
                height: 40,
              }}
            >
              Editar
            </Link>

            <Link
              href={`/group/${groupId}/research/${researchId}/tokens`}
              style={{
                padding: "10px 12px",
                border: "1px solid #ddd",
                borderRadius: 10,
                textDecoration: "none",
                height: 40,
              }}
            >
              Gerar tokens
            </Link>
          </div>
        ) : null}
      </div>

      <div
        style={{
          marginTop: 16,
          border: "1px solid #eee",
          borderRadius: 12,
          padding: 12,
          opacity: 0.9,
        }}
      >
        <strong>Descrição</strong>
        <div style={{ marginTop: 8, opacity: 0.85 }}>
          {research.description ?? "Sem descrição"}
        </div>
      </div>

      <div
        style={{
          marginTop: 12,
          border: "1px solid #eee",
          borderRadius: 12,
          padding: 12,
          opacity: 0.85,
        }}
      >
        {isAdmin ? (
          <>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Stats (ADMIN)</div>
            <StatsBox researchId={researchId} />
          </>
        ) : (
          <>
            Views: — • Completions: —{" "}
            <span style={{ opacity: 0.7 }}>(Em breve)</span>
          </>
        )}
      </div>

      <div style={{ marginTop: 18 }}>
        <h2 style={{ marginBottom: 10 }}>Verificação</h2>

        <div
          style={{
            border: "1px solid #eee",
            borderRadius: 12,
            padding: 12,
            opacity: 0.9,
          }}
        >
          <p style={{ margin: 0, opacity: 0.85 }}>
            Esta pesquisa usa tokens de verificação. O endpoint já existe em:
            <span style={{ opacity: 0.8 }}>
              {" "}
              POST <code>/api/research/{researchId}/verify</code>
            </span>
          </p>

          <div style={{ marginTop: 12 }}>
            <VerifyForm researchId={researchId} />
          </div>
        </div>
      </div>
    </main>
  );
}
