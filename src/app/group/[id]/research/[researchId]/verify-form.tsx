"use client";

import { useState } from "react";

export default function VerifyForm({ researchId }: { researchId: string }) {
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    setMsg(null);

    try {
      const res = await fetch(`/api/research/${researchId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await res.json().catch(() => ({} as any));

      if (!res.ok) {
        setErr(data?.error ?? "REQUEST_FAILED");
        return;
      }

      setMsg("Verificação OK! Pontos creditados.");
      setToken("");
    } catch {
      setErr("NETWORK_ERROR");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} style={{ display: "grid", gap: 10, maxWidth: 520 }}>
      <label style={{ display: "grid", gap: 6 }}>
        <span style={{ fontSize: 12, opacity: 0.75 }}>Token</span>
        <input
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Ex: K7QH-9M2X-WR5P"
          style={{
            height: 40,
            padding: "0 10px",
            border: "1px solid #ddd",
            borderRadius: 10,
          }}
        />
      </label>

      <button
        type="submit"
        disabled={loading || token.trim().length === 0}
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
        {loading ? "Verificando..." : "Verificar"}
      </button>

      {err ? (
        <div style={{ padding: 10, border: "1px solid #f1c2c2", borderRadius: 10 }}>
          <strong>Erro:</strong> <span>{err}</span>
        </div>
      ) : null}

      {msg ? (
        <div style={{ padding: 10, border: "1px solid #cfe8cf", borderRadius: 10 }}>
          <strong>{msg}</strong>
        </div>
      ) : null}
    </form>
  );
}
