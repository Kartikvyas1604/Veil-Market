"use client";

export function GridBg({ className }: { className?: string }) {
  return (
    <div
      className={className}
      aria-hidden="true"
      style={{
        backgroundImage: `
          linear-gradient(rgba(224, 247, 250, 0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(224, 247, 250, 0.03) 1px, transparent 1px)
        `,
        backgroundSize: "40px 40px",
      }}
    />
  );
}

export function DotMatrix({ className }: { className?: string }) {
  return (
    <div
      className={className}
      aria-hidden="true"
      style={{
        backgroundImage:
          "radial-gradient(circle, rgba(224, 247, 250, 0.06) 1px, transparent 1px)",
        backgroundSize: "20px 20px",
      }}
    />
  );
}
