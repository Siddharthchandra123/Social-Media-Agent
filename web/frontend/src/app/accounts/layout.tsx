"use client";

import { UserProvider, useUser } from "@/state/user-context";
import { AppShell } from "@/components/layout/app-shell";
import { RequireAuth } from "@/components/require-auth";

function UserGate({ children }: { children: React.ReactNode }) {
  const { loading } = useUser();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading your account...</p>
        </div>
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}

export default function AccountsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireAuth>
      <UserProvider>
        <UserGate>{children}</UserGate>
      </UserProvider>
    </RequireAuth>
  );
}
