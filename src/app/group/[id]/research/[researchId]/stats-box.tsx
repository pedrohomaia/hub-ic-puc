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

export default function StatsBox({ researchId }: Props) {
  const [data, setData] = useState<StatsOk | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    fetch(`/api/research/${researchId}/stats`)
      .then(async (r) => {
        const json = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error((json as any)?.error ?? "REQUEST_FAILED");
        return json as StatsOk;
      })
      .then((json) => {
        if (alive) setData(json);
      })
      .catch((e: any) => {
        if (alive) setErr(String(e?.message ?? "REQUEST_FAILED"));
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
