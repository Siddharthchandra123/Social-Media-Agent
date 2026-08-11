"use client";

import { useState } from "react";
import Link from "next/link";
import { PlugZap } from "lucide-react";
import { getAccessToken } from "@/lib/api";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Authentication is OAuth-only (LinkedIn / Facebook). There is no
 * email/password login. A user is "signed in" when the backend OAuth
 * callback stored a JWT locally. Every app screen is gated through this
 * component: unauthenticated visitors see a connect-first empty state.
 */
function NotSignedIn() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <EmptyState
        icon={PlugZap}
        title="Connect an account to get started"
        description="SocialAgent signs you in through LinkedIn or Facebook. Connect one to start generating content."
        action={
          <Link
            href="/accounts"
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-foreground px-3.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            Connect an account
          </Link>
        }
      />
    </div>
  );
}

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const [authed] = useState<boolean | null>(() => Boolean(getAccessToken()));

  if (authed === null) {
    return (
      <div className="space-y-4" aria-hidden="true">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-4 w-96 max-w-full" />
        <div className={cn("mt-8 grid gap-4 md:grid-cols-2")}>
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  return authed ? children : <NotSignedIn />;
}