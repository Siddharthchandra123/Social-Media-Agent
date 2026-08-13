import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, { badge: string; dot: string }> = {
  // generation
  completed: {
    badge: "bg-[oklch(0.55_0.09_145/0.12)] text-[oklch(0.42_0.09_145)] dark:text-[oklch(0.72_0.09_145)] ring-[oklch(0.55_0.09_145/0.25)]",
    dot: "bg-[oklch(0.55_0.09_145)]",
  },
  processing: {
    badge: "bg-[oklch(0.62_0.1_55/0.12)] text-[oklch(0.5_0.1_55)] dark:text-[oklch(0.75_0.1_55)] ring-[oklch(0.62_0.1_55/0.25)]",
    dot: "bg-[oklch(0.62_0.1_55)]",
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
    badge: "bg-[oklch(0.44_0.09_24/0.1)] text-[oklch(0.42_0.09_24)] dark:text-[oklch(0.78_0.08_25)] ring-[oklch(0.44_0.09_24/0.25)]",
    dot: "bg-[oklch(0.5_0.1_24)]",
  },
  scheduled: {
    badge: "bg-[oklch(0.62_0.1_55/0.12)] text-[oklch(0.5_0.1_55)] dark:text-[oklch(0.75_0.1_55)] ring-[oklch(0.62_0.1_55/0.25)]",
    dot: "bg-[oklch(0.62_0.1_55)]",
  },
  publishing: {
    badge: "bg-[oklch(0.62_0.1_55/0.12)] text-[oklch(0.5_0.1_55)] dark:text-[oklch(0.75_0.1_55)] ring-[oklch(0.62_0.1_55/0.25)]",
    dot: "bg-[oklch(0.62_0.1_55)]",
  },
  published: {
    badge: "bg-[oklch(0.55_0.09_145/0.12)] text-[oklch(0.42_0.09_145)] dark:text-[oklch(0.72_0.09_145)] ring-[oklch(0.55_0.09_145/0.25)]",
    dot: "bg-[oklch(0.55_0.09_145)]",
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
