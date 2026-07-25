"use client";

import { useState } from "react";
import {
  MessageSquare,
  Sparkles,
  Bot,
  ThumbsUp,
  AlertTriangle,
  Send,
  CheckCircle2,
  Filter,
} from "lucide-react";

const MOCK_COMMENTS = [
  {
    id: "c-1",
    author: "Sarah Jenkins",
    handle: "@sarah_tech",
    postTitle: "🚀 Most marketing teams waste 20+ hours a week...",
    content: "Is this agent integrated with LinkedIn graph API v2 directly or using webhooks?",
    sentiment: "positive",
    intent: "question",
    suggestedReply: "Hi Sarah! Yes, it integrates directly via the LinkedIn Graph API v2 with OAuth2 token auto-refresh.",
  },
  {
    id: "c-2",
    author: "David Miller",
    handle: "@dmiller_growth",
    postTitle: "AI agents are redefining social strategy in 2026...",
    content: "We tried candidate scoring last quarter and saw a huge boost in post impressions. Highly recommend this approach!",
    sentiment: "positive",
    intent: "praise",
    suggestedReply: "Thanks David! Candidate scoring is definitely the secret sauce for consistent virality.",
  },
  {
    id: "c-3",
    author: "Alex Rivers",
    handle: "@arivers",
    postTitle: "Design beautiful content effortlessly with Gemini...",
    content: "What is the pricing tier for enterprise teams with 10+ social accounts?",
    sentiment: "neutral",
    intent: "inquiry",
    suggestedReply: "Hey Alex! Drop us a DM or visit our website to explore our custom enterprise workspace plans.",
  },
];

export default function CommentsPage() {
  const [comments, setComments] = useState(MOCK_COMMENTS);
  const [repliedIds, setRepliedIds] = useState<string[]>([]);

  const handleSendReply = (id: string) => {
    setRepliedIds((prev) => [...prev, id]);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-800 pb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-2">
          <MessageSquare className="h-3.5 w-3.5 text-indigo-400" />
          <span>Community Moderation Agent</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Comment Sentiment & AI Replies
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Gemini 3.6 automatically classifies comment intent, filters spam, and drafts high-context replies for approval.
        </p>
      </div>

      <div className="space-y-4">
        {comments.map((comment) => {
          const isReplied = repliedIds.includes(comment.id);

          return (
            <div
              key={comment.id}
              className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800/90 space-y-4 shadow-xl"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{comment.author}</span>
                    <span className="text-xs text-slate-400 font-mono">{comment.handle}</span>
                  </div>
                  <span className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                    On post: &quot;{comment.postTitle}&quot;
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                    {comment.sentiment}
                  </span>
                  <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-800/60">
                    {comment.intent}
                  </span>
                </div>
              </div>

              {/* Comment Content */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80">
                <p className="text-xs text-slate-200 leading-relaxed">&quot;{comment.content}&quot;</p>
              </div>

              {/* Suggested Reply Box */}
              <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/30 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-300">
                  <Bot className="h-4 w-4 text-indigo-400" />
                  <span>Gemini Suggested Reply</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed italic">
                  &quot;{comment.suggestedReply}&quot;
                </p>

                <div className="flex items-center justify-end gap-2 pt-1">
                  {isReplied ? (
                    <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-800/60">
                      <CheckCircle2 className="h-4 w-4" /> Reply Sent
                    </span>
                  ) : (
                    <button
                      onClick={() => handleSendReply(comment.id)}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-2 shadow-md shadow-indigo-950 transition-colors"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>Approve & Post Reply</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
