// src/app/group/[id]/research/new/page.tsx
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { getUserGroupRole } from "@/lib/rbac";
import { getGroupById } from "@/lib/research.repo";
import NewResearchForm from "./research-form";

type Props = { params: Promise<{ id: string }> };

export default async function NewResearchPage({ params }: Props) {
  const { id: groupId } = await params;

  const group = await getGroupById(groupId);
  if (!group) {
    return (
      <main style={{ padding: 24, maxWidth: 900 }}>
        <h1>Grupo não encontrado</h1>
      </main>
    );
  }

  // guard page
  let role: "ADMIN" | "MEMBER" | null = null;
  try {
    const user = await getSessionUser();
    if (user?.id) role = (await getUserGroupRole(user.id, groupId)) as any;
  } catch {
    role = null;
  }

  if (role !== "ADMIN") {
    return (
      <main style={{ padding: 24, maxWidth: 900 }}>
        <Link href={`/group/${groupId}`} style={{ textDecoration: "none" }}>
          ← Voltar
        </Link>
        <h1 style={{ marginTop: 12 }}>Acesso negado</h1>
        <p style={{ opacity: 0.75 }}>Apenas ADMIN pode criar pesquisa.</p>
      </main>
    );
  }

  return (
    <main style={{ padding: 24, maxWidth: 900 }}>
      <Link href={`/group/${groupId}`} style={{ textDecoration: "none" }}>
        ← Voltar ao grupo
      </Link>

      <h1 style={{ marginTop: 12, marginBottom: 6 }}>Nova pesquisa</h1>
      <div style={{ fontSize: 12, opacity: 0.75 }}>
        {group.name} • {group.area.course.name} • {group.area.name}
      </div>

      <div style={{ marginTop: 14 }}>
        <NewResearchForm groupId={groupId} />
      </div>
    </main>
  );
}
