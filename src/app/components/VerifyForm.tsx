"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = { researchId: string };

function asObj(v: unknown): Record<string, unknown> {
  return typeof v === "object" && v !== null ? (v as Record<string, unknown>) : {};
}

// ✅ US6.4: códigos -> mensagens humanas
function humanizeError(code: string) {
  switch (code) {
    case "TOKEN_REQUIRED":
      return "Digite um token para verificar.";
    case "TOKEN_INVALID":
      return "Token inválido. Confira se você copiou corretamente.";
    case "TOKEN_USED":
      return "Esse token já foi usado.";
    case "TOKEN_EXPIRED":
      return "Esse token expirou. Peça um novo para o ADMIN.";
    case "ALREADY_COMPLETED":
      return "Você já concluiu essa pesquisa.";
    case "RESEARCH_NOT_FOUND":
      return "Pesquisa não encontrada.";
    case "UNAUTHENTICATED":
      return "Você precisa estar logado para verificar.";
    case "FORBIDDEN":
      return "Você não tem permissão para isso.";
    case "REQUEST_FAILED":
      return "Falha na requisição. Tente novamente.";
    case "NETWORK_ERROR":
      return "Sem conexão. Verifique sua internet e tente de novo.";
    default:
      return `Erro: ${code}`;
  }
}

export default function VerifyForm({ researchId }: Props) {
  const router = useRouter();

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

      const raw: unknown = await res.json().catch(() => ({}));
      const data = asObj(raw);
      const apiError = typeof data.error === "string" ? data.error : null;

      if (!res.ok) {
        setErr(apiError ?? "REQUEST_FAILED");
        return;
      }

      setMsg("Verificação OK! ✅");
      setToken("");

      // ✅ US6.1: atualiza stats sem F5
      router.refresh();
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
          <strong>Erro:</strong> <span>{humanizeError(err)}</span>
          <div style={{ fontSize: 12, opacity: 0.6, marginTop: 6 }}>({err})</div>
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
