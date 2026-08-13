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
   */
  publishAvailable: boolean;
  icon: typeof LinkedinIcon;
  /** Tailwind classes for the brand-tinted icon tile. */
  tintClass: string;
  /** Tailwind classes for the brand-colored dot/text accent. */
  accentClass: string;
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
    tintClass: "bg-[oklch(0.5_0.09_245/0.12)] text-[oklch(0.45_0.09_245)] dark:bg-[oklch(0.75_0.06_245/0.14)] dark:text-[oklch(0.75_0.06_245)]",
    accentClass: "text-[oklch(0.45_0.09_245)] dark:text-[oklch(0.75_0.06_245)]",
  },
  {
    id: "facebook",
    label: "Facebook",
    shortLabel: "Fb",
    description: "Pages & Groups — connect via OAuth",
    connectAvailable: true,
    publishAvailable: true,
    icon: FacebookIcon,
    tintClass: "bg-[oklch(0.52_0.09_255/0.12)] text-[oklch(0.47_0.09_255)] dark:bg-[oklch(0.76_0.06_255/0.14)] dark:text-[oklch(0.76_0.06_255)]",
    accentClass: "text-[oklch(0.47_0.09_255)] dark:text-[oklch(0.76_0.06_255)]",
  },
  {
    id: "instagram",
    label: "Instagram",
    shortLabel: "Ig",
    description: "Reels & feed publishing",
    connectAvailable: true,
    publishAvailable: true,
    icon: InstagramIcon,
    tintClass: "bg-[oklch(0.52_0.11_10/0.12)] text-[oklch(0.47_0.11_10)] dark:bg-[oklch(0.76_0.07_10/0.14)] dark:text-[oklch(0.78_0.07_10)]",
    accentClass: "text-[oklch(0.47_0.11_10)] dark:text-[oklch(0.78_0.07_10)]",
  },
  {
    id: "x",
    label: "X (Twitter)",
    shortLabel: "X",
    description: "Short-form posts",
    connectAvailable: false,
    publishAvailable: false,
    icon: TwitterIcon,
    tintClass: "bg-muted text-muted-foreground",
    accentClass: "text-muted-foreground",
  },
];

export function getPlatformMeta(platform: string | null): PlatformMeta {
  return (
    PLATFORMS.find((p) => p.id === platform) ?? PLATFORMS[0]
  );
}

/* ------------------------------------------------------------------ */
/*  OAuth connect flow                                                */
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
