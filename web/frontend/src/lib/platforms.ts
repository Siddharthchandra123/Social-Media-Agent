import { API_BASE_URL } from "@/lib/api";
import {
  TwitterIcon,
  LinkedinIcon,
  InstagramIcon,
  FacebookIcon,
} from "@/components/ui/icons";
import type { PlatformType } from "@/lib/api";

export interface PlatformMeta {
  id: PlatformType;
  label: string;
  shortLabel: string;
  description: string;
  /** Whether the backend exposes a connect flow for this platform. */
  connectAvailable: boolean;
  /**
   * Whether the backend can publish to this platform.
   * Currently only LinkedIn publishing is implemented server-side.
   */
  publishAvailable: boolean;
  icon: typeof LinkedinIcon;
}

export const PLATFORMS: PlatformMeta[] = [
  {
    id: "linkedin",
    label: "LinkedIn",
    shortLabel: "Li",
    description: "Professional network — connect via OAuth",
    connectAvailable: true,
    publishAvailable: true,
    icon: LinkedinIcon,
  },
  {
    id: "facebook",
    label: "Facebook",
    shortLabel: "Fb",
    description: "Pages & Groups — connect via OAuth",
    connectAvailable: true,
    publishAvailable: false,
    icon: FacebookIcon,
  },
  {
    id: "instagram",
    label: "Instagram",
    shortLabel: "Ig",
    description: "Reels & feed publishing",
    connectAvailable: false,
    publishAvailable: false,
    icon: InstagramIcon,
  },
  {
    id: "x",
    label: "X (Twitter)",
    shortLabel: "X",
    description: "Short-form posts",
    connectAvailable: false,
    publishAvailable: false,
    icon: TwitterIcon,
  },
];

export function getPlatformMeta(
  platform: string | null
): PlatformMeta {
  return (
    PLATFORMS.find((p) => p.id === platform) ?? PLATFORMS[0]
  );
}

/* ------------------------------------------------------------------ */
/*  OAuth connect flow                                                */
/*                                                                     */
/*  The backend signs you in AND connects the account through          */
/*  /auth/{platform}, then redirects to `/auth/callback?token=...`     */
/*  with a fresh JWT. Because the JWT can only exist once the backend  */
/*  created/updated the social account, recording the platform before  */
/*  the redirect lets us honestly show "connected" on return.          */
/* ------------------------------------------------------------------ */

export function connectUrl(platform: PlatformType) {
  return `${API_BASE_URL}/auth/${platform}`;
}

function pendingPlatformKey() {
  return "pending_oauth_platform";
}

export function storePendingPlatform(platform: PlatformType) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(pendingPlatformKey(), platform);
}

export function consumePendingPlatform(): PlatformType | null {
  if (typeof window === "undefined") return null;
  const value = sessionStorage.getItem(pendingPlatformKey());
  sessionStorage.removeItem(pendingPlatformKey());
  return value as PlatformType | null;
}

export interface ConnectedPlatform {
  platform: PlatformType;
  /** ISO timestamp recorded after a successful OAuth callback. */
  connectedAt: string;
}

function storageKey() {
  return "connected_platforms";
}

export function getConnectedPlatforms(): ConnectedPlatform[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey());
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ConnectedPlatform[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function isPlatformConnected(
  platform: PlatformType
): boolean {
  return getConnectedPlatforms().some(
    (p) => p.platform === platform
  );
}

export function recordPlatformConnected(
  platform: PlatformType,
  at = new Date().toISOString()
) {
  const current = getConnectedPlatforms().filter(
    (p) => p.platform !== platform
  );
  current.push({ platform, connectedAt: at });
  localStorage.setItem(storageKey(), JSON.stringify(current));
}

export function startConnectFlow(platform: PlatformType) {
  storePendingPlatform(platform);
  window.location.assign(connectUrl(platform));
}

export function clearConnectedPlatforms() {
  localStorage.removeItem(storageKey());
}