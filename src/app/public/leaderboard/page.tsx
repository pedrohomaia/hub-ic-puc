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
  const periodSafe: "week" | "month" | "30d" = period === "week" || period === "month" || period === "30d" ? period : "week";

  const data = await fetchPublicLeaderboard(periodSafe);

  const linkBase = "/public/leaderboard";

  return (
    <main style={{ padding: 24, maxWidth: 980, margin: "0 auto" }}>
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>Leaderboard público</h1>
      <p style={{ opacity: 0.75, marginTop: 8 }}>
        Período: <b>{data.period}</b> • Desde: {new Date(data.since).toLocaleString()}
      </p>

      <div style={{ marginTop: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <a
          href={`${linkBase}?period=week`}
          style={{
            padding: "8px 12px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.15)",
            textDecoration: "none",
            opacity: periodSafe === "week" ? 1 : 0.7,
          }}
        >
          Semana (ISO)
        </a>
        <a
          href={`${linkBase}?period=month`}
          style={{
            padding: "8px 12px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.15)",
            textDecoration: "none",
            opacity: periodSafe === "month" ? 1 : 0.7,
          }}
        >
          Mês
        </a>
        <a
          href={`${linkBase}?period=30d`}
          style={{
            padding: "8px 12px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.15)",
            textDecoration: "none",
            opacity: periodSafe === "30d" ? 1 : 0.7,
          }}
        >
          30 dias
        </a>
      </div>

      <div
        style={{
          marginTop: 16,
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", background: "rgba(255,255,255,0.06)" }}>
              <th style={{ padding: 12, width: 60 }}>#</th>
              <th style={{ padding: 12 }}>Nome</th>
              <th style={{ padding: 12, width: 120 }}>Pontos</th>
              <th style={{ padding: 12, width: 140 }}>Completions</th>
              <th style={{ padding: 12, width: 110 }}>Top 10</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((it) => (
              <tr key={it.userId} style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                <td style={{ padding: 12 }}>{it.rank}</td>
                <td style={{ padding: 12 }}>{it.name}</td>
                <td style={{ padding: 12 }}>{it.points}</td>
                <td style={{ padding: 12 }}>{it.completions}</td>
                <td style={{ padding: 12 }}>{it.rank <= 10 ? "🏅" : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p style={{ marginTop: 14, opacity: 0.7, fontSize: 13 }}>
        URL compartilhável: <code>{`${linkBase}?period=${periodSafe}`}</code>
      </p>
    </main>
  );
}
