"use client";

import { useMemo, useState } from "react";

export default function CopyLink({ path }: { path: string }) {
  const [copied, setCopied] = useState(false);

  const full = useMemo(() => {
    // tenta usar a URL real do navegador; fallback para o path
    if (typeof window === "undefined") return path;
    return `${window.location.origin}${path}`;
  }, [path]);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(full);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // fallback mínimo
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    }
  }

  return (
    <button
      onClick={onCopy}
      className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10 transition"
      aria-label="Copiar link"
      type="button"
    >
      {copied ? "Copiado!" : "Copiar link"}
    </button>
  );
}
