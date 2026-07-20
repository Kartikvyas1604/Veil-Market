"use client";

export function Scanline({ className }: { className?: string }) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className ?? ""}`}
      aria-hidden="true"
    >
      <div
        className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-veil-700/30 to-transparent"
        style={{
          animation: "scanline 8s linear infinite",
        }}
      />
    </div>
  );
}
