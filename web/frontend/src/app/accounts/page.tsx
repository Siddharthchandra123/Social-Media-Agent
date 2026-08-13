"use client";

import { useState } from "react";
import { PlugZap } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { PlatformAccountCard } from "@/components/platform-account-card";
import { useUser } from "@/state/user-context";
import { API_BASE_URL, getAccessToken } from "@/lib/api";

const PLATFORMS: {
  id: "linkedin" | "facebook" | "instagram" | "x";
  description: string;
  connectAvailable: boolean;
}[] = [
  {
    id: "linkedin",
    description:
      "Connect your LinkedIn account to publish posts and grow your professional presence.",
    connectAvailable: true,
  },
  {
    id: "facebook",
    description:
      "Connect your Facebook Pages to publish updates and engage your audience.",
    connectAvailable: true,
  },
  {
    id: "instagram",
    description:
      "Connect your Instagram business account to publish reels and feed posts.",
    connectAvailable: true,
  },
  {
    id: "x",
    description:
      "Connect your X account to broadcast short-form posts (coming soon).",
    connectAvailable: false,
  },
];

export default function AccountsPage() {
  const { socialAccounts, disconnectAccount } = useUser();
  const [disconnecting, setDisconnecting] = useState<string | null>(null);

  const connectedMap = new Map(socialAccounts.map((acc) => [acc.platform, acc]));
  const connectedCount = socialAccounts.filter(
    (a) => a.status === "active"
  ).length;

  const handleConnect = (platform: string) => {
    const token = getAccessToken();
    const query = token ? `?token=${encodeURIComponent(token)}` : "";
    window.location.assign(`${API_BASE_URL}/auth/${platform}${query}`);
  };

  const handleDisconnect = async (platform: string) => {
    if (!confirm(`Are you sure you want to disconnect ${platform}?`)) return;
    try {
      setDisconnecting(platform);
      await disconnectAccount(platform);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to disconnect");
    } finally {
      setDisconnecting(null);
    }
  };

  return (
    <div className="animate-rise">
      <PageHeader
        title="Connected Accounts"
        description="Manage your social platform connections and publishing permissions."
      />

      <section className="mb-6 flex flex-col gap-3 rounded-xl border border-border bg-card p-5 shadow-soft sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <PlugZap className="size-5" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-tight text-foreground">
              {connectedCount} of 3 platforms connected
            </p>
            <p className="text-xs text-muted-foreground">
              Connections are permanent — you won&apos;t need to reconnect after
              logging out.
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        {PLATFORMS.map((p) => (
          <PlatformAccountCard
            key={p.id}
            platform={p.id}
            description={p.description}
            account={connectedMap.get(p.id)}
            connectAvailable={p.connectAvailable}
            disconnecting={disconnecting === p.id}
            onConnect={() => handleConnect(p.id)}
            onDisconnect={() => handleDisconnect(p.id)}
          />
        ))}
      </div>
    </div>
  );
}