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
  FileText,
  CheckCircle2,
  Send,
  Layers,
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
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { PlatformIcon } from "@/components/platform-icon";
import { StatCard } from "@/components/ui/stat-card";
import { PlatformAccountCard } from "@/components/platform-account-card";
import { cn } from "@/lib/utils";

const PLATFORM_CARDS: {
  id: "linkedin" | "facebook" | "instagram" | "x";
  description: string;
  connectAvailable: boolean;
}[] = [
  {
    id: "linkedin",
    description: "Publish professional updates to your LinkedIn profile.",
    connectAvailable: true,
  },
  {
    id: "facebook",
    description: "Publish to your Facebook Pages.",
    connectAvailable: true,
  },
  {
    id: "instagram",
    description: "Publish feed posts to your Instagram Business account.",
    connectAvailable: true,
  },
  {
    id: "x",
    description: "Broadcast short-form posts on X (coming soon).",
    connectAvailable: false,
  },
];

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

  const counts = {
    connected: socialAccounts.filter((a) => a.status === "active").length,
    drafts: posts?.filter((p) => p.status === "draft").length ?? 0,
    scheduled: posts?.filter((p) => p.status === "scheduled").length ?? 0,
    published: posts?.filter((p) => p.status === "published").length ?? 0,
  };

  const handleQuickCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const query = topic.trim() ? `?topic=${encodeURIComponent(topic.trim())}` : "";
    router.push(`/create${query}`);
  };

  const handleConnect = (platform: string) => {
    const token = getAccessToken();
    const query = token ? `?token=${encodeURIComponent(token)}` : "";
    window.location.assign(`${API_BASE_URL}/auth/${platform}${query}`);
  };

  const handleDisconnect = async (platform: string) => {
    if (!confirm(`Are you sure you want to disconnect ${platform}?`)) return;
    try {
      setDisconnecting(platform);
      await disconnectAccount(platform);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to disconnect");
    } finally {
      setDisconnecting(null);
    }
  };

  return (
    <div className="animate-rise">
      {/* Hero / welcome */}
      <section className="relative mb-6 overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-soft sm:p-7">
        <div className="absolute inset-0 bg-app-aurora" aria-hidden="true" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              Welcome back, {user?.name?.split(" ")[0] || "Creator"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Your AI content command center — draft, review, and publish in
              one place.
            </p>

            <form
              onSubmit={handleQuickCreate}
              className="mt-4 flex max-w-lg flex-col gap-2 sm:flex-row"
            >
              <label htmlFor="quick-topic" className="sr-only">
                Post topic
              </label>
              <input
                id="quick-topic"
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="What should your next post be about?"
                className="h-10 min-w-0 flex-1 rounded-lg border border-input bg-background px-3.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
              />
              <button
                type="submit"
                className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-soft transition-all hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:translate-y-px"
              >
                <Sparkles className="size-4" aria-hidden="true" />
                Generate
              </button>
            </form>
          </div>

          <Link
            href="/create"
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-foreground px-3.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            <PenLine className="size-4" aria-hidden="true" />
            Open AI Studio
          </Link>
        </div>
      </section>

      {error ? (
        <ErrorState
          title="Couldn't load your dashboard"
          message="We couldn't reach the API. Check your connection and try again."
          retry={load}
        />
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <StatCard
              label="Connected platforms"
              value={loading ? "—" : `${counts.connected}/3`}
              icon={PlugZap}
              hint="LinkedIn · Facebook · Instagram"
            />
            <StatCard
              label="Drafts awaiting review"
              value={loading ? "—" : counts.drafts}
              icon={FileText}
              hint="Ready to approve"
            />
            <StatCard
              label="Scheduled posts"
              value={loading ? "—" : counts.scheduled}
              icon={Clock}
              hint="In the publishing queue"
            />
            <StatCard
              label="Published"
              value={loading ? "—" : counts.published}
              icon={CheckCircle2}
              hint="Lifetime posts"
            />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            {/* Recent generations */}
            <section className="lg:col-span-2">
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
                <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card shadow-soft">
                  {generations.map((gen) => {
                    const rec = recommendedCandidate(gen);
                    return (
                      <li key={gen.id}>
                        <Link
                          href={`/content/${gen.id}`}
                          className="group flex flex-col gap-3 px-4 py-3.5 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="flex min-w-0 items-start gap-3">
                            <PlatformIcon platform={gen.platform} size="sm" />
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
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
                    >
                      <PenLine className="size-4" aria-hidden="true" />
                      Create content
                    </Link>
                  }
                />
              )}
            </section>

            {/* Connected accounts */}
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

              <div className="space-y-2.5 rounded-xl border border-border bg-card p-3.5 shadow-soft">
                {PLATFORM_CARDS.map((p) => (
                  <div key={p.id}>
                    <PlatformAccountCard
                      platform={p.id}
                      description={p.description}
                      account={connectedMap.get(p.id)}
                      connectAvailable={p.connectAvailable}
                      disconnecting={disconnecting === p.id}
                      onConnect={() => handleConnect(p.id)}
                      onDisconnect={() => handleDisconnect(p.id)}
                      compact
                    />
                  </div>
                ))}
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
                    className={cn(
                      "flex flex-col justify-between rounded-xl border bg-card p-4 shadow-soft transition-all hover:shadow-card",
                      post.status === "failed" && "border-destructive/30"
                    )}
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
                    {post.status === "failed" && (
                      <p className="mt-2 flex items-center gap-1.5 text-xs text-destructive">
                        <Layers className="size-3" aria-hidden="true" />
                        Failed — review on publishing page
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                compact
                icon={Send}
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
