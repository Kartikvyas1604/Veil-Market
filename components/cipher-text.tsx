"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { randomCipherChar } from "@/lib/utils";

interface CipherTextProps {
  text: string;
  isRevealing: boolean;
  duration?: number;
  className?: string;
  onComplete?: () => void;
}

export function CipherText({
  text,
  isRevealing,
  duration = 1000,
  className,
  onComplete,
}: CipherTextProps) {
  const [display, setDisplay] = useState(() =>
    isRevealing ? text : Array(text.length).fill("█").join("")
  );
  const frameRef = useRef<number>(0);
  const prefersReduced = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    prefersReduced.current = mq.matches;
  }, []);

  const scramble = useCallback(() => {
    if (prefersReduced.current) {
      setDisplay(text);
      onComplete?.();
      return;
    }

    const start = performance.now();
    const chars = text.split("");

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);

      const result = chars.map((char, i) => {
        if (char === " ") return " ";
        const charProgress = (progress * chars.length - i * 0.3) / 0.7;
        if (charProgress >= 1) return char;
        if (charProgress <= 0) return randomCipherChar();
        return Math.random() < charProgress ? char : randomCipherChar();
      });

      setDisplay(result.join(""));

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        setDisplay(text);
        onComplete?.();
      }
    };

    frameRef.current = requestAnimationFrame(tick);
  }, [text, duration, onComplete]);

  useEffect(() => {
    if (isRevealing) {
      scramble();
    } else {
      setDisplay(text.replace(/./g, (c) => (c === " " ? " " : "█")));
    }
    return () => cancelAnimationFrame(frameRef.current);
  }, [isRevealing, scramble, text]);

  return (
    <span
      className={`font-mono tabular-nums ${className ?? ""}`}
      aria-label={isRevealing ? text : "Encrypted"}
    >
      {display}
    </span>
  );
}
