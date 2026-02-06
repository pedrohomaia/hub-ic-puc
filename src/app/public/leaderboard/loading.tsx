export default function Loading() {
  return (
    <main className="mx-auto max-w-[980px] p-6">
      <div className="space-y-3">
        <div className="h-8 w-64 animate-pulse rounded bg-white/10" />
        <div className="h-4 w-96 animate-pulse rounded bg-white/10" />
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <div className="h-9 w-28 animate-pulse rounded-lg bg-white/10" />
        <div className="h-9 w-20 animate-pulse rounded-lg bg-white/10" />
        <div className="h-9 w-24 animate-pulse rounded-lg bg-white/10" />
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-white/10">
        <div className="h-12 bg-white/5" />
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-t border-white/10 p-3">
            <div className="h-4 w-10 animate-pulse rounded bg-white/10" />
            <div className="h-4 w-56 animate-pulse rounded bg-white/10" />
            <div className="ml-auto h-4 w-20 animate-pulse rounded bg-white/10" />
          </div>
        ))}
      </div>
    </main>
  );
}
