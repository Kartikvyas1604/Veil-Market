"use client";

import { cn } from "@/lib/utils";

type AlertVariant = "error" | "warning" | "info" | "success";

interface AlertBannerProps {
  variant?: AlertVariant;
  title?: string;
  message: string;
  details?: string;
  onDismiss?: () => void;
  className?: string;
}

const variantConfig = {
  error: {
    border: "border-red-500/30",
    bg: "bg-red-500/5",
    icon: "✕",
    iconBg: "bg-red-500/10 text-red-400",
    title: "text-red-400",
    message: "text-red-300/80",
    details: "text-red-400/60",
    dismiss: "text-red-400/40 hover:text-red-400/70",
  },
  warning: {
    border: "border-amber-500/30",
    bg: "bg-amber-500/5",
    icon: "⚠",
    iconBg: "bg-amber-500/10 text-amber-400",
    title: "text-amber-400",
    message: "text-amber-300/80",
    details: "text-amber-400/60",
    dismiss: "text-amber-400/40 hover:text-amber-400/70",
  },
  info: {
    border: "border-blue-500/30",
    bg: "bg-blue-500/5",
    icon: "ℹ",
    iconBg: "bg-blue-500/10 text-blue-400",
    title: "text-blue-400",
    message: "text-blue-300/80",
    details: "text-blue-400/60",
    dismiss: "text-blue-400/40 hover:text-blue-400/70",
  },
  success: {
    border: "border-emerald-500/30",
    bg: "bg-emerald-500/5",
    icon: "✓",
    iconBg: "bg-emerald-500/10 text-emerald-400",
    title: "text-emerald-400",
    message: "text-emerald-300/80",
    details: "text-emerald-400/60",
    dismiss: "text-emerald-400/40 hover:text-emerald-400/70",
  },
};

export function AlertBanner({
  variant = "error",
  title,
  message,
  details,
  onDismiss,
  className,
}: AlertBannerProps) {
  const config = variantConfig[variant];

  return (
    <div
      className={cn(
        "rounded-sm border px-4 py-3",
        config.border,
        config.bg,
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-sm text-[10px]",
            config.iconBg
          )}
        >
          {config.icon}
        </div>
        <div className="flex-1 min-w-0">
          {title && (
            <p className={cn("mb-1 font-mono text-xs font-medium", config.title)}>
              {title}
            </p>
          )}
          <p className={cn("font-mono text-xs leading-relaxed", config.message)}>
            {message}
          </p>
          {details && (
            <p className={cn("mt-1.5 font-mono text-[10px] leading-relaxed", config.details)}>
              {details}
            </p>
          )}
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className={cn(
              "shrink-0 font-mono text-xs transition-colors",
              config.dismiss
            )}
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
