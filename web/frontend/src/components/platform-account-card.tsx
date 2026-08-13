"use client";

import { ArrowRight, CheckCircle2, Clock, Loader2, Trash2 } from "lucide-react";
import type { PlatformType } from "@/lib/api";
import { getPlatformMeta } from "@/lib/platforms";
import { PlatformIcon } from "@/components/platform-icon";
import { cn } from "@/lib/utils";
import type { SocialAccount } from "@/state/user-context";

interface PlatformAccountCardProps {
  platform: PlatformType;
  description: string;
  account: SocialAccount | undefined;
  connectAvailable: boolean;
  disconnecting?: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
  compact?: boolean;
}

export function PlatformAccountCard({
  platform,
  description,
  account,
  connectAvailable,
  disconnecting,
  onConnect,
  onDisconnect,
  compact,
}: PlatformAccountCardProps) {
  const meta = getPlatformMeta(platform);
  const isConnected = Boolean(account);

  if (compact) {
    return (
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <PlatformIcon platform={platform} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">
              {meta.label}
            </p>
            {isConnected && account?.display_name ? (
              <p className="truncate text-xs text-muted-foreground">
                {account.display_name}
              </p>
            ) : (
              <p className="truncate text-xs text-muted-foreground">
                {connectAvailable ? "Not connected" : "Coming soon"}
              </p>
            )}
          </div>
        </div>

        {isConnected ? (
          <div className="flex shrink-0 items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[oklch(0.44_0.09_145)] dark:text-[oklch(0.72_0.09_145)]">
              <CheckCircle2 className="size-3.5" aria-hidden="true" />
              Connected
            </span>
            <button
              type="button"
              onClick={onDisconnect}
              disabled={disconnecting}
              aria-label={`Disconnect ${meta.label}`}
              className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
            >
              {disconnecting ? (
                <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <Trash2 className="size-3.5" aria-hidden="true" />
              )}
            </button>
          </div>
        ) : connectAvailable ? (
          <button
            type="button"
            onClick={onConnect}
            className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg border border-border bg-background px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
          >
            + Connect
          </button>
        ) : (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            <Clock className="size-3" aria-hidden="true" />
            Soon
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group flex flex-col justify-between gap-4 rounded-lg border bg-card p-5 transition-colors hover:border-input",
        isConnected
          ? "border-border"
          : connectAvailable
            ? "border-border"
            : "border-dashed opacity-80"
      )}
    >
      <div className="flex items-start gap-3.5">
        <PlatformIcon platform={platform} size="lg" />
        <div className="min-w-0">
          <h3 className="text-sm font-semibold tracking-tight text-foreground">
            {meta.label}
          </h3>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            {description}
          </p>
          {isConnected && account?.display_name && (
            <p
              className={cn(
                "mt-1.5 inline-flex items-center gap-1.5 text-xs font-medium",
                meta.accentClass
              )}
            >
              <span aria-hidden="true">@</span>
              <span className="truncate">{account.display_name}</span>
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-border pt-4">
        {isConnected ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[oklch(0.44_0.09_145)] dark:text-[oklch(0.72_0.09_145)]">
            <CheckCircle2 className="size-3.5" aria-hidden="true" />
            Connected
          </span>
        ) : connectAvailable ? (
          <span className="text-xs text-muted-foreground">Not connected</span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="size-3" aria-hidden="true" />
            Coming soon
          </span>
        )}

        {isConnected ? (
          <button
            type="button"
            onClick={onDisconnect}
            disabled={disconnecting}
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-background px-3 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
          >
            {disconnecting ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Trash2 className="size-3.5" aria-hidden="true" />
            )}
            <span>Disconnect</span>
          </button>
        ) : connectAvailable ? (
          <button
            type="button"
            onClick={onConnect}
            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3.5 text-xs font-medium text-primary-foreground shadow-soft transition-all hover:opacity-90 active:translate-y-px"
          >
            Connect
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </button>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
            Soon
          </span>
        )}
      </div>
    </div>
  );
}