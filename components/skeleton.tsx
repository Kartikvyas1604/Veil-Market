import { cn } from "@/lib/utils";

export function MarketCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-sm border border-border bg-surface-raised p-5",
        className
      )}
      aria-busy="true"
      aria-label="Loading market"
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="h-3 w-16 rounded-sm bg-surface-elevated" />
        <div className="h-4 w-16 rounded-sm bg-surface-elevated" />
      </div>
      <div className="mb-4 space-y-2">
        <div className="redaction-bar h-4 w-full rounded-sm" />
        <div className="redaction-bar h-4 w-3/4 rounded-sm" />
      </div>
      <div className="mb-4 flex gap-6">
        <div className="space-y-1">
          <div className="redaction-bar h-6 w-14 rounded-sm" />
          <div className="h-2 w-8 rounded-sm bg-surface-elevated" />
        </div>
        <div className="space-y-1">
          <div className="redaction-bar h-6 w-14 rounded-sm" />
          <div className="h-2 w-8 rounded-sm bg-surface-elevated" />
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-border pt-3">
        <div className="h-3 w-20 rounded-sm bg-surface-elevated" />
        <div className="h-3 w-12 rounded-sm bg-surface-elevated" />
      </div>
    </div>
  );
}

export function MarketDetailSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading market details">
      <div className="space-y-3">
        <div className="flex gap-3">
          <div className="h-3 w-16 rounded-sm bg-surface-elevated" />
          <div className="h-4 w-16 rounded-sm bg-surface-elevated" />
        </div>
        <div className="space-y-2">
          <div className="redaction-bar h-6 w-full rounded-sm" />
          <div className="redaction-bar h-6 w-2/3 rounded-sm" />
        </div>
      </div>
      <div className="rounded-sm border border-border bg-surface-raised p-6">
        <div className="mb-4 h-3 w-20 rounded-sm bg-surface-elevated" />
        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-2">
            <div className="redaction-bar h-12 w-24 rounded-sm" />
            <div className="h-3 w-16 rounded-sm bg-surface-elevated" />
          </div>
          <div className="space-y-2">
            <div className="redaction-bar h-12 w-24 rounded-sm" />
            <div className="h-3 w-16 rounded-sm bg-surface-elevated" />
          </div>
        </div>
        <div className="mt-6 space-y-2">
          <div className="h-1 w-full rounded-full bg-surface-elevated" />
        </div>
      </div>
    </div>
  );
}
