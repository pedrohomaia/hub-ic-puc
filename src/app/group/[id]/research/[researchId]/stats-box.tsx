"use client";

import { useEffect, useState } from "react";

type Props = { researchId: string };

type StatsOk = {
  ok: true;
  researchId: string;
  completionsCount: number;
  verifiedCount: number;
  tokensUsedCount: number;
  tokensTotalCount: number;
};

function asObj(v: unknown): Record<string, unknown> {
  return typeof v === "object" && v !== null ? (v as Record<string, unknown>) : {};
}

export default function StatsBox({ researchId }: Props) {
  const [data, setData] = useState<StatsOk | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    fetch(`/api/research/${researchId}/stats`)
      .then(async (r) => {
        const raw: unknown = await r.json().catch(() => ({}));
        const obj = asObj(raw);
        const apiError = typeof obj.error === "string" ? obj.error : null;

        if (!r.ok) throw new Error(apiError ?? "REQUEST_FAILED");

        // validação mínima do payload
        const ok = obj.ok === true;
        const completionsCount = typeof obj.completionsCount === "number" ? obj.completionsCount : 0;
        const verifiedCount = typeof obj.verifiedCount === "number" ? obj.verifiedCount : 0;
        const tokensUsedCount = typeof obj.tokensUsedCount === "number" ? obj.tokensUsedCount : 0;
        const tokensTotalCount = typeof obj.tokensTotalCount === "number" ? obj.tokensTotalCount : 0;

        if (!ok) throw new Error("INVALID_RESPONSE");

        const parsed: StatsOk = {
          ok: true,
          researchId,
          completionsCount,
          verifiedCount,
          tokensUsedCount,
          tokensTotalCount,
        };
        return parsed;
      })
      .then((json) => {
        if (alive) setData(json);
      })
      .catch((e: unknown) => {
        const msg = e instanceof Error ? e.message : String(e);
        if (alive) setErr(msg);
      });

    return () => {
      alive = false;
    };
  }, [researchId]);

  if (err) {
    return (
      <div style={{ fontSize: 13, opacity: 0.8 }}>
        <strong>Stats:</strong> erro ({err})
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ fontSize: 13, opacity: 0.8 }}>
        <strong>Stats:</strong> carregando...
      </div>
    );
  }

  return (
    <div style={{ fontSize: 13, opacity: 0.9 }}>
      <div>
        <strong>Completions:</strong> {data.completionsCount}
      </div>
      <div>
        <strong>Verified:</strong> {data.verifiedCount}
      </div>
      <div>
        <strong>Tokens used:</strong> {data.tokensUsedCount} / {data.tokensTotalCount}
      </div>
    </div>
  );
}
