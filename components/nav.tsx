"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ConnectWallet } from "@/components/connect-wallet";

const links = [
  { href: "/markets", label: "Markets" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/create", label: "Create" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 md:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2.5 group"
          aria-label="VEIL home"
        >
          <div className="relative flex h-8 w-8 items-center justify-center">
            <Image 
              src="/logo.svg" 
              alt="VEIL Logo" 
              width={32} 
              height={32} 
              className="opacity-90 transition-opacity group-hover:opacity-100 dark:invert-0 invert"
            />
          </div>
          <span className="font-mono text-sm font-semibold tracking-[0.2em] uppercase text-text-primary">
            Veil
          </span>
        </Link>

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
                  "hover:text-text-primary",
                  isActive ? "text-text-primary" : "text-text-muted"
                )}
              >
                {link.label}
                {isActive && (
                  <span className="absolute bottom-0 left-3 right-3 h-px bg-text-primary" />
                )}
              </Link>
            );
          })}

          <div className="ml-3 h-4 w-px bg-border" aria-hidden="true" />

          <div className="ml-3">
            <ConnectWallet />
          </div>
        </nav>
      </div>
    </header>
  );
}
