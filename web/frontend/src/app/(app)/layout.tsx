"use client";

import { WorkspaceBrandProvider, useWorkspaceBrand } from "@/state/workspace-brand-context";
import { OnboardingWizard } from "@/components/workspace/onboarding-wizard";
import { AppShell } from "@/components/layout/app-shell";
import { RequireAuth } from "@/components/require-auth";

function WorkspaceBrandGate({ children }: { children: React.ReactNode }) {
  const { workspaces, brands, loading } = useWorkspaceBrand();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  if (workspaces.length === 0 || brands.length === 0) {
    return <OnboardingWizard />;
  }

  return <AppShell>{children}</AppShell>;
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireAuth>
      <WorkspaceBrandProvider>
        <WorkspaceBrandGate>{children}</WorkspaceBrandGate>
      </WorkspaceBrandProvider>
    </RequireAuth>
  );
}
