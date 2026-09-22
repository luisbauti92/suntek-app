export function ProductCardSkeleton() {
  return (
    <div className="flex w-full animate-pulse items-start gap-3 rounded-lg bg-zinc-900/50 p-3">
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <div className="h-3.5 w-14 rounded bg-zinc-800"></div>
          <div className="h-3.5 w-32 rounded bg-zinc-800"></div>
        </div>
        <div className="h-2.5 w-20 rounded bg-zinc-800/60"></div>
        <div className="flex items-baseline gap-2">
          <div className="h-4 w-20 rounded bg-zinc-800"></div>
          <div className="h-3 w-24 rounded bg-zinc-800/60"></div>
        </div>
        <div className="h-2.5 w-40 rounded bg-zinc-800/50"></div>
      </div>
      <div className="mt-0.5 h-4 w-4 shrink-0 rounded bg-zinc-800"></div>
    </div>
  );
}
