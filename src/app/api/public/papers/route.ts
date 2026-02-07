// src/app/api/public/papers/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";

type SortMode = "cited" | "recent";

type PublicPaper = {
  title: string;
  url: string;
  venue?: string;
  year?: number;
  authors?: string[];
  citedBy?: number;
};

function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : {};
}

function asString(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function asNumber(v: unknown): number | undefined {
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

function asArray(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}

function clampInt(v: string | null, def: number, min: number, max: number): number {
  const n = v ? Number.parseInt(v, 10) : NaN;
  if (!Number.isFinite(n)) return def;
  return Math.max(min, Math.min(max, n));
}

function normalizeSort(v: string | null): SortMode {
  return v === "recent" ? "recent" : "cited";
}

function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  const xrip = req.headers.get("x-real-ip");
  if (xrip) return xrip.trim();
  return "unknown";
}

/**
 * OpenAlex work -> PublicPaper
 * Docs (alto nível):
 * - results[] com title, id, publication_year, host_venue.display_name, authorships[].author.display_name, cited_by_count
 * - best_oa_location?.landing_page_url ou primary_location?.landing_page_url
 */
function coerceOpenAlexWork(work: unknown): PublicPaper | null {
  const w = asRecord(work);

  const title = asString(w.title).trim();
  if (!title) return null;

  const publicationYear = asNumber(w.publication_year);

  const hostVenue = asRecord(w.host_venue);
  const venue = asString(hostVenue.display_name).trim() || undefined;

  const citedBy = asNumber(w.cited_by_count);

  // tenta URL aberta primeiro
  const best = asRecord(w.best_oa_location);
  const primary = asRecord(w.primary_location);
  const url =
    asString(best.landing_page_url).trim() ||
    asString(primary.landing_page_url).trim() ||
    asString(w.doi).trim();

  // se vier DOI sem prefixo, transforma
  const normalizedUrl =
    url && url.startsWith("10.") ? `https://doi.org/${url}` : url;

  // autores
  const authorships = asArray(w.authorships);
  const authors = authorships
    .map((a) => {
      const ar = asRecord(a);
      const author = asRecord(ar.author);
      return asString(author.display_name).trim();
    })
    .filter((n) => n.length > 0);

  return {
    title,
    url: normalizedUrl,
    venue,
    year: publicationYear,
    authors: authors.length ? authors : undefined,
    citedBy,
  };
}

export async function GET(req: Request) {
  // endpoint público — sem auth
  // (se quiser rate limit depois, dá pra usar getClientIp aqui)
  const ip = getClientIp(req);
  void ip; // evita warning se você ainda não usa

  const { searchParams } = new URL(req.url);

  // query
  const q = asString(searchParams.get("q")).trim();
  // sort: cited | recent
  const sort = normalizeSort(searchParams.get("sort"));
  // quantidade
  const limit = clampInt(searchParams.get("limit"), 12, 1, 24);

  // Se não vier query, ainda assim retorna algo (papers recentes)
  const encodedQ = encodeURIComponent(q);
  const perPage = limit;

  const sortParam =
    sort === "recent" ? "publication_date:desc" : "cited_by_count:desc";

  // OpenAlex works endpoint
  // - se tiver q: search=...
  // - se não tiver q: só ordena e retorna
  const url =
    q.length > 0
      ? `https://api.openalex.org/works?search=${encodedQ}&per-page=${perPage}&sort=${encodeURIComponent(
          sortParam
        )}`
      : `https://api.openalex.org/works?per-page=${perPage}&sort=${encodeURIComponent(
          sortParam
        )}`;

  const res = await fetch(url, {
    // endpoint público e “vitrine”: não cachear no server
    cache: "no-store",
    headers: {
      "Accept": "application/json",
    },
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: "UPSTREAM_FAILED", status: res.status },
      { status: 502 }
    );
  }

  const raw: unknown = await res.json().catch(() => ({}));
  const obj = asRecord(raw);
  const results = asArray(obj.results);

  const papers = results
    .map(coerceOpenAlexWork)
    .filter((p): p is PublicPaper => Boolean(p && p.url));

  return NextResponse.json(
    {
      sort,
      q,
      count: papers.length,
      papers,
    },
    { status: 200 }
  );
}
