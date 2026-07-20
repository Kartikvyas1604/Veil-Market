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

function getMasked(text: string) {
  return text.replace(/./g, (c) => (c === " " ? " " : "█"));
}

export function CipherText({
  text,
  isRevealing,
  duration = 1000,
  className,
  onComplete,
}: CipherTextProps) {
  const [display, setDisplay] = useState(() =>
    isRevealing ? text : getMasked(text)
  );
  const [revealed, setRevealed] = useState(false);
  const frameRef = useRef<number>(0);
  const prevRevealing = useRef(isRevealing);

  const scramble = useCallback(() => {
    let cancelled = false;

    const runScramble = () => {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      if (mq.matches) {
        setDisplay(text);
        setRevealed(true);
        onComplete?.();
        return;
      }

      const start = performance.now();
      const chars = text.split("");

      const tick = (now: number) => {
        if (cancelled) return;
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
          setRevealed(true);
          onComplete?.();
        }
      };

      frameRef.current = requestAnimationFrame(tick);
    };

    runScramble();

    return () => {
      cancelled = true;
      cancelAnimationFrame(frameRef.current);
    };
  }, [text, duration, onComplete]);

  useEffect(() => {
    if (prevRevealing.current === isRevealing) return;
    prevRevealing.current = isRevealing;

    cancelAnimationFrame(frameRef.current);

    if (isRevealing) {
      return scramble();
    } else {
      const id = requestAnimationFrame(() => {
        setDisplay(getMasked(text));
        setRevealed(false);
      });
      return () => cancelAnimationFrame(id);
    }
  }, [isRevealing, scramble, text]);

  return (
    <span
      className={`font-mono tabular-nums inline-block transition-opacity duration-300 ${
        revealed ? "opacity-100" : "opacity-100"
      } ${className ?? ""}`}
      aria-label={isRevealing ? text : "Encrypted"}
    >
      {display}
    </span>
  );
}
