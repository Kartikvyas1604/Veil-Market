import { MarketCardSkeleton } from "@/components/skeleton";
import { GridBg } from "@/components/grid-bg";

export default function MarketsLoading() {
  return (
    <div className="relative min-h-screen bg-veil-900">
      <GridBg className="fixed inset-0 h-full w-full pointer-events-none" />
      <div className="relative mx-auto max-w-7xl px-4 pt-10 pb-16 md:px-6 md:pt-14 lg:px-8">
        <div className="mb-8 space-y-2">
          <div className="h-8 w-32 rounded-sm bg-surface-elevated" />
          <div className="h-3 w-48 rounded-sm bg-surface-elevated" />
        </div>
        <div className="mb-8 flex gap-1">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 w-16 rounded-sm bg-surface-elevated" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <MarketCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
