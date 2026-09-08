export function ProductCardSkeleton() {
  return (
    <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-3.5 flex items-center justify-between gap-3 animate-pulse">
      <div className="flex-1 min-w-0 space-y-2.5">
        {/* Title & Badge */}
        <div className="flex items-center gap-2">
          <div className="w-12 h-4 rounded bg-zinc-800"></div>
          <div className="w-48 h-4 rounded bg-zinc-800"></div>
        </div>

        {/* Pricing pills */}
        <div className="flex items-center gap-2">
          <div className="w-24 h-6 rounded-xl bg-zinc-800/90"></div>
          <div className="w-20 h-6 rounded-xl bg-zinc-800/60"></div>
        </div>

        {/* Stock counters */}
        <div className="flex items-center gap-2">
          <div className="w-20 h-3 rounded bg-zinc-800/50"></div>
          <div className="w-20 h-3 rounded bg-zinc-800/50"></div>
        </div>
      </div>

      {/* Button placeholder */}
      <div className="w-11 h-11 rounded-2xl bg-zinc-800 shrink-0"></div>
    </div>
  );
}
