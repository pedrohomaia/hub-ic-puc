// src/app/me/page.tsx
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import type { ReactNode } from "react";

import {
  getPointsSinceByUser,
  getPointsTotalByUser,
  startOfCurrentMonthUTC,
} from "@/lib/points.repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function BadgePill({ children }: { children: ReactNode }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "2px 8px",
        borderRadius: 999,
        border: "1px solid #eee",
        fontSize: 12,
      }}
    >
      {children}
    </span>
  );
}

function badgeLabel(code: string) {
  const map: Record<string, string> = {
    BRONZE_1: "Bronze I",
    BRONZE_2: "Bronze II",
    BRONZE_3: "Bronze III",
    VERIFIED_1: "Verificada",
  };
  return map[code] ?? code;
}

export default async function MePage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/signin");

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, email: true, name: true },
  });

  // ✅ ledger: total e mês atual (igual leaderboard)
  const total = await getPointsTotalByUser(user.id);
  const since = startOfCurrentMonthUTC();
  const month = await getPointsSinceByUser(user.id, since);

  const badges = await prisma.userBadge.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: { code: true, createdAt: true },
  });

  const completions = await prisma.completion.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 30,
    select: {
      createdAt: true,
      pointsAwarded: true,
      type: true,
      research: { select: { id: true, title: true } },
    },
  });

  const hasVerifiedCompletion = completions.some((c) => c.type === "VERIFIED");
  const hasVerifiedBadge = badges.some((b) => b.code === "VERIFIED_1");
  const isVerified = hasVerifiedBadge || hasVerifiedCompletion;

  return (
    <main style={{ padding: 24, maxWidth: 900 }}>
      <h1 style={{ marginBottom: 8 }}>/me</h1>

      <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 12, marginBottom: 16 }}>
        <div>
          <strong>{dbUser?.name ?? "Sem nome"}</strong>
        </div>
        <div style={{ opacity: 0.8 }}>{dbUser?.email}</div>

        <div style={{ marginTop: 8, display: "grid", gap: 6 }}>
          <div>
            Pontos (Total): <strong>{total.points}</strong> — Completions:{" "}
            <strong>{total.completions}</strong>
          </div>
          <div style={{ opacity: 0.8, fontSize: 13 }}>
            Pontos (Mês atual): <strong>{month.points}</strong> — Completions:{" "}
            <strong>{month.completions}</strong>{" "}
            <span style={{ marginLeft: 8, opacity: 0.7 }}>
              (desde {since.toISOString().slice(0, 10)})
            </span>
          </div>
        </div>

        <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
          {isVerified ? <BadgePill>✅ Verificada</BadgePill> : <BadgePill>⏳ Não verificada</BadgePill>}
        </div>
      </div>

      <h2 style={{ marginBottom: 8 }}>Badges</h2>
      {badges.length === 0 ? (
        <p style={{ opacity: 0.8 }}>Nenhum badge ainda.</p>
      ) : (
        <ul style={{ paddingLeft: 18 }}>
          {badges.map((b, i) => (
            <li key={i}>
              <BadgePill>{badgeLabel(String(b.code))}</BadgePill>{" "}
              <span style={{ opacity: 0.6, fontSize: 12 }}>
                ({new Date(b.createdAt).toLocaleString()})
              </span>
            </li>
          ))}
        </ul>
      )}

      <h2 style={{ marginTop: 18, marginBottom: 8 }}>Histórico</h2>
      {completions.length === 0 ? (
        <p style={{ opacity: 0.8 }}>Nenhuma completion ainda.</p>
      ) : (
        <ul style={{ paddingLeft: 18 }}>
          {completions.map((c, i) => (
            <li key={i} style={{ marginBottom: 6 }}>
              <a href={`/research/${c.research.id}`} style={{ textDecoration: "none" }}>
                {c.research.title}
              </a>{" "}
              —{" "}
              {c.type === "VERIFIED" ? (
                <BadgePill>✅ Verificada</BadgePill>
              ) : (
                <span style={{ opacity: 0.8 }}>{c.type}</span>
              )}{" "}
              — +{c.pointsAwarded} pts{" "}
              <span style={{ opacity: 0.6, fontSize: 12 }}>
                ({new Date(c.createdAt).toLocaleString()})
              </span>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
