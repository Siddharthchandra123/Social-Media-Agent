import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  // generation
  completed: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/30",
  processing: "bg-amber-500/10 text-amber-400 ring-amber-500/30",
  failed: "bg-destructive/10 text-destructive ring-destructive/25",
  // post lifecycle
  draft: "bg-zinc-500/10 text-zinc-400 ring-zinc-500/30",
  approved: "bg-sky-500/10 text-sky-400 ring-sky-500/30",
  scheduled: "bg-indigo-500/10 text-indigo-400 ring-indigo-500/30",
  publishing: "bg-amber-500/10 text-amber-400 ring-amber-500/30",
  published: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/30",
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
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        STATUS_STYLES[status] ?? "bg-muted text-muted-foreground ring-border",
        className
      )}
    >
      {pulse && (
        <span
          className="size-1.5 rounded-full bg-current animate-pulse"
          aria-hidden="true"
        />
      )}
      {label ?? statusLabel(status)}
    </span>
  );
}