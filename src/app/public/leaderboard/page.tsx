// src/app/public/leaderboard/page.tsx
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

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

  const linkBase = "/public/leaderboard";

  const top3 = data.items.slice(0, 3);
  const rest = data.items.slice(3);

  return (
    <main className="mx-auto max-w-[980px] p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Leaderboard público</h1>
          <p className="mt-2 text-sm opacity-75">
            Período: <b>{data.period}</b> • Desde: {new Date(data.since).toLocaleString()}
          </p>
        </div>

        <div className="mt-3 text-sm opacity-70 sm:mt-0">
          Link:{" "}
          <code className="rounded bg-white/10 px-2 py-1">{`/public/leaderboard?period=${periodSafe}`}</code>
        </div>
      </div>

      {/* Filtros */}
      <div className="mt-5 flex flex-wrap gap-2">
        <a
          href={`${linkBase}?period=week`}
          className={`rounded-lg border px-3 py-2 text-sm ${
            periodSafe === "week"
              ? "border-white/30 bg-white/10"
              : "border-white/15 opacity-80 hover:bg-white/5"
          }`}
        >
          Semana (ISO)
        </a>
        <a
          href={`${linkBase}?period=month`}
          className={`rounded-lg border px-3 py-2 text-sm ${
            periodSafe === "month"
              ? "border-white/30 bg-white/10"
              : "border-white/15 opacity-80 hover:bg-white/5"
          }`}
        >
          Mês
        </a>
        <a
          href={`${linkBase}?period=30d`}
          className={`rounded-lg border px-3 py-2 text-sm ${
            periodSafe === "30d"
              ? "border-white/30 bg-white/10"
              : "border-white/15 opacity-80 hover:bg-white/5"
          }`}
        >
          30 dias
        </a>
      </div>

      {/* Top 3 */}
      {top3.length > 0 ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {top3.map((u) => (
            <div key={u.userId} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm opacity-80">#{u.rank}</div>
                <div className="text-lg">{u.rank === 1 ? "🥇" : u.rank === 2 ? "🥈" : "🥉"}</div>
              </div>

              <div className="mt-2 text-lg font-semibold">{u.name}</div>

              <div className="mt-2 text-sm opacity-80">
                <b>{u.points}</b> pts • {u.completions} completions
              </div>

              <div className="mt-3 text-xs opacity-60">Top 10: ✅</div>
            </div>
          ))}
        </div>
      ) : null}

      {/* Tabela (4º em diante) */}
      <div className="mt-6 overflow-hidden rounded-xl border border-white/10">
        <table className="w-full border-collapse">
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
              <tr key={it.userId} className="border-t border-white/10">
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

      <p className="mt-4 text-xs opacity-60">Público e sem login. Rate limit ativo por IP.</p>
    </main>
  );
}
