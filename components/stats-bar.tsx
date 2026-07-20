"use client";

import { useEffect, useRef, useState } from "react";
import { cn, formatNumber } from "@/lib/utils";

interface StatItem {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
}

interface StatsBarProps {
  stats: StatItem[];
  className?: string;
}

function AnimatedNumber({
  value,
  prefix = "",
  suffix = "",
}: {
  value: number;
  prefix?: string;
  suffix?: string;
}) {
  const [display, setDisplay] = useState(0);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) {
      setDisplay(value);
      return;
    }

    const start = performance.now();
    const duration = 1200;

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setDisplay(Math.round(value * eased));

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      }
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [value]);

  return (
    <span className="font-mono font-bold tabular-nums text-veil-text-bright">
      {prefix}
      {formatNumber(display)}
      {suffix}
    </span>
  );
}

export function StatsBar({ stats, className }: StatsBarProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-center gap-8 md:gap-12",
        className
      )}
    >
      {stats.map((stat, i) => (
        <div
          key={stat.label}
          className="flex flex-col items-center gap-1 stagger-enter"
          style={{ animationDelay: `${200 + i * 100}ms` }}
        >
          <AnimatedNumber
            value={stat.value}
            prefix={stat.prefix}
            suffix={stat.suffix}
          />
          <span className="font-mono text-[10px] tracking-[0.2em] text-veil-text-muted uppercase">
            {stat.label}
          </span>
        </div>
      ))}
    </div>
  );
}
