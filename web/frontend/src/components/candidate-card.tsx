"use client";

import { useState } from "react";
import {
  Star,
  Award,
  ChevronDown,
  ChevronUp,
  Check,
  Loader2,
  Clapperboard,
} from "lucide-react";
import type { CandidateResponse } from "@/lib/api";
import { cn } from "@/lib/utils";
import { CopyButton } from "@/components/copy-button";

function stars(totalScore: number) {
  const filled = Math.max(1, Math.min(5, Math.round(totalScore / 20)));
  return (
    <span
      className="inline-flex items-center gap-0.5"
      aria-label={`Rated ${filled} out of 5`}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            "size-3.5",
            i < filled
              ? "fill-current text-amber-400"
              : "text-muted-foreground/40"
          )}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}

const SCORE_ITEMS: { key: keyof CandidateResponse; label: string }[] = [
  { key: "hook_score", label: "Hook" },
  { key: "relevance_score", label: "Relevance" },
  { key: "brand_score", label: "Brand" },
  { key: "readability_score", label: "Readability" },
  { key: "cta_score", label: "CTA" },
  { key: "platform_score", label: "Platform" },
];

interface CandidateCardProps {
  candidate: CandidateResponse;
  recommended?: boolean;
  onUse?: () => Promise<void>;
  defaultExpanded?: boolean;
}

export function CandidateCard({
  candidate,
  recommended,
  onUse,
  defaultExpanded,
}: CandidateCardProps) {
  const [showEvaluation, setShowEvaluation] = useState(Boolean(defaultExpanded));
  const [using, setUsing] = useState(false);
  const [used, setUsed] = useState(false);

  const fullText = [
    candidate.hook,
    candidate.caption,
    `CTA: ${candidate.cta}`,
    candidate.hashtags.join(" "),
  ]
    .filter(Boolean)
    .join("\n\n");

  const handleUse = async () => {
    if (!onUse) return;
    setUsing(true);
    try {
      await onUse();
      setUsed(true);
    } finally {
      setUsing(false);
    }
  };

  return (
    <article
      className={cn(
        "flex flex-col gap-4 rounded-xl border bg-card p-5",
        recommended
          ? "border-ring/40 shadow-sm"
          : "border-border"
      )}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-sm font-semibold text-foreground">
            {candidate.rank}
          </span>
          <div>
            {recommended ? (
              <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <Award className="size-3.5 text-amber-400" aria-hidden="true" />
                Recommended
              </p>
            ) : (
              <p className="text-xs font-semibold text-muted-foreground">
                Candidate {candidate.rank}
              </p>
            )}
            {stars(candidate.total_score)}
          </div>
        </div>
        <div className="text-right">
          <p className="font-mono text-lg font-semibold leading-none">
            {Math.round(candidate.total_score)}
            <span className="text-xs font-normal text-muted-foreground">/100</span>
          </p>
          <p className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground">
            Total score
          </p>
        </div>
      </header>

      <div className="space-y-3 text-sm">
        <div className="space-y-1">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Hook
          </p>
          <p className="font-medium text-foreground">{candidate.hook}</p>
        </div>

        <div className="space-y-1">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Caption
          </p>
          <p className="whitespace-pre-wrap leading-relaxed text-foreground/90">
            {candidate.caption}
          </p>
        </div>

        <div className="space-y-1">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Call to action
          </p>
          <p className="text-foreground/90">{candidate.cta}</p>
        </div>

        {candidate.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {candidate.hashtags.map((tag, i) => (
              <span
                key={i}
                className="rounded-md border border-border bg-muted/60 px-2 py-0.5 font-mono text-xs text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {(candidate.content_type || candidate.suggested_media) && (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clapperboard className="size-3.5" aria-hidden="true" />
            {[candidate.content_type, candidate.suggested_media]
              .filter(Boolean)
              .join(" · ")}
          </p>
        )}
      </div>

      <div className="mt-auto rounded-lg border border-border bg-muted/30">
        <button
          type="button"
          onClick={() => setShowEvaluation((v) => !v)}
          aria-expanded={showEvaluation}
          className="flex w-full items-center justify-between px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <span>{showEvaluation ? "Hide evaluation" : "View evaluation"}</span>
          {showEvaluation ? (
            <ChevronUp className="size-3.5" aria-hidden="true" />
          ) : (
            <ChevronDown className="size-3.5" aria-hidden="true" />
          )}
        </button>
        {showEvaluation && (
          <div className="border-t border-border px-3 py-3">
            <div className="grid grid-cols-3 gap-2">
              {SCORE_ITEMS.map(({ key, label }) => (
                <div
                  key={key}
                  className="rounded-md border border-border bg-card px-2.5 py-2"
                >
                  <p className="text-[11px] text-muted-foreground">{label}</p>
                  <p className="font-mono text-sm font-semibold">
                    {candidate[key] as number}
                    <span className="text-[10px] font-normal text-muted-foreground">
                      /100
                    </span>
                  </p>
                </div>
              ))}
            </div>
            {candidate.evaluation_explanation && (
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                {candidate.evaluation_explanation}
              </p>
            )}
          </div>
        )}
      </div>

      <footer className="flex items-center gap-2">
        <CopyButton value={fullText} label="Copy post" />
        {onUse && (
          <button
            type="button"
            onClick={handleUse}
            disabled={using || used}
            className={cn(
              "inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-md text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-60",
              used
                ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-inset ring-emerald-500/30"
                : "bg-foreground text-background hover:opacity-90"
            )}
          >
            {using ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Creating…
              </>
            ) : used ? (
              <>
                <Check className="size-4" aria-hidden="true" />
                Saved as draft
              </>
            ) : (
              "Save as draft"
            )}
          </button>
        )}
      </footer>
    </article>
  );
}