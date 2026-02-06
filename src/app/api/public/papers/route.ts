// src/app/api/public/papers/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { asErrorCode } from "@/lib/appError";
import { rateLimit, rateHeaders } from "@/lib/rateLimit";

type Paper = {
  id: string;
  title: string;
  url: string;
  year: number | null;
  venue: string | null;
  citedBy: number;
  authors: string[];
  openAccess: boolean;
  doi: string | null;
};

type SortMode = "cited" | "recent";

function getClientIp(req: Request) {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  const xrip = req.headers.get("x-real-ip");
  if (xrip) return xrip.trim();
  return "unknown";
}

function safeText(v: unknown) {
  return String(v ?? "").replace(/\s+/g, " ").trim();
}

function clampInt(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function isoDateUTC(d: Date) {
  return d.toISOString().slice(0, 10);
}

function sinceDaysUTC(days: number) {
  const now = new Date();
  const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  return { from: isoDateUTC(since), to: isoDateUTC(now), days };
}

function mapPapers(results: any[]): Paper[] {
  return results.map((w: any) => {
    const authors = Array.isArray(w?.authorships)
      ? w.authorships
          .map((a: any) => safeText(a?.author?.display_name))
          .filter(Boolean)
          .slice(0, 4)
      : [];

    const venue = safeText(w?.primary_location?.source?.display_name) || null;

    const id = safeText(w?.id);
    const paperUrl = id || "https://openalex.org";

    const doiRaw = safeText(w?.doi);
    const doi = doiRaw ? doiRaw.replace(/^https?:\/\/doi\.org\//, "") : null;

    const openAccess = Boolean(w?.open_access?.is_oa);

    return {
      id,
      title: safeText(w?.title) || "Sem título",
      url: paperUrl,
      year: typeof w?.publication_year === "number" ? w.publication_year : null,
      venue,
      citedBy: typeof w?.cited_by_count === "number" ? w.cited_by_count : 0,
      authors,
      openAccess,
      doi,
    };
  });
}

async function fetchOpenAlexWorks(params: {
  topic: string;
  perPage: number;
  from?: string;
  to?: string;
  sort: SortMode;
  signal?: AbortSignal;
}) {
  const oa = new URL("https://api.openalex.org/works");
  oa.searchParams.set("search", params.topic);
  oa.searchParams.set("per-page", String(params.perPage));
  oa.searchParams.set("sort", params.sort === "recent" ? "publication_date:desc" : "cited_by_count:desc");
  oa.searchParams.set(
    "select",
    [
      "id",
      "title",
      "publication_year",
      "cited_by_count",
      "primary_location",
      "open_access",
      "doi",
      "authorships",
      "publication_date",
    ].join(",")
  );

  // filtro opcional por janela
  if (params.from && params.to) {
    oa.searchParams.set("filter", `from_publication_date:${params.from},to_publication_date:${params.to}`);
  }

  const res = await fetch(oa.toString(), {
    headers: { "User-Agent": "hub-ic-puc/1.0 (public leaderboard papers)" },
    signal: params.signal,
  });

  const json = await res.json().catch(() => null);
  return { ok: res.ok, json };
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);

    const topic = safeText(url.searchParams.get("topic") ?? "ui ux hci software engineering");
    const perPage = clampInt(Number(url.searchParams.get("perPage") ?? 6) || 6, 3, 8);

    const windowDays = clampInt(Number(url.searchParams.get("window") ?? 90) || 90, 7, 365);
    const range = sinceDaysUTC(windowDays);

    const sortRaw = safeText(url.searchParams.get("sort") ?? "cited").toLowerCase();
    const sort: SortMode = sortRaw === "recent" ? "recent" : "cited";

    // rate limit
    const ip = getClientIp(req);
    const rl = rateLimit(`public-papers:${ip}`, { windowMs: 60_000, max: 30 });
    const baseHeaders = rateHeaders(rl);

    if (!rl.ok) {
      return NextResponse.json({ ok: false, error: "RATE_LIMITED" }, { status: 429, headers: baseHeaders });
    }

    // timeout (assinatura sênior)
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), 8000);

    // 1) tenta com filtro de data (janela móvel)
    const r1 = await fetchOpenAlexWorks({
      topic,
      perPage,
      from: range.from,
      to: range.to,
      sort,
      signal: ac.signal,
    });

    if (!r1.ok || !r1.json) {
      clearTimeout(timer);
      return NextResponse.json({ ok: false, error: "UPSTREAM_FAILED" }, { status: 502, headers: baseHeaders });
    }

    let results = Array.isArray(r1.json?.results) ? r1.json.results : [];

    // 2) fallback: se veio vazio, tenta sem filtro de data
    if (results.length === 0) {
      const r2 = await fetchOpenAlexWorks({ topic, perPage, sort, signal: ac.signal });
      if (r2.ok && r2.json) {
        results = Array.isArray(r2.json?.results) ? r2.json.results : [];
      }
    }

    clearTimeout(timer);

    const papers = mapPapers(results);

    const headersOut = {
      ...baseHeaders,
      // bom para CDN/edge
      "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600",
    };

    return NextResponse.json(
      {
        ok: true,
        windowDays,
        range: { from: range.from, to: range.to },
        topic,
        sort,
        papers,
      },
      { status: 200, headers: headersOut }
    );
  } catch (err) {
    const { code, status } = asErrorCode(err);
    if (typeof status === "number") return NextResponse.json({ ok: false, error: code }, { status });

    console.error("[GET /api/public/papers]", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
