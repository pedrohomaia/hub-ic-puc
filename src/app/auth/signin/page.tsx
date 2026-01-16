"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

export default function SignInPage() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault();

  if (!email.trim() || !password.trim()) {
    setMsg("Preencha email e senha.");
    return;
  }

  const safeCallbackUrl =
    callbackUrl.startsWith("/") ? callbackUrl : `/${callbackUrl}`;

  setLoading(true);
  setMsg(null);

  const res = await signIn("credentials", {
    redirect: false,
    email: email.trim(),
    password: password.trim(),
    callbackUrl: safeCallbackUrl,
  });

  setLoading(false);
  setMsg(JSON.stringify(res, null, 2));

  if (!res) return;
  if (res.error) return;

  window.location.href = res.url ?? safeCallbackUrl;
}


  return (
    <div style={{ padding: 24 }}>
      <h1>Entrar (DEV)</h1>

      <form
        onSubmit={onSubmit}
        style={{ display: "grid", gap: 12, maxWidth: 360 }}
      >
        <label>
          Email
          <input
            name="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@local.dev"
            style={{ width: "100%", padding: 8 }}
          />
        </label>

        <label>
          Senha
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="admin123"
            style={{ width: "100%", padding: 8 }}
          />
        </label>

        <button type="submit" disabled={loading} style={{ padding: 10 }}>
          {loading ? "Entrando..." : "Entrar"}
        </button>

        {msg && <pre style={{ whiteSpace: "pre-wrap" }}>{msg}</pre>}
      </form>
    </div>
  );
}
