"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Home" },
  { href: "/markets", label: "Markets" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-veil-border bg-veil-bg/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 md:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 group"
          aria-label="VEIL home"
        >
          <div className="relative flex h-8 w-8 items-center justify-center rounded border border-veil-border-strong bg-veil-surface transition-colors duration-150 group-hover:border-veil-accent/30">
            <span className="font-mono text-xs font-bold tracking-wider text-veil-accent">
              V
            </span>
          </div>
          <span className="font-mono text-sm font-semibold tracking-[0.2em] text-veil-text-bright uppercase">
            Veil
          </span>
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-1" aria-label="Main navigation">
          {links.map((link) => {
            const isActive =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative min-h-[40px] min-w-[40px] flex items-center px-3 py-2 font-mono text-xs tracking-wide transition-colors duration-150",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-veil-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-veil-bg rounded",
                  isActive
                    ? "text-veil-accent"
                    : "text-veil-text-dim hover:text-veil-text"
                )}
              >
                {link.label}
                {isActive && (
                  <span className="absolute bottom-0 left-3 right-3 h-px bg-veil-accent" />
                )}
              </Link>
            );
          })}

          <div className="ml-3 h-4 w-px bg-veil-border" aria-hidden="true" />

          {/* Chain indicator */}
          <div className="ml-3 hidden items-center gap-2 sm:flex">
            <div className="h-1.5 w-1.5 rounded-full bg-veil-success animate-pulse" aria-hidden="true" />
            <span className="font-mono text-[10px] tracking-wider text-veil-text-muted uppercase">
              Avalanche C-Chain
            </span>
          </div>
        </nav>
      </div>
    </header>
  );
}
