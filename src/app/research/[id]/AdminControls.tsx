"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  canAdmin: boolean;
  researchId: string;
  initialTitle: string;
  initialDescription: string;
};

export default function AdminControls({
  canAdmin,
  researchId,
  initialTitle,
  initialDescription,
}: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [busy, setBusy] = useState(false);

  if (!canAdmin) return null;

  async function handleSave() {
    setBusy(true);
    try {
      const res = await fetch(`/api/research/${researchId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description }),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok) {
        alert(json?.error ?? "Falha ao salvar (PATCH).");
        return;
      }

      alert("Salvo!");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function handleHide() {
    if (!confirm("Ocultar esta pesquisa?")) return;

    setBusy(true);
    try {
      const res = await fetch(`/api/research/${researchId}`, { method: "DELETE" });
      const json = await res.json().catch(() => null);

      if (!res.ok) {
        alert(json?.error ?? "Falha ao ocultar (DELETE).");
        return;
      }

      alert("Ocultada.");
      router.push("/research");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <section style={{ border: "1px solid #eee", borderRadius: 12, padding: 12 }}>
      <div style={{ fontWeight: 600, marginBottom: 8 }}>Admin</div>

      <div style={{ display: "grid", gap: 8 }}>
        <label style={{ fontSize: 12, opacity: 0.8 }}>Título</label>
        <input
          value={title}
          disabled={busy}
          onChange={(e) => setTitle(e.target.value)}
          style={{ border: "1px solid #ddd", borderRadius: 10, padding: 10 }}
        />

        <label style={{ fontSize: 12, opacity: 0.8 }}>Descrição</label>
        <textarea
          value={description}
          disabled={busy}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          style={{ border: "1px solid #ddd", borderRadius: 10, padding: 10 }}
        />

        <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
          <button
            onClick={handleSave}
            disabled={busy}
            style={{ padding: 10, border: "1px solid #ddd", borderRadius: 10 }}
          >
            Salvar (PATCH)
          </button>

          <button
            onClick={handleHide}
            disabled={busy}
            style={{ padding: 10, border: "1px solid #ddd", borderRadius: 10 }}
          >
            Ocultar (DELETE)
          </button>
        </div>
      </div>
    </section>
  );
}
