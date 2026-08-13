import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  hint?: string;
  className?: string;
  iconClassName?: string;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  className,
  iconClassName,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3.5 rounded-xl border border-border bg-card p-4 shadow-soft transition-shadow hover:shadow-card sm:p-5",
        className
      )}
    >
      <div
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary",
          iconClassName
        )}
      >
        <Icon className="size-5" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-semibold leading-none tracking-tight text-foreground">
          {value}
        </p>
        <p className="mt-1 truncate text-xs font-medium text-muted-foreground">
          {label}
        </p>
        {hint && (
          <p className="mt-0.5 truncate text-[11px] text-muted-foreground/80">
            {hint}
          </p>
        )}
      </div>
    </div>
  );
}