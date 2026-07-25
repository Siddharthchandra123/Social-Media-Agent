"use client";

import { useState } from "react";
import {
  Users2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sliders,
  Sparkles,
  Save,
} from "lucide-react";
import { TwitterIcon, LinkedinIcon, InstagramIcon, FacebookIcon } from "@/components/ui/icons";

export default function AccountsPage() {
  const [brandTone, setBrandTone] = useState("Professional, Authoritative, & Insightful");
  const [targetAudience, setAudience] = useState("Tech Founders, Product Leaders, SaaS Executives");
  const [hashtags, setHashtags] = useState("#AgenticAI, #TechInnovation, #SaaSGrowth, #Leadership");
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSavePersona = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-800 pb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-2">
          <Users2 className="h-3.5 w-3.5 text-indigo-400" />
          <span>Connected Channels & Brand Settings</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Social Channels & Voice Personas
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Manage platform API credentials and fine-tune default brand parameters for Gemini 3.6 Flash generation.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Connected Platforms (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          <h2 className="text-base font-bold text-white">Social Channel Connectors</h2>

          <div className="space-y-4">
            {/* LinkedIn Card */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/90 flex items-center justify-between shadow-xl">
              <div className="flex items-center gap-3.5">
                <div className="p-2.5 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
                  <LinkedinIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">LinkedIn Enterprise</h3>
                  <p className="text-xs text-slate-400">Connected as SocialAgent Org</p>
                </div>
              </div>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-800/60">
                <CheckCircle2 className="h-3.5 w-3.5" /> Active Token
              </span>
            </div>

            {/* X (Twitter) Card */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/90 flex items-center justify-between shadow-xl">
              <div className="flex items-center gap-3.5">
                <div className="p-2.5 rounded-xl bg-slate-800 text-slate-200 border border-slate-700">
                  <TwitterIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">X (Twitter) v2 API</h3>
                  <p className="text-xs text-slate-400">Connected as @SocialAgentAI</p>
                </div>
              </div>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-800/60">
                <CheckCircle2 className="h-3.5 w-3.5" /> Active Token
              </span>
            </div>

            {/* Instagram Card */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/90 flex items-center justify-between shadow-xl">
              <div className="flex items-center gap-3.5">
                <div className="p-2.5 rounded-xl bg-pink-600/20 text-pink-400 border border-pink-500/30">
                  <InstagramIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Instagram Graph API</h3>
                  <p className="text-xs text-slate-400">Connected as @socialagent.official</p>
                </div>
              </div>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-800/60">
                <CheckCircle2 className="h-3.5 w-3.5" /> Active Token
              </span>
            </div>

            {/* Facebook Card */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/90 flex items-center justify-between shadow-xl">
              <div className="flex items-center gap-3.5">
                <div className="p-2.5 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                  <FacebookIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Facebook Business Page</h3>
                  <p className="text-xs text-slate-400">SocialAgent Official Page</p>
                </div>
              </div>
              <button className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 bg-indigo-950/40 px-3 py-1 rounded-full border border-indigo-800/50">
                Reconnect
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Brand Persona Configuration (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Sliders className="h-4 w-4 text-indigo-400" />
              <span>Default Brand Voice Settings</span>
            </h2>
          </div>

          <form onSubmit={handleSavePersona} className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800/90 space-y-5 shadow-xl">
            {savedSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Brand voice persona updated successfully!</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Core Brand Persona & Tone
              </label>
              <input
                type="text"
                value={brandTone}
                onChange={(e) => setBrandTone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Default Target Audience Profile
              </label>
              <input
                type="text"
                value={targetAudience}
                onChange={(e) => setAudience(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Default Brand Hashtags
              </label>
              <input
                type="text"
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-950 transition-colors flex items-center justify-center gap-2"
            >
              <Save className="h-4 w-4" />
              <span>Save Brand Voice Settings</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
