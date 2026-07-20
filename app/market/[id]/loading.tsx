import { MarketDetailSkeleton } from "@/components/skeleton";
import { GridBg } from "@/components/grid-bg";

export default function MarketLoading() {
  return (
    <div className="relative min-h-screen bg-veil-900">
      <GridBg className="fixed inset-0 h-full w-full pointer-events-none" />
      <div className="relative mx-auto max-w-4xl px-4 pt-8 pb-16 md:px-6 md:pt-12 lg:px-8">
        <div className="mb-8 h-3 w-28 rounded-sm bg-surface-elevated" />
        <MarketDetailSkeleton />
      </div>
    </div>
  );
}
