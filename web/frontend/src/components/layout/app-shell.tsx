"use client";

import { useState } from "react";
import { Sidebar, MobileSidebar } from "@/components/ui/layout/sidebar";
import { Topbar } from "@/components/ui/layout/topbar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <MobileSidebar
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
      />

      <div className="min-h-screen lg:pl-64">
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-sidebar-border bg-sidebar lg:block">
          <Sidebar />
        </aside>

        <div className="flex min-h-screen min-w-0 flex-col">
          <Topbar onOpenMobileNav={() => setMobileNavOpen(true)} />
          <main className="min-w-0 flex-1 px-4 pb-12 pt-6 sm:px-6 lg:px-8 lg:pt-8">
            <div className="mx-auto w-full max-w-6xl">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
