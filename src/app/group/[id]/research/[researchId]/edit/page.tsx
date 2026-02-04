export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { getUserGroupRole } from "@/lib/rbac";
import { getGroupById, getResearchById } from "@/lib/research.repo";
import EditResearchForm from "./research-form";

type Props = { params: Promise<{ id: string; researchId: string }> };

export default async function EditResearchPage({ params }: Props) {
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
          ← Voltar
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

  if (role !== "ADMIN") {
    return (
      <main style={{ padding: 24, maxWidth: 900 }}>
        <Link href={`/group/${groupId}/research/${researchId}`} style={{ textDecoration: "none" }}>
          ← Voltar
        </Link>
        <h1 style={{ marginTop: 12 }}>Acesso negado</h1>
        <p style={{ opacity: 0.75 }}>Apenas ADMIN pode editar pesquisa.</p>
      </main>
    );
  }

  return (
    <main style={{ padding: 24, maxWidth: 900 }}>
      <Link href={`/group/${groupId}/research/${researchId}`} style={{ textDecoration: "none" }}>
        ← Voltar
      </Link>

      <h1 style={{ marginTop: 12, marginBottom: 6 }}>Editar pesquisa</h1>
      <div style={{ fontSize: 12, opacity: 0.75 }}>
        {group.name} • {research.title}
      </div>

      <div style={{ marginTop: 14 }}>
        <EditResearchForm
          groupId={groupId}
          researchId={researchId}
          initialTitle={research.title}
          initialDescription={research.description ?? ""}
        />
      </div>
    </main>
  );
}

