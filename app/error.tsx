"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <div className="text-center">
        <div className="mb-4 font-mono text-4xl text-veil-danger">⚠</div>

        <h1 className="mb-2 font-serif text-2xl text-veil-text-bright">
          System Malfunction
        </h1>

        <p className="mb-6 max-w-sm font-mono text-sm text-veil-text-dim">
          The encryption layer encountered an unexpected error. Your funds remain
          safe on-chain.
        </p>

        {error.digest && (
          <p className="mb-4 font-mono text-xs text-veil-text-muted">
            Error: {error.digest}
          </p>
        )}

        <button
          type="button"
          onClick={reset}
          className="inline-flex h-10 items-center rounded-md border border-veil-border px-5 font-mono text-xs font-medium tracking-wide text-veil-text-dim transition-colors duration-150 hover:border-veil-border-strong hover:text-veil-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-veil-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-veil-bg"
        >
          Retry
        </button>
      </div>
    </div>
  );
}
