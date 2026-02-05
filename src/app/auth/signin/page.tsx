"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

const AUTH_MODE = process.env.NEXT_PUBLIC_AUTH_MODE ?? "dev";

export default function SignInPage() {
  const isDev = AUTH_MODE === "dev";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onDevSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
      callbackUrl: "/",
    });

    setLoading(false);

    if (!res) return setErr("Erro ao tentar login.");
    if (res.error) return setErr("Credenciais inválidas.");

    window.location.href = res.url ?? "/";
  }

  async function onMicrosoft() {
    setErr(null);
    setLoading(true);
    await signIn("azure-ad", { callbackUrl: "/" });
  }

  return (
    <main style={{ padding: 24, maxWidth: 420 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Entrar</h1>

      {!isDev ? (
        <div style={{ display: "grid", gap: 10 }}>
          <button
            onClick={onMicrosoft}
            disabled={loading}
            style={{
              padding: 12,
              borderRadius: 12,
              border: "1px solid #111",
              background: loading ? "#eee" : "#111",
              color: loading ? "#111" : "#fff",
              fontWeight: 700,
            }}
          >
            {loading ? "Redirecionando..." : "Entrar com Microsoft"}
          </button>

          {err ? (
            <div style={{ padding: 10, borderRadius: 10, border: "1px solid #f5b5b5" }}>
              {err}
            </div>
          ) : null}
        </div>
      ) : (
        <form onSubmit={onDevSubmit} style={{ display: "grid", gap: 10 }}>
          <label style={{ display: "grid", gap: 6 }}>
            Email
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@local.dev"
              style={{ padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            Senha
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              style={{ padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
            />
          </label>

          {err ? (
            <div style={{ padding: 10, borderRadius: 10, border: "1px solid #f5b5b5" }}>
              {err}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: 12,
              borderRadius: 12,
              border: "1px solid #111",
              background: loading ? "#eee" : "#111",
              color: loading ? "#111" : "#fff",
              fontWeight: 700,
            }}
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      )}
    </main>
  );
}
