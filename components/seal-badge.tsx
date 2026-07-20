import { cn } from "@/lib/utils";
import type { Urgency } from "@/lib/utils";

interface SealBadgeProps {
  status: "sealed" | "revealed";
  urgency?: Urgency;
  className?: string;
}

export function SealBadge({ status, urgency = "normal", className }: SealBadgeProps) {
  const isSealed = status === "sealed";

  const urgencyStyles = {
    critical: isSealed
      ? "bg-redaction-bar border-2 border-text-muted/60 badge-pulse"
      : "bg-veil-800 border-2 border-text-primary/40",
    normal: isSealed
      ? "bg-redaction-bar/50 border border-border"
      : "bg-veil-800 border border-border-strong",
    low: isSealed
      ? "bg-transparent border border-border/60 text-text-muted/70"
      : "bg-transparent border border-border-strong/60 text-text-secondary",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm px-2.5 py-0.5 font-mono text-[10px] font-semibold tracking-[0.15em] uppercase",
        urgencyStyles[urgency],
        className
      )}
    >
      {isSealed ? "■" : "□"}
      {isSealed ? "Sealed" : "Revealed"}
    </span>
  );
}
