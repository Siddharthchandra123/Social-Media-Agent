"use client";

import { useSyncExternalStore } from "react";
import { Sparkles } from "lucide-react";
import { getAccessToken } from "@/lib/api";
import { LoginPage } from "@/components/auth/login-page";

const emptySubscribe = () => () => {};

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const authed = useSyncExternalStore(
    emptySubscribe,
    () => Boolean(getAccessToken()),
    () => null
  );

  if (authed === null) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background">
        <div className="flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-soft">
          <Sparkles className="size-5" aria-hidden="true" />
        </div>
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return authed ? children : <LoginPage />;
}