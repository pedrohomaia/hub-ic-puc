import { headers } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type Period = "month" | "week" | "30d";

type LeaderboardItem = {
  rank: number;
  userId: string;
  name: string | null;
  email: string | null;
  points: number;
  completions: number;
};

type LeaderboardResponse =
  | {
      ok: true;
      period: Period;
      since: string;
      page: number;
      pageSize: number;
      totalUsers: number;
      items: LeaderboardItem[];
      me: LeaderboardItem | null;
    }
  | { ok: false; error?: string };

function clampInt(v: string | undefined, def: number, min: number, max: number) {
  const n = Number(v);
  if (!Number.isFinite(n)) return def;
  const i = Math.floor(n);
  return Math.max(min, Math.min(max, i));
}

async function getLeaderboard(period: Period, page: number, pageSize: number): Promise<LeaderboardResponse> {
  const h = await headers();
  const host = h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";

  const baseUrl = host ? `${proto}://${host}` : (process.env.NEXTAUTH_URL ?? "http://localhost:3000");

  const res = await fetch(
    `${baseUrl}/api/leaderboard?period=${period}&page=${page}&pageSize=${pageSize}`,
    { cache: "no-store" }
  );

  return (await res.json()) as LeaderboardResponse;
}

type Props = {
  searchParams: Promise<{ period?: string; page?: string; pageSize?: string }>;
};

function periodLabel(p: Period) {
  return p === "month" ? "Mês (atual)" : p === "week" ? "Semana (7 dias)" : "Últimos 30 dias";
}

function buildHref(period: Period, page: number, pageSize: number) {
  const sp = new URLSearchParams();
  sp.set("period", period);
  sp.set("page", String(page));
  sp.set("pageSize", String(pageSize));
  return `/leaderboard?${sp.toString()}`;
}

export default async function LeaderboardPage({ searchParams }: Props) {
  const sp = await searchParams;

  const rawPeriod = (sp.period ?? "month").toLowerCase();
  const period: Period = rawPeriod === "week" ? "week" : rawPeriod === "30d" ? "30d" : "month";

  const page = clampInt(sp.page, 1, 1, 10000);
  const pageSize = clampInt(sp.pageSize, 10, 5, 50);

  const data = await getLeaderboard(period, page, pageSize);
  const label = periodLabel(period);

  if (!data.ok) {
    return (
      <main style={{ padding: 24, maxWidth: 900 }}>
        <h1 style={{ marginBottom: 8 }}>Leaderboard</h1>
        <p style={{ color: "crimson" }}>Erro: {data.error ?? "UNKNOWN"}</p>
      </main>
    );
  }

  const totalPages = Math.max(1, Math.ceil(data.totalUsers / data.pageSize));
  const prevPage = Math.max(1, data.page - 1);
  const nextPage = Math.min(totalPages, data.page + 1);

  return (
    <main style={{ padding: 24, maxWidth: 900 }}>
      <h1 style={{ marginBottom: 8 }}>Leaderboard</h1>
      <p style={{ opacity: 0.75, marginBottom: 14 }}>
        {label} <span style={{ opacity: 0.6, fontSize: 12 }}>(desde {data.since.slice(0, 10)})</span>
      </p>

      {/* filtros */}
      <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
        <a href={buildHref("month", 1, pageSize)} style={{ fontWeight: period === "month" ? 700 : 400 }}>
          Mês
        </a>
        <a href={buildHref("week", 1, pageSize)} style={{ fontWeight: period === "week" ? 700 : 400 }}>
          Semana
        </a>
        <a href={buildHref("30d", 1, pageSize)} style={{ fontWeight: period === "30d" ? 700 : 400 }}>
          30 dias
        </a>

        <span style={{ opacity: 0.5 }}>•</span>

        <span style={{ opacity: 0.75 }}>Por página:</span>
        {[10, 20, 50].map((n) => (
          <a key={n} href={buildHref(period, 1, n)} style={{ fontWeight: pageSize === n ? 700 : 400 }}>
            {n}
          </a>
        ))}
      </div>

      {/* minha posição */}
      {data.me ? (
        <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 12, marginBottom: 14 }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Sua posição</div>
          <div style={{ opacity: 0.9 }}>
            <strong>#{data.me.rank}</strong> — {data.me.points} pts • {data.me.completions} completions
          </div>
          <div style={{ fontSize: 12, opacity: 0.65, marginTop: 4 }}>
            {data.me.name ?? "Sem nome"} {data.me.email ? `• ${data.me.email}` : ""}
          </div>
        </div>
      ) : (
        <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 12, marginBottom: 14, opacity: 0.8 }}>
          Faça login e participe para aparecer no ranking.
        </div>
      )}

      {/* paginação */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <a
          href={buildHref(period, prevPage, pageSize)}
          style={{ pointerEvents: data.page <= 1 ? "none" : "auto", opacity: data.page <= 1 ? 0.5 : 1 }}
        >
          ← Anterior
        </a>
        <div style={{ opacity: 0.75, fontSize: 13 }}>
          Página <strong>{data.page}</strong> de <strong>{totalPages}</strong> • {data.totalUsers} usuários
        </div>
        <a
          href={buildHref(period, nextPage, pageSize)}
          style={{ pointerEvents: data.page >= totalPages ? "none" : "auto", opacity: data.page >= totalPages ? 0.5 : 1 }}
        >
          Próxima →
        </a>
      </div>

      {/* lista */}
      {data.items.length === 0 ? (
        <p style={{ opacity: 0.8 }}>Ainda sem pontuações neste período.</p>
      ) : (
        <ol style={{ paddingLeft: 18 }}>
          {data.items.map((it) => (
            <li key={it.userId} style={{ marginBottom: 10 }}>
              <div>
                <strong>
                  #{it.rank} {it.name ?? "Sem nome"}
                </strong>{" "}
                <span style={{ opacity: 0.7, fontSize: 12 }}>{it.email ?? ""}</span>
              </div>
              <div style={{ opacity: 0.85 }}>
                Pontos: <strong>{it.points}</strong> • Completions: {it.completions}
              </div>
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}
