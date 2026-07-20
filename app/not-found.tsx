import Link from "next/link";
import { GridBg } from "@/components/grid-bg";

export default function NotFound() {
  return (
    <div className="relative flex min-h-[60vh] flex-col items-center justify-center px-4">
      <GridBg className="absolute inset-0 h-full w-full pointer-events-none" />

      <div className="relative text-center">
        {/* Cipher-style 404 */}
        <div className="mb-6 font-mono text-7xl font-bold tracking-tighter text-veil-text-muted md:text-8xl">
          4
          <span className="text-veil-accent">0</span>
          4
        </div>

        <h1 className="mb-2 font-serif text-2xl text-veil-text-bright">
          Signal Lost
        </h1>

        <p className="mb-8 max-w-sm font-mono text-sm text-veil-text-dim">
          This market doesn&apos;t exist or has been wiped from the record.
        </p>

        <Link
          href="/markets"
          className="inline-flex h-10 items-center rounded-md bg-veil-accent px-5 font-mono text-xs font-semibold tracking-wide text-veil-bg transition-colors duration-150 hover:bg-veil-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-veil-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-veil-bg"
        >
          Browse Markets
        </Link>
      </div>
    </div>
  );
}
