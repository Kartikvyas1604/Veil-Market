"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface OddsTickerProps {
  value: number;
  label?: string;
  size?: "sm" | "md" | "lg";
  animated?: boolean;
  redacted?: boolean;
  className?: string;
}

export function OddsTicker({
  value,
  label,
  size = "md",
  animated = true,
  redacted = false,
  className,
}: OddsTickerProps) {
  const [display, setDisplay] = useState(animated ? 0 : value);
  const frameRef = useRef(0);

  useEffect(() => {
    if (!animated) {
      setDisplay(value);
      return;
    }

    let cancelled = false;
    const start = performance.now();
    const duration = 800;

    const tick = (now: number) => {
      if (cancelled) return;
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(value * eased);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      }
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      cancelAnimationFrame(frameRef.current);
    };
  }, [value, animated]);

  const percent = (display * 100).toFixed(1);

  const sizeClasses = {
    sm: "text-sm",
    md: "text-2xl",
    lg: "text-4xl md:text-5xl",
  };

  if (redacted) {
    return (
      <div className={cn("flex flex-col items-baseline gap-1", className)}>
        <div className="redaction-bar h-8 w-20 md:h-12 md:w-28 rounded-sm" />
        {label && (
          <span className="font-mono text-[10px] tracking-[0.2em] text-text-muted uppercase">
            {label}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col items-baseline gap-1", className)}>
      <span
        className={cn(
          "font-mono font-bold tabular-nums text-text-primary",
          sizeClasses[size]
        )}
      >
        {percent}
        <span className="text-text-muted ml-0.5">%</span>
      </span>
      {label && (
        <span className="font-mono text-[10px] tracking-[0.2em] text-text-muted uppercase">
          {label}
        </span>
      )}
    </div>
  );
}
