// src/app/public/leaderboard/papers-section.tsx
import Link from "next/link";

type SortMode = "cited" | "recent";

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

type ApiOk = {
  ok: true;
  windowDays: number;
  range: { from: string; to: string };
  topic: string;
  sort?: SortMode;
  papers: Paper[];
};

function isApiOk(v: unknown): v is ApiOk {
  if (!v || typeof v !== "object") return false;
  const o = v as any;
  return o.ok === true && Array.isArray(o.papers);
}

async function fetchPapers(sort: SortMode): Promise<ApiOk> {
  const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  const res = await fetch(
    `${base}/api/public/papers?perPage=6&window=90&sort=${sort}`,
    { next: { revalidate: 600 } }
  );

  const parsed: unknown = await res.json().catch(() => null);

  // fallback silencioso (não quebra a página)
  if (!res.ok || !isApiOk(parsed)) {
    return {
      ok: true,
      windowDays: 90,
      range: { from: "", to: "" },
      topic: "",
      sort,
      papers: [],
    };
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

export default async function PapersSection({
  sort = "cited",
  baseHref = "/public/leaderboard",
  period = "week",
}: {
  sort?: SortMode;
  baseHref?: string;
  period?: string;
}) {
  const data = await fetchPapers(sort);
  const papers = data.papers ?? [];

  return (
    <section className="mt-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-sm text-foreground/70">Vitrine científica</div>
          <h2 className="mt-1 text-xl font-semibold">Leituras recomendadas</h2>
          <p className="mt-1 text-sm text-foreground/70">
            Artigos públicos (OpenAlex) para apoiar pesquisas, responder enquetes
            com mais embasamento e aprofundar o estudo individual.
            <span className="ml-1">Janela: {data.windowDays} dias.</span>
          </p>
        </div>

        <div className="text-xs text-foreground/60">
          {data.range?.from ? (
            <span>
              Período analisado:{" "}
              <span className="text-foreground/80">{data.range.from}</span> →{" "}
              <span className="text-foreground/80">{data.range.to}</span>
            </span>
          ) : (
            <span>Fonte: OpenAlex</span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-3 flex flex-wrap gap-2">
        <PillLink
          href={`${baseHref}?period=${period}&papers=cited`}
          active={sort === "cited"}
        >
          Mais citados
        </PillLink>
        <PillLink
          href={`${baseHref}?period=${period}&papers=recent`}
          active={sort === "recent"}
        >
          Mais recentes
        </PillLink>
      </div>

      {/* Conteúdo */}
      {papers.length === 0 ? (
        <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-sm text-foreground/70">
            Nenhuma recomendação disponível no momento
          </div>
          <div className="mt-1 text-sm text-foreground/70">
            Esta vitrine é atualizada automaticamente e não interfere no uso do Hub.
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href={`/api/public/papers?perPage=6&window=365&sort=${sort}`}
              target="_blank"
              className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10 transition"
            >
              Abrir fonte (JSON)
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {papers.map((p) => (
            <article
              key={p.id}
              className="rounded-2xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="text-sm font-medium leading-snug line-clamp-2">
                  {(p.title ?? "Sem título").trim()}
                </div>

                <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-foreground/70">
                  {p.openAccess ? "Open access" : "Acesso restrito"}
                </span>
              </div>

              <div className="mt-2 text-xs text-foreground/70 line-clamp-1">
                {p.authors.length ? p.authors.join(", ") : "Autores não informados"}
              </div>

              <div className="mt-3 flex flex-wrap gap-2 text-xs text-foreground/60">
                {p.venue && (
                  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1">
                    {p.venue}
                  </span>
                )}
                {p.year && (
                  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1">
                    {p.year}
                  </span>
                )}
                <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1">
                  {p.citedBy} citações
                </span>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Link
                  href={p.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex rounded-full bg-white/10 px-3 py-1.5 text-sm hover:bg-white/15 transition"
                >
                  Ver no OpenAlex
                </Link>

                {p.doi && (
                  <Link
                    href={`https://doi.org/${p.doi}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10 transition"
                  >
                    DOI
                  </Link>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
