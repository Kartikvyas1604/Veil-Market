"use client";

import { cn, formatNumber } from "@/lib/utils";

interface ActivityItem {
  id: string;
  action: "bet_placed" | "market_resolved" | "position_sealed";
  market: string;
  amount?: number;
  timestamp: string;
}

const mockActivity: ActivityItem[] = [
  { id: "1", action: "position_sealed", market: "Federal Reserve rate cut January 2026", amount: 1200, timestamp: "2m ago" },
  { id: "2", action: "bet_placed", market: "Bitcoin exceeds $150K before Q1 2026", amount: 5400, timestamp: "5m ago" },
  { id: "3", action: "market_resolved", market: "El Salvador Bitcoin reserve increase", timestamp: "1h ago" },
  { id: "4", action: "bet_placed", market: "SpaceX Starship full orbital mission", amount: 3200, timestamp: "2h ago" },
  { id: "5", action: "position_sealed", market: "AVAX exceeds $50 by end of Q2 2026", amount: 890, timestamp: "3h ago" },
];

function ActionIcon({ action }: { action: ActivityItem["action"] }) {
  const icons = {
    bet_placed: "+",
    market_resolved: "✓",
    position_sealed: "■",
  };
  return (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm bg-surface-elevated font-mono text-[10px] text-text-secondary">
      {icons[action]}
    </span>
  );
}

export function RecentActivity({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-0", className)}>
      {mockActivity.map((item, i) => (
        <div
          key={item.id}
          className="flex items-start gap-3 border-b border-border/50 py-3 last:border-0 stagger-enter"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <ActionIcon action={item.action} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-text-secondary">
                {item.action.replace(/_/g, " ")}
              </span>
              {item.amount && (
                <span className="font-mono text-xs text-text-muted">
                  ${formatNumber(item.amount)}
                </span>
              )}
            </div>
            <p className="mt-0.5 truncate font-mono text-[11px] text-text-muted">
              {item.market}
            </p>
          </div>
          <span className="shrink-0 font-mono text-[10px] text-text-muted">
            {item.timestamp}
          </span>
        </div>
      ))}
    </div>
  );
}
