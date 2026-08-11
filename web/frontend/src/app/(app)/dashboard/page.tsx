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
} from "lucide-react";
import {
  fetchGenerations,
  fetchPosts,
  GenerationResponse,
  PostResponse,
} from "@/lib/api";
import {
  PLATFORMS,
  getConnectedPlatforms,
  ConnectedPlatform,
} from "@/lib/platforms";
import { recommendedCandidate, timeAgo } from "@/lib/format";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { PlatformIcon } from "@/components/platform-icon";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const router = useRouter();
  const [generations, setGenerations] = useState<GenerationResponse[] | null>(null);
  const [posts, setPosts] = useState<PostResponse[] | null>(null);
  const [error, setError] = useState(false);
  const [topic, setTopic] = useState("");
  const [connected] = useState<ConnectedPlatform[]>(() => getConnectedPlatforms());

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
  const connectedCount = connected.length;
  const connectedSet = new Set(connected.map((c) => c.platform));

  const handleQuickCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const query = topic.trim() ? `?topic=${encodeURIComponent(topic.trim())}` : "";
    router.push(`/create${query}`);
  };

  return (
    <div className="animate-rise">
      <PageHeader
        title="Dashboard"
        description="Your AI social media workspace."
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
                placeholder="What do you want to post about?"
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
            <p className="mt-3 text-xs text-muted-foreground">
              Pick a topic, then refine platform, tone, and audience in the
              Create workspace.
            </p>
          </section>

          {/* Status grid */}
          <div className="grid gap-4 md:grid-cols-3">
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

            {/* Accounts */}
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-sm font-semibold">
                  <PlugZap className="size-4 text-muted-foreground" aria-hidden="true" />
                  Accounts
                </h2>
                <Link
                  href="/accounts"
                  className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  Manage
                  <ArrowRight className="size-3" aria-hidden="true" />
                </Link>
              </div>

              <div className="rounded-xl border border-border bg-card p-2">
                {PLATFORMS.map((platform) => {
                  const isConnected = connectedSet.has(platform.id);
                  return (
                    <div
                      key={platform.id}
                      className="flex items-center gap-3 rounded-lg px-2 py-2.5"
                    >
                      <PlatformIcon platform={platform.id} size="sm" />
                      <span className="flex-1 truncate text-sm text-foreground">
                        {platform.label}
                      </span>
                      {isConnected ? (
                        <StatusBadge status="published" label="Connected" />
                      ) : (
                        <StatusBadge
                          status="draft"
                          label={platform.connectAvailable ? "Not connected" : "Soon"}
                          className="rounded-full bg-muted text-muted-foreground ring-border"
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              {connectedCount === 0 && (
                <Link
                  href="/accounts"
                  className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-background px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                >
                  Connect an account
                  <ArrowRight className="size-3.5" aria-hidden="true" />
                </Link>
              )}
            </section>
          </div>

          {/* Publishing pipeline */}
          <section className="mt-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <Clock className="size-4 text-muted-foreground" aria-hidden="true" />
                Publishing
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