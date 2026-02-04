"use client";

import { useMemo, useState } from "react";

type Props = {
  researchId: string;
};

type ApiOk = {
  ok: true;
  researchId: string;
  count: number;
  expiresAt: string | null;
  tokens: string[];
};

type ApiErr = {
  error: string;
  hint?: string;
};

export default function TokensForm({ researchId }: Props) {
  const [count, setCount] = useState(10);
  const [expiresInDays, setExpiresInDays] = useState<number | "">(30);
  const [loading, setLoading] = useState(false);

  const [tokens, setTokens] = useState<string[] | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const tokensText = useMemo(() => (tokens ? tokens.join("\n") : ""), [tokens]);

  async function onGenerate() {
    setLoading(true);
    setError(null);
    setTokens(null);
    setExpiresAt(null);

    try {
      const payload: any = { count };

      if (expiresInDays !== "") payload.expiresInDays = expiresInDays;

      const res = await fetch(`/api/research/${researchId}/tokens`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await res.json().catch(() => ({}))) as Partial<ApiOk & ApiErr>;

      if (!res.ok) {
        const code = data.error ?? "REQUEST_FAILED";
        const hint = data.hint ? ` (${data.hint})` : "";
        setError(`${code}${hint}`);
        return;
      }

      setTokens(Array.isArray(data.tokens) ? data.tokens : []);
      setExpiresAt(typeof data.expiresAt === "string" ? data.expiresAt : null);
    } catch (e) {
      setError("NETWORK_ERROR");
    } finally {
      setLoading(false);
    }
  }

  async function onCopy() {
    if (!tokensText) return;
    await navigator.clipboard.writeText(tokensText);
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "grid", gap: 10 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 12, opacity: 0.75 }}>Quantidade (1–500)</span>
            <input
              value={count}
              type="number"
              min={1}
              max={500}
              onChange={(e) => setCount(Number(e.target.value))}
              style={{
                height: 38,
                padding: "0 10px",
                border: "1px solid #ddd",
                borderRadius: 10,
                width: 160,
              }}
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 12, opacity: 0.75 }}>Expira em dias (opcional)</span>
            <input
              value={expiresInDays}
              type="number"
              min={1}
              max={365}
              onChange={(e) => {
                const v = e.target.value;
                setExpiresInDays(v === "" ? "" : Number(v));
              }}
              placeholder="ex: 30"
              style={{
                height: 38,
                padding: "0 10px",
                border: "1px solid #ddd",
                borderRadius: 10,
                width: 200,
              }}
            />
          </label>

          <button
            onClick={onGenerate}
            disabled={loading}
            style={{
              height: 40,
              padding: "0 12px",
              border: "1px solid #ddd",
              borderRadius: 10,
              background: "transparent",
              cursor: loading ? "not-allowed" : "pointer",
              alignSelf: "flex-end",
            }}
          >
            {loading ? "Gerando..." : "Gerar tokens"}
          </button>
        </div>

        {error ? (
          <div style={{ padding: 10, border: "1px solid #f1c2c2", borderRadius: 10, opacity: 0.9 }}>
            <strong>Erro:</strong> <span style={{ opacity: 0.85 }}>{error}</span>
          </div>
        ) : null}
      </div>

      {tokens ? (
        <div style={{ display: "grid", gap: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div style={{ fontSize: 13, opacity: 0.8 }}>
              <strong>Tokens gerados:</strong> {tokens.length}
              {expiresAt ? (
                <span style={{ marginLeft: 10, opacity: 0.75 }}>Expira em: {new Date(expiresAt).toLocaleString()}</span>
              ) : (
                <span style={{ marginLeft: 10, opacity: 0.75 }}>Sem expiração</span>
              )}
            </div>

            <button
              onClick={onCopy}
              style={{
                height: 36,
                padding: "0 12px",
                border: "1px solid #ddd",
                borderRadius: 10,
                background: "transparent",
                cursor: "pointer",
              }}
            >
              Copiar
            </button>
          </div>

          <textarea
            readOnly
            value={tokensText}
            style={{
              minHeight: 220,
              width: "100%",
              padding: 12,
              border: "1px solid #ddd",
              borderRadius: 12,
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
              fontSize: 13,
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
