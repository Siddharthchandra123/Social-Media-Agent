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

/*
 * A stat is typography first: label, figure, context.
 * No box — the surrounding layout provides structure via rules/whitespace.
 */
export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  className,
  iconClassName,
}: StatCardProps) {
  return (
    <div className={cn("min-w-0", className)}>
      <p className="flex items-center gap-1.5 text-label">
        <Icon
          className={cn("size-3.5 text-muted-foreground", iconClassName)}
          aria-hidden="true"
        />
        {label}
      </p>
      <p className="stat-figure mt-2 text-foreground">{value}</p>
      {hint && (
        <p className="mt-1 truncate text-xs text-muted-foreground/85">
          {hint}
        </p>
      )}
    </div>
  );
}