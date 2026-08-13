import type { PlatformType } from "@/lib/api";
import { getPlatformMeta } from "@/lib/platforms";
import { cn } from "@/lib/utils";

interface PlatformIconProps {
  platform: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  /** Use the platform's brand tint (defaults to neutral). */
  brand?: boolean;
}

/**
 * Brand icon + tinted container for a platform.
 */
export function PlatformIcon({
  platform,
  size = "md",
  className,
  brand = true,
}: PlatformIconProps) {
  const meta = getPlatformMeta(platform as PlatformType);
  const Icon = meta.icon;

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-lg",
        size === "sm" && "size-7 rounded-md",
        size === "md" && "size-9",
        size === "lg" && "size-11",
        brand ? meta.tintClass : "bg-muted text-muted-foreground",
        className
      )}
      aria-hidden="true"
    >
      <Icon
        className={cn(
          size === "sm" && "size-3.5",
          size === "md" && "size-4.5",
          size === "lg" && "size-5"
        )}
      />
    </span>
  );
}
