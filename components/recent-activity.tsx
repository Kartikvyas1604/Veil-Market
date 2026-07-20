"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import type { DbMarketActivity } from "@/lib/supabase";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function ActionIcon({ type }: { type: string }) {
  const icons: Record<string, string> = {
    bet_placed: "+",
    market_resolved: "✓",
    odds_updated: "~",
    market_created: "★",
  };
  return (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm bg-surface-elevated font-mono text-[10px] text-text-secondary">
      {icons[type] ?? "·"}
    </span>
  );
}

export function RecentActivity({ className }: { className?: string }) {
  const [activity, setActivity] = useState<DbMarketActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initial fetch
  useEffect(() => {
    supabase
      .from("market_activity")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10)
      .then(({ data }) => {
        setActivity(data ?? []);
        setIsLoading(false);
      });
  }, []);

  // Real-time updates
  useEffect(() => {
    const channel = supabase
      .channel("activity-feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "market_activity" },
        (payload) => {
          setActivity((prev) => [payload.new as DbMarketActivity, ...prev.slice(0, 9)]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  if (isLoading) {
    return (
      <div className={cn("space-y-0", className)}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 border-b border-border/50 py-3 last:border-0">
            <div className="h-6 w-6 rounded-sm bg-surface-elevated animate-pulse" />
            <div className="flex-1 space-y-1">
              <div className="h-3 w-32 rounded bg-surface-elevated animate-pulse" />
              <div className="h-2 w-48 rounded bg-surface-elevated animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activity.length === 0) {
    return (
      <div className={cn("py-8 text-center", className)}>
        <p className="font-mono text-xs text-text-muted">No activity yet. Be the first to place an encrypted bet.</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-0", className)}>
      {activity.map((item, i) => (
        <div
          key={item.id}
          className="flex items-start gap-3 border-b border-border/50 py-3 last:border-0 stagger-enter"
          style={{ animationDelay: `${i * 40}ms` }}
        >
          <ActionIcon type={item.event_type} />
          <div className="min-w-0 flex-1">
            <span className="text-text-secondary text-sm">
              {item.description}
            </span>
          </div>
          <span className="shrink-0 font-mono text-[10px] text-text-muted">
            {timeAgo(item.created_at)}
          </span>
        </div>
      ))}
    </div>
  );
}
