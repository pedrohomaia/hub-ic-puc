// src/app/research/[id]/page.tsx
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { getResearchById } from "@/lib/research.repo";
import { getSessionUser } from "@/lib/auth";
import { getUserGroupRole } from "@/lib/rbac";
import AdminControls from "./AdminControls";
import CompleteButton from "./CompleteButton";


type Props = { params: Promise<{ id: string }> };

export default async function ResearchDetailPage({ params }: Props) {
  const { id } = await params; // 

  const research = await getResearchById(id);

  if (!research || research.isHidden) {
    return (
      <main style={{ padding: 24, maxWidth: 900 }}>
        <h1>Não encontrada</h1>
      </main>
    );
  }

  // leitura pública; botões só se ADMIN
  let canAdmin = false;

  try {
    const user = await getSessionUser(); // se não tiver sessão, pode lançar (ok)
    if (user?.id) {
      const role = await getUserGroupRole(user.id, research.groupId);
      canAdmin = role === "ADMIN";
    }
  } catch {
    // sem sessão: não mostra botões
  }

  return (
    <main style={{ padding: 24, maxWidth: 900 }}>
      <h1 style={{ marginBottom: 8 }}>{research.title}</h1>

      <p style={{ opacity: 0.85, marginBottom: 10 }}>
        {research.description ?? "Sem descrição"}
      </p>

      <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 16 }}>
        ID: {research.id} • Group: {research.groupId}
      </div>

      <div
        style={{
          border: "1px solid #eee",
          borderRadius: 12,
          padding: 12,
          marginBottom: 16,
          opacity: 0.85,
        }}
      >
        Views: — • Completions: — <span style={{ opacity: 0.7 }}>(Em breve)</span>
        <CompleteButton researchId={research.id} />
      </div>

      <AdminControls
        canAdmin={canAdmin}
        researchId={research.id}
        initialTitle={research.title}
        initialDescription={research.description ?? ""}
      />
    </main>
  );
}
