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
  {
    id: "1",
    action: "position_sealed",
    market: "Will the Federal Reserve cut rates in January 2026?",
    amount: 1200,
    timestamp: "2m ago",
  },
  {
    id: "2",
    action: "bet_placed",
    market: "Will Bitcoin exceed $150,000 before end of Q1 2026?",
    amount: 5400,
    timestamp: "5m ago",
  },
  {
    id: "3",
    action: "market_resolved",
    market: "Will El Salvador increase its Bitcoin reserve by 50% in 2026?",
    timestamp: "1h ago",
  },
  {
    id: "4",
    action: "bet_placed",
    market: "Will SpaceX Starship complete a full orbital mission by March 2026?",
    amount: 3200,
    timestamp: "2h ago",
  },
  {
    id: "5",
    action: "position_sealed",
    market: "Will AVAX token price exceed $50 by end of Q2 2026?",
    amount: 890,
    timestamp: "3h ago",
  },
];

function ActionIcon({ action }: { action: ActivityItem["action"] }) {
  switch (action) {
    case "bet_placed":
      return (
        <span className="flex h-6 w-6 items-center justify-center rounded bg-veil-accent/10 font-mono text-[10px] text-veil-accent">
          +
        </span>
      );
    case "market_resolved":
      return (
        <span className="flex h-6 w-6 items-center justify-center rounded bg-veil-success/10 font-mono text-[10px] text-veil-success">
          ✓
        </span>
      );
    case "position_sealed":
      return (
        <span className="flex h-6 w-6 items-center justify-center rounded bg-veil-text-muted/10 font-mono text-[10px] text-veil-text-muted">
          ◉
        </span>
      );
  }
}

function ActionLabel({ action }: { action: ActivityItem["action"] }) {
  switch (action) {
    case "bet_placed":
      return <span className="text-veil-text-dim">New bet placed</span>;
    case "market_resolved":
      return <span className="text-veil-success">Market resolved</span>;
    case "position_sealed":
      return <span className="text-veil-text-muted">Position sealed</span>;
  }
}

export function RecentActivity({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-0", className)}>
      {mockActivity.map((item, i) => (
        <div
          key={item.id}
          className="flex items-start gap-3 border-b border-veil-border/50 py-3 last:border-0 stagger-enter"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <ActionIcon action={item.action} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <ActionLabel action={item.action} />
              {item.amount && (
                <span className="font-mono text-xs text-veil-text-dim">
                  ${formatNumber(item.amount)}
                </span>
              )}
            </div>
            <p className="mt-0.5 truncate font-mono text-[11px] text-veil-text-muted">
              {item.market}
            </p>
          </div>
          <span className="shrink-0 font-mono text-[10px] text-veil-text-muted">
            {item.timestamp}
          </span>
        </div>
      ))}
    </div>
  );
}
