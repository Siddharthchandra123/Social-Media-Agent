"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  PenLine,
  FolderOpen,
  Send,
  PlugZap,
  Settings,
  Sparkles,
  X,
  LogOut,
} from "lucide-react";
import { useEffect, useState } from "react";
import { checkBackendHealth, logout } from "@/lib/api";
import { cn } from "@/lib/utils";

export const NAV_ITEMS = [
  {
    section: "Workspace",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "Create", href: "/create", icon: PenLine, badge: "AI" },
      { name: "Content", href: "/content", icon: FolderOpen },
      { name: "Publishing", href: "/posts", icon: Send },
    ],
  },
  {
    section: "Manage",
    items: [
      { name: "Accounts", href: "/accounts", icon: PlugZap },
      { name: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

function NavItem({
  name,
  href,
  icon: Icon,
  active,
  badge,
}: {
  name: string;
  href: string;
  icon: typeof LayoutDashboard;
  active: boolean;
  badge?: string;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <Icon
        className={cn("size-4 shrink-0", active && "text-foreground")}
        aria-hidden="true"
      />
      <span className="flex-1 truncate">{name}</span>
      {badge && (
        <span
          className={cn(
            "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
            active
              ? "bg-accent-foreground/10 text-accent-foreground"
              : "bg-muted text-muted-foreground"
          )}
        >
          {badge}
        </span>
      )}
    </Link>
  );
}

function Brand() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2.5 px-2 py-1">
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Sparkles className="size-4" aria-hidden="true" />
      </span>
      <span className="text-sm font-semibold tracking-tight">SocialAgent</span>
    </Link>
  );
}

function BackendStatus() {
  const [online, setOnline] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      const { online } = await checkBackendHealth();
      if (mounted) setOnline(online);
    };
    check();
    const interval = setInterval(check, 30000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="flex items-center justify-between gap-2 px-2 py-1.5">
      <span className="text-xs text-muted-foreground">API</span>
      <span
        className={cn(
          "inline-flex items-center gap-1.5 text-xs font-medium",
          online === null && "text-muted-foreground",
          online === true && "text-emerald-400",
          online === false && "text-destructive"
        )}
      >
        <span
          className={cn(
            "size-1.5 rounded-full",
            online === null && "bg-muted-foreground/60",
            online === true && "bg-emerald-400",
            online === false && "bg-destructive"
          )}
          aria-hidden="true"
        />
        {online === null ? "Checking" : online ? "Connected" : "Offline"}
      </span>
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav aria-label="Main navigation" className="flex h-full flex-col">
      <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-3">
        <Brand />
      </div>
      <div className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map((group) => (
          <div key={group.section}>
            <p className="mb-1.5 px-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
              {group.section}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavItem
                  key={item.href}
                  {...item}
                  active={pathname === item.href}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="space-y-2 border-t border-sidebar-border p-3">
        <BackendStatus />
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <LogOut className="size-4" aria-hidden="true" />
          Sign out
        </button>
      </div>
    </nav>
  );
}

interface MobileSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function MobileSidebar({ open, onClose }: MobileSidebarProps) {
  const pathname = usePathname();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <div className={cn("lg:hidden", open ? "fixed inset-0 z-50" : "hidden")}>
      <div
        className="absolute inset-0 bg-background/70 backdrop-blur-sm animate-fade"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col border-r border-sidebar-border bg-sidebar shadow-xl dark:shadow-black/50 animate-rise">
        <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-3">
          <Brand />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
        <div className="flex-1 space-y-6 overflow-y-auto px-3 py-4" onClick={onClose}>
          {NAV_ITEMS.map((group) => (
            <div key={group.section}>
              <p className="mb-1.5 px-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
                {group.section}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavItem
                    key={item.href}
                    {...item}
                    active={pathname === item.href}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-sidebar-border p-3">
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <LogOut className="size-4" aria-hidden="true" />
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}