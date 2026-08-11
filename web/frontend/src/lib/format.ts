import type { CandidateResponse, GenerationResponse } from "@/lib/api";

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function formatDay(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function timeAgo(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (Number.isNaN(seconds)) return "";
  const units: [number, string][] = [
    [60, "second"],
    [3600, "minute"],
    [86400, "hour"],
    [604800, "day"],
    [2592000, "week"],
    [31536000, "month"],
  ];
  let result = `${seconds} second${seconds === 1 ? "" : "s"} ago`;
  for (const [limit, unit] of units) {
    if (seconds < limit) {
      return result;
    }
    const count = Math.floor(seconds / limit);
    result = `${count} ${unit}${count === 1 ? "" : "s"} ago`;
  }
  return result;
}

/**
 * The candidate the backend recommended. Falls back to the first
 * (highest-ranked) candidate so UIs never render empty.
 */
export function recommendedCandidate(
  generation: GenerationResponse | null | undefined
): CandidateResponse | null {
  if (!generation || generation.candidates.length === 0) return null;
  const rec = generation.candidates.find(
    (c) => c.id === generation.recommended_candidate_id
  );
  return rec ?? generation.candidates[0];
}