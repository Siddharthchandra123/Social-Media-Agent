import { AlertTriangle } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  title?: string;
  message?: string;
  retry?: () => void;
  retryLabel?: string;
  className?: string;
  children?: ReactNode;
}

export function ErrorState({
  title = "Something went wrong",
  message = "We couldn\u2019t load this right now. Please try again.",
  retry,
  retryLabel = "Try again",
  className,
  children,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-xl border border-destructive/25 bg-destructive/5 px-8 py-12 text-center",
        className
      )}
    >
      <div className="flex size-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
        <AlertTriangle className="size-5" aria-hidden="true" />
      </div>
      <div className="space-y-1.5">
        <h3 className="text-sm font-medium text-foreground">{title}</h3>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground">
          {message}
        </p>
      </div>
      {(retry || children) && (
        <div className="mt-1 flex flex-wrap items-center justify-center gap-3">
          {retry && (
            <button
              type="button"
              onClick={retry}
              className="h-8 rounded-md bg-foreground px-3.5 text-sm font-medium text-background transition-colors hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {retryLabel}
            </button>
          )}
          {children}
        </div>
      )}
    </div>
  );
}