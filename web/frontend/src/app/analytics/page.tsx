"use client";

import {
  BarChart3,
  TrendingUp,
  Flame,
  Award,
  Users,
  Eye,
  MousePointer,
  Share2,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  CartesianGrid,
} from "recharts";

const PERFORMANCE_DATA = [
  { day: "Mon", impressions: 3200, engagement: 420, hookScore: 94 },
  { day: "Tue", impressions: 4500, engagement: 680, hookScore: 96 },
  { day: "Wed", impressions: 3900, engagement: 510, hookScore: 89 },
  { day: "Thu", impressions: 5800, engagement: 890, hookScore: 95 },
  { day: "Fri", impressions: 7200, engagement: 1120, hookScore: 98 },
  { day: "Sat", impressions: 4100, engagement: 530, hookScore: 88 },
  { day: "Sun", impressions: 4900, engagement: 740, hookScore: 92 },
];

const PLATFORM_SCORES = [
  { platform: "LinkedIn", score: 95, posts: 14 },
  { platform: "X (Twitter)", score: 91, posts: 18 },
  { platform: "Instagram", score: 88, posts: 9 },
  { platform: "Facebook", score: 85, posts: 6 },
];

export default function AnalyticsPage() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-800 pb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-2">
          <BarChart3 className="h-3.5 w-3.5 text-indigo-400" />
          <span>Analytics & Agent Performance Insights</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Content Metrics & Virality Intelligence
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Track engagement velocity, candidate score efficiency, and audience reaction metrics.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800/90 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase">
            <span>Total Organic Reach</span>
            <Eye className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">33,600</div>
          <p className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
            <TrendingUp className="h-3 w-3" /> +34% this month
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800/90 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase">
            <span>Engagement Rate</span>
            <MousePointer className="h-4 w-4 text-violet-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">14.6%</div>
          <p className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
            <TrendingUp className="h-3 w-3" /> 2.8x industry benchmark
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800/90 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase">
            <span>Avg Candidate Virality</span>
            <Flame className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">93.8/100</div>
          <p className="text-xs text-amber-400 font-semibold">
            Top 3% Gemini candidates
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800/90 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase">
            <span>Share & Amplification</span>
            <Share2 className="h-4 w-4 text-blue-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">4,890</div>
          <p className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
            <TrendingUp className="h-3 w-3" /> +42% reposts
          </p>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Engagement Trend Chart (8 cols) */}
        <div className="lg:col-span-8 p-6 rounded-2xl bg-slate-900/90 border border-slate-800/90 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Weekly Impressions & Engagement</h2>
              <p className="text-xs text-slate-400">Organic reach volume vs active audience interactions</p>
            </div>
          </div>

          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={PERFORMANCE_DATA}>
                <defs>
                  <linearGradient id="colorImp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorEng" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px" }}
                />
                <Area type="monotone" dataKey="impressions" stroke="#6366f1" fillOpacity={1} fill="url(#colorImp)" strokeWidth={2} />
                <Area type="monotone" dataKey="engagement" stroke="#a855f7" fillOpacity={1} fill="url(#colorEng)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Platform Performance Bar Chart (4 cols) */}
        <div className="lg:col-span-4 p-6 rounded-2xl bg-slate-900/90 border border-slate-800/90 space-y-4 shadow-xl">
          <div>
            <h2 className="text-base font-bold text-white">Platform Score Efficiency</h2>
            <p className="text-xs text-slate-400">Average candidate score by platform</p>
          </div>

          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={PLATFORM_SCORES}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="platform" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px" }}
                />
                <Bar dataKey="score" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
