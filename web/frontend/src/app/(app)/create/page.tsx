"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Sparkles, Wand2, Loader2 } from "lucide-react";
import {
  generateContent,
  createPostFromCandidate,
  PlatformType,
  GenerationResponse,
} from "@/lib/api";
import { PLATFORMS } from "@/lib/platforms";
import { getBrandDefaults, setBrandDefaults } from "@/lib/preferences";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { CandidateCard } from "@/components/candidate-card";
import { PlatformIcon } from "@/components/platform-icon";
import { cn } from "@/lib/utils";

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

function fieldClasses() {
  return "h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30";
}

function CreateWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTopic = searchParams.get("topic") ?? "";

  const [brandDefaults] = useState(() => getBrandDefaults());

  const [platform, setPlatform] = useState<PlatformType>("linkedin");
  const [topic, setTopic] = useState(initialTopic);
  const [objective, setObjective] = useState(brandDefaults.objective);
  const [audience, setAudience] = useState(brandDefaults.audience);
  const [tone, setTone] = useState(brandDefaults.tone);

  const [status, setStatus] = useState<"idle" | "loading" | "error" | "done">(
    "idle"
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [result, setResult] = useState<GenerationResponse | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setBrandDefaults({ tone, objective, audience });
    setStatus("loading");
    setErrorMessage("");

    try {
      const res = await generateContent({
        platform,
        topic: topic.trim(),
        objective,
        tone,
        audience,
      });
      setResult(res);
      setStatus("done");
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Generation failed."
      );
      setStatus("error");
    }
  };

  const handleUse = async (candidateId: string) => {
    await createPostFromCandidate(candidateId);
    router.push("/posts");
  };

  const retry = () => {
    void handleGenerate({ preventDefault: () => undefined } as React.FormEvent);
  };

  return (
    <div className="animate-rise">
      <PageHeader
        title="Create content"
        description="Describe a post idea and the agent drafts three ranked candidates."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        {/* Form */}
        <form
          onSubmit={handleGenerate}
          className="space-y-5 self-start rounded-xl border border-border bg-card p-5 lg:sticky lg:top-8"
        >
          <fieldset>
            <legend className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Platform
            </legend>
            <div className="grid grid-cols-2 gap-2">
              {PLATFORMS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPlatform(p.id)}
                  aria-pressed={platform === p.id}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors",
                    platform === p.id
                      ? "border-ring/40 bg-accent text-foreground"
                      : "border-border bg-background text-muted-foreground hover:border-input hover:text-foreground"
                  )}
                >
                  <PlatformIcon platform={p.id} size="sm" />
                  <span className="truncate">{p.label}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <div className="space-y-1.5">
            <label
              htmlFor="topic"
              className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
            >
              Topic
            </label>
            <textarea
              id="topic"
              required
              rows={3}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Five AI strategies SaaS founders are using to grow this year"
              className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="objective"
              className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
            >
              Objective
            </label>
            <select
              id="objective"
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              className={fieldClasses()}
            >
              {OBJECTIVES.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="audience"
              className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
            >
              Audience
            </label>
            <input
              id="audience"
              type="text"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              placeholder="Who is this for?"
              className={fieldClasses()}
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="tone"
              className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
            >
              Tone
            </label>
            <select
              id="tone"
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className={fieldClasses()}
            >
              {TONES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={status === "loading" || !topic.trim()}
            className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-md bg-foreground text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-60"
          >
            {status === "loading" ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Generating…
              </>
            ) : (
              <>
                <Wand2 className="size-4" aria-hidden="true" />
                Generate candidates
              </>
            )}
          </button>
        </form>

        {/* Results */}
        <div className="min-w-0">
          {status === "idle" && (
            <div className="lg:sticky lg:top-8">
              <EmptyState
                icon={Sparkles}
                title="Ready when you are"
                description="Choose a platform, describe a topic, and the agent will draft and rank three post candidates for you."
              />
            </div>
          )}

          {status === "loading" && (
            <div className="space-y-4" aria-busy="true">
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center gap-3">
                  <span className="relative flex size-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ring opacity-40" />
                    <span className="relative inline-flex size-2.5 rounded-full bg-ring" />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      The agent is drafting your candidates
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Writing hooks, captions, and CTAs — this can take up to a
                      minute.
                    </p>
                  </div>
                </div>
              </div>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="rounded-xl border border-border bg-card p-5"
                >
                  <Skeleton className="mb-4 h-4 w-40" />
                  <Skeleton className="mb-2 h-4 w-full" />
                  <Skeleton className="mb-2 h-4 w-11/12" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ))}
            </div>
          )}

          {status === "error" && (
            <ErrorState
              title="Something went wrong while generating your content"
              message={
                errorMessage || "The agent couldn't complete this run."
              }
              retry={retry}
            />
          )}

          {status === "done" && result && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5 font-medium capitalize text-foreground">
                  <PlatformIcon platform={result.platform} size="sm" />
                  {result.platform}
                </span>
                <span aria-hidden="true">·</span>
                <span className="line-clamp-1">{result.topic}</span>
                <span aria-hidden="true">·</span>
                <span>{result.candidates.length} candidates ranked</span>
              </div>

              <div className="space-y-4">
                {result.candidates.map((candidate) => (
                  <CandidateCard
                    key={candidate.id}
                    candidate={candidate}
                    recommended={
                      candidate.id === result.recommended_candidate_id
                    }
                    onUse={() => handleUse(candidate.id)}
                  />
                ))}
              </div>

              <p className="px-1 text-center text-xs text-muted-foreground">
                Saving a candidate as a draft lets you approve, schedule, or
                publish it later.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CreatePage() {
  return (
    <Suspense fallback={<PageHeader title="Create content" />}>
      <CreateWorkspace />
    </Suspense>
  );
}