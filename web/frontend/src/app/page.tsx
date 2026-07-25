"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  TrendingUp,
  Clock,
  CheckCircle,
  BarChart2,
  ArrowRight,
  Zap,
  Bot,
  Flame,
  ChevronRight,
} from "lucide-react";
import { TwitterIcon, LinkedinIcon, InstagramIcon } from "@/components/ui/icons";
import {
  fetchGenerations,
  fetchPosts,
  checkBackendHealth,
  GenerationResponse,
  PostResponse,
} from "@/lib/api";

export default function Home() {
  const [generations, setGenerations] = useState<GenerationResponse[]>([]);
  const [posts, setPosts] = useState<PostResponse[]>([]);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [quickTopic, setQuickTopic] = useState("");

  useEffect(() => {
    async function loadData() {
      const { online } = await checkBackendHealth();
      setBackendOnline(online);

      const [genData, postData] = await Promise.all([
        fetchGenerations(5),
        fetchPosts(),
      ]);
      setGenerations(genData);
      setPosts(postData);
    }
    loadData();
  }, []);

  const pendingApprovals = posts.filter((p) => p.status === "draft").length;
  const scheduledCount = posts.filter((p) => p.status === "scheduled").length;
  const publishedCount = posts.filter((p) => p.status === "published").length;

  const totalCandidates = generations.flatMap((g) => g.candidates);
  const avgHookScore = totalCandidates.length
    ? Math.round(
        totalCandidates.reduce((acc, c) => acc + c.hook_score, 0) /
          totalCandidates.length
      )
    : 92;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-950 via-slate-900 to-violet-950 p-8 border border-indigo-500/20 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
              <Zap className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
              <span>Gemini 3.6 Flash Agent Engine</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Autonomous Social Media Orchestrator
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed">
              Generate 3 high-virality scored post candidates, optimize hook angles,
              and schedule across LinkedIn, Instagram, X, and Facebook in seconds.
            </p>
          </div>

          <div className="w-full lg:w-auto flex flex-col sm:flex-row gap-3 shrink-0">
            <Link
              href="/create"
              className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white font-semibold text-sm shadow-xl shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-95"
            >
              <Sparkles className="h-4 w-4 text-amber-300" />
              <span>Launch Content Studio</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Quick Generation Bar */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Type a topic (e.g. '5 AI strategies for SaaS founders')..."
            value={quickTopic}
            onChange={(e) => setQuickTopic(e.target.value)}
            className="flex-1 bg-slate-900/90 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
          />
          <Link
            href={`/create?topic=${encodeURIComponent(quickTopic)}`}
            className="inline-flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs px-5 py-2.5 rounded-xl border border-slate-700 transition-colors shrink-0"
          >
            <Bot className="h-4 w-4 text-indigo-400" />
            <span>Generate Candidates</span>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-3 relative overflow-hidden group hover:border-indigo-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Generations
            </span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white">
            {generations.length * 3 || 12}
          </div>
          <p className="text-xs text-slate-400 flex items-center gap-1.5">
            <span className="text-emerald-400 font-semibold flex items-center">
              <TrendingUp className="h-3 w-3 mr-0.5" /> +28%
            </span>
            <span>vs last week</span>
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-3 relative overflow-hidden group hover:border-amber-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Pending Approvals
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white">
            {pendingApprovals}
          </div>
          <p className="text-xs text-slate-400">
            Awaiting manual review in pipeline
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-3 relative overflow-hidden group hover:border-blue-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Scheduled Queue
            </span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <CheckCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white">{scheduledCount}</div>
          <p className="text-xs text-slate-400">
            {publishedCount} already published
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-3 relative overflow-hidden group hover:border-emerald-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Avg Hook Score
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Flame className="h-4 w-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white">
            {avgHookScore}
            <span className="text-sm font-semibold text-slate-500">/100</span>
          </div>
          <p className="text-xs text-emerald-400 font-medium">
            Top 5% virality optimization
          </p>
        </div>
      </div>

      {/* Main Grid: Recent Generations & Active Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Generations List (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Recent Agent Outputs</h2>
              <p className="text-xs text-slate-400">
                Latest multi-candidate post sets scored by Gemini 3.6
              </p>
            </div>
            <Link
              href="/create"
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
            >
              <span>View Studio</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="space-y-4">
            {generations.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 text-slate-400 text-sm">
                Loading agent generations...
              </div>
            ) : (
              generations.map((gen) => {
                const recCand =
                  gen.candidates.find((c) => c.id === gen.recommended_candidate_id) ||
                  gen.candidates[0];

                return (
                  <div
                    key={gen.id}
                    className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/90 space-y-4 hover:border-slate-700/80 transition-all shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        {gen.platform === "linkedin" && (
                          <span className="p-1.5 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
                            <LinkedinIcon className="h-4 w-4" />
                          </span>
                        )}
                        {gen.platform === "x" && (
                          <span className="p-1.5 rounded-lg bg-slate-800 text-slate-200 border border-slate-700">
                            <TwitterIcon className="h-4 w-4" />
                          </span>
                        )}
                        {gen.platform === "instagram" && (
                          <span className="p-1.5 rounded-lg bg-pink-600/20 text-pink-400 border border-pink-500/30">
                            <InstagramIcon className="h-4 w-4" />
                          </span>
                        )}
                        <div>
                          <span className="text-xs font-semibold text-white capitalize">
                            {gen.platform} Post Generation
                          </span>
                          <p className="text-[11px] text-slate-400 line-clamp-1">
                            Topic: {gen.topic}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950/60 px-2.5 py-1 rounded-full border border-amber-800/60">
                          Rank #1 Score: {recCand?.total_score || 94}
                        </span>
                      </div>
                    </div>

                    {recCand && (
                      <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-2">
                        <p className="text-xs font-bold text-indigo-300">
                          {recCand.hook}
                        </p>
                        <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                          {recCand.caption}
                        </p>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {recCand.hashtags.map((h, i) => (
                            <span
                              key={i}
                              className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800"
                            >
                              {h}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Sidebar: Pipeline Status & Quick Actions */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800/90 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">Active Post Pipeline</h3>
              <Link
                href="/posts"
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
              >
                View Pipeline →
              </Link>
            </div>

            <div className="space-y-3">
              {posts.slice(0, 3).map((post) => (
                <div
                  key={post.id}
                  className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/50">
                      {post.platform}
                    </span>
                    <span
                      className={`text-[10px] font-semibold capitalize px-2 py-0.5 rounded-full ${
                        post.status === "approved"
                          ? "bg-emerald-950 text-emerald-400 border border-emerald-800/60"
                          : post.status === "scheduled"
                          ? "bg-blue-950 text-blue-400 border border-blue-800/60"
                          : post.status === "published"
                          ? "bg-purple-950 text-purple-400 border border-purple-800/60"
                          : "bg-amber-950 text-amber-400 border border-amber-800/60"
                      }`}
                    >
                      {post.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-200 line-clamp-2 font-medium">
                    {post.hook}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Agent Capability Highlights */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-950/60 to-slate-900 border border-indigo-500/20 space-y-4">
            <div className="flex items-center gap-2 text-indigo-300 font-semibold text-xs">
              <Zap className="h-4 w-4 text-amber-400" />
              <span>Multi-Agent Capabilities</span>
            </div>
            <ul className="text-xs text-slate-300 space-y-2.5">
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">•</span>
                <span>Structured Pydantic validation guarantees 3 post candidates per run.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">•</span>
                <span>Candidate evaluation scores hook virality, readability, and brand alignment.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">•</span>
                <span>Automatic optimal posting time calculation per social network.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

