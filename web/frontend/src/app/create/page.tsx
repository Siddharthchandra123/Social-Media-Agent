"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Sparkles,
  Bot,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Award,
  BarChart,
  Layers,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { TwitterIcon, LinkedinIcon, InstagramIcon, FacebookIcon } from "@/components/ui/icons";
import {
  generateContent,
  createPostFromCandidate,
  PlatformType,
  GenerationResponse,
  CandidateResponse,
} from "@/lib/api";

const PLATFORMS: { id: PlatformType; name: string; icon: any; color: string }[] = [
  { id: "linkedin", name: "LinkedIn", icon: LinkedinIcon, color: "text-blue-400 bg-blue-500/10 border-blue-500/30" },
  { id: "x", name: "X (Twitter)", icon: TwitterIcon, color: "text-slate-200 bg-slate-800 border-slate-700" },
  { id: "instagram", name: "Instagram", icon: InstagramIcon, color: "text-pink-400 bg-pink-500/10 border-pink-500/30" },
  { id: "facebook", name: "Facebook", icon: FacebookIcon, color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/30" },
];

const TONES = [
  "Professional & Authoritative",
  "Witty & Energetic",
  "Educational & Actionable",
  "Empathetic & Storytelling",
];

const OBJECTIVES = [
  "Engagement & Comments",
  "Lead Generation & Conversions",
  "Brand Awareness & Reach",
  "Thought Leadership",
];

function CreateContentStudioForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTopic = searchParams.get("topic") || "";

  const [platform, setPlatform] = useState<PlatformType>("linkedin");
  const [topic, setTopic] = useState(initialTopic);
  const [tone, setTone] = useState(TONES[0]);
  const [objective, setObjective] = useState(OBJECTIVES[0]);
  const [audience, setAudience] = useState("SaaS Founders, Tech Leaders, Product Managers");

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationResult, setGenerationResult] = useState<GenerationResponse | null>(null);
  const [selectedCandId, setSelectedCandId] = useState<string | null>(null);
  const [expandedExplanation, setExpandedExplanation] = useState<string | null>(null);
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [creationSuccess, setCreationSuccess] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setIsGenerating(true);
    setGenerationResult(null);
    setCreationSuccess(false);

    try {
      const res = await generateContent({
        platform,
        topic,
        tone,
        objective,
        audience,
      });
      setGenerationResult(res);
      if (res.recommended_candidate_id) {
        setSelectedCandId(res.recommended_candidate_id);
      } else if (res.candidates.length > 0) {
        setSelectedCandId(res.candidates[0].id);
      }
    } catch (err) {
      console.error("Generation error:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreatePost = async (candId: string) => {
    setIsCreatingPost(true);
    try {
      await createPostFromCandidate(candId);
      setCreationSuccess(true);
      setTimeout(() => {
        router.push("/posts");
      }, 1200);
    } catch (err) {
      console.error("Post creation error:", err);
    } finally {
      setIsCreatingPost(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-2">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>AI Content Studio</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Generate Scored Post Candidates
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Define your parameters and let Gemini 3.6 Flash craft and evaluate 3 high-impact post options.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Form Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <form onSubmit={handleGenerate} className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800/90 space-y-5 shadow-xl">
            {/* Platform Selection */}
            <div className="space-y-2.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Target Platform
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {PLATFORMS.map((p) => {
                  const Icon = p.icon;
                  const isSelected = platform === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPlatform(p.id)}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-semibold transition-all ${
                        isSelected
                          ? "bg-indigo-600/20 border-indigo-500 text-white shadow-md shadow-indigo-950/50 ring-1 ring-indigo-500/50"
                          : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                      }`}
                    >
                      <Icon className={`h-4 w-4 ${p.color}`} />
                      <span>{p.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Topic Input */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Core Topic / Idea Prompt <span className="text-indigo-400">*</span>
              </label>
              <textarea
                required
                rows={3}
                placeholder="e.g., How AI agents automate social content scheduling and boost engagement by 3x..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            {/* Tone Selection */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Brand Tone
              </label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
              >
                {TONES.map((t) => (
                  <option key={t} value={t} className="bg-slate-900 text-slate-100">
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Campaign Objective */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Campaign Objective
              </label>
              <select
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
              >
                {OBJECTIVES.map((o) => (
                  <option key={o} value={o} className="bg-slate-900 text-slate-100">
                    {o}
                  </option>
                ))}
              </select>
            </div>

            {/* Target Audience */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Target Audience
              </label>
              <input
                type="text"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isGenerating || !topic.trim()}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <Bot className="h-4 w-4 text-amber-300 animate-spin" />
                  <span>Evaluating Candidates with Gemini...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 text-amber-300" />
                  <span>Generate 3 Candidates & Rank</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Candidate Display (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {isGenerating ? (
            <div className="p-12 rounded-2xl bg-slate-900/40 border border-slate-800 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative">
                <div className="h-16 w-16 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center animate-pulse">
                  <Bot className="h-8 w-8 text-indigo-400" />
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">Agent Inference Active</h3>
                <p className="text-xs text-slate-400 max-w-sm">
                  Drafting 3 post variations, scoring hooks, virality potential, and brand voice alignment...
                </p>
              </div>
            </div>
          ) : !generationResult ? (
            <div className="p-12 rounded-2xl bg-slate-900/40 border border-slate-800/80 flex flex-col items-center justify-center text-center space-y-4 text-slate-400">
              <Sparkles className="h-10 w-10 text-indigo-400/60" />
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-200">No Candidates Generated Yet</h3>
                <p className="text-xs text-slate-400">
                  Fill in your topic on the left and click &quot;Generate 3 Candidates&quot; to begin.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-amber-400" />
                  <h2 className="text-base font-bold text-white">
                    Agent Evaluation Results (3 Candidates)
                  </h2>
                </div>
                <span className="text-xs text-slate-400">
                  Platform: <strong className="text-white uppercase">{generationResult.platform}</strong>
                </span>
              </div>

              {creationSuccess && (
                <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>Candidate converted into Post Draft! Redirecting to pipeline...</span>
                </div>
              )}

              {/* Candidate Cards Stack */}
              <div className="space-y-5">
                {generationResult.candidates.map((cand) => {
                  const isRec = cand.id === generationResult.recommended_candidate_id;
                  const isSelected = selectedCandId === cand.id;
                  const isExpanded = expandedExplanation === cand.id;

                  return (
                    <div
                      key={cand.id}
                      onClick={() => setSelectedCandId(cand.id)}
                      className={`p-6 rounded-2xl border transition-all cursor-pointer space-y-4 ${
                        isSelected
                          ? "bg-slate-900 border-indigo-500 shadow-xl shadow-indigo-950/40 ring-1 ring-indigo-500/50"
                          : "bg-slate-900/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/80"
                      }`}
                    >
                      {/* Card Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="h-6 w-6 rounded-full bg-slate-800 border border-slate-700 text-slate-200 text-xs font-extrabold flex items-center justify-center">
                            #{cand.rank}
                          </span>
                          {isRec && (
                            <span className="text-[10px] font-bold text-amber-300 bg-amber-500/20 px-2.5 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1">
                              <Award className="h-3 w-3" /> Agent Recommended Pick
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <div className="text-xs font-mono font-extrabold text-indigo-400">
                              {cand.total_score} <span className="text-[10px] text-slate-500">/100</span>
                            </div>
                            <span className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">
                              Total Score
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Hook & Content */}
                      <div className="space-y-2">
                        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80">
                          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block mb-1">
                            Hook Angle (Score: {cand.hook_score}/100)
                          </span>
                          <p className="text-xs font-bold text-slate-100">{cand.hook}</p>
                        </div>

                        <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                          {cand.caption}
                        </p>

                        <div className="p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-800/40 text-xs text-indigo-300">
                          <strong className="text-indigo-400 font-semibold">CTA: </strong>
                          {cand.cta}
                        </div>

                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {cand.hashtags.map((h, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 font-mono"
                            >
                              {h}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Score Breakdown Bar */}
                      <div className="pt-2 border-t border-slate-800/80 grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
                        <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                          <div className="text-[9px] text-slate-400 uppercase">Hook</div>
                          <div className="text-xs font-bold text-slate-200">{cand.hook_score}</div>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                          <div className="text-[9px] text-slate-400 uppercase">Relevance</div>
                          <div className="text-xs font-bold text-slate-200">{cand.relevance_score}</div>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                          <div className="text-[9px] text-slate-400 uppercase">Brand</div>
                          <div className="text-xs font-bold text-slate-200">{cand.brand_score}</div>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                          <div className="text-[9px] text-slate-400 uppercase">Readability</div>
                          <div className="text-xs font-bold text-slate-200">{cand.readability_score}</div>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                          <div className="text-[9px] text-slate-400 uppercase">CTA</div>
                          <div className="text-xs font-bold text-slate-200">{cand.cta_score}</div>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                          <div className="text-[9px] text-slate-400 uppercase">Platform</div>
                          <div className="text-xs font-bold text-slate-200">{cand.platform_score}</div>
                        </div>
                      </div>

                      {/* Explanation Collapsible */}
                      <div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedExplanation(isExpanded ? null : cand.id);
                          }}
                          className="text-[11px] text-slate-400 hover:text-slate-200 font-medium flex items-center gap-1"
                        >
                          <span>{isExpanded ? "Hide Agent Rationale" : "Why was this candidate scored this way?"}</span>
                          {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        </button>
                        {isExpanded && (
                          <p className="mt-2 text-xs text-slate-300 p-3 rounded-xl bg-slate-950/90 border border-slate-800 leading-relaxed italic">
                            &quot;{cand.evaluation_explanation}&quot;
                          </p>
                        )}
                      </div>

                      {/* Select Action Button */}
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCreatePost(cand.id);
                          }}
                          disabled={isCreatingPost}
                          className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                            isSelected
                              ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-950"
                              : "bg-slate-800 hover:bg-slate-700 text-slate-200"
                          }`}
                        >
                          <Layers className="h-4 w-4" />
                          <span>Turn Candidate #{cand.rank} Into Post Draft</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CreateContentPage() {
  return (
    <Suspense fallback={<div className="p-12 text-slate-400 text-xs">Loading AI Studio...</div>}>
      <CreateContentStudioForm />
    </Suspense>
  );
}
