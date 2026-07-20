import { cn } from "@/lib/utils";

export function MarketCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-lg border border-veil-border bg-veil-surface/30 p-5",
        className
      )}
      aria-busy="true"
      aria-label="Loading market"
    >
      {/* Top row skeleton */}
      <div className="mb-3 flex items-center justify-between">
        <div className="h-3 w-16 rounded bg-veil-elevated" />
        <div className="h-4 w-16 rounded-full bg-veil-elevated" />
      </div>

      {/* Title skeleton */}
      <div className="mb-4 space-y-2">
        <div className="h-4 w-full rounded bg-veil-elevated" />
        <div className="h-4 w-3/4 rounded bg-veil-elevated" />
      </div>

      {/* Odds skeleton */}
      <div className="mb-4 flex gap-6">
        <div className="space-y-1">
          <div className="h-6 w-14 rounded bg-veil-elevated" />
          <div className="h-2 w-8 rounded bg-veil-elevated" />
        </div>
        <div className="space-y-1">
          <div className="h-6 w-14 rounded bg-veil-elevated" />
          <div className="h-2 w-8 rounded bg-veil-elevated" />
        </div>
      </div>

      {/* Bottom row skeleton */}
      <div className="flex items-center justify-between border-t border-veil-border pt-3">
        <div className="h-3 w-20 rounded bg-veil-elevated" />
        <div className="h-3 w-12 rounded bg-veil-elevated" />
      </div>
    </div>
  );
}

export function MarketDetailSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading market details">
      {/* Header skeleton */}
      <div className="space-y-3">
        <div className="flex gap-3">
          <div className="h-3 w-16 rounded bg-veil-elevated" />
          <div className="h-4 w-16 rounded-full bg-veil-elevated" />
        </div>
        <div className="space-y-2">
          <div className="h-6 w-full rounded bg-veil-elevated" />
          <div className="h-6 w-2/3 rounded bg-veil-elevated" />
        </div>
      </div>

      {/* Odds panel skeleton */}
      <div className="rounded-lg border border-veil-border bg-veil-surface/50 p-6">
        <div className="mb-4 h-3 w-20 rounded bg-veil-elevated" />
        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-2">
            <div className="h-12 w-24 rounded bg-veil-elevated" />
            <div className="h-3 w-16 rounded bg-veil-elevated" />
          </div>
          <div className="space-y-2">
            <div className="h-12 w-24 rounded bg-veil-elevated" />
            <div className="h-3 w-16 rounded bg-veil-elevated" />
          </div>
        </div>
        <div className="mt-6 space-y-2">
          <div className="h-1 w-full rounded-full bg-veil-elevated" />
          <div className="flex justify-between">
            <div className="h-2 w-8 rounded bg-veil-elevated" />
            <div className="h-2 w-8 rounded bg-veil-elevated" />
          </div>
        </div>
      </div>
    </div>
  );
}
