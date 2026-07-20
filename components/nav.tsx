"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const marketingLinks = [
  { href: "/", label: "Home" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/docs", label: "Docs" },
];

const appLinks = [
  { href: "/markets", label: "Markets" },
  { href: "/portfolio", label: "Portfolio" },
];

export function Nav() {
  const pathname = usePathname();
  const isMarketing = ["/", "/how-it-works", "/docs"].includes(pathname);
  const links = isMarketing ? marketingLinks : appLinks;

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b backdrop-blur-xl",
        isMarketing
          ? "border-veil-200 bg-paper/80"
          : "border-border bg-surface/80"
      )}
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 md:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 group"
          aria-label="VEIL home"
        >
          <div
            className={cn(
              "relative flex h-8 w-8 items-center justify-center rounded-sm border",
              isMarketing
                ? "border-veil-300 bg-veil-100"
                : "border-border-strong bg-surface-raised"
            )}
          >
            <span
              className={cn(
                "font-mono text-xs font-bold tracking-wider",
                isMarketing ? "text-ink" : "text-text-primary"
              )}
            >
              V
            </span>
          </div>
          <span
            className={cn(
              "font-mono text-sm font-semibold tracking-[0.2em] uppercase",
              isMarketing ? "text-ink" : "text-text-primary"
            )}
          >
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
                  "relative min-h-[40px] flex items-center px-3 py-2 font-mono text-xs tracking-wide transition-colors duration-150 rounded-sm",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-veil-500 focus-visible:ring-offset-2",
                  isMarketing
                    ? cn(
                        "hover:text-ink",
                        isActive ? "text-ink" : "text-veil-500"
                      )
                    : cn(
                        "hover:text-text-primary",
                        isActive
                          ? "text-text-primary"
                          : "text-text-muted"
                      )
                )}
              >
                {link.label}
                {isActive && (
                  <span
                    className={cn(
                      "absolute bottom-0 left-3 right-3 h-px",
                      isMarketing ? "bg-ink" : "bg-text-primary"
                    )}
                  />
                )}
              </Link>
            );
          })}

          <div
            className={cn(
              "ml-3 h-4 w-px",
              isMarketing ? "bg-veil-300" : "bg-border"
            )}
            aria-hidden="true"
          />

          {/* Wallet / Enter */}
          {isMarketing ? (
            <Link
              href="/markets"
              className={cn(
                "ml-3 stamp-btn inline-flex min-h-[40px] items-center rounded-sm border px-4 font-mono text-xs font-medium tracking-wide transition-colors duration-150",
                "border-ink bg-ink text-paper hover:bg-veil-800",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-veil-500 focus-visible:ring-offset-2"
              )}
            >
              Enter App
            </Link>
          ) : (
            <Link
              href="/onboarding"
              className={cn(
                "ml-3 stamp-btn inline-flex min-h-[40px] items-center rounded-sm border px-4 font-mono text-xs font-medium tracking-wide transition-colors duration-150",
                "border-border-strong bg-surface-raised text-text-primary hover:bg-surface-elevated",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-veil-500 focus-visible:ring-offset-2"
              )}
            >
              Connect Wallet
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
