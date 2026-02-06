"use client";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  const code = error?.message || "REQUEST_FAILED";

  return (
    <div className="mx-auto max-w-[980px]">
      <h1 className="text-2xl font-bold">Leaderboard público</h1>

      <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
        <p className="font-medium">Não deu pra carregar agora.</p>

        <p className="mt-1 text-sm text-foreground/80">
          Código: <code className="rounded bg-black/30 px-2 py-0.5">{code}</code>
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={() => reset()}
            className="rounded-full bg-white/10 px-3 py-2 text-sm hover:bg-white/15 transition"
          >
            Tentar novamente
          </button>

          <a
            href="/public/leaderboard?period=week"
            className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10 transition"
          >
            Voltar (Semana)
          </a>

          <a
            href="/auth/signin"
            className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10 transition"
          >
            Entrar
          </a>
        </div>
      </div>
    </div>
  );
}
