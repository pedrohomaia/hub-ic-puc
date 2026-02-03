// src/app/moderation/moderation-controls.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ModerationControls({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<"approve" | "hide" | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function patch(body: unknown) {
    setErr(null);
    const res = await fetch(`/api/research/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({} as unknown));
    const obj = (typeof data === "object" && data !== null ? data : {}) as {
      ok?: boolean;
      error?: string;
    };

    if (!res.ok || obj.ok === false) {
      throw new Error(obj.error || "REQUEST_FAILED");
    }
  }

  async function approve() {
    try {
      setLoading("approve");
      await patch({ approved: true });
      router.refresh(); // remove da lista (não é mais pendente)
    } catch (e) {
      setErr(e instanceof Error ? e.message : "ERROR");
    } finally {
      setLoading(null);
    }
  }

  async function hide() {
    try {
      setLoading("hide");
      await patch({ hidden: true });
      router.refresh(); // remove da lista (isHidden=true)
    } catch (e) {
      setErr(e instanceof Error ? e.message : "ERROR");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
      <button
        onClick={approve}
        disabled={loading !== null}
        style={{ padding: 8, border: "1px solid #ddd", borderRadius: 10 }}
      >
        {loading === "approve" ? "Aprovando..." : "Aprovar"}
      </button>

      <button
        onClick={hide}
        disabled={loading !== null}
        style={{ padding: 8, border: "1px solid #ddd", borderRadius: 10 }}
      >
        {loading === "hide" ? "Ocultando..." : "Ocultar"}
      </button>

      {err ? (
        <span style={{ fontSize: 12, opacity: 0.75 }}>
          Erro: <code>{err}</code>
        </span>
      ) : null}
    </div>
  );
}
