import type { PlatformType } from "@/lib/api";
import { getPlatformMeta } from "@/lib/platforms";
import { cn } from "@/lib/utils";

interface PlatformIconProps {
  platform: string;
  size?: "sm" | "md";
  className?: string;
}

/**
 * Brand icon + tinted container for a platform. Keep usage restrained —
 * mostly in tight meta rows and status contexts.
 */
export function PlatformIcon({
  platform,
  size = "md",
  className,
}: PlatformIconProps) {
  const meta = getPlatformMeta(platform as PlatformType);
  const Icon = meta.icon;

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground",
        size === "sm" ? "size-6" : "size-8",
        className
      )}
      aria-hidden="true"
    >
      <Icon className={size === "sm" ? "size-3.5" : "size-4.5"} />
    </span>
  );
}