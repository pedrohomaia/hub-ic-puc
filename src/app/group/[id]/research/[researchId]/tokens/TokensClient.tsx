"use client";

import { useMemo, useState } from "react";

export default function TokensClient({ researchId }: { researchId: string }) {
  const [count, setCount] = useState<number>(50);
  const [expiresInDays, setExpiresInDays] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [tokens, setTokens] = useState<string[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const tokenText = useMemo(() => tokens.join("\n"), [tokens]);

  async function onGenerate() {
    setErr(null);
    setLoading(true);
    setTokens([]);

    try {
      const res = await fetch(`/api/research/${researchId}/tokens`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          count,
          expiresInDays: expiresInDays > 0 ? expiresInDays : undefined,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErr(data?.error ?? `HTTP_${res.status}`);
        return;
      }

      setTokens(Array.isArray(data?.tokens) ? data.tokens : []);
    } catch (e: any) {
      setErr(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  }

  async function copyToClipboard() {
    await navigator.clipboard.writeText(tokenText);
    alert("Copiado!");
  }

  return (
    <section style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "end" }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontSize: 12, opacity: 0.8 }}>Quantidade (1–500)</span>
          <input
            type="number"
            min={1}
            max={500}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            style={{ padding: 10, borderRadius: 10, border: "1px solid #ddd", width: 160 }}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontSize: 12, opacity: 0.8 }}>Expira em dias (0 = sem)</span>
          <input
            type="number"
            min={0}
            max={365}
            value={expiresInDays}
            onChange={(e) => setExpiresInDays(Number(e.target.value))}
            style={{ padding: 10, borderRadius: 10, border: "1px solid #ddd", width: 160 }}
          />
        </label>

        <button
          onClick={onGenerate}
          disabled={loading}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid #ddd",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Gerando..." : "Gerar tokens"}
        </button>
      </div>

      {err && (
        <div style={{ padding: 12, border: "1px solid #f1c0c0", borderRadius: 10 }}>
          <b>Erro:</b> <code>{err}</code>
        </div>
      )}

      <div style={{ display: "grid", gap: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <b>Tokens gerados ({tokens.length})</b>

          <button
            onClick={copyToClipboard}
            disabled={tokens.length === 0}
            style={{
              padding: "8px 12px",
              borderRadius: 10,
              border: "1px solid #ddd",
              cursor: tokens.length === 0 ? "not-allowed" : "pointer",
            }}
          >
            Copiar
          </button>
        </div>

        <textarea
          readOnly
          value={tokenText}
          placeholder="Gere tokens para aparecer aqui..."
          rows={12}
          style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid #ddd" }}
        />
        <p style={{ fontSize: 12, opacity: 0.75 }}>
          *Guarde esses tokens: depois você não consegue “ver de novo” no banco, só o hash fica salvo.
        </p>
      </div>
    </section>
  );
}
