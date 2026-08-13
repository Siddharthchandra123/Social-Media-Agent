"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LogOut,
  LayoutDashboard,
  PenLine,
  FileText,
  Send,
  PlugZap,
  Settings,
  X,
  Sparkles,
} from "lucide-react";
import { logout } from "@/lib/api";
import { useUser } from "@/state/user-context";
import { cn } from "@/lib/utils";
import { Drawer } from "@base-ui/react/drawer";

const NAV_SECTIONS: {
  label: string;
  items: { href: string; label: string; icon: typeof LayoutDashboard }[];
}[] = [
  {
    label: "Workspace",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/create", label: "AI Studio", icon: PenLine },
      { href: "/content", label: "Content", icon: FileText },
    ],
  },
  {
    label: "Publish",
    items: [
      { href: "/posts", label: "Publishing", icon: Send },
      { href: "/accounts", label: "Connected Accounts", icon: PlugZap },
    ],
  },
  {
    label: "Account",
    items: [{ href: "/settings", label: "Settings", icon: Settings }],
  },
];

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SidebarContent({
  onNavigate,
}: {
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const { user } = useUser();

  return (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="flex items-center gap-3 px-4 pb-5 pt-6">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-soft">
          <Sparkles className="size-4" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="truncate font-display text-[17px] font-semibold leading-tight tracking-tight text-foreground">
            SocialAgent
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {user?.email || "AI content studio"}
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-7 overflow-y-auto px-3 pb-4" aria-label="Main">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            <p className="mb-2 px-3 text-label">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon
                      className="size-4 shrink-0"
                      aria-hidden="true"
                    />
                    <span className="truncate">{item.label}</span>
                    {active && (
                      <span
                        className="absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-full bg-primary"
                        aria-hidden="true"
                      />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-3">
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <LogOut className="size-4 shrink-0" aria-hidden="true" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}

export function Sidebar() {
  return <SidebarContent />;
}

export function MobileSidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Drawer.Root open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <Drawer.Portal>
        <Drawer.Backdrop
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm lg:hidden data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 transition-opacity duration-200"
        />
        <Drawer.Popup
          className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-sidebar text-sidebar-foreground shadow-lift lg:hidden data-[ending-style]:translate-x-[-100%] data-[starting-style]:translate-x-[-100%] transition-transform duration-300 ease-out"
        >
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-end p-2">
              <Drawer.Close
                aria-label="Close navigation"
                className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="size-4" aria-hidden="true" />
              </Drawer.Close>
            </div>
            <div className="flex-1 overflow-hidden">
              <SidebarContent onNavigate={onClose} />
            </div>
          </div>
        </Drawer.Popup>
      </Drawer.Portal>
    </Drawer.Root>
  );
}