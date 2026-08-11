"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Plus } from "lucide-react";
import { useUser } from "@/state/user-context";

interface TopbarProps {
  onOpenMobileNav: () => void;
}

export function Topbar({ onOpenMobileNav }: TopbarProps) {
  const pathname = usePathname();
  const { user } = useUser();

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "US";

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border bg-background/80 px-4 backdrop-blur sm:px-6">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onOpenMobileNav}
          aria-label="Open navigation"
          className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden"
        >
          <Menu className="size-4.5" aria-hidden="true" />
        </button>

        <div className="hidden text-sm font-medium text-foreground sm:block">
          {pathname === "/dashboard" && "Dashboard"}
          {pathname === "/create" && "AI Content Studio"}
          {pathname === "/content" && "Content History"}
          {pathname === "/posts" && "Publishing Pipeline"}
          {pathname === "/accounts" && "Connected Accounts"}
          {pathname === "/settings" && "Settings"}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/create"
          className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <Plus className="size-4" aria-hidden="true" />
          <span>Create</span>
        </Link>
        <div
          className="flex size-8 items-center justify-center rounded-full bg-primary/20 text-xs font-semibold text-primary select-none"
          title={user?.email || "User"}
        >
          {initials}
        </div>
      </div>
    </header>
  );
}
