import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SpinnerProps {
  className?: string;
  label?: string;
}

export function Spinner({ className, label }: SpinnerProps) {
  return (
    <span
      role="status"
      className={cn("inline-flex items-center gap-2", className)}
    >
      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      {label && <span className="text-sm text-muted-foreground">{label}</span>}
      <span className="sr-only">{label ?? "Loading"}</span>
    </span>
  );
}