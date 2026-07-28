import axios, { AxiosError } from "axios";

/* =========================================================
   CONFIG
========================================================= */

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://social-media-agent-backend-yn86.onrender.com/api/v1";

export const api = axios.create({
  baseURL: API_BASE_URL,

  headers: {
    "Content-Type": "application/json",
  },

  // Gemini generation can take longer than 15 seconds.
  timeout: 1500000,
});


api.interceptors.request.use((config) => {
  const token = getAccessToken();

  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});


api.interceptors.response.use(
  (response) => response,

  (error) => {
    if (error.response?.status === 401) {
      removeAccessToken();

      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
    }

    return Promise.reject(error);
  }
);

export function getAccessToken() {
  if (typeof window === "undefined") return null;

  return localStorage.getItem("access_token");
}

export function setAccessToken(token: string) {
  localStorage.setItem("access_token", token);
}

export function removeAccessToken() {
  localStorage.removeItem("access_token");
}

/* =========================================================
   TYPES
========================================================= */

export type PlatformType =
  | "linkedin"
  | "instagram"
  | "facebook"
  | "x";

export type PostStatusType =
  | "draft"
  | "approved"
  | "scheduled"
  | "publishing"
  | "published"
  | "failed";


export interface ContentGenerationRequest {
  platform: PlatformType;
  topic: string;
  objective?: string;
  tone?: string;
  audience?: string;
}


export interface CandidateResponse {
  id: string;

  hook: string;
  caption: string;
  cta: string;

  hashtags: string[];

  content_type: string;
  suggested_media: string;

  hook_score: number;
  relevance_score: number;
  brand_score: number;
  readability_score: number;
  cta_score: number;
  platform_score: number;

  total_score: number;
  rank: number;

  evaluation_explanation: string;
}


export interface GenerationResponse {
  id: string;

  platform: string;
  topic: string;

  objective: string;
  tone: string;
  audience: string;

  status: string;

  recommended_candidate_id: string | null;

  created_at: string;

  candidates: CandidateResponse[];
}


export interface PostResponse {
  id: string;

  candidate_id: string | null;

  platform: string;

  hook: string;
  caption: string;
  cta: string;

  hashtags: string[];

  status: PostStatusType;

  scheduled_at: string | null;
  published_at: string | null;

  external_post_id: string | null;
  failure_reason: string | null;

  created_at: string;
  updated_at: string;
}


export interface EngagementWindow {
  day: string;
  start: string;
  end: string;
}


export interface SchedulingRecommendationResponse {
  platform: string;
  timezone: string;
  source: string;
  confidence: string;

  windows: EngagementWindow[];
}


/* =========================================================
   API ERROR HANDLING
========================================================= */

function handleApiError(error: unknown): never {

  if (axios.isAxiosError(error)) {

    const axiosError =
      error as AxiosError<any>;

    console.error(
      "API Error:",
      axiosError.response?.data ||
      axiosError.message
    );

    const detail =
      axiosError.response?.data?.detail;

    if (typeof detail === "string") {
      throw new Error(detail);
    }

    if (detail?.message) {
      throw new Error(detail.message);
    }

    throw new Error(
      axiosError.message ||
      "Backend request failed"
    );
  }

  throw error;
}


/* =========================================================
   HEALTH
========================================================= */

export async function checkBackendHealth(): Promise<{
  online: boolean;
  detail?: unknown;
}> {

  try {

    const response =
      await api.get("/health");

    return {
      online: true,
      detail: response.data,
    };

  } catch (error) {

    console.error(
      "Backend health check failed:",
      error
    );

    return {
      online: false,
    };
  }
}


/* =========================================================
   CONTENT GENERATION
========================================================= */

export async function generateContent(
  payload: ContentGenerationRequest
): Promise<GenerationResponse> {

  try {

    const response =
      await api.post<GenerationResponse>(
        "/content/generate",
        payload
      );

    return response.data;

  } catch (error) {

    return handleApiError(error);
  }
}


/* =========================================================
   GENERATION HISTORY
========================================================= */

export async function fetchGenerations(
  limit = 20
): Promise<GenerationResponse[]> {

  try {

    const response =
      await api.get<GenerationResponse[]>(
        "/content/generations",
        {
          params: {
            limit,
          },
        }
      );

    return response.data;

  } catch (error) {

    return handleApiError(error);
  }
}


/* =========================================================
   SINGLE GENERATION
========================================================= */

export async function fetchGeneration(
  generationId: string
): Promise<GenerationResponse> {

  try {

    const response =
      await api.get<GenerationResponse>(
        `/content/generations/${generationId}`
      );

    return response.data;

  } catch (error) {

    return handleApiError(error);
  }
}


/* =========================================================
   POSTS
========================================================= */

export async function fetchPosts():
Promise<PostResponse[]> {

  try {

    const response =
      await api.get<PostResponse[]>(
        "/posts"
      );

    return response.data;

  } catch (error) {

    return handleApiError(error);
  }
}


/* =========================================================
   CREATE POST FROM AI CANDIDATE
========================================================= */

export async function createPostFromCandidate(
  candidateId: string
): Promise<PostResponse> {
  try {
    const response = await api.post<PostResponse>(
      "/posts",
      {
        candidate_id: candidateId,
      }
    );

    return response.data;
  } catch (error) {
    console.error("Create post failed:", error);
    throw error;
  }
}


/* =========================================================
   APPROVE POST
========================================================= */

export async function approvePost(
  postId: string
): Promise<PostResponse> {

  try {

    const response =
      await api.post<PostResponse>(
        `/posts/${postId}/approve`
      );

    return response.data;

  } catch (error) {

    return handleApiError(error);
  }
}


/* =========================================================
   SCHEDULE POST
========================================================= */

export async function schedulePost(
  postId: string,
  scheduledAt: string
): Promise<PostResponse> {

  try {

    const response =
      await api.post<PostResponse>(
        `/posts/${postId}/schedule`,
        {
          scheduled_at: scheduledAt,
        }
      );

    return response.data;

  } catch (error) {

    return handleApiError(error);
  }
}


/* =========================================================
   PUBLISH NOW
========================================================= */

export async function publishPostNow(
  postId: string
): Promise<{
  message: string;
  post_id: string;
}> {

  try {

    const response =
      await api.post(
        `/posts/${postId}/publish`
      );

    return response.data;

  } catch (error) {

    return handleApiError(error);
  }
}


/* =========================================================
   OPTIMAL POSTING TIMES
========================================================= */

export async function fetchOptimalTimes(
  platform: string
): Promise<SchedulingRecommendationResponse> {
  try {
    const response =
      await api.get<SchedulingRecommendationResponse>(
        "/scheduling/recommendations",
        {
          params: {
            platform,
          },
        }
      );

    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
}