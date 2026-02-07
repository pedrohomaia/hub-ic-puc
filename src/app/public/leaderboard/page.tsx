// src/app/public/leaderboard/page.tsx
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import CopyLink from "./copy-link";
import PapersSection from "./papers-section";

type Item = {
  rank: number;
  userId: string;
  points: number;
  completions: number;
  name: string;
};

type ApiOk = {
  ok: true;
  period: string;
  since: string;
  page: number;
  pageSize: number;
  items: Item[];
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
  const res = await fetch(`${base}/api/public/leaderboard?${qs.toString()}`, {
    cache: "no-store",
  });

  const parsed: unknown = await res.json().catch(() => null);

  if (!res.ok || !isApiOk(parsed)) {
    const errObj =
      parsed && typeof parsed === "object"
        ? (parsed as Record<string, unknown>)
        : null;

    const err =
      typeof errObj?.error === "string" ? errObj.error : "REQUEST_FAILED";
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

  const periodRaw = (sp.period ?? "week").toLowerCase();
  const period: "week" | "month" | "30d" =
    periodRaw === "week" || periodRaw === "month" || periodRaw === "30d"
      ? periodRaw
      : "week";

  const papersRaw = (sp.papers ?? "cited").toLowerCase();
  const papersSort = papersRaw === "recent" ? "recent" : "cited";

  const data = await fetchPublicLeaderboard(period);

  const linkBase = "/public/leaderboard";
  const linkPath = `${linkBase}?period=${period}&papers=${papersSort}`;

  const top3 = data.items.slice(0, 3);
  const rest = data.items.slice(3);
  const topSlots: Array<Item | null> = [
    top3[0] ?? null,
    top3[1] ?? null,
    top3[2] ?? null,
  ];

  const sinceText = new Date(data.since).toLocaleString();

  return (
    <div className="mx-auto max-w-[980px]">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Leaderboard público</h1>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-foreground/70">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
              Período:{" "}
              <b className="text-foreground">
                {period === "week"
                  ? "Semana"
                  : period === "month"
                  ? "Mês"
                  : "30 dias"}
              </b>
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
              Desde: <span className="text-foreground/90">{sinceText}</span>
            </span>
            <CopyLink path={linkPath} />
          </div>
        </div>

        <div className="text-sm text-foreground/60">
          Acesso público.{" "}
          <span className="text-foreground/80">Protegido contra abuso</span>.
        </div>
      </div>

      {/* Filtros */}
      <div className="mt-5 flex flex-wrap gap-2">
        <PillLink
          href={`${linkBase}?period=week&papers=${papersSort}`}
          active={period === "week"}
        >
          Semana
        </PillLink>
        <PillLink
          href={`${linkBase}?period=month&papers=${papersSort}`}
          active={period === "month"}
        >
          Mês
        </PillLink>
        <PillLink
          href={`${linkBase}?period=30d&papers=${papersSort}`}
          active={period === "30d"}
        >
          30 dias
        </PillLink>
      </div>

      {/* Top 3 */}
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {topSlots.map((u, idx) => {
          const rank = idx + 1;

          if (!u) {
            return (
              <div
                key={`slot-${rank}`}
                className="rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm text-foreground/70">#{rank}</div>
                  <div className="text-lg">{medal(rank)}</div>
                </div>

                <div className="mt-2 text-lg font-semibold text-foreground/80">
                  Próxima posição
                </div>

                <div className="mt-2 text-sm text-foreground/70">
                  Participe de pesquisas e enquetes para aparecer aqui.
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
            <div
              key={u.userId}
              className="rounded-2xl border border-white/10 bg-white/5 p-4"
            >
              <div className="flex items-center justify-between">
                <div className="text-sm text-foreground/70">#{u.rank}</div>
                <div className="text-lg">{medal(u.rank)}</div>
              </div>

              <div className="mt-2 text-lg font-semibold">{u.name}</div>

              <div className="mt-2 text-sm text-foreground/80">
                <b>{u.points}</b> pontos • {u.completions} participações
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabela */}
      {rest.length > 0 && (
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5">
          <div className="overflow-x-auto">
            <table className="min-w-[720px] w-full border-collapse">
              <thead>
                <tr className="bg-white/5 text-left">
                  <th className="p-3 w-[60px]">#</th>
                  <th className="p-3">Nome</th>
                  <th className="p-3 w-[120px]">Pontos</th>
                  <th className="p-3 w-[160px]">Participações</th>
                </tr>
              </thead>
              <tbody>
                {rest.map((it) => (
                  <tr
                    key={it.userId}
                    className="border-t border-white/10 hover:bg-white/5 transition"
                  >
                    <td className="p-3">{it.rank}</td>
                    <td className="p-3">{it.name}</td>
                    <td className="p-3">{it.points}</td>
                    <td className="p-3">{it.completions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Vitrine científica */}
      <PapersSection sort={papersSort} baseHref={linkBase} period={period} />

      {/* Como funciona */}
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-sm text-foreground/70">O que é?</div>
          <div className="mt-1 font-semibold">Engajamento em pesquisas</div>
          <div className="mt-2 text-sm text-foreground/70">
            Ranking público que destaca participação em pesquisas e enquetes
            acadêmicas.
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-sm text-foreground/70">Como participar?</div>
          <div className="mt-1 font-semibold">Responder e estudar</div>
          <div className="mt-2 text-sm text-foreground/70">
            Faça login, participe das pesquisas e aprofunde seu estudo com apoio
            do planner e das leituras recomendadas.
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
          <div className="mt-1 font-semibold">Aberto e estável</div>
          <div className="mt-2 text-sm text-foreground/70">
            Esta página é pública para facilitar divulgação, com limites de uso
            para manter estabilidade.
          </div>
        </div>
      </div>

      <p className="mt-4 text-xs text-foreground/60">
        Dica: compartilhe o link do período usando “Copiar link”.
      </p>
    </div>
  );
}
