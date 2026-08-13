"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Plus } from "lucide-react";
import { useUser } from "@/state/user-context";
import { ThemeToggle } from "@/components/theme-toggle";

interface TopbarProps {
  onOpenMobileNav: () => void;
}

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/create": "AI Content Studio",
  "/content": "Content History",
  "/posts": "Publishing Pipeline",
  "/accounts": "Connected Accounts",
  "/settings": "Settings",
};

export function Topbar({ onOpenMobileNav }: TopbarProps) {
  const pathname = usePathname();
  const { user } = useUser();

  const title =
    PAGE_TITLES[pathname] ??
    (pathname.startsWith("/content/") ? "Content" : "SocialAgent");

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "US";

  return (
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border bg-background/85 px-4 backdrop-blur-md sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-2.5">
        <button
          type="button"
          onClick={onOpenMobileNav}
          aria-label="Open navigation"
          className="flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
        >
          <Menu className="size-5" aria-hidden="true" />
        </button>

        <h1 className="truncate font-display text-[15px] font-semibold tracking-tight text-foreground">
          {title}
        </h1>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <ThemeToggle />
        <Link
          href="/create"
          className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground shadow-soft transition-all hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:translate-y-px"
        >
          <Plus className="size-4" aria-hidden="true" />
          <span className="hidden sm:inline">Create</span>
        </Link>
        <div
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary select-none ring-1 ring-inset ring-primary/25"
          title={user?.email || "User"}
        >
          {initials}
        </div>
      </div>
    </header>
  );
}
