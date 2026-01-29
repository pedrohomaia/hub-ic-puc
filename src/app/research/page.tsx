// src/app/research/page.tsx
import Link from "next/link";
import { listResearchNew } from "@/lib/research.repo";

export default async function ResearchIndexPage() {
  const items = await listResearchNew(30);

  return (
    <main style={{ padding: 24, maxWidth: 900 }}>
      <h1 style={{ marginBottom: 12 }}>Pesquisas</h1>

      {items.length === 0 ? (
        <p style={{ opacity: 0.8 }}>Nenhuma pesquisa ainda.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: 10 }}>
          {items.map((r) => (
            <li
              key={r.id}
              style={{ border: "1px solid #eee", borderRadius: 12, padding: 12 }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <strong>{r.title}</strong>
                  <div style={{ opacity: 0.8, marginTop: 6 }}>
                    {r.description ?? "Sem descrição"}
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>
                    {r.courseName} • {r.areaName} • {r.groupName}
                  </div>
                </div>

                <Link
                  href={`/research/${r.id}`}
                  style={{ padding: 8, border: "1px solid #ddd", borderRadius: 10 }}
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
