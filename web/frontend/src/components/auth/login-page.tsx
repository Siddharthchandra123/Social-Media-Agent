"use client";

import { useState } from "react";
import Link from "next/link";
import { api, setAccessToken } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Loader2, AlertTriangle } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export function LoginPage() {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const endpoint = isSignup ? "/auth/signup" : "/auth/login";
      const payload = isSignup ? { email, password, name } : { email, password };

      const res = await api.post(endpoint, payload);
      setAccessToken(res.data.access_token);
      window.location.href = "/dashboard";
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : typeof err === "object" &&
            err !== null &&
            "response" in err &&
            err.response &&
            typeof err.response === "object" &&
            "data" in err.response
            ? ((err.response.data as { detail?: string }).detail ?? "Authentication failed")
          : "Authentication failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      {/* Editorial backdrop: warm wash + faint paper grain */}
      <div className="absolute inset-0 bg-app-wash" aria-hidden="true" />
      <div className="absolute inset-0 bg-app-grain" aria-hidden="true" />

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-4 py-4 sm:px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-soft">
            <Sparkles className="size-4" aria-hidden="true" />
          </div>
          <span className="font-display text-[17px] font-semibold tracking-tight text-foreground">
            SocialAgent
          </span>
        </div>
        <ThemeToggle />
      </div>

      <div className="relative z-10 flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-md animate-rise">
          <div className="rounded-lg border border-border bg-card px-6 py-8 shadow-dialog sm:px-8">
            {/* Header */}
            <div className="mb-7">
              <p className="text-label">AI content studio</p>
              <h1 className="text-page-title mt-2 text-foreground">
                {isSignup
                  ? "Begin your journal"
                  : "Welcome back"}
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {isSignup
                  ? "Create an account and start drafting, reviewing, and publishing social content."
                  : "Sign in to your workspace — your connected accounts are waiting."}
              </p>
            </div>

            {/* Error */}
            {error && (
              <div
                role="alert"
                className="mb-4 flex items-start gap-2.5 rounded-md border border-destructive/25 bg-destructive/5 px-3.5 py-2.5 text-sm text-destructive"
              >
                <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            {/* Tabs */}
            <div
              className="mb-5 grid grid-cols-2 gap-1 rounded-md border border-border bg-muted/60 p-1"
              role="tablist"
              aria-label="Authentication mode"
            >
              <button
                type="button"
                role="tab"
                aria-selected={!isSignup}
                onClick={() => setIsSignup(false)}
                className="rounded-[4px] py-2 text-sm font-medium transition-colors aria-selected:bg-card aria-selected:text-foreground aria-selected:shadow-soft"
              >
                Sign in
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={isSignup}
                onClick={() => setIsSignup(true)}
                className="rounded-[4px] py-2 text-sm font-medium transition-colors aria-selected:bg-card aria-selected:text-foreground aria-selected:shadow-soft"
              >
                Create account
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignup && (
                <div className="space-y-2">
                  <label
                    htmlFor="auth-name"
                    className="text-sm font-medium leading-none text-foreground"
                  >
                    Full Name
                  </label>
                  <Input
                    id="auth-name"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              )}
              <div className="space-y-2">
                <label
                  htmlFor="auth-email"
                  className="text-sm font-medium leading-none text-foreground"
                >
                  Email Address
                </label>
                <Input
                  id="auth-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="auth-password"
                  className="text-sm font-medium leading-none text-foreground"
                >
                  Password
                </label>
                <Input
                  id="auth-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="h-10 w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    Processing...
                  </>
                ) : isSignup ? (
                  "Create Account"
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            <p className="ornament-rule mt-7 text-[11px] uppercase tracking-[0.14em]">
              Connected accounts stay linked
            </p>

            <p className="mt-3 text-center text-xs leading-relaxed text-muted-foreground">
              By continuing, you agree to SocialAgent&apos;s{" "}
              <Link href="#" className="font-medium text-foreground underline-offset-2 hover:underline">
                Terms
              </Link>{" "}
              and{" "}
              <Link href="#" className="font-medium text-foreground underline-offset-2 hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}