"use client";

import { useState } from "react";
import { Sidebar, MobileSidebar } from "@/components/ui/layout/sidebar";
import { Topbar } from "@/components/ui/layout/topbar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-60 shrink-0 border-r border-sidebar-border bg-sidebar lg:flex lg:flex-col">
        <Sidebar />
      </aside>

      <MobileSidebar
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onOpenMobileNav={() => setMobileNavOpen(true)} />
        <main className="min-w-0 flex-1 px-4 py-8 sm:px-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}