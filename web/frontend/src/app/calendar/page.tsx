"use client";

import { useEffect, useState } from "react";
import {
  CalendarDays,
  Clock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Zap,
} from "lucide-react";
import { TwitterIcon, LinkedinIcon, InstagramIcon, FacebookIcon } from "@/components/ui/icons";
import {
  fetchPosts,
  fetchOptimalTimes,
  PostResponse,
  SchedulingRecommendationResponse,
} from "@/lib/api";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function CalendarPage() {
  const [posts, setPosts] = useState<PostResponse[]>([]);
  const [optimalTimes, setOptimalTimes] = useState<SchedulingRecommendationResponse | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState("linkedin");

  useEffect(() => {
    async function loadCalendarData() {
      const [pData, optData] = await Promise.all([
        fetchPosts(),
        fetchOptimalTimes(selectedPlatform),
      ]);
      setPosts(pData);
      setOptimalTimes(optData);
    }
    loadCalendarData();
  }, [selectedPlatform]);

  const scheduledPosts = posts.filter((p) => p.status === "scheduled" || p.status === "approved" || p.status === "published");

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-2">
            <CalendarDays className="h-3.5 w-3.5 text-indigo-400" />
            <span>Content Calendar & Peak Hours</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Social Publishing Calendar
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Visualize your upcoming scheduled post queue aligned with peak engagement time windows.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {["linkedin", "x", "instagram"].map((p) => (
            <button
              key={p}
              onClick={() => setSelectedPlatform(p)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold uppercase border transition-all ${
                selectedPlatform === p
                  ? "bg-indigo-600/30 text-indigo-300 border-indigo-500"
                  : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Calendar Grid (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800/90 space-y-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Weekly Dispatch Schedule</span>
              </h2>
              <div className="flex items-center gap-1.5">
                <button className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-xs font-semibold text-slate-300 px-2">Current Week</span>
                <button className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-7 gap-3">
              {DAYS.map((day, idx) => {
                const dayPosts = scheduledPosts.filter((_, pIdx) => pIdx % 7 === idx);
                const isToday = idx === 1; // Tuesday demo mock indicator

                return (
                  <div
                    key={day}
                    className={`p-3 rounded-xl border min-h-[160px] flex flex-col justify-between ${
                      isToday
                        ? "bg-indigo-950/40 border-indigo-500/50 ring-1 ring-indigo-500/30"
                        : "bg-slate-950/70 border-slate-800/80"
                    }`}
                  >
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5 mb-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        {day.slice(0, 3)}
                      </span>
                      {isToday && (
                        <span className="text-[9px] font-bold text-indigo-400 bg-indigo-500/20 px-1.5 rounded">
                          Today
                        </span>
                      )}
                    </div>

                    <div className="space-y-2 flex-1">
                      {dayPosts.length === 0 ? (
                        <span className="text-[10px] text-slate-600 italic block mt-2">
                          No posts
                        </span>
                      ) : (
                        dayPosts.map((post) => (
                          <div
                            key={post.id}
                            className="p-2 rounded-lg bg-slate-900 border border-slate-800 space-y-1 text-left"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-bold text-indigo-300 uppercase">
                                {post.platform}
                              </span>
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                            </div>
                            <p className="text-[10px] text-slate-300 font-medium line-clamp-2">
                              {post.hook}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Peak Hours Recommendation (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800/90 space-y-5 shadow-xl">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <Zap className="h-4 w-4" />
              <span>Optimal Time Algorithm</span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Based on empirical historical engagement data for{" "}
              <strong className="text-slate-200 uppercase">{selectedPlatform}</strong>, our peak timing agent recommends posting during:
            </p>

            <div className="space-y-2.5">
              {optimalTimes?.windows.map((win, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between"
                >
                  <span className="text-xs font-semibold text-slate-300">{win.day}</span>
                  <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-indigo-400 bg-indigo-950/60 px-2.5 py-1 rounded-lg border border-indigo-800/60">
                    <Clock className="h-3 w-3" />
                    <span>{win.start} - {win.end}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-800/40 space-y-1">
              <div className="text-xs font-bold text-indigo-300">Confidence Score: High</div>
              <p className="text-[11px] text-slate-400">
                Calculated from 1,200+ target audience activity logs.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
