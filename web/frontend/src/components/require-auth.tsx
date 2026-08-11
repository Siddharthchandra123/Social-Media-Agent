"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { getAccessToken } from "@/lib/api";
import { LoginPage } from "@/components/auth/login-page";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const [authed] = useState<boolean | null>(() => Boolean(getAccessToken()));

  if (authed === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return authed ? children : <LoginPage />;
}
