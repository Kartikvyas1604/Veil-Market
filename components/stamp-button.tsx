import { cn } from "@/lib/utils";

interface StampButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "dark" | "light" | "ghost";
  size?: "sm" | "md" | "lg";
}

export function StampButton({
  variant = "dark",
  size = "md",
  className,
  children,
  ...props
}: StampButtonProps) {
  const sizeClasses = {
    sm: "h-8 px-3 text-[11px]",
    md: "h-10 px-5 text-xs",
    lg: "h-12 px-6 text-sm",
  };

  const variantClasses = {
    dark: "border-border-strong bg-surface-raised text-text-primary hover:bg-surface-elevated active:bg-surface",
    light: "border-veil-300 bg-ink text-paper hover:bg-veil-800 active:bg-veil-900",
    ghost: "border-transparent bg-transparent text-text-secondary hover:text-text-primary hover:bg-surface-raised active:bg-surface-elevated",
  };

  return (
    <button
      className={cn(
        "stamp-btn inline-flex items-center justify-center gap-2 rounded-sm font-mono font-medium tracking-wide border transition-colors duration-100",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-veil-500 focus-visible:ring-offset-2 focus-visible:ring-offset-veil-900",
        "disabled:pointer-events-none disabled:opacity-40",
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
