"use client";

import { PlugZap, CheckCircle2, Clock, ArrowRight } from "lucide-react";
import {
  PLATFORMS,
  getConnectedPlatforms,
  ConnectedPlatform,
  startConnectFlow,
} from "@/lib/platforms";
import { PageHeader } from "@/components/ui/page-header";
import { PlatformIcon } from "@/components/platform-icon";
import { useState } from "react";

export default function AccountsPage() {
  const [connected] = useState<ConnectedPlatform[]>(() => getConnectedPlatforms());

  const connectedSet = new Set(connected.map((c) => c.platform));

  return (
    <div className="animate-rise">
      <PageHeader
        title="Connected accounts"
        description="Connect your social platforms to publish AI-generated content."
      />

      <div className="space-y-6">
        {/* Available platforms */}
        <section>
          <h2 className="mb-3 text-sm font-semibold">Platforms</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {PLATFORMS.map((platform) => {
              const isConnected = connectedSet.has(platform.id);
              const connectedInfo = connected.find((c) => c.platform === platform.id);

              return (
                <div
                  key={platform.id}
                  className="flex flex-col justify-between gap-4 rounded-xl border border-border bg-card p-5"
                >
                  <div className="flex items-start gap-3">
                    <PlatformIcon platform={platform.id} />
                    <div className="min-w-0">
                      <h3 className="text-sm font-medium text-foreground">
                        {platform.label}
                      </h3>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {platform.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    {isConnected ? (
                      <div className="flex items-center gap-2 text-xs text-emerald-400">
                        <CheckCircle2 className="size-3.5" aria-hidden="true" />
                        <span>Connected</span>
                        {connectedInfo && (
                          <span className="text-muted-foreground">
                            · {new Date(connectedInfo.connectedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    ) : platform.connectAvailable ? (
                      <span className="text-xs text-muted-foreground">
                        Not connected
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        Coming soon
                      </span>
                    )}

                    {isConnected ? (
                      <span className="text-xs text-muted-foreground">
                        Disconnect — coming soon
                      </span>
                    ) : platform.connectAvailable ? (
                      <button
                        type="button"
                        onClick={() => startConnectFlow(platform.id)}
                        className="inline-flex h-8 items-center gap-1.5 rounded-md bg-foreground px-3 text-xs font-medium text-background transition-opacity hover:opacity-90"
                      >
                        Connect
                        <ArrowRight className="size-3.5" aria-hidden="true" />
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                        <Clock className="size-3" aria-hidden="true" />
                        Soon
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Explanation */}
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <PlugZap className="size-4 text-muted-foreground" aria-hidden="true" />
            How it works
          </h2>
          <p className="text-sm text-muted-foreground">
            Signing in connects your account and lets the agent generate
            and publish content on your behalf. LinkedIn and Facebook
            are available now. Instagram and X are coming soon.
          </p>
        </section>
      </div>
    </div>
  );
}