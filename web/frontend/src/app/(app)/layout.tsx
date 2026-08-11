import { AppShell } from "@/components/layout/app-shell";
import { RequireAuth } from "@/components/require-auth";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell>
      <RequireAuth>{children}</RequireAuth>
    </AppShell>
  );
}