"use client";

import { useEffect, useRef } from "react";
import { CIPHER_CHARS } from "@/lib/utils";

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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) {
      // Draw static cipher text for reduced motion
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      ctx.font = "13px 'JetBrains Mono', monospace";
      ctx.fillStyle = `rgba(224, 247, 250, ${opacity * 0.5})`;

      const cols = Math.floor(canvas.width / 16);
      const rows = Math.floor(canvas.height / 20);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (Math.random() < density) {
            const char =
              CIPHER_CHARS[Math.floor(Math.random() * CIPHER_CHARS.length)];
            ctx.fillText(char, c * 16, r * 20 + 14);
          }
        }
      }
      return;
    }

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };
    resize();
    window.addEventListener("resize", resize);

    let lastTick = 0;

    const draw = (time: number) => {
      if (time - lastTick < speed) {
        frameRef.current = requestAnimationFrame(draw);
        return;
      }
      lastTick = time;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.font = "13px 'JetBrains Mono', monospace";

      const cols = Math.floor(canvas.width / 16);
      const rows = Math.floor(canvas.height / 20);

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (Math.random() < density) {
            const char =
              CIPHER_CHARS[Math.floor(Math.random() * CIPHER_CHARS.length)];
            const flickerOpacity =
              opacity * (0.3 + Math.random() * 0.7);
            ctx.fillStyle = `rgba(224, 247, 250, ${flickerOpacity})`;
            ctx.fillText(char, c * 16, r * 20 + 14);
          }
        }
      }

      frameRef.current = requestAnimationFrame(draw);
    };

    frameRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [density, speed, opacity]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-hidden="true"
    />
  );
}
