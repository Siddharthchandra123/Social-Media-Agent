"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  PenLine,
  Sparkles,
  PlugZap,
  Clock,
  Trash2,
  CheckCircle2,
} from "lucide-react";
import {
  fetchGenerations,
  fetchPosts,
  GenerationResponse,
  PostResponse,
  API_BASE_URL,
  getAccessToken,
} from "@/lib/api";
import { useUser } from "@/state/user-context";
import { recommendedCandidate, timeAgo } from "@/lib/format";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { PlatformIcon } from "@/components/platform-icon";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const router = useRouter();
  const { user, socialAccounts, disconnectAccount } = useUser();
  const [generations, setGenerations] = useState<GenerationResponse[] | null>(null);
  const [posts, setPosts] = useState<PostResponse[] | null>(null);
  const [error, setError] = useState(false);
  const [topic, setTopic] = useState("");
  const [disconnecting, setDisconnecting] = useState<string | null>(null);

  const load = async () => {
    try {
      const [genData, postData] = await Promise.all([
        fetchGenerations(6),
        fetchPosts(),
      ]);
      setGenerations(genData);
      setPosts(postData);
    } catch {
      setError(true);
    }
  };

  useEffect(() => {
    let mounted = true;
    Promise.all([fetchGenerations(6), fetchPosts()])
      .then(([genData, postData]) => {
        if (mounted) {
          setGenerations(genData);
          setPosts(postData);
        }
      })
      .catch(() => {
        if (mounted) setError(true);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const loading = !error && (generations === null || posts === null);
  const connectedMap = new Map(socialAccounts.map((acc) => [acc.platform, acc]));

  const handleQuickCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const query = topic.trim() ? `?topic=${encodeURIComponent(topic.trim())}` : "";
    router.push(`/create${query}`);
  };

  const handleConnect = (platform: string) => {
    const token = getAccessToken();
    const query = token ? `?token=${encodeURIComponent(token)}` : "";
    window.location.href = `${API_BASE_URL}/auth/${platform}${query}`;
  };

  const handleDisconnect = async (platform: string) => {
    if (!confirm(`Are you sure you want to disconnect ${platform}?`)) return;
    try {
      setDisconnecting(platform);
      await disconnectAccount(platform);
    } catch (err: any) {
      alert(err.message || "Failed to disconnect");
    } finally {
      setDisconnecting(null);
    }
  };

  return (
    <div className="animate-rise">
      <PageHeader
        title={`Welcome back, ${user?.name || "Creator"}`}
        description="Your AI social media agent and publishing command center."
        actions={
          <Link
            href="/create"
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-foreground px-3.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            <PenLine className="size-4" aria-hidden="true" />
            New generation
          </Link>
        }
      />

      {error ? (
        <ErrorState
          title="Couldn't load your dashboard"
          message="We couldn't reach the API. Check your connection and try again."
          retry={load}
        />
      ) : (
        <>
          {/* Quick create */}
          <section className="mb-6 rounded-xl border border-border bg-card p-5 sm:p-6">
            <form
              onSubmit={handleQuickCreate}
              className="flex flex-col gap-3 sm:flex-row sm:items-center"
            >
              <label htmlFor="quick-topic" className="sr-only">
                Post topic
              </label>
              <input
                id="quick-topic"
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="What do you want to post about today?"
                className="h-9 flex-1 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
              />
              <button
                type="submit"
                className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                <Sparkles className="size-4" aria-hidden="true" />
                Generate
              </button>
            </form>
          </section>

          {/* Status grid */}
          <div className="grid gap-6 md:grid-cols-3">
            {/* Recent generations */}
            <section className="md:col-span-2">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-sm font-semibold">
                  <Sparkles className="size-4 text-muted-foreground" aria-hidden="true" />
                  Recent generations
                </h2>
                <Link
                  href="/content"
                  className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  View all
                  <ArrowRight className="size-3" aria-hidden="true" />
                </Link>
              </div>

              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : generations && generations.length > 0 ? (
                <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
                  {generations.map((gen) => {
                    const rec = recommendedCandidate(gen);
                    return (
                      <li key={gen.id}>
                        <Link
                          href={`/content/${gen.id}`}
                          className="group flex flex-col gap-3 px-4 py-3.5 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="flex min-w-0 items-start gap-3">
                            <PlatformIcon platform={gen.platform} size="sm" className="mt-0.5" />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-foreground">
                                {gen.topic}
                              </p>
                              <p className="mt-0.5 text-xs text-muted-foreground">
                                {rec ? (
                                  <>
                                    <span className="font-medium text-foreground/80">
                                      Hook:
                                    </span>{" "}
                                    {rec.hook} · Score {rec.total_score}/100
                                  </>
                                ) : (
                                  "No candidates yet"
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                            <span className="capitalize">{gen.platform}</span>
                            <span aria-hidden="true">·</span>
                            <span>{timeAgo(gen.created_at)}</span>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <EmptyState
                  icon={Sparkles}
                  compact
                  title="No content yet"
                  description="Create your first AI-assisted post to populate this list."
                  action={
                    <Link
                      href="/create"
                      className="inline-flex h-8 items-center gap-1.5 rounded-md bg-foreground px-3.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
                    >
                      <PenLine className="size-4" aria-hidden="true" />
                      Create content
                    </Link>
                  }
                />
              )}
            </section>

            {/* Connected Accounts */}
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-sm font-semibold">
                  <PlugZap className="size-4 text-muted-foreground" aria-hidden="true" />
                  Connected Accounts
                </h2>
                <Link
                  href="/accounts"
                  className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  Manage
                  <ArrowRight className="size-3" aria-hidden="true" />
                </Link>
              </div>

              <div className="rounded-xl border border-border bg-card p-3 space-y-3">
                {/* LinkedIn */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <PlatformIcon platform="linkedin" size="sm" />
                    <span className="text-sm font-medium">LinkedIn</span>
                  </div>
                  {connectedMap.has("linkedin") ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-emerald-400 font-medium">Connected</span>
                      <button
                        onClick={() => handleDisconnect("linkedin")}
                        disabled={disconnecting === "linkedin"}
                        className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                        title="Disconnect"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleConnect("linkedin")}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      + Connect
                    </button>
                  )}
                </div>

                <div className="h-px bg-border" />

                {/* Facebook */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <PlatformIcon platform="facebook" size="sm" />
                    <span className="text-sm font-medium">Facebook</span>
                  </div>
                  {connectedMap.has("facebook") ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-emerald-400 font-medium">Connected</span>
                      <button
                        onClick={() => handleDisconnect("facebook")}
                        disabled={disconnecting === "facebook"}
                        className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                        title="Disconnect"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleConnect("facebook")}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      + Connect
                    </button>
                  )}
                </div>

                <div className="h-px bg-border" />

                {/* Instagram */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <PlatformIcon platform="instagram" size="sm" />
                    <span className="text-sm font-medium">Instagram</span>
                    {connectedMap.has("instagram") && (
                      <span className="text-xs text-muted-foreground">
                        @{connectedMap.get("instagram")?.display_name}
                      </span>
                    )}
                  </div>
                  {connectedMap.has("instagram") ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-emerald-400 font-medium">Connected</span>
                      <button
                        onClick={() => handleDisconnect("instagram")}
                        disabled={disconnecting === "instagram"}
                        className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                        title="Disconnect"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleConnect("instagram")}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      + Connect
                    </button>
                  )}
                </div>

                <div className="h-px bg-border" />

                {/* X / Twitter (Coming Soon) */}
                <div className="flex items-center justify-between opacity-60">
                  <div className="flex items-center gap-2.5">
                    <PlatformIcon platform="x" size="sm" />
                    <span className="text-sm font-medium">X (Twitter)</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground">Soon</span>
                </div>
              </div>
            </section>
          </div>

          {/* Publishing pipeline */}
          <section className="mt-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <Clock className="size-4 text-muted-foreground" aria-hidden="true" />
                Publishing Pipeline
              </h2>
              <Link
                href="/posts"
                className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Open publishing
                <ArrowRight className="size-3" aria-hidden="true" />
              </Link>
            </div>

            {loading ? (
              <Skeleton className="h-28 w-full" />
            ) : posts && posts.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {posts.slice(0, 3).map((post) => (
                  <div
                    key={post.id}
                    className="flex flex-col justify-between rounded-xl border border-border bg-card p-4"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                        <PlatformIcon platform={post.platform} size="sm" />
                        <span className="capitalize">{post.platform}</span>
                      </span>
                      <StatusBadge status={post.status} />
                    </div>
                    <p className="mt-3 line-clamp-2 text-sm text-foreground">
                      {post.hook}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                compact
                icon={PenLine}
                title="Nothing in the pipeline yet"
                description="Convert an AI candidate into a post draft and manage it here."
                className={cn("bg-card/40")}
              />
            )}
          </section>
        </>
      )}
    </div>
  );
}
