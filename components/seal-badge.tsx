import { cn } from "@/lib/utils";

interface SealBadgeProps {
  status: "sealed" | "revealed";
  className?: string;
}

export function SealBadge({ status, className }: SealBadgeProps) {
  const isSealed = status === "sealed";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-mono text-[10px] font-semibold tracking-[0.15em] uppercase",
        isSealed
          ? "bg-veil-sealed/30 text-veil-text-dim border border-veil-sealed/50"
          : "bg-veil-accent/10 text-veil-accent border border-veil-accent/30",
        className
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          isSealed ? "bg-veil-text-muted" : "bg-veil-accent animate-pulse"
        )}
      />
      {isSealed ? "Sealed" : "Revealed"}
    </span>
  );
}
