"use client";

import { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import type { FriendlyError } from "@/lib/error-messages";

interface ErrorToastProps {
  error: FriendlyError | null;
  /** Called when the toast is dismissed (by user click or auto-dismiss timer) */
  onDismiss: () => void;
  className?: string;
}

const SEVERITY_STYLES = {
  error: {
    border: "border-red-500/30",
    bg: "bg-red-500/[0.06]",
    iconBg: "bg-red-500/10 text-red-400",
    title: "text-red-300",
    accent: "bg-red-500/20",
  },
  warning: {
    border: "border-amber-500/30",
    bg: "bg-amber-500/[0.06]",
    iconBg: "bg-amber-500/10 text-amber-400",
    title: "text-amber-300",
    accent: "bg-amber-500/20",
  },
  info: {
    border: "border-text-muted/30",
    bg: "bg-text-muted/[0.04]",
    iconBg: "bg-text-muted/10 text-text-muted",
    title: "text-text-secondary",
    accent: "bg-text-muted/20",
  },
};

const AUTO_DISMISS_MS = 8000;

export function ErrorToast({ error, onDismiss, className }: ErrorToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const dismiss = useCallback(() => {
    setIsLeaving(true);
    setTimeout(() => {
      setIsVisible(false);
      setIsLeaving(false);
      onDismiss();
    }, 300);
  }, [onDismiss]);

  useEffect(() => {
    if (error) {
      setIsVisible(true);
      setIsLeaving(false);
    } else {
      setIsVisible(false);
    }
  }, [error]);

  useEffect(() => {
    if (error?.autoDismiss && isVisible) {
      const timer = setTimeout(dismiss, AUTO_DISMISS_MS);
      return () => clearTimeout(timer);
    }
  }, [error, isVisible, dismiss]);

  if (!error || !isVisible) return null;

  const styles = SEVERITY_STYLES[error.severity];

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn(
        "relative overflow-hidden rounded-sm border transition-all duration-300",
        styles.border,
        styles.bg,
        isLeaving
          ? "opacity-0 translate-y-2"
          : "opacity-100 translate-y-0 animate-[fade-in-up_400ms_var(--ease-out-expo)_both]",
        className
      )}
    >
      {/* Progress bar for auto-dismiss */}
      {error.autoDismiss && (
        <div className="absolute top-0 left-0 right-0 h-[2px]">
          <div
            className={cn("h-full rounded-full", styles.accent)}
            style={{
              animation: `shrink-bar ${AUTO_DISMISS_MS}ms linear forwards`,
            }}
          />
        </div>
      )}

      <div className="flex items-start gap-3.5 px-4 py-3.5">
        {/* Icon badge */}
        <div
          className={cn(
            "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-sm font-mono text-sm",
            styles.iconBg
          )}
        >
          {error.icon}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h4 className={cn("font-mono text-xs font-semibold tracking-wide", styles.title)}>
              {error.title}
            </h4>
            <button
              onClick={dismiss}
              className="shrink-0 font-mono text-xs text-text-muted/50 transition-colors hover:text-text-secondary p-0.5 -m-0.5"
              aria-label="Dismiss error"
            >
              ✕
            </button>
          </div>
          <p className="mt-1 font-mono text-[11px] leading-relaxed text-text-muted">
            {error.message}
          </p>
          {error.hint && (
            <p className="mt-1.5 font-mono text-[10px] leading-relaxed text-text-muted/70">
              💡 {error.hint}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Inline variant — smaller, used inside form sections (e.g. bet panel).
 * Shows only the message + hint, no icon badge.
 */
export function ErrorInline({
  error,
  onDismiss,
  className,
}: ErrorToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const dismiss = useCallback(() => {
    setIsLeaving(true);
    setTimeout(() => {
      setIsVisible(false);
      setIsLeaving(false);
      onDismiss();
    }, 300);
  }, [onDismiss]);

  useEffect(() => {
    if (error) {
      setIsVisible(true);
      setIsLeaving(false);
    } else {
      setIsVisible(false);
    }
  }, [error]);

  useEffect(() => {
    if (error?.autoDismiss && isVisible) {
      const timer = setTimeout(dismiss, AUTO_DISMISS_MS);
      return () => clearTimeout(timer);
    }
  }, [error, isVisible, dismiss]);

  if (!error || !isVisible) return null;

  const styles = SEVERITY_STYLES[error.severity];

  return (
    <div
      role="alert"
      className={cn(
        "mt-3 rounded-sm border px-3 py-2.5 transition-all duration-300",
        styles.border,
        styles.bg,
        isLeaving
          ? "opacity-0 translate-y-1"
          : "opacity-100 translate-y-0 animate-[fade-in-up_400ms_var(--ease-out-expo)_both]",
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <span className={cn("font-mono text-[11px] font-semibold", styles.title)}>
            {error.title}
          </span>
          <span className="mx-1.5 font-mono text-[11px] text-text-muted/30">—</span>
          <span className="font-mono text-[11px] text-text-muted">
            {error.message}
          </span>
          {error.hint && (
            <span className="ml-1 font-mono text-[10px] text-text-muted/60">
              ({error.hint})
            </span>
          )}
        </div>
        <button
          onClick={dismiss}
          className="shrink-0 mt-0.5 font-mono text-[10px] text-text-muted/40 transition-colors hover:text-text-secondary"
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
