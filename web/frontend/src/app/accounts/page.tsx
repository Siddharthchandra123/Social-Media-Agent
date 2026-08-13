"use client";

import { useState } from "react";
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

      <section className="mb-8 flex items-center gap-4 border-b border-border pb-5">
        <p className="text-label">Connections</p>
        <div className="h-1 flex-1" aria-hidden="true" />
        <p className="stat-figure text-accent-foreground">
          {connectedCount}
          <span className="text-base font-medium text-muted-foreground">/3</span>
        </p>
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