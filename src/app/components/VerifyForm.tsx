"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Props = { researchId: string };

function asObj(v: unknown): Record<string, unknown> {
  return typeof v === "object" && v !== null ? (v as Record<string, unknown>) : {};
}

function pickString(v: unknown): string | null {
  return typeof v === "string" ? v : null;
}

function pickNumber(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

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
    case "INTERNAL_ERROR":
      return "Erro interno. Tente novamente em instantes.";
    default:
      return "Não foi possível verificar. Tente novamente.";
  }
}

type Status =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "success"; message: string; pointsAwarded: number }
  | { kind: "error"; code: string; message?: string };

export default function VerifyForm({ researchId }: Props) {
  const router = useRouter();

  const [token, setToken] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const tokenSanitized = useMemo(() => token.replace(/\s+/g, "").toUpperCase(), [token]);

  const canSubmit = tokenSanitized.trim().length > 0 && status.kind !== "loading";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit) return;

    setStatus({ kind: "loading" });

    try {
      const res = await fetch(`/api/research/${researchId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: tokenSanitized }),
      });

      const raw: unknown = await res.json().catch(() => ({}));
      const data = asObj(raw);

      if (!res.ok) {
        const code = pickString(data.error) ?? "REQUEST_FAILED";
        const message = pickString(data.message) ?? undefined;
        setStatus({ kind: "error", code, message });
        return;
      }

      const message = pickString(data.message) ?? "Token verificado com sucesso.";
      const pointsAwarded = pickNumber(data.pointsAwarded) ?? 0;

      setStatus({ kind: "success", message, pointsAwarded });
      setToken("");
      router.refresh();
    } catch {
      setStatus({ kind: "error", code: "NETWORK_ERROR" });
    }
  }

  return (
    <form onSubmit={onSubmit} style={{ display: "grid", gap: 10, maxWidth: 520 }}>
      <label style={{ display: "grid", gap: 6 }}>
        <span style={{ fontSize: 12, opacity: 0.75 }}>Token</span>
        <input
          value={tokenSanitized}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Ex: K7QH-9M2X-WR5P"
          autoComplete="off"
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
        disabled={!canSubmit}
        style={{
          height: 40,
          padding: "0 12px",
          border: "1px solid #ddd",
          borderRadius: 10,
          background: "transparent",
          cursor: !canSubmit ? "not-allowed" : "pointer",
          justifySelf: "start",
          opacity: !canSubmit ? 0.7 : 1,
        }}
      >
        {status.kind === "loading" ? "Verificando..." : "Verificar"}
      </button>

      {status.kind === "error" && (
        <div style={{ padding: 10, border: "1px solid #f1c2c2", borderRadius: 10 }}>
          <strong>Não deu certo:</strong>{" "}
          <span>{status.message ?? humanizeError(status.code)}</span>
        </div>
      )}

      {status.kind === "success" && (
        <div style={{ padding: 10, border: "1px solid #cfe8cf", borderRadius: 10 }}>
          <strong>{status.message} ✅</strong>
          <div style={{ fontSize: 12, opacity: 0.8, marginTop: 6 }}>
            {status.pointsAwarded > 0 ? (
              <>
                Você ganhou <strong>+{status.pointsAwarded}</strong> pontos.
              </>
            ) : (
              <>Verificação registrada.</>
            )}
          </div>
        </div>
      )}
    </form>
  );
}
