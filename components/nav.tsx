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
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative flex h-7 w-7 items-center justify-center rounded border border-veil-border-strong bg-veil-surface">
            <span className="font-mono text-xs font-bold tracking-wider text-veil-accent">
              V
            </span>
            <div className="absolute inset-0 rounded border border-veil-accent/20 opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
          </div>
          <span className="font-mono text-sm font-semibold tracking-[0.2em] text-veil-text-bright uppercase">
            Veil
          </span>
        </Link>

        <nav className="flex items-center gap-1">
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
                  "relative px-3 py-1.5 font-mono text-xs tracking-wide transition-colors duration-150",
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

          <div className="ml-3 h-4 w-px bg-veil-border" />

          <div className="ml-3 hidden items-center gap-2 sm:flex">
            <div className="h-1.5 w-1.5 rounded-full bg-veil-success animate-pulse" />
            <span className="font-mono text-[10px] tracking-wider text-veil-text-muted uppercase">
              Avalanche C-Chain
            </span>
          </div>
        </nav>
      </div>
    </header>
  );
}
