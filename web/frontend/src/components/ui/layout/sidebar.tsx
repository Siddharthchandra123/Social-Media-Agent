"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Sparkles,
  Layers,
  CalendarDays,
  BarChart3,
  Users2,
  MessageSquare,
  Bot,
  Zap,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { checkBackendHealth } from "@/lib/api";

const NAV_ITEMS = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "AI Content Studio", href: "/create", icon: Sparkles, badge: "Gemini 3.6" },
  { name: "Post Pipeline", href: "/posts", icon: Layers },
  { name: "Calendar Schedule", href: "/calendar", icon: CalendarDays },
  { name: "Analytics & Insights", href: "/analytics", icon: BarChart3 },
  { name: "Community Comments", href: "/comments", icon: MessageSquare },
  { name: "Connected Accounts", href: "/accounts", icon: Users2 },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isBackendOnline, setIsBackendOnline] = useState<boolean | null>(null);

  useEffect(() => {
    async function verifyHealth() {
      const { online } = await checkBackendHealth();
      setIsBackendOnline(online);
    }
    verifyHealth();
    const interval = setInterval(verifyHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <aside className="w-64 bg-slate-950/90 text-slate-100 border-r border-slate-800/80 flex flex-col backdrop-blur-xl shrink-0">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800/80 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-500 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-300">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Bot className="h-5 w-5 text-indigo-400" />
            </div>
          </div>
          <div>
            <h1 className="font-bold text-base tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              SocialAgent AI
            </h1>
            <p className="text-xs text-slate-400 font-mono">v1.0 • Gemini 3.6</p>
          </div>
        </Link>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        <div className="px-3 py-2 text-[10px] font-semibold text-slate-400 tracking-wider uppercase">
          Agent Studio & Operations
        </div>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-gradient-to-r from-indigo-600/30 to-violet-600/20 text-white border border-indigo-500/30 shadow-md shadow-indigo-950/50"
                  : "text-slate-400 hover:text-slate-100 hover:bg-slate-900/60"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`h-4 w-4 transition-colors ${
                    isActive ? "text-indigo-400" : "text-slate-400 group-hover:text-slate-200"
                  }`}
                />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Agent Status Footnote */}
      <div className="p-4 m-3 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-400" />
            <span className="text-xs font-semibold text-slate-200">Backend Agent</span>
          </div>
          {isBackendOnline === null ? (
            <span className="text-[10px] text-slate-400 animate-pulse">Checking...</span>
          ) : isBackendOnline ? (
            <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/60">
              <CheckCircle2 className="h-3 w-3" /> Online
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[10px] font-medium text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-800/60">
              <AlertCircle className="h-3 w-3" /> Demo Mode
            </span>
          )}
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          {isBackendOnline
            ? "Connected to FastAPI agent on port 8000. Real-time Gemini inference ready."
            : "Running with interactive agent preview state."}
        </p>
      </div>
    </aside>
  );
}
