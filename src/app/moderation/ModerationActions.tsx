"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = { researchId: string };

function asObj(v: unknown): Record<string, unknown> {
  return typeof v === "object" && v !== null ? (v as Record<string, unknown>) : {};
}

export default function ModerationActions({ researchId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<null | "APPROVE" | "HIDE">(null);
  const [err, setErr] = useState<string | null>(null);

  async function act(action: "APPROVE" | "HIDE") {
    setLoading(action);
    setErr(null);

    try {
      const res = await fetch(`/api/moderation/research/${researchId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      const raw: unknown = await res.json().catch(() => ({}));
      const data = asObj(raw);
      const apiError = typeof data.error === "string" ? data.error : null;

      if (!res.ok) {
        setErr(apiError ?? "REQUEST_FAILED");
        return;
      }

      router.refresh();
    } catch {
      setErr("NETWORK_ERROR");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div style={{ display: "grid", gap: 8, justifyItems: "end" }}>
      <button
        onClick={() => act("APPROVE")}
        disabled={!!loading}
        style={{
          height: 36,
          padding: "0 10px",
          border: "1px solid #ddd",
          borderRadius: 10,
          background: "transparent",
          cursor: loading ? "not-allowed" : "pointer",
          width: 120,
        }}
      >
        {loading === "APPROVE" ? "Aprovando..." : "Aprovar"}
      </button>

      <button
        onClick={() => act("HIDE")}
        disabled={!!loading}
        style={{
          height: 36,
          padding: "0 10px",
          border: "1px solid #f1c2c2",
          borderRadius: 10,
          background: "transparent",
          cursor: loading ? "not-allowed" : "pointer",
          width: 120,
        }}
      >
        {loading === "HIDE" ? "Ocultando..." : "Ocultar"}
      </button>

      {err ? (
        <div style={{ fontSize: 12, opacity: 0.85 }}>
          <strong>Erro:</strong> <span>{err}</span>
        </div>
      ) : null}
    </div>
  );
}
