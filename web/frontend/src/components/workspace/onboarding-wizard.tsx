"use client";

import { useState } from "react";
import { useWorkspaceBrand } from "@/state/workspace-brand-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Sparkles, ArrowRight } from "lucide-react";

export function OnboardingWizard() {
  const { workspaces, brands, createWorkspace, createBrand, loading } = useWorkspaceBrand();
  const [step, setStep] = useState<"workspace" | "brand">(
    workspaces.length === 0 ? "workspace" : "brand"
  );
  const [workspaceName, setWorkspaceName] = useState("");
  const [brandName, setBrandName] = useState("");
  const [brandTone, setBrandTone] = useState("Professional, engaging, authoritative");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceName.trim()) return;
    try {
      setSubmitting(true);
      setError(null);
      await createWorkspace(workspaceName.trim());
      setStep("brand");
    } catch (err: any) {
      setError(err.message || "Failed to create workspace");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandName.trim()) return;
    try {
      setSubmitting(true);
      setError(null);
      await createBrand(brandName.trim(), brandTone);
    } catch (err: any) {
      setError(err.message || "Failed to create brand");
    } finally {
      setSubmitting(false);
    }
  };

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

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-border/60 shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            {step === "workspace" ? <Building2 className="size-6" /> : <Sparkles className="size-6" />}
          </div>
          <CardTitle className="text-2xl font-semibold">
            {step === "workspace" ? "Create your workspace" : "Create your first brand"}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {step === "workspace"
              ? "Workspaces help you group your agency or organization."
              : "Brands define the content tone, target audience, and connected social accounts."}
          </p>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {step === "workspace" ? (
            <form onSubmit={handleCreateWorkspace} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">Workspace Name</label>
                <Input
                  placeholder="e.g. Acme Agency"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Creating..." : "Continue to Brand"}
                <ArrowRight className="ml-2 size-4" />
              </Button>
            </form>
          ) : (
            <form onSubmit={handleCreateBrand} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">Brand Name</label>
                <Input
                  placeholder="e.g. My Personal Brand or Acme SaaS"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">Content Tone</label>
                <Input
                  placeholder="e.g. Professional, authoritative, witty"
                  value={brandTone}
                  onChange={(e) => setBrandTone(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Setting up..." : "Launch Dashboard"}
                <ArrowRight className="ml-2 size-4" />
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
