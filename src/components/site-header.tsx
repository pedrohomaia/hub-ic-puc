// src/components/site-header.tsx
import Link from "next/link";

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-4">
          <Link href="/research" className="font-semibold tracking-tight">
            Hub IC PUC
          </Link>

          <nav className="hidden items-center gap-3 text-sm text-foreground/80 sm:flex">
            <Link href="/research" className="hover:text-foreground transition-colors">
              Research
            </Link>
            <Link href="/public/leaderboard" className="hover:text-foreground transition-colors">
              Leaderboard público
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/auth/signin"
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10 transition"
          >
            Entrar
          </Link>
        </div>
      </div>
    </header>
  );
}
