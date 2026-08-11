import { Inbox, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string | ReactNode;
  action?: ReactNode;
  className?: string;
  compact?: boolean;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
  compact,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/40 text-center",
        compact ? "gap-3 px-6 py-8" : "gap-4 px-8 py-16",
        className
      )}
    >
      <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="size-5" aria-hidden="true" />
      </div>
      <div className="space-y-1.5">
        <h3 className="text-sm font-medium text-foreground">
          {title}
        </h3>
        {description && (
          <p className="mx-auto max-w-sm text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}