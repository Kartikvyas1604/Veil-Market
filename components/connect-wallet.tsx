"use client";

import { useState, useCallback, useSyncExternalStore } from "react";
import Image from "next/image";
import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { avalanche, avalancheFuji } from "viem/chains";
import { cn } from "@/lib/utils";

const supportedChains = [avalanche, avalancheFuji] as const;

const subscribeToHydration = () => () => {};

export function ConnectWallet({ className }: { className?: string }) {
  const { address, isConnected, chain } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showChainSelect, setShowChainSelect] = useState(false);
  // Wagmi restores persisted wallet state only in the browser. Use the server
  // snapshot for the first client render so its markup is identical to SSR.
  const hasHydrated = useSyncExternalStore(subscribeToHydration, () => true, () => false);

  const handleConnect = useCallback(
    (connector: (typeof connectors)[number]) => {
      connect({ connector });
      setShowDropdown(false);
    },
    [connect]
  );

  const handleSwitchChain = useCallback(
    (chainId: typeof avalanche.id | typeof avalancheFuji.id) => {
      switchChain({ chainId });
      setShowChainSelect(false);
    },
    [switchChain]
  );

  if (!hasHydrated || !isConnected) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className={cn(
            "stamp-btn inline-flex min-h-[40px] items-center rounded-sm border px-4 font-mono text-xs font-medium tracking-wide transition-colors duration-150",
            "border-border-strong bg-surface-raised text-text-primary hover:bg-surface-elevated",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-veil-500 focus-visible:ring-offset-2",
            className
          )}
          disabled={!hasHydrated || isPending}
        >
          {hasHydrated && isPending ? "Connecting..." : "Connect Wallet"}
        </button>

        {showDropdown && (
          <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-sm border border-border-strong bg-surface-raised shadow-lg">
            <div className="p-2">
              <p className="px-2 py-1 font-mono text-[10px] tracking-wider uppercase text-text-muted">
                Select Wallet
              </p>
              {connectors
                .filter((connector) => connector.name !== "Injected")
                .map((connector) => (
                  <button
                  key={connector.uid}
                  onClick={() => handleConnect(connector)}
                  className="flex w-full items-center gap-3 rounded-sm px-2 py-2.5 font-mono text-xs text-text-primary transition-colors hover:bg-surface-elevated"
                >
                  {connector.icon && (
                    <Image src={connector.icon.trim()} className="h-5 w-5" alt={connector.name} width={20} height={20} unoptimized />
                  )}
                  {connector.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  const shortAddress = `${address?.slice(0, 6)}...${address?.slice(-4)}`;

  return (
    <div className="flex items-center gap-2">
      {/* Chain switcher */}
      <div className="relative">
        <button
          onClick={() => setShowChainSelect(!showChainSelect)}
          className={cn(
            "stamp-btn inline-flex min-h-[40px] items-center gap-1.5 rounded-sm border px-3 font-mono text-xs font-medium tracking-wide transition-colors duration-150",
            "border-border-strong bg-surface-raised text-text-primary hover:bg-surface-elevated",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-veil-500 focus-visible:ring-offset-2"
          )}
        >
          <span className="h-2 w-2 rounded-full bg-green-500" />
          {chain?.name ?? "Unknown"}
        </button>

        {showChainSelect && (
          <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-sm border border-border-strong bg-surface-raised shadow-lg">
            <div className="p-2">
              <p className="px-2 py-1 font-mono text-[10px] tracking-wider uppercase text-text-muted">
                Switch Network
              </p>
              {supportedChains.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleSwitchChain(c.id)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-sm px-2 py-2 font-mono text-xs transition-colors hover:bg-surface-elevated",
                    chain?.id === c.id
                      ? "text-text-primary"
                      : "text-text-muted"
                  )}
                >
                  <span
                    className={cn(
                      "h-2 w-2 rounded-full",
                      chain?.id === c.id ? "bg-green-500" : "bg-text-muted"
                    )}
                  />
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Address + disconnect */}
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className={cn(
            "stamp-btn inline-flex min-h-[40px] items-center rounded-sm border px-3 font-mono text-xs tracking-wide transition-colors duration-150",
            "border-border-strong bg-surface-raised text-text-primary hover:bg-surface-elevated",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-veil-500 focus-visible:ring-offset-2"
          )}
        >
          {shortAddress}
        </button>

        {showDropdown && (
          <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-sm border border-border-strong bg-surface-raised shadow-lg">
            <div className="p-2">
              <button
                onClick={async () => {
                  try {
                    disconnect();
                    await fetch("/api/auth/signout", { method: "POST" });
                  } finally {
                    setShowDropdown(false);
                    window.location.reload();
                  }
                }}
                className="flex w-full rounded-sm px-2 py-2 font-mono text-xs text-red-400 transition-colors hover:bg-surface-elevated"
              >
                Disconnect
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
