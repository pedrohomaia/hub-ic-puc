"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CompleteButton({ researchId }: { researchId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function click() {
    setLoading(true);
    setMsg(null);

    try {
      const res = await fetch(`/api/research/${researchId}/complete`, { method: "POST" });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setMsg(`Erro: ${data?.error ?? "REQUEST_FAILED"}`);
        return;
      }

      setMsg(data?.alreadyCompleted ? "Você já registrou essa pesquisa ✅" : "Registrado! ✅ +10 pontos");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
      <button
        onClick={click}
        disabled={loading}
        style={{ padding: 10, border: "1px solid #ddd", borderRadius: 12 }}
      >
        {loading ? "Registrando..." : "✅ Já respondi"}
      </button>
      {msg ? <p style={{ fontSize: 12, opacity: 0.8 }}>{msg}</p> : null}
    </div>
  );
}
