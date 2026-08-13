"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, PenLine, ArrowRight } from "lucide-react";
import { fetchGenerations, GenerationResponse } from "@/lib/api";
import { recommendedCandidate, timeAgo } from "@/lib/format";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { PlatformIcon } from "@/components/platform-icon";

export default function ContentPage() {
  const [generations, setGenerations] = useState<GenerationResponse[] | null>(null);
  const [error, setError] = useState(false);

  const load = async () => {
    try {
      const data = await fetchGenerations(50);
      setGenerations(data);
    } catch {
      setError(true);
    }
  };

  useEffect(() => {
    let mounted = true;
    fetchGenerations(50)
      .then((data) => {
        if (mounted) setGenerations(data);
      })
      .catch(() => {
        if (mounted) setError(true);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const loading = !error && generations === null;

  return (
    <div className="animate-rise">
      <PageHeader
        title="Content"
        description="Every AI generation you've created."
        actions={
          <Link
            href="/create"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-sm font-medium text-primary-foreground shadow-soft transition-all hover:opacity-90 active:translate-y-px"
          >
            <PenLine className="size-4" aria-hidden="true" />
            New generation
          </Link>
        }
      />

      {error ? (
        <ErrorState
          title="Couldn't load your content"
          message="We couldn't reach the API. Check your connection and try again."
          retry={load}
        />
      ) : loading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : generations && generations.length > 0 ? (
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card shadow-soft">
          {generations.map((gen) => {
            const rec = recommendedCandidate(gen);
            return (
              <li key={gen.id}>
                <Link
                  href={`/content/${gen.id}`}
                  className="group flex flex-col gap-3 px-4 py-4 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <PlatformIcon platform={gen.platform} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {gen.topic}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {rec ? (
                          <>
                            <span className="font-medium text-foreground/80">
                              Hook:
                            </span>{" "}
                            {rec.hook} · Score {rec.total_score}/100
                          </>
                        ) : (
                          "No candidates yet"
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                    <span className="capitalize">{gen.platform}</span>
                    <span aria-hidden="true">·</span>
                    <span>{timeAgo(gen.created_at)}</span>
                    <ArrowRight
                      className="size-3.5 opacity-0 transition-opacity group-hover:opacity-100"
                      aria-hidden="true"
                    />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState
          icon={Sparkles}
          title="No content yet"
          description="Create your first AI-generated post to see it here."
          action={
            <Link
              href="/create"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              <PenLine className="size-4" aria-hidden="true" />
              Create content
            </Link>
          }
        />
      )}
    </div>
  );
}