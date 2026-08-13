"use client";

import { useState } from "react";
import { PlugZap, CheckCircle2, ArrowRight, Trash2, Clock } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { PlatformIcon } from "@/components/platform-icon";
import { useUser } from "@/state/user-context";
import { API_BASE_URL, getAccessToken } from "@/lib/api";
import { StatusBadge } from "@/components/ui/status-badge";

export default function AccountsPage() {
  const { socialAccounts, disconnectAccount } = useUser();
  const [disconnecting, setDisconnecting] = useState<string | null>(null);

  const handleConnect = (platform: string) => {
    const token = getAccessToken();
    const query = token ? `?token=${encodeURIComponent(token)}` : "";
    window.location.href = `${API_BASE_URL}/auth/${platform}${query}`;
  };

  const handleDisconnect = async (platform: string) => {
    if (!confirm(`Are you sure you want to disconnect ${platform}?`)) return;
    try {
      setDisconnecting(platform);
      await disconnectAccount(platform);
    } catch (err: any) {
      alert(err.message || "Failed to disconnect");
    } finally {
      setDisconnecting(null);
    }
  };

  const connectedMap = new Map(socialAccounts.map((acc) => [acc.platform, acc]));

  const platforms = [
    {
      id: "linkedin" as const,
      label: "LinkedIn",
      description: "Connect your LinkedIn account to publish posts instantly.",
      connectAvailable: true,
    },
    {
      id: "facebook" as const,
      label: "Facebook Page",
      description: "Connect your Facebook Pages to publish and engage audiences.",
      connectAvailable: true,
    },
    {
      id: "instagram" as const,
      label: "Instagram Business",
      description: "Connect your Instagram business account to publish reels & feed posts.",
      connectAvailable: true,
    },
    {
      id: "x" as const,
      label: "X (Twitter)",
      description: "Connect your X account to broadcast posts (Coming Soon).",
      connectAvailable: false,
    },
  ];

  return (
    <div className="animate-rise">
      <PageHeader
        title="Connected Accounts"
        description="Manage your social platform connections and publishing permissions."
      />

      <div className="space-y-6">
        <section>
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
                        <span className="font-medium truncate max-w-[160px]">
                          {account.display_name || "Connected"}
                        </span>
                      </div>
                    ) : p.connectAvailable ? (
                      <span className="text-xs text-muted-foreground">
                        Not connected
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        Coming soon
                      </span>
                    )}

                    {isConnected ? (
                      <div className="flex items-center gap-2">
                        <StatusBadge status="published" label="Connected" />
                        <button
                          type="button"
                          onClick={() => handleDisconnect(p.id)}
                          disabled={disconnecting === p.id}
                          className="inline-flex h-8 items-center gap-1 rounded-md border border-border bg-background px-2.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10"
                        >
                          <Trash2 className="size-3.5" />
                          <span>Disconnect</span>
                        </button>
                      </div>
                    ) : p.connectAvailable ? (
                      <button
                        type="button"
                        onClick={() => handleConnect(p.id)}
                        className="inline-flex h-8 items-center gap-1.5 rounded-md bg-foreground px-3 text-xs font-medium text-background transition-opacity hover:opacity-90"
                      >
                        Connect
                        <ArrowRight className="size-3.5" aria-hidden="true" />
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                        <Clock className="size-3" />
                        Soon
                      </span>
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
            Permanent Account Connections
          </h2>
          <p className="text-sm text-muted-foreground">
            Your connected social accounts are linked permanently to your account. You can log out and log back in at any time without needing to reconnect your accounts.
          </p>
        </section>
      </div>
    </div>
  );
}
