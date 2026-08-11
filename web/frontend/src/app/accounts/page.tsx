"use client";

import { useEffect, useState } from "react";
import { PlugZap, CheckCircle2, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { PlatformIcon } from "@/components/platform-icon";
import { useWorkspaceBrand, SocialAccount } from "@/state/workspace-brand-context";
import { API_BASE_URL, getAccessToken } from "@/lib/api";
import { StatusBadge } from "@/components/ui/status-badge";

export default function AccountsPage() {
  const { activeBrand, socialAccounts, refreshSocialAccounts } = useWorkspaceBrand();
  const [loadingPlatform, setLoadingPlatform] = useState<string | null>(null);

  const handleConnect = (platform: "linkedin" | "facebook") => {
    const token = getAccessToken();
    // Redirect to backend OAuth route
    // Note: Backend OAuth redirects back to frontend, so we can pass brand id if desired or use current active brand
    window.location.href = `${API_BASE_URL}/auth/${platform}`;
  };

  const connectedMap = new Map<string, SocialAccount>();
  socialAccounts.forEach((acc) => {
    connectedMap.set(acc.platform, acc);
  });

  const platforms = [
    {
      id: "linkedin" as const,
      label: "LinkedIn",
      description: "Connect your LinkedIn profile or company page to publish posts.",
      connectAvailable: true,
    },
    {
      id: "facebook" as const,
      label: "Facebook Page",
      description: "Connect your Facebook Pages to publish content and engage audiences.",
      connectAvailable: true,
    },
  ];

  return (
    <div className="animate-rise">
      <PageHeader
        title="Connected accounts"
        description={`Manage social accounts connected to brand: ${activeBrand?.name || "Current Brand"}`}
      />

      <div className="space-y-6">
        <section>
          <h2 className="mb-3 text-sm font-semibold">Supported Platforms</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {platforms.map((p) => {
              const account = connectedMap.get(p.id);
              const isConnected = !!account;

              return (
                <div
                  key={p.id}
                  className="flex flex-col justify-between gap-4 rounded-xl border border-border bg-card p-5"
                >
                  <div className="flex items-start gap-3">
                    <PlatformIcon platform={p.id} />
                    <div className="min-w-0">
                      <h3 className="text-sm font-medium text-foreground">
                        {p.label}
                      </h3>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {p.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 border-t border-border pt-4">
                    {isConnected ? (
                      <div className="flex items-center gap-2 text-xs text-emerald-400">
                        <CheckCircle2 className="size-3.5" aria-hidden="true" />
                        <span className="font-medium truncate max-w-[180px]">
                          {account.display_name || "Connected"}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        Not connected
                      </span>
                    )}

                    {isConnected ? (
                      <StatusBadge status="published" label="Active" />
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleConnect(p.id)}
                        className="inline-flex h-8 items-center gap-1.5 rounded-md bg-foreground px-3 text-xs font-medium text-background transition-opacity hover:opacity-90"
                      >
                        Connect {p.label}
                        <ArrowRight className="size-3.5" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <PlugZap className="size-4 text-muted-foreground" aria-hidden="true" />
            Brand Context
          </h2>
          <p className="text-sm text-muted-foreground">
            Social accounts are scoped to your currently selected brand (<span className="text-foreground font-medium">{activeBrand?.name}</span>). Switch brands using the top navigation to manage accounts for other projects.
          </p>
        </section>
      </div>
    </div>
  );
}
