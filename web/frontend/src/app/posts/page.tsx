"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Layers,
  Sparkles,
  CheckCircle2,
  Clock,
  Send,
  Calendar,
  AlertCircle,
  X,
  Check,
  ChevronRight,
} from "lucide-react";
import { TwitterIcon, LinkedinIcon, InstagramIcon, FacebookIcon } from "@/components/ui/icons";
import {
  fetchPosts,
  approvePost,
  publishPostNow,
  schedulePost,
  PostResponse,
  PostStatusType,
} from "@/lib/api";

const TABS: { id: string; name: string }[] = [
  { id: "all", name: "All Posts" },
  { id: "draft", name: "Drafts (Needs Review)" },
  { id: "approved", name: "Approved" },
  { id: "scheduled", name: "Scheduled Queue" },
  { id: "published", name: "Published" },
];

export default function PostPipelinePage() {
  const [posts, setPosts] = useState<PostResponse[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true);

  // Scheduling Modal state
  const [schedulingPostId, setSchedulingPostId] = useState<string | null>(null);
  const [scheduleDatetime, setScheduleDatetime] = useState("");
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadPostsData = async () => {
    setLoading(true);
    try {
      const data = await fetchPosts();
      setPosts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPostsData();
  }, []);

  const handleApprove = async (postId: string) => {
    try {
      await approvePost(postId);
      setActionMessage("Post successfully approved!");
      await loadPostsData();
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePublishNow = async (postId: string) => {
  try {
    await publishPostNow(postId);

    setActionMessage("Publishing post...");

    // Poll until Celery finishes publishing.
    for (let i = 0; i < 10; i++) {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const data = await fetchPosts();
      setPosts(data);

      const updatedPost = data.find((p) => p.id === postId);

      if (updatedPost?.status === "published") {
        setActionMessage("Post successfully published!");
        break;
      }

      if (updatedPost?.status === "failed") {
        setActionMessage("Post publishing failed.");
        break;
      }
    }

    setTimeout(() => setActionMessage(null), 3000);
  } catch (err) {
    console.error(err);
  }
};

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedulingPostId || !scheduleDatetime) return;

    try {
      await schedulePost(schedulingPostId, scheduleDatetime);
      setActionMessage("Post successfully scheduled!");
      setSchedulingPostId(null);
      setScheduleDatetime("");
      await loadPostsData();
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredPosts = posts.filter((p) => {
    if (activeTab === "all") return true;
    return p.status === activeTab;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-2">
            <Layers className="h-3.5 w-3.5 text-indigo-400" />
            <span>Post Operations & Approval Pipeline</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Manage & Publish Social Posts
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Review agent-generated drafts, approve posts, and dispatch or schedule across your social channels.
          </p>
        </div>

        <Link
          href="/create"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 shrink-0"
        >
          <Sparkles className="h-3.5 w-3.5 text-amber-300" />
          <span>New AI Generation</span>
        </Link>
      </div>

      {actionMessage && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs font-semibold flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>{actionMessage}</span>
          </div>
          <button onClick={() => setActionMessage(null)}>
            <X className="h-4 w-4 text-emerald-400 hover:text-emerald-200" />
          </button>
        </div>
      )}

      {/* Tabs Row */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const count =
            tab.id === "all"
              ? posts.length
              : posts.filter((p) => p.status === tab.id).length;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-2 ${
                isActive
                  ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              }`}
            >
              <span>{tab.name}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Posts Grid */}
      {loading ? (
        <div className="p-16 rounded-2xl bg-slate-900/40 border border-slate-800 text-center text-slate-400 text-xs">
          Loading post pipeline...
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="p-16 rounded-2xl bg-slate-900/40 border border-slate-800/80 text-center space-y-3">
          <Layers className="h-10 w-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-300">No Posts In This Category</h3>
          <p className="text-xs text-slate-500">
            Generate new candidate posts in the AI Studio to populate your pipeline.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post) => {
            return (
              <div
                key={post.id}
                className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800/90 space-y-4 flex flex-col justify-between hover:border-slate-700/80 transition-all shadow-xl"
              >
                <div className="space-y-4">
                  {/* Card Platform & Status header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {post.platform === "linkedin" && (
                        <span className="p-1.5 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
                          <LinkedinIcon className="h-4 w-4" />
                        </span>
                      )}
                      {post.platform === "x" && (
                        <span className="p-1.5 rounded-lg bg-slate-800 text-slate-200 border border-slate-700">
                          <TwitterIcon className="h-4 w-4" />
                        </span>
                      )}
                      {post.platform === "instagram" && (
                        <span className="p-1.5 rounded-lg bg-pink-600/20 text-pink-400 border border-pink-500/30">
                          <InstagramIcon className="h-4 w-4" />
                        </span>
                      )}
                      {post.platform === "facebook" && (
                        <span className="p-1.5 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                          <FacebookIcon className="h-4 w-4" />
                        </span>
                      )}
                      <span className="text-xs font-bold text-slate-200 capitalize">
                        {post.platform}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border ${
                        post.status === "approved"
                          ? "bg-emerald-950/80 text-emerald-400 border-emerald-800/60"
                          : post.status === "scheduled"
                          ? "bg-blue-950/80 text-blue-400 border-blue-800/60"
                          : post.status === "published"
                          ? "bg-purple-950/80 text-purple-400 border-purple-800/60"
                          : "bg-amber-950/80 text-amber-400 border-amber-800/60"
                      }`}
                    >
                      {post.status}
                    </span>
                  </div>

                  {/* Post Content Preview Card */}
                  <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800/80 space-y-2">
                    <p className="text-xs font-bold text-indigo-300">{post.hook}</p>
                    <p className="text-xs text-slate-300 leading-relaxed line-clamp-4">
                      {post.caption}
                    </p>
                    <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 font-medium">
                      <strong className="text-slate-300">CTA:</strong> {post.cta}
                    </div>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {post.hashtags.map((h, i) => (
                        <span
                          key={i}
                          className="text-[9px] text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 font-mono"
                        >
                          {h}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Scheduled / Published Metadata */}
                  {post.scheduled_at && (
                    <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
                      <Clock className="h-3.5 w-3.5 text-blue-400" />
                      <span>
                        Scheduled: {new Date(post.scheduled_at).toLocaleString()}
                      </span>
                    </div>
                  )}

                  {post.published_at && (
                    <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
                      <CheckCircle2 className="h-3.5 w-3.5 text-purple-400" />
                      <span>
                        Published: {new Date(post.published_at).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions Footer */}
                <div className="pt-4 border-t border-slate-800/80 flex flex-col gap-2">
                  {post.status === "draft" && (
                    <button
                      onClick={() => handleApprove(post.id)}
                      className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-950 transition-colors"
                    >
                      <Check className="h-4 w-4" />
                      <span>Approve Post</span>
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
                        className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors border border-slate-700"
                      >
                        <Calendar className="h-3.5 w-3.5 text-indigo-400" />
                        <span>Schedule</span>
                      </button>

                      <button
                        onClick={() => handlePublishNow(post.id)}
                        className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-indigo-950"
                      >
                        <Send className="h-3.5 w-3.5" />
                        <span>Publish Now</span>
                      </button>
                    </div>
                  )}

                  {post.status === "scheduled" && (
                    <button
                      onClick={() => handlePublishNow(post.id)}
                      className="w-full py-2.5 px-3 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 font-semibold text-xs flex items-center justify-center gap-2 border border-indigo-500/40 transition-colors"
                    >
                      <Send className="h-3.5 w-3.5 text-indigo-400" />
                      <span>Publish Immediately</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Schedule Post Modal */}
      {schedulingPostId && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-indigo-300 font-bold text-sm">
                <Calendar className="h-4 w-4 text-indigo-400" />
                <span>Schedule Post Publishing</span>
              </div>
              <button
                onClick={() => setSchedulingPostId(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleScheduleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Select Date & Time
                </label>
                <input
                  type="datetime-local"
                  required
                  value={scheduleDatetime}
                  onChange={(e) => setScheduleDatetime(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <p className="text-[11px] text-slate-400">
                Peak engagement time recommendation: <strong>09:30 AM - 11:00 AM UTC</strong>
              </p>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSchedulingPostId(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-950"
                >
                  Confirm Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
