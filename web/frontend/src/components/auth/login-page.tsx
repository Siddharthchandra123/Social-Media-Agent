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
      {/* Aurora backdrop */}
      <div className="absolute inset-0 bg-app-aurora" aria-hidden="true" />

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-4 py-4 sm:px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-soft">
            <Sparkles className="size-4" aria-hidden="true" />
          </div>
          <span className="text-sm font-semibold tracking-tight text-foreground">
            SocialAgent
          </span>
        </div>
        <ThemeToggle />
      </div>

      <div className="relative z-10 flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-md animate-rise">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-dialog sm:p-8">
            {/* Header */}
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Sparkles className="size-6" aria-hidden="true" />
              </div>
              <h1 className="text-xl font-semibold tracking-tight text-foreground">
                {isSignup ? "Create your Agent account" : "Sign in to SocialAgent"}
              </h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {isSignup
                  ? "Get started with your AI social media agent"
                  : "Welcome back — your content studio is waiting"}
              </p>
            </div>

            {/* Error */}
            {error && (
              <div
                role="alert"
                className="mb-4 flex items-start gap-2.5 rounded-lg border border-destructive/25 bg-destructive/5 px-3.5 py-2.5 text-sm text-destructive"
              >
                <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            {/* Tabs */}
            <div
              className="mb-5 grid grid-cols-2 gap-1 rounded-lg bg-muted p-1"
              role="tablist"
              aria-label="Authentication mode"
            >
              <button
                type="button"
                role="tab"
                aria-selected={!isSignup}
                onClick={() => setIsSignup(false)}
                className="rounded-md py-2 text-sm font-medium transition-colors aria-selected:bg-card aria-selected:text-foreground aria-selected:shadow-soft"
              >
                Sign in
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={isSignup}
                onClick={() => setIsSignup(true)}
                className="rounded-md py-2 text-sm font-medium transition-colors aria-selected:bg-card aria-selected:text-foreground aria-selected:shadow-soft"
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

            <p className="mt-5 text-center text-xs leading-relaxed text-muted-foreground">
              By continuing, you agree to SocialAgent&apos;s{" "}
              <Link href="#" className="font-medium text-foreground underline-offset-2 hover:underline">
                Terms
              </Link>{" "}
              and{" "}
              <Link href="#" className="font-medium text-foreground underline-offset-2 hover:underline">
                Privacy Policy
              </Link>
              . Your connected social accounts remain linked to your account.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}