"use client";

import { useState } from "react";

function asObj(v: unknown): Record<string, unknown> {
  return typeof v === "object" && v !== null ? (v as Record<string, unknown>) : {};
}

type Props = {
  groupId: string;
  researchId: string;
  initialTitle: string;
  initialDescription: string;
};

export default function EditResearchForm({
  groupId,
  researchId,
  initialTitle,
  initialDescription,
}: Props) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);

    try {
      const res = await fetch(`/api/research/${researchId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description: description || null }),
      });

      const raw: unknown = await res.json().catch(() => ({}));
      const data = asObj(raw);

      if (!res.ok) {
        const code = typeof data.error === "string" ? data.error : "REQUEST_FAILED";
        setErr(code);
        return;
      }

      window.location.href = `/group/${groupId}/research/${researchId}`;
    } catch {
      setErr("NETWORK_ERROR");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} style={{ display: "grid", gap: 10, maxWidth: 720 }}>
      <label style={{ display: "grid", gap: 6 }}>
        <span style={{ fontSize: 12, opacity: 0.75 }}>Título</span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ height: 40, padding: "0 10px", border: "1px solid #ddd", borderRadius: 10 }}
        />
      </label>

      <label style={{ display: "grid", gap: 6 }}>
        <span style={{ fontSize: 12, opacity: 0.75 }}>Descrição</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={{ minHeight: 120, padding: 10, border: "1px solid #ddd", borderRadius: 12 }}
        />
      </label>

      {err ? (
        <div style={{ padding: 10, border: "1px solid #f1c2c2", borderRadius: 10 }}>
          <strong>Erro:</strong> <span>{err}</span>
        </div>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        style={{
          height: 40,
          padding: "0 12px",
          border: "1px solid #ddd",
          borderRadius: 10,
          background: "transparent",
          cursor: loading ? "not-allowed" : "pointer",
          justifySelf: "start",
        }}
      >
        {loading ? "Salvando..." : "Salvar"}
      </button>
    </form>
  );
}
