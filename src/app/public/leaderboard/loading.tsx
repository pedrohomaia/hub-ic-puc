export default function Loading() {
  return (
    <div className="mx-auto max-w-[980px]">
      <div className="space-y-3">
        <div className="h-8 w-64 animate-pulse rounded bg-white/10" />
        <div className="h-4 w-[520px] animate-pulse rounded bg-white/10" />
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <div className="h-10 w-28 animate-pulse rounded-full bg-white/10" />
        <div className="h-10 w-20 animate-pulse rounded-full bg-white/10" />
        <div className="h-10 w-24 animate-pulse rounded-full bg-white/10" />
        <div className="ml-auto h-10 w-28 animate-pulse rounded-full bg-white/10" />
      </div>

      {/* Top 3 skeleton */}
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between">
              <div className="h-4 w-10 animate-pulse rounded bg-white/10" />
              <div className="h-6 w-6 animate-pulse rounded bg-white/10" />
            </div>
            <div className="mt-3 h-5 w-40 animate-pulse rounded bg-white/10" />
            <div className="mt-2 h-4 w-56 animate-pulse rounded bg-white/10" />
            <div className="mt-4 h-3 w-24 animate-pulse rounded bg-white/10" />
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
        <div className="h-12 bg-white/5" />
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-t border-white/10 p-3">
            <div className="h-4 w-10 animate-pulse rounded bg-white/10" />
            <div className="h-4 w-56 animate-pulse rounded bg-white/10" />
            <div className="ml-auto h-4 w-20 animate-pulse rounded bg-white/10" />
          </div>
        ))}
      </div>
    </div>
  );
}
