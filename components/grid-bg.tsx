"use client";

import { cn } from "@/lib/utils";

interface CipherNoiseProps {
  className?: string;
  density?: number;
  speed?: number;
  opacity?: number;
}

export function CipherNoise({
  className,
  density = 0.4,
  speed = 80,
  opacity = 0.06,
}: CipherNoiseProps) {
  return (
    <div
      className={cn("pointer-events-none", className)}
      aria-hidden="true"
      style={{
        backgroundImage: `
          radial-gradient(circle, rgba(250, 250, 248, ${opacity}) 1px, transparent 1px)
        `,
        backgroundSize: "18px 18px",
      }}
    />
  );
}

export function GridBg({ className }: { className?: string }) {
  return (
    <div
      className={cn("dot-grid pointer-events-none", className)}
      aria-hidden="true"
    />
  );
}

export function PaperTexture({ className }: { className?: string }) {
  return (
    <div
      className={cn("paper-texture pointer-events-none", className)}
      aria-hidden="true"
    />
  );
}
