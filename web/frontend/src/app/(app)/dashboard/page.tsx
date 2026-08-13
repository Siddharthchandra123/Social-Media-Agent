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
  AlertTriangle,
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

const PLATFORM_CARDS: {
  id: "linkedin" | "facebook" | "instagram" | "x";
  description: string;
  connectAvailable: boolean;
}[] = [
  {
    id: "linkedin",
    description: "Professional updates to your profile.",
    connectAvailable: true,
  },
  {
    id: "facebook",
    description: "Posts to your Facebook Pages.",
    connectAvailable: true,
  },
  {
    id: "instagram",
    description: "Feed posts to your Business account.",
    connectAvailable: true,
  },
  {
    id: "x",
    description: "Short-form posts (coming soon).",
    connectAvailable: false,
  },
];

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

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
    approved: posts?.filter((p) => p.status === "approved").length ?? 0,
    scheduled: posts?.filter((p) => p.status === "scheduled").length ?? 0,
    published: posts?.filter((p) => p.status === "published").length ?? 0,
    failed: posts?.filter((p) => p.status === "failed").length ?? 0,
  };

  const nextUp =
    posts
      ?.filter((p) => p.status === "scheduled")
      .sort(
        (a, b) =>
          new Date(a.scheduled_at ?? 0).getTime() -
          new Date(b.scheduled_at ?? 0).getTime()
      )[0] ?? null;

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

  const firstName = user?.name?.split(" ")[0] || "Creator";

  return (
    <div className="animate-rise">
      {/* ================= WELCOME / PRIMARY ACTION ================= */}
      <section className="relative mb-8 sm:mb-10">
        <div
          className="pointer-events-none absolute -inset-x-4 -top-6 -bottom-8 bg-app-wash sm:-inset-x-6 lg:-inset-x-8"
          aria-hidden="true"
        />
        <div className="relative max-w-2xl">
          <p className="text-label">
            {new Date().toLocaleDateString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
          <h1 className="text-display mt-2 text-foreground">
            {greeting()},{" "}
            <span className="italic">{firstName}</span>
          </h1>
          <p className="mt-2.5 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
            Your social content desk — draft, review, and publish
            in one calm place.
          </p>

          <form
            onSubmit={handleQuickCreate}
            className="mt-5 flex max-w-lg flex-col gap-2 sm:flex-row"
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
              className="h-11 min-w-0 flex-1 rounded-md border border-input bg-card px-3.5 text-sm text-foreground shadow-soft outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
            />
            <button
              type="submit"
              className="inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-soft transition-all hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:translate-y-px"
            >
              <Sparkles className="size-4" aria-hidden="true" />
              Generate
            </button>
          </form>

          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs font-medium text-muted-foreground">
            <Link
              href="/create"
              className="inline-flex items-center gap-1 transition-colors hover:text-accent-foreground"
            >
              Open AI Studio
              <ArrowRight className="size-3" aria-hidden="true" />
            </Link>
            <Link
              href="/posts"
              className="inline-flex items-center gap-1 transition-colors hover:text-accent-foreground"
            >
              View publishing
              <ArrowRight className="size-3" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {error ? (
        <ErrorState
          title="Couldn't load your dashboard"
          message="We couldn't reach the API. Check your connection and try again."
          retry={load}
        />
      ) : (
        <div className="space-y-10 sm:space-y-12">
          {/* ================= NUMBERS ================= */}
          <section className="grid grid-cols-2 gap-x-4 gap-y-6 rounded-lg border border-border bg-card px-5 py-6 sm:grid-cols-4 sm:px-6 lg:px-8">
            <StatCard
              label="Platforms"
              value={loading ? "—" : `${counts.connected}/3`}
              icon={PlugZap}
              hint="LinkedIn · Facebook · Instagram"
            />
            <StatCard
              label="Drafts"
              value={loading ? "—" : counts.drafts}
              icon={FileText}
              hint="Awaiting approval"
            />
            <StatCard
              label="Scheduled"
              value={loading ? "—" : counts.scheduled}
              icon={Clock}
              hint="In the queue"
            />
            <StatCard
              label="Published"
              value={loading ? "—" : counts.published}
              icon={CheckCircle2}
              hint="Lifetime posts"
            />
          </section>

          {/* ================= CONNECTED PRESENCE ================= */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-section-title">
                Connected presence
              </h2>
              <Link
                href="/accounts"
                className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-accent-foreground"
              >
                Manage
                <ArrowRight className="size-3" aria-hidden="true" />
              </Link>
            </div>

            <div className="divide-y divide-border rounded-lg border border-border bg-card sm:grid sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4">
              {PLATFORM_CARDS.map((p, i) => (
                <div
                  key={p.id}
                  className={
                    "px-5 py-4 sm:px-4 lg:px-5 " +
                    (i % 2 === 1
                      ? "sm:border-l sm:border-border lg:border-l"
                      : "")
                  }
                >
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

          <div className="grid gap-10 lg:grid-cols-2 lg:gap-12">
            {/* ================= PUBLISHING ================= */}
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-section-title">Publishing desk</h2>
                <Link
                  href="/posts"
                  className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-accent-foreground"
                >
                  Open publishing
                  <ArrowRight className="size-3" aria-hidden="true" />
                </Link>
              </div>

              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : nextUp ? (
                <div className="rounded-lg border border-border bg-card p-5">
                  <p className="text-label">Next up</p>
                  <div className="mt-3 flex items-start gap-3">
                    <PlatformIcon platform={nextUp.platform} size="sm" />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium leading-snug text-foreground">
                          {nextUp.hook}
                        </p>
                        <StatusBadge status={nextUp.status} />
                      </div>
                      {nextUp.scheduled_at && (
                        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="size-3.5" aria-hidden="true" />
                          {new Date(nextUp.scheduled_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <EmptyState
                  compact
                  icon={Send}
                  title="Nothing scheduled"
                  description="Approve a draft or schedule a post to see it here."
                />
              )}

              <dl className="mt-4 divide-y divide-border rounded-lg border border-border bg-card">
                {[
                  { label: "Drafts awaiting approval", value: counts.drafts, icon: FileText },
                  { label: "Approved, ready to publish", value: counts.approved, icon: CheckCircle2 },
                  { label: "Scheduled", value: counts.scheduled, icon: Clock },
                  { label: "Published", value: counts.published, icon: Send },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between px-5 py-2.5"
                  >
                    <dt className="flex items-center gap-2.5 text-xs text-muted-foreground">
                      <row.icon className="size-3.5" aria-hidden="true" />
                      {row.label}
                    </dt>
                    <dd className="font-display text-[15px] font-semibold tabular-nums text-foreground">
                      {row.value}
                    </dd>
                  </div>
                ))}
                {counts.failed > 0 && (
                  <div className="flex items-center justify-between bg-destructive/5 px-5 py-2.5">
                    <dt className="flex items-center gap-2.5 text-xs font-medium text-destructive">
                      <AlertTriangle className="size-3.5" aria-hidden="true" />
                      Failed — review needed
                    </dt>
                    <dd className="font-display text-[15px] font-semibold tabular-nums text-destructive">
                      {counts.failed}
                    </dd>
                  </div>
                )}
              </dl>
            </section>

            {/* ================= RECENT ACTIVITY ================= */}
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-section-title">Recent activity</h2>
                <Link
                  href="/content"
                  className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-accent-foreground"
                >
                  View all
                  <ArrowRight className="size-3" aria-hidden="true" />
                </Link>
              </div>

              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : generations && generations.length > 0 ? (
                <ul className="divide-y divide-border rounded-lg border border-border bg-card">
                  {generations.map((gen) => {
                    const rec = recommendedCandidate(gen);
                    return (
                      <li key={gen.id}>
                        <Link
                          href={`/content/${gen.id}`}
                          className="group flex items-start gap-3 px-5 py-3.5 transition-colors hover:bg-muted/50"
                        >
                          <span className="mt-0.5 shrink-0">
                            <PlatformIcon platform={gen.platform} size="sm" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-foreground">
                              {gen.topic}
                            </p>
                            <p className="mt-0.5 truncate text-xs text-muted-foreground">
                              {rec ? (
                                <>
                                  {rec.hook} · Score {rec.total_score}/100
                                </>
                              ) : (
                                "No candidates yet"
                              )}
                            </p>
                          </div>
                          <span className="shrink-0 text-[11px] text-muted-foreground/80">
                            {timeAgo(gen.created_at)}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <EmptyState
                  compact
                  icon={Layers}
                  title="No activity yet"
                  description="Create your first AI-assisted post to fill this journal."
                  action={
                    <Link
                      href="/create"
                      className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
                    >
                      <PenLine className="size-4" aria-hidden="true" />
                      Create content
                    </Link>
                  }
                />
              )}
            </section>
          </div>
        </div>
      )}
    </div>
  );
}