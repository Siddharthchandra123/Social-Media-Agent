import type { LucideIcon } from "lucide-react";
import { Rocket } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ComingSoonProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: ReactNode;
  className?: string;
}

/**
 * Honest placeholder for product areas that do not have backend
 * functionality yet. Never presents placeholder work as functional.
 */
export function ComingSoon({
  title,
  description,
  icon: Icon = Rocket,
  actions,
  className,
}: ComingSoonProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-5 rounded-xl border border-border bg-card/40 px-8 py-20 text-center",
        className
      )}
    >
      <div className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
        <Icon className="size-6" aria-hidden="true" />
      </div>
      <div className="space-y-2">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {description && (
          <p className="mx-auto max-w-sm text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
      <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-2.5 py-1 text-xs font-medium text-muted-foreground">
        <span className="size-1.5 rounded-full bg-muted-foreground/50" aria-hidden="true" />
        Coming soon
      </span>
    </div>
  );
}