"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { setAccessToken } from "@/lib/api";
import { consumePendingPlatform, recordPlatformConnected } from "@/lib/platforms";
import { Sparkles } from "lucide-react";

function Callback() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // The backend now redirects to /dashboard with the JWT already
    // persisted (httponly connect_jwt cookie set during the OAuth leg).
    // A ?token= query is still accepted defensively for older flows.
    const token = searchParams.get("token");
    if (token) {
      setAccessToken(token);
    }

    // Record the platform that was connected during this OAuth flow
    const platform = consumePendingPlatform();
    if (platform) {
      recordPlatformConnected(platform);
    }

    // RequireAuth shows the login experience on /dashboard when no
    // session exists, so a single landing point covers every case.
    router.replace("/dashboard");
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background">
      <div className="flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-soft">
        <Sparkles className="size-5" aria-hidden="true" />
      </div>
      <p className="text-sm text-muted-foreground">Connecting your account…</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background">
          <div className="flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-soft">
            <Sparkles className="size-5" aria-hidden="true" />
          </div>
          <p className="text-sm text-muted-foreground">Connecting your account…</p>
        </div>
      }
    >
      <Callback />
    </Suspense>
  );
}