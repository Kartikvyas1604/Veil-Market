"use client";

import { cn } from "@/lib/utils";

interface RedactionBarProps {
  revealed?: boolean;
  width?: string;
  className?: string;
  children?: React.ReactNode;
}

export function RedactionBar({
  revealed = false,
  width = "100%",
  className,
  children,
}: RedactionBarProps) {
  return (
    <span
      className={cn(
        "relative inline-block overflow-hidden",
        className
      )}
      style={{ width }}
    >
      {/* The redaction block */}
      <span
        className={cn(
          "absolute inset-0 bg-redaction-bar transition-none",
          revealed && "redact-reveal"
        )}
        aria-hidden="true"
      />
      {/* Content underneath — visible when revealed */}
      <span
        className={cn(
          "relative z-10 transition-opacity duration-300",
          revealed ? "opacity-100" : "opacity-0"
        )}
      >
        {children}
      </span>
    </span>
  );
}

interface RedactedBlockProps {
  revealed?: boolean;
  label?: string;
  className?: string;
}

export function RedactedBlock({
  revealed = false,
  label = "CLASSIFIED",
  className,
}: RedactedBlockProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-sm",
        className
      )}
    >
      {/* Redaction bar */}
      <div
        className={cn(
          "absolute inset-0 bg-redaction-bar flex items-center justify-center",
          revealed && "redact-reveal"
        )}
      >
        <span className="font-mono text-[9px] tracking-[0.3em] text-veil-600 uppercase">
          {label}
        </span>
      </div>
      {/* Revealed content */}
      {revealed && (
        <div className="relative z-10" style={{ animation: "contrast-snap 400ms ease-out" }}>
          {/* content passed as children renders here when revealed */}
        </div>
      )}
    </div>
  );
}
