"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewResearchForm({ groupId }: { groupId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);

        const form = e.currentTarget;
        const fd = new FormData(form);

        const title = String(fd.get("title") ?? "").trim();
        const description = String(fd.get("description") ?? "").trim();

        const res = await fetch("/api/research", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ groupId, title, description }),
        });

        const data = await res.json().catch(() => null);

        setLoading(false);

        if (!data?.ok) {
          alert(data?.error ?? "Erro ao criar");
          return;
        }

        router.push(`/group/${groupId}`);
      }}
      style={{ display: "grid", gap: 10 }}
    >
      <label>
        <div style={{ marginBottom: 6 }}>Título</div>
        <input
          name="title"
          required
          minLength={3}
          style={{
            width: "100%",
            padding: 10,
            border: "1px solid #ddd",
            borderRadius: 10,
          }}
        />
      </label>

      <label>
        <div style={{ marginBottom: 6 }}>Descrição</div>
        <textarea
          name="description"
          rows={5}
          style={{
            width: "100%",
            padding: 10,
            border: "1px solid #ddd",
            borderRadius: 10,
          }}
        />
      </label>

      <div style={{ display: "flex", gap: 10 }}>
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: 10,
            border: "1px solid #ddd",
            borderRadius: 10,
            cursor: "pointer",
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? "Criando..." : "Criar"}
        </button>
      </div>
    </form>
  );
}
