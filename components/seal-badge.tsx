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
        "inline-flex items-center gap-1.5 rounded-sm px-2.5 py-0.5 font-mono text-[10px] font-semibold tracking-[0.15em] uppercase border",
        isSealed
          ? "bg-redaction-bar/50 text-text-muted border-border"
          : "bg-veil-800 text-text-primary border-border-strong",
        className
      )}
    >
      {isSealed ? "■" : "□"}
      {isSealed ? "Sealed" : "Revealed"}
    </span>
  );
}
