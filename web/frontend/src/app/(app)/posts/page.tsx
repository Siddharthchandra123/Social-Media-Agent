"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Layers,
  Sparkles,
  CheckCircle2,
  Clock,
  Send,
  Calendar,
  X,
  Check,
  Loader2,
  AlertTriangle,
  RefreshCcw,
} from "lucide-react";
import {
  fetchPosts,
  approvePost,
  publishPostNow,
  schedulePost,
  PostResponse,
} from "@/lib/api";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { PlatformIcon } from "@/components/platform-icon";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";

const TABS: { id: string; name: string }[] = [
  { id: "all", name: "All" },
  { id: "draft", name: "Drafts" },
  { id: "approved", name: "Approved" },
  { id: "scheduled", name: "Scheduled" },
  { id: "published", name: "Published" },
];

function friendlyError(reason: string | null): string {
  if (!reason) return "Publishing failed. Please try again.";
  const lower = reason.toLowerCase();
  if (lower.includes("no active") || lower.includes("not connected")) {
    return "No connected account for this platform. Connect it in Connected Accounts and try again.";
  }
  if (lower.includes("access token") || lower.includes("token")) {
    return "The connected account token is invalid or expired. Reconnect the account and try again.";
  }
  if (lower.includes("media container") || lower.includes("not ready")) {
    return "The platform wasn't ready to accept the post yet. Please try again in a moment.";
  }
  return reason.length > 220 ? `${reason.slice(0, 220)}…` : reason;
}

export default function PostPipelinePage() {
  const [posts, setPosts] = useState<PostResponse[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Scheduling Modal state
  const [schedulingPostId, setSchedulingPostId] = useState<string | null>(null);
  const [scheduleDatetime, setScheduleDatetime] = useState("");
  const [actionMessage, setActionMessage] = useState<{
    text: string;
    kind: "success" | "error";
  } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadPostsData = useCallback(async () => {
    try {
      const data = await fetchPosts();
      setPosts(data);
      setLoading(false);
    } catch {
      setError(true);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    fetchPosts()
      .then((data) => {
        if (mounted) {
          setPosts(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (mounted) {
          setError(true);
          setLoading(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  const showMessage = (text: string, kind: "success" | "error" = "success") => {
    setActionMessage({ text, kind });
    setTimeout(() => setActionMessage(null), 4000);
  };

  const handleApprove = async (postId: string) => {
    setActionLoading(postId);
    try {
      await approvePost(postId);
      showMessage("Post approved and ready to publish");
      await loadPostsData();
    } catch {
      showMessage("Failed to approve post", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handlePublishNow = async (postId: string) => {
    setActionLoading(postId);
    try {
      await publishPostNow(postId);
      showMessage("Publishing post...");

      // Poll until backend finishes publishing.
      for (let i = 0; i < 10; i++) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const data = await fetchPosts();
        setPosts(data);
        const updatedPost = data.find((p) => p.id === postId);
        if (updatedPost?.status === "published") {
          showMessage("Post published successfully");
          break;
        }
        if (updatedPost?.status === "failed") {
          showMessage(friendlyError(updatedPost.failure_reason), "error");
          break;
        }
      }
    } catch {
      showMessage("Failed to publish post", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedulingPostId || !scheduleDatetime) return;

    try {
      await schedulePost(schedulingPostId, scheduleDatetime);
      showMessage("Post scheduled");
      setSchedulingPostId(null);
      setScheduleDatetime("");
      await loadPostsData();
    } catch {
      showMessage("Failed to schedule post", "error");
    }
  };

  const filteredPosts = posts.filter((p) => {
    if (activeTab === "all") return true;
    return p.status === activeTab;
  });

  return (
    <div className="animate-rise">
      <PageHeader
        title="Publishing"
        description="Review, approve, schedule, and publish your AI-generated posts."
        actions={
          <Link
            href="/create"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-sm font-medium text-primary-foreground shadow-soft transition-all hover:opacity-90 active:translate-y-px"
          >
            <Sparkles className="size-4" aria-hidden="true" />
            New generation
          </Link>
        }
      />

      {actionMessage && (
        <div
          role="status"
          className={cn(
            "mb-4 flex items-center justify-between rounded-lg border px-4 py-2.5 text-sm",
            actionMessage.kind === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : "border-destructive/30 bg-destructive/10 text-destructive"
          )}
        >
          <span className="flex items-center gap-2">
            {actionMessage.kind === "success" ? (
              <CheckCircle2 className="size-4" aria-hidden="true" />
            ) : (
              <AlertTriangle className="size-4" aria-hidden="true" />
            )}
            {actionMessage.text}
          </span>
          <button
            onClick={() => setActionMessage(null)}
            aria-label="Dismiss notification"
            className="text-current opacity-70 transition-opacity hover:opacity-100"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div
        className="mb-5 flex items-center gap-1 overflow-x-auto border-b border-border pb-2"
        role="tablist"
        aria-label="Filter posts by status"
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const count =
            tab.id === "all"
              ? posts.length
              : posts.filter((p) => p.status === tab.id).length;

          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium whitespace-nowrap transition-colors",
                isActive
                  ? "bg-accent text-accent-foreground shadow-soft"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <span>{tab.name}</span>
              <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {error ? (
        <ErrorState
          title="Couldn't load your posts"
          message="We couldn't reach the API. Check your connection and try again."
          retry={loadPostsData}
        />
      ) : loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-52 w-full" />
          <Skeleton className="h-52 w-full" />
          <Skeleton className="h-52 w-full" />
        </div>
      ) : filteredPosts.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No posts in this category"
          description="Generate new candidate posts in the AI studio to populate your pipeline."
          action={
            <Link
              href="/create"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              <Sparkles className="size-4" aria-hidden="true" />
              Create content
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPosts.map((post) => (
            <div
              key={post.id}
              className={cn(
                "flex flex-col justify-between rounded-xl border bg-card p-5 shadow-soft transition-all hover:shadow-card",
                post.status === "failed" && "border-destructive/30"
              )}
            >
              <div className="space-y-4">
                {/* Card header */}
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <PlatformIcon platform={post.platform} size="sm" />
                    <span className="capitalize">{post.platform}</span>
                  </span>
                  <StatusBadge status={post.status} />
                </div>

                {/* Post content */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">{post.hook}</p>
                  <p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground">
                    {post.caption}
                  </p>
                  {post.cta && (
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground/80">CTA:</span>{" "}
                      {post.cta}
                    </p>
                  )}
                  {post.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {post.hashtags.map((h, i) => (
                        <span
                          key={i}
                          className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
                        >
                          {h}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Failure reason */}
                {post.status === "failed" && (
                  <div className="rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                    <p className="flex items-center gap-1.5 font-medium">
                      <AlertTriangle className="size-3.5" aria-hidden="true" />
                      Couldn&apos;t publish
                    </p>
                    <p className="mt-1 text-muted-foreground">
                      {friendlyError(post.failure_reason)}
                    </p>
                  </div>
                )}

                {/* Metadata */}
                {post.scheduled_at && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="size-3.5" aria-hidden="true" />
                    <span>
                      Scheduled: {new Date(post.scheduled_at).toLocaleString()}
                    </span>
                  </div>
                )}
                {post.published_at && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="size-3.5" aria-hidden="true" />
                    <span>
                      Published: {new Date(post.published_at).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4">
                {post.status === "draft" && (
                  <button
                    onClick={() => handleApprove(post.id)}
                    disabled={actionLoading === post.id}
                    className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-500/10 text-sm font-medium text-emerald-600 ring-1 ring-inset ring-emerald-500/30 transition-colors hover:bg-emerald-500/20 disabled:opacity-50 dark:text-emerald-400"
                  >
                    {actionLoading === post.id ? (
                      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Check className="size-4" aria-hidden="true" />
                    )}
                    Approve
                  </button>
                )}

                {post.status === "approved" && (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        setSchedulingPostId(post.id);
                        setScheduleDatetime(
                          new Date(Date.now() + 86400000).toISOString().slice(0, 16)
                        );
                      }}
                      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-border bg-background text-sm font-medium text-foreground transition-colors hover:bg-muted"
                    >
                      <Calendar className="size-3.5" aria-hidden="true" />
                      Schedule
                    </button>
                    <button
                      onClick={() => handlePublishNow(post.id)}
                      disabled={actionLoading === post.id}
                      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-primary text-sm font-medium text-primary-foreground shadow-soft transition-opacity hover:opacity-90 disabled:opacity-50"
                    >
                      {actionLoading === post.id ? (
                        <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                      ) : (
                        <Send className="size-3.5" aria-hidden="true" />
                      )}
                      Publish
                    </button>
                  </div>
                )}

                {post.status === "scheduled" && (
                  <button
                    onClick={() => handlePublishNow(post.id)}
                    disabled={actionLoading === post.id}
                    className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-background text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
                  >
                    {actionLoading === post.id ? (
                      <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                    ) : (
                      <Send className="size-3.5" aria-hidden="true" />
                    )}
                    Publish immediately
                  </button>
                )}

                {post.status === "published" && (
                  <p className="py-1 text-center text-xs text-emerald-600 dark:text-emerald-400">
                    {post.external_post_id
                      ? "Live on your connected account"
                      : "Published successfully"}
                  </p>
                )}

                {post.status === "failed" && (
                  <button
                    onClick={() => handleApprove(post.id)}
                    disabled={actionLoading === post.id}
                    className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-background text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
                  >
                    <RefreshCcw className="size-3.5" aria-hidden="true" />
                    Reset to approved
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Schedule Post Modal */}
      <Modal
        open={Boolean(schedulingPostId)}
        onClose={() => setSchedulingPostId(null)}
        title="Schedule post"
        description="Pick a date and time for this post to go live."
      >
        <form onSubmit={handleScheduleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="schedule-datetime"
              className="text-label"
            >
              Date &amp; time
            </label>
            <input
              id="schedule-datetime"
              type="datetime-local"
              required
              value={scheduleDatetime}
              onChange={(e) => setScheduleDatetime(e.target.value)}
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setSchedulingPostId(null)}
              className="inline-flex h-9 items-center rounded-lg px-3.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-soft transition-all hover:opacity-90 active:translate-y-px"
            >
              Confirm
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
