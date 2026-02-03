import { headers } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type Period = "month" | "week" | "30d";

type LeaderboardItem = {
  rank: number;
  userId: string;
  name?: string | null;
  email?: string | null;
  points: number;
  completions: number;
};

type LeaderboardResponse =
  | { ok: true; items: LeaderboardItem[] }
  | { ok: false; error?: string };

async function getLeaderboard(period: Period): Promise<LeaderboardResponse> {
  // ✅ Next 16+: headers() é async
  const h = await headers();

  const host = h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";

  // fallback local (dev)
  const baseUrl =
    host ? `${proto}://${host}` : (process.env.NEXTAUTH_URL ?? "http://localhost:3000");

  const res = await fetch(`${baseUrl}/api/leaderboard?period=${period}`, {
    cache: "no-store",
  });

  return (await res.json()) as LeaderboardResponse;
}

type Props = {
  searchParams: Promise<{ period?: string }>;
};

export default async function LeaderboardPage({ searchParams }: Props) {
  const sp = await searchParams;

  const raw = (sp.period ?? "month").toLowerCase();
  const period: Period = raw === "week" ? "week" : raw === "30d" ? "30d" : "month";

  const data = await getLeaderboard(period);

  const label =
    period === "month" ? "Mês (atual)" : period === "week" ? "Semana (7 dias)" : "Últimos 30 dias";

  return (
    <main style={{ padding: 24, maxWidth: 900 }}>
      <h1 style={{ marginBottom: 8 }}>Leaderboard</h1>
      <p style={{ opacity: 0.75, marginBottom: 14 }}>{label}</p>

      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <a href="/leaderboard?period=month">Mês</a>
        <a href="/leaderboard?period=week">Semana</a>
        <a href="/leaderboard?period=30d">30 dias</a>
      </div>

      {!data.ok ? (
        <p style={{ color: "crimson" }}>Erro: {data.error ?? "UNKNOWN"}</p>
      ) : data.items.length === 0 ? (
        <p style={{ opacity: 0.8 }}>Ainda sem pontuações neste período.</p>
      ) : (
        <ol style={{ paddingLeft: 18 }}>
          {data.items.map((it) => (
            <li key={it.userId} style={{ marginBottom: 10 }}>
              <div>
                <strong>
                  #{it.rank} {it.name}
                </strong>{" "}
                <span style={{ opacity: 0.7, fontSize: 12 }}>{it.email}</span>
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
