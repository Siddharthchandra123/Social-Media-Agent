"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { setAccessToken } from "@/lib/api";
import { consumePendingPlatform, recordPlatformConnected } from "@/lib/platforms";
import { Loader2 } from "lucide-react";

function Callback() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      router.replace("/");
      return;
    }

    setAccessToken(token);

    // Record the platform that was connected during this OAuth flow
    const platform = consumePendingPlatform();
    if (platform) {
      recordPlatformConnected(platform);
    }

    router.replace("/dashboard");
  }, [router, searchParams]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="size-8 animate-spin text-muted-foreground" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">Connecting your account...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="size-8 animate-spin text-muted-foreground" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">Connecting your account...</p>
          </div>
        </div>
      }
    >
      <Callback />
    </Suspense>
  );
}