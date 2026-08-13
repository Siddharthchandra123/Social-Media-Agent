import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, { badge: string; dot: string }> = {
  // generation
  completed: {
    badge: "bg-success/12 text-success ring-success/25",
    dot: "bg-success",
  },
  processing: {
    badge: "bg-warning/12 text-warning ring-warning/25",
    dot: "bg-warning",
  },
  failed: {
    badge: "bg-destructive/10 text-destructive ring-destructive/25",
    dot: "bg-destructive",
  },
  // post lifecycle
  draft: {
    badge: "bg-muted text-muted-foreground ring-border",
    dot: "bg-muted-foreground",
  },
  approved: {
    badge: "bg-primary/10 text-primary ring-primary/25",
    dot: "bg-primary",
  },
  scheduled: {
    badge: "bg-warning/12 text-warning ring-warning/25",
    dot: "bg-warning",
  },
  publishing: {
    badge: "bg-info/12 text-info ring-info/25",
    dot: "bg-info",
  },
  published: {
    badge: "bg-success/12 text-success ring-success/25",
    dot: "bg-success",
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
