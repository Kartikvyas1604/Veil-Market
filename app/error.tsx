"use client";

import { StampButton } from "@/components/stamp-button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center bg-veil-900 px-4">
      <div className="text-center">
        <div className="mb-4 font-mono text-4xl text-text-muted">⚠</div>
        <h1 className="mb-2 font-serif text-2xl text-text-primary">System Error</h1>
        <p className="mb-6 max-w-sm font-mono text-sm text-text-muted">
          The encryption layer encountered an unexpected error. Your funds remain
          safe on-chain.
        </p>
        {error.digest && (
          <p className="mb-4 font-mono text-xs text-text-muted">Error: {error.digest}</p>
        )}
        <StampButton variant="ghost" onClick={reset}>
          Retry
        </StampButton>
      </div>
    </div>
  );
}
