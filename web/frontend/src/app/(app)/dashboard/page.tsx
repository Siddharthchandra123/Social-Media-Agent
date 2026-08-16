"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  ChevronRight,
  PenLine,
  Sparkles,
  PlugZap,
  Clock,
  FileText,
  CheckCircle2,
  Layers,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  fetchGenerations,
  fetchPosts,
  GenerationResponse,
  PostResponse,
} from "@/lib/api";
import { useUser } from "@/state/user-context";
import { recommendedCandidate, timeAgo } from "@/lib/format";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { PlatformIcon } from "@/components/platform-icon";
import { StatCard } from "@/components/ui/stat-card";

const PLATFORM_CARDS: {
  id: "linkedin" | "facebook" | "instagram" | "x";
  name: string;
  connectAvailable: boolean;
}[] = [
  { id: "linkedin", name: "LinkedIn", connectAvailable: true },
  { id: "facebook", name: "Facebook", connectAvailable: true },
  { id: "instagram", name: "Instagram", connectAvailable: true },
  { id: "x", name: "X", connectAvailable: true },
];

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, socialAccounts } = useUser();
  const [generations, setGenerations] = useState<GenerationResponse[] | null>(null);
  const [posts, setPosts] = useState<PostResponse[] | null>(null);
  const [error, setError] = useState(false);
  const [topic, setTopic] = useState("");

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

  const firstName = user?.name?.split(" ")[0] || "Creator";

  const ledgerCells = [
    { label: "Drafts", value: counts.drafts },
    { label: "Approved", value: counts.approved },
    { label: "Scheduled", value: counts.scheduled },
    { label: "Published", value: counts.published },
  ];

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
        <div className="space-y-8 sm:space-y-10">
          {/* ================= NUMBERS ================= */}
          <section className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-4">
            <div className="bg-card px-4 py-4 sm:px-5">
              <StatCard
                label="Platforms"
                value={loading ? "—" : `${counts.connected}/4`}
                icon={PlugZap}
                hint="LinkedIn · Facebook · Instagram · X"
              />
            </div>
            <div className="bg-card px-4 py-4 sm:px-5">
              <StatCard
                label="Drafts"
                value={loading ? "—" : counts.drafts}
                icon={FileText}
                hint="Awaiting approval"
              />
            </div>
            <div className="bg-card px-4 py-4 sm:px-5">
              <StatCard
                label="Scheduled"
                value={loading ? "—" : counts.scheduled}
                icon={Clock}
                hint="In the queue"
              />
            </div>
            <div className="bg-card px-4 py-4 sm:px-5">
              <StatCard
                label="Published"
                value={loading ? "—" : counts.published}
                icon={CheckCircle2}
                hint="Lifetime posts"
              />
            </div>
          </section>

          {/* ================= CONNECTED PRESENCE ================= */}
          <section>
            <div className="mb-2.5 flex min-w-0 items-center justify-between gap-3">
              <h2 className="flex min-w-0 items-center gap-2 text-section-title">
                <span className="mark-accent shrink-0" aria-hidden="true" />
                <span className="truncate">Connected presence</span>
              </h2>
              <Link
                href="/accounts"
                className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-accent-foreground"
              >
                Manage
                <ArrowRight className="size-3" aria-hidden="true" />
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
              {PLATFORM_CARDS.map((p) => {
                const account = connectedMap.get(p.id);
                const active = account?.status === "active";
                return (
                  <Link
                    key={p.id}
                    href="/accounts"
                    title={
                      active
                        ? `${p.name} is connected`
                        : p.connectAvailable
                          ? `Connect ${p.name}`
                          : `${p.name} is coming soon`
                    }
                    className="flex min-w-0 items-center gap-3 bg-card px-3.5 py-3 transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:flex-col sm:items-start sm:justify-center sm:gap-2.5 sm:px-4 sm:py-4"
                  >
                    <span className="shrink-0">
                      <PlatformIcon platform={p.id} size="sm" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-foreground">
                        {p.name}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {active
                          ? (account?.display_name ?? "Connected")
                          : p.connectAvailable
                            ? "Not connected"
                            : "Coming soon"}
                      </span>
                    </span>
                    <span
                      className={cn(
                        "shrink-0 text-xs font-medium",
                        active
                          ? "text-success"
                          : p.connectAvailable
                            ? "text-primary"
                            : "text-muted-foreground/70"
                      )}
                    >
                      {active ? "Active" : p.connectAvailable ? "Connect" : "Soon"}
                    </span>
                    <ChevronRight
                      className="size-4 shrink-0 text-muted-foreground/40 sm:hidden"
                      aria-hidden="true"
                    />
                  </Link>
                );
              })}
            </div>
          </section>

          {/* ================= PUBLISHING + ACTIVITY ================= */}
          {/*
            NOTE: the explicit `grid-cols-1` below is required. Without it the
            wrapper creates implicit `auto` grid tracks at mobile width, which
            size to the sections' min-content (the nowrap/truncate hook line in
            "Next up" is ~485px) and overflow the container horizontally.
          */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
            {/* ================= PUBLISHING DESK ================= */}
            <section className="min-w-0">
              <div className="mb-2.5 flex min-w-0 items-center justify-between gap-3">
                <h2 className="flex min-w-0 items-center gap-2 text-section-title">
                  <span className="mark-accent shrink-0" aria-hidden="true" />
                  <span className="truncate">Publishing desk</span>
                </h2>
                <Link
                  href="/posts"
                  className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-accent-foreground"
                >
                  Open publishing
                  <ArrowRight className="size-3" aria-hidden="true" />
                </Link>
              </div>

              <div className="overflow-hidden rounded-lg border border-border bg-card">
                {loading ? (
                  <div className="space-y-3 p-4">
                    <Skeleton className="h-14 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                ) : nextUp ? (
                  <div className="flex items-center gap-3 border-b border-border px-4 py-3.5">
                    <PlatformIcon platform={nextUp.platform} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {nextUp.hook}
                      </p>
                      {nextUp.scheduled_at && (
                        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="size-3.5 shrink-0" aria-hidden="true" />
                          <span className="truncate">
                            Next up · {new Date(nextUp.scheduled_at).toLocaleString()}
                          </span>
                        </p>
                      )}
                    </div>
                    <StatusBadge status={nextUp.status} className="shrink-0" />
                  </div>
                ) : (
                  <div className="border-b border-border px-4 py-3.5 text-xs text-muted-foreground">
                    Nothing scheduled — approve a draft to queue it.
                  </div>
                )}

                <div className="grid grid-cols-2 gap-px bg-border sm:grid-cols-4">
                  {ledgerCells.map((cell) => (
                    <div key={cell.label} className="min-w-0 bg-card px-4 py-3.5">
                      <p className="text-label">{cell.label}</p>
                      <p className="stat-figure mt-1.5">{cell.value}</p>
                    </div>
                  ))}
                </div>

                {counts.failed > 0 && (
                  <Link
                    href="/posts"
                    className="flex items-center justify-between gap-3 bg-destructive/5 px-4 py-2.5 transition-colors hover:bg-destructive/10"
                  >
                    <span className="flex min-w-0 items-center gap-2.5 text-xs font-medium text-destructive">
                      <AlertTriangle className="size-3.5 shrink-0" aria-hidden="true" />
                      <span className="truncate">Failed — review needed</span>
                    </span>
                    <span className="font-display text-[15px] font-semibold tabular-nums text-destructive">
                      {counts.failed}
                    </span>
                  </Link>
                )}
              </div>
            </section>

            {/* ================= RECENT ACTIVITY ================= */}
            <section className="min-w-0">
              <div className="mb-2.5 flex min-w-0 items-center justify-between gap-3">
                <h2 className="flex min-w-0 items-center gap-2 text-section-title">
                  <span className="mark-accent shrink-0" aria-hidden="true" />
                  <span className="truncate">Recent activity</span>
                </h2>
                <Link
                  href="/content"
                  className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-accent-foreground"
                >
                  View all
                  <ArrowRight className="size-3" aria-hidden="true" />
                </Link>
              </div>

              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-14 w-full" />
                  <Skeleton className="h-14 w-full" />
                  <Skeleton className="h-14 w-full" />
                </div>
              ) : generations && generations.length > 0 ? (
                <ul className="divide-y divide-border rounded-lg border border-border bg-card">
                  {generations.map((gen) => {
                    const rec = recommendedCandidate(gen);
                    const statusDot =
                      gen.status === "failed"
                        ? "bg-destructive"
                        : gen.status === "processing"
                          ? "bg-warning"
                          : "bg-success";
                    return (
                      <li key={gen.id}>
                        <Link
                          href={`/content/${gen.id}`}
                          className="group flex min-w-0 items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50 sm:px-5"
                        >
                          <span className="shrink-0">
                            <PlatformIcon platform={gen.platform} size="sm" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium text-foreground">
                              {gen.topic}
                            </span>
                            <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                              {rec ? (
                                <>
                                  {rec.hook} · Score {rec.total_score}/100
                                </>
                              ) : (
                                "No candidates yet"
                              )}
                            </span>
                          </span>
                          <span className="flex shrink-0 items-center gap-1.5 text-[11px] text-muted-foreground/80">
                            <span
                              className={cn("size-1.5 rounded-full", statusDot)}
                              aria-hidden="true"
                            />
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