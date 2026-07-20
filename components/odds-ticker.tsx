"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface OddsTickerProps {
  value: number;
  label?: string;
  size?: "sm" | "md" | "lg";
  animated?: boolean;
  className?: string;
}

export function OddsTicker({
  value,
  label,
  size = "md",
  animated = true,
  className,
}: OddsTickerProps) {
  const [display, setDisplay] = useState(animated ? 0 : value);
  const frameRef = useRef<number>(0);
  const prefersReduced = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    prefersReduced.current = mq.matches;
  }, []);

  useEffect(() => {
    if (!animated || prefersReduced.current) {
      setDisplay(value);
      return;
    }

    const start = performance.now();
    const from = display;
    const duration = 800;

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(from + (value - from) * eased);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      }
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, animated]);

  const percent = (display * 100).toFixed(1);

  const sizeClasses = {
    sm: "text-sm",
    md: "text-2xl",
    lg: "text-4xl md:text-5xl",
  };

  return (
    <div className={cn("flex flex-col items-baseline gap-1", className)}>
      <span
        className={cn(
          "font-mono font-bold tabular-nums text-veil-text-bright",
          sizeClasses[size]
        )}
      >
        {percent}
        <span className="text-veil-text-muted ml-0.5">%</span>
      </span>
      {label && (
        <span className="font-mono text-[10px] tracking-[0.2em] text-veil-text-muted uppercase">
          {label}
        </span>
      )}
    </div>
  );
}
