"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { LogOut, LayoutDashboard, PenLine, FileText, Send, PlugZap, Settings } from "lucide-react";
import { logout } from "@/lib/api";
import { useUser } from "@/state/user-context";

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useUser();

  const links = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/create", label: "AI Studio", icon: PenLine },
    { href: "/content", label: "Content", icon: FileText },
    { href: "/posts", label: "Publishing", icon: Send },
    { href: "/accounts", label: "Connected Accounts", icon: PlugZap },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="flex h-full flex-col justify-between p-4">
      <div className="space-y-6">
        <div className="flex items-center gap-2.5 px-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
            SA
          </div>
          <div>
            <h1 className="text-sm font-semibold text-foreground">Social Agent</h1>
            <p className="text-xs text-muted-foreground truncate max-w-[140px]">{user?.email || "Agent Account"}</p>
          </div>
        </div>

        <nav className="space-y-1">
          {links.map((link) => {
            const Icon = link.icon;
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="size-4" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-border pt-4">
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <LogOut className="size-4" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}

export function MobileSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex bg-black/50 lg:hidden">
      <div className="w-64 bg-sidebar border-r border-sidebar-border">
        <Sidebar />
      </div>
      <div className="flex-1" onClick={onClose} />
    </div>
  );
}
