import Link from "next/link";
import { GridBg } from "@/components/grid-bg";

export default function NotFound() {
  return (
    <div className="relative flex min-h-[60vh] flex-col items-center justify-center bg-veil-900 px-4">
      <GridBg className="absolute inset-0 h-full w-full pointer-events-none" />
      <div className="relative text-center">
        <div className="mb-6 font-mono text-7xl font-bold tracking-tighter text-text-muted md:text-8xl">
          4<span className="text-text-primary">0</span>4
        </div>
        <h1 className="mb-2 font-serif text-2xl text-text-primary">Document Not Found</h1>
        <p className="mb-8 max-w-sm font-mono text-sm text-text-muted">
          This record does not exist or has been redacted from the archive.
        </p>
        <Link
          href="/markets"
          className="stamp-btn inline-flex h-10 items-center rounded-sm border border-text-primary bg-text-primary px-5 font-mono text-xs font-semibold tracking-wide text-veil-900 transition-colors duration-100 hover:bg-veil-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-veil-500 focus-visible:ring-offset-2 focus-visible:ring-offset-veil-900"
        >
          Browse Markets
        </Link>
      </div>
    </div>
  );
}
