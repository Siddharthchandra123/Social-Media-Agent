"use client";

import Link from "next/link";
import { Plus, Bell, Search, Sparkles, Activity } from "lucide-react";

export function Topbar() {
  return (
    <header className="h-16 bg-slate-950/80 border-b border-slate-800/80 px-6 flex items-center justify-between backdrop-blur-xl shrink-0">
      {/* Search / Global Command Bar */}
      <div className="flex items-center gap-3 w-96 bg-slate-900/90 border border-slate-800 rounded-xl px-3.5 py-1.5 focus-within:border-indigo-500/60 transition-colors">
        <Search className="h-4 w-4 text-slate-400 shrink-0" />
        <input
          type="text"
          placeholder="Search agent generations, topics, or scheduled posts..."
          className="bg-transparent text-xs text-slate-200 placeholder-slate-400 focus:outline-none w-full"
        />
        <kbd className="hidden sm:inline-block text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700 font-mono">
          ⌘K
        </kbd>
      </div>

      {/* Action Buttons & Profile */}
      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/40 border border-indigo-800/40 text-indigo-300 text-xs font-medium">
          <Activity className="h-3.5 w-3.5 text-indigo-400 animate-pulse" />
          <span>Gemini 3.6 Active</span>
        </div>

        <button className="relative p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-900 transition-colors">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-indigo-500 ring-2 ring-slate-950" />
        </button>

        <Link
          href="/create"
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium text-xs px-4 py-2 rounded-xl shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 transition-all duration-200 active:scale-95"
        >
          <Sparkles className="h-3.5 w-3.5 text-amber-300" />
          <span>Generate Content</span>
        </Link>

        {/* User Profile Avatar */}
        <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 p-0.5 cursor-pointer">
          <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center text-xs font-semibold text-white">
            SA
          </div>
        </div>
      </div>
    </header>
  );
}
