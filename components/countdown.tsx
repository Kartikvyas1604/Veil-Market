"use client";

import { useEffect, useState } from "react";
import { cn, timeRemaining } from "@/lib/utils";

interface CountdownProps {
  endDate: number;
  className?: string;
}

export function Countdown({ endDate, className }: CountdownProps) {
  const [remaining, setRemaining] = useState(() => timeRemaining(endDate));

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(timeRemaining(endDate));
    }, 60000);
    return () => clearInterval(interval);
  }, [endDate]);

  const isEnded = remaining === "Ended";

  return (
    <span
      className={cn(
        "font-mono text-xs tabular-nums tracking-wide",
        isEnded ? "text-veil-text-muted" : "text-veil-text-dim",
        className
      )}
    >
      {isEnded ? (
        "Ended"
      ) : (
        <>
          <span className="text-veil-accent/60 mr-1">⏱</span>
          {remaining}
        </>
      )}
    </span>
  );
}
