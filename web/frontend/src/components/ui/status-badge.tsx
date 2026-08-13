import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, { badge: string; dot: string }> = {
  // generation
  completed: {
    badge: "bg-emerald-500/10 text-emerald-600 ring-emerald-500/25 dark:text-emerald-400",
    dot: "bg-emerald-500",
  },
  processing: {
    badge: "bg-amber-500/10 text-amber-600 ring-amber-500/25 dark:text-amber-400",
    dot: "bg-amber-500",
  },
  failed: {
    badge: "bg-destructive/10 text-destructive ring-destructive/25",
    dot: "bg-destructive",
  },
  // post lifecycle
  draft: {
    badge: "bg-zinc-500/10 text-zinc-600 ring-zinc-500/25 dark:text-zinc-400",
    dot: "bg-zinc-500",
  },
  approved: {
    badge: "bg-sky-500/10 text-sky-600 ring-sky-500/25 dark:text-sky-400",
    dot: "bg-sky-500",
  },
  scheduled: {
    badge: "bg-indigo-500/10 text-indigo-600 ring-indigo-500/25 dark:text-indigo-400",
    dot: "bg-indigo-500",
  },
  publishing: {
    badge: "bg-amber-500/10 text-amber-600 ring-amber-500/25 dark:text-amber-400",
    dot: "bg-amber-500",
  },
  published: {
    badge: "bg-emerald-500/10 text-emerald-600 ring-emerald-500/25 dark:text-emerald-400",
    dot: "bg-emerald-500",
  },
};

const STATUS_LABELS: Record<string, string> = {
  completed: "Completed",
  processing: "Processing",
  failed: "Failed",
  draft: "Draft",
  approved: "Approved",
  scheduled: "Scheduled",
  publishing: "Publishing",
  published: "Published",
};

export function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

interface StatusBadgeProps {
  status: string;
  className?: string;
  label?: string;
  pulse?: boolean;
}

export function StatusBadge({
  status,
  className,
  label,
  pulse,
}: StatusBadgeProps) {
  const style = STATUS_STYLES[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        style?.badge ?? "bg-muted text-muted-foreground ring-border",
        className
      )}
    >
      {pulse || status === "publishing" || status === "processing" ? (
        <span
          className={cn(
            "size-1.5 rounded-full bg-current animate-pulse",
            style?.dot
          )}
          aria-hidden="true"
        />
      ) : (
        <span
          className={cn("size-1.5 rounded-full bg-current", style?.dot)}
          aria-hidden="true"
        />
      )}
      {label ?? statusLabel(status)}
    </span>
  );
}
