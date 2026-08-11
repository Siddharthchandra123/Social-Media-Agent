"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { fetchGeneration, GenerationResponse } from "@/lib/api";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { CandidateCard } from "@/components/candidate-card";
import { PlatformIcon } from "@/components/platform-icon";

export default function ContentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [generation, setGeneration] = useState<GenerationResponse | null>(null);
  const [error, setError] = useState(false);

  const load = async () => {
    try {
      const data = await fetchGeneration(id);
      setGeneration(data);
    } catch {
      setError(true);
    }
  };

  useEffect(() => {
    let mounted = true;
    fetchGeneration(id)
      .then((data) => {
        if (mounted) setGeneration(data);
      })
      .catch(() => {
        if (mounted) setError(true);
      });
    return () => {
      mounted = false;
    };
  }, [id]);

  if (error) {
    return (
      <ErrorState
        title="Couldn't load this generation"
        message="We couldn't reach the API. Check your connection and try again."
        retry={load}
      />
    );
  }

  if (!generation) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-4 w-96 max-w-full" />
        <div className="space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-rise">
      <Link
        href="/content"
        className="mb-4 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" aria-hidden="true" />
        Back to content
      </Link>

      <PageHeader
        title={generation.topic}
        description={`${generation.platform} · ${generation.candidates.length} candidates`}
      />

      {/* Summary meta */}
      <div className="mb-6 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5 font-medium capitalize text-foreground">
          <PlatformIcon platform={generation.platform} size="sm" />
          {generation.platform}
        </span>
        <span aria-hidden="true">·</span>
        <span>{generation.tone}</span>
        <span aria-hidden="true">·</span>
        <span>{generation.objective}</span>
        {generation.audience && (
          <>
            <span aria-hidden="true">·</span>
            <span>{generation.audience}</span>
          </>
        )}
      </div>

      {/* Candidates */}
      {generation.candidates.length > 0 ? (
        <div className="space-y-4">
          {generation.candidates.map((candidate) => (
            <CandidateCard
              key={candidate.id}
              candidate={candidate}
              recommended={candidate.id === generation.recommended_candidate_id}
              defaultExpanded={candidate.id === generation.recommended_candidate_id}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Sparkles}
          title="No candidates yet"
          description="This generation didn't produce any candidates."
        />
      )}
    </div>
  );
}