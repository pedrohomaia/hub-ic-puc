// src/app/public/leaderboard/page.tsx
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import CopyLink from "./copy-link";

type Item = {
  rank: number;
  userId: string;
  points: number;
  completions: number;
  name: string;
  top10?: boolean;
};

type ApiOk = {
  ok: true;
  period: string;
  since: string;
  page: number;
  pageSize: number;
  items: Item[];
};

type ApiErr = {
  ok?: false;
  error?: string;
};

function isApiOk(v: unknown): v is ApiOk {
  if (!v || typeof v !== "object") return false;
  const obj = v as Record<string, unknown>;
  return obj.ok === true && Array.isArray(obj.items);
}

async function fetchPublicLeaderboard(period: string): Promise<ApiOk> {
  const qs = new URLSearchParams();
  qs.set("period", period);
  qs.set("page", "1");
  qs.set("pageSize", "20");

  const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const res = await fetch(`${base}/api/public/leaderboard?${qs.toString()}`, { cache: "no-store" });

  const parsed: unknown = await res.json().catch(() => null);

  if (!res.ok || !isApiOk(parsed)) {
    const errObj = (parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null) as
      | (ApiErr & Record<string, unknown>)
      | null;

    const err = typeof errObj?.error === "string" ? errObj.error : "REQUEST_FAILED";
    throw new Error(err);
  }

  return parsed;
}

function PillLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={[
        "rounded-full border px-3 py-2 text-sm transition",
        active
          ? "border-white/25 bg-white/10 text-foreground"
          : "border-white/10 bg-white/5 text-foreground/80 hover:bg-white/10 hover:text-foreground",
      ].join(" ")}
    >
      {children}
    </Link>
  );
}

function medal(rank: number) {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return "🏅";
}

export default async function PublicLeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const period = (sp.period ?? "week").toLowerCase();
  const periodSafe: "week" | "month" | "30d" =
    period === "week" || period === "month" || period === "30d" ? period : "week";

  const data = await fetchPublicLeaderboard(periodSafe);

  const linkPath = `/public/leaderboard?period=${periodSafe}`;
  const linkBase = "/public/leaderboard";

  const top3 = data.items.slice(0, 3);
  const rest = data.items.slice(3);

  // sempre renderizar 3 slots (C)
  const topSlots: Array<Item | null> = [top3[0] ?? null, top3[1] ?? null, top3[2] ?? null];

  const sinceText = new Date(data.since).toLocaleString();

  return (
    <div className="mx-auto max-w-[980px]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Leaderboard público</h1>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-foreground/70">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
              Período: <b className="text-foreground">{data.period}</b>
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
              Desde: <span className="text-foreground/90">{sinceText}</span>
            </span>
            <CopyLink path={linkPath} />
          </div>
        </div>

        <div className="text-sm text-foreground/60">
          Público, sem login. <span className="text-foreground/80">Rate limit</span> ativo por IP.
        </div>
      </div>

      {/* Filtros (G) */}
      <div className="mt-5 flex flex-wrap gap-2">
        <PillLink href={`${linkBase}?period=week`} active={periodSafe === "week"}>
          Semana (ISO)
        </PillLink>
        <PillLink href={`${linkBase}?period=month`} active={periodSafe === "month"}>
          Mês
        </PillLink>
        <PillLink href={`${linkBase}?period=30d`} active={periodSafe === "30d"}>
          30 dias
        </PillLink>
      </div>

      {/* Top 3 (C) */}
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {topSlots.map((u, idx) => {
          const rank = idx + 1;

          if (!u) {
            return (
              <div key={`slot-${rank}`} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-foreground/70">#{rank}</div>
                  <div className="text-lg">{medal(rank)}</div>
                </div>

                <div className="mt-2 text-lg font-semibold text-foreground/80">Vaga aberta</div>

                <div className="mt-2 text-sm text-foreground/70">
                  Seja o próximo a aparecer aqui.
                </div>

                <div className="mt-4">
                  <Link
                    href="/research"
                    className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10 transition"
                  >
                    Ver pesquisas
                  </Link>
                </div>
              </div>
            );
          }

          return (
            <div key={u.userId} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-foreground/70">#{u.rank}</div>
                <div className="text-lg">{medal(u.rank)}</div>
              </div>

              <div className="mt-2 text-lg font-semibold">{u.name}</div>

              <div className="mt-2 text-sm text-foreground/80">
                <b>{u.points}</b> pts • {u.completions} completions
              </div>

              <div className="mt-3 text-xs text-foreground/60">
                Top 10: {u.rank <= 10 ? "✅" : "—"}
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabela ou Empty State (A) */}
      {rest.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="text-sm text-foreground/70">Sem dados suficientes</div>
          <div className="mt-1 text-lg font-semibold">Ainda não há pontuações para listar</div>
          <div className="mt-2 text-sm text-foreground/70">
            Quando mais pessoas participarem, o ranking completo aparece aqui.
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/research"
              className="rounded-full bg-white/10 px-3 py-2 text-sm hover:bg-white/15 transition"
            >
              Participar (entrar)
            </Link>
            <Link
              href={`${linkBase}?period=30d`}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10 transition"
            >
              Ver 30 dias
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5">
          <div className="overflow-x-auto">
            <table className="min-w-[720px] w-full border-collapse">
              <thead>
                <tr className="bg-white/5 text-left">
                  <th className="p-3 w-[60px]">#</th>
                  <th className="p-3">Nome</th>
                  <th className="p-3 w-[120px]">Pontos</th>
                  <th className="p-3 w-[140px]">Completions</th>
                  <th className="p-3 w-[110px]">Top 10</th>
                </tr>
              </thead>
              <tbody>
                {rest.map((it) => (
                  <tr key={it.userId} className="border-t border-white/10 hover:bg-white/5 transition">
                    <td className="p-3">{it.rank}</td>
                    <td className="p-3">{it.name}</td>
                    <td className="p-3">{it.points}</td>
                    <td className="p-3">{it.completions}</td>
                    <td className="p-3">{it.rank <= 10 ? "🏅" : ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Como funciona (I) */}
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-sm text-foreground/70">O que é isso?</div>
          <div className="mt-1 font-semibold">Ranking público do Hub</div>
          <div className="mt-2 text-sm text-foreground/70">
            Mostra pontos e completions por período, sem exigir login.
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-sm text-foreground/70">Como entrar?</div>
          <div className="mt-1 font-semibold">Participe de uma pesquisa</div>
          <div className="mt-2 text-sm text-foreground/70">
            Faça login e complete pesquisas para aparecer no ranking.
          </div>
          <div className="mt-3">
            <Link
              href="/auth/signin"
              className="inline-flex rounded-full bg-white/10 px-3 py-2 text-sm hover:bg-white/15 transition"
            >
              Entrar
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-sm text-foreground/70">Sobre o acesso</div>
          <div className="mt-1 font-semibold">Seguro e controlado</div>
          <div className="mt-2 text-sm text-foreground/70">
            Endpoint público com rate limit por IP para evitar abuso.
          </div>
        </div>
      </div>

      <p className="mt-4 text-xs text-foreground/60">
        Dica: compartilhe o link do período com o botão “Copiar link”.
      </p>
    </div>
  );
}
