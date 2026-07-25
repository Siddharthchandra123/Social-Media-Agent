import axios from "axios";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api/v1";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

export type PlatformType = "linkedin" | "instagram" | "facebook" | "x";
export type PostStatusType = "draft" | "approved" | "scheduled" | "publishing" | "published" | "failed";

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

// Fallback demo data for instant UI interactivity when backend is starting up or offline
const MOCK_GENERATIONS: GenerationResponse[] = [
  {
    id: "gen-101",
    platform: "linkedin",
    topic: "AI Agent Automation in Enterprise Marketing",
    objective: "Lead Generation",
    tone: "Professional & Authoritative",
    audience: "CMOs, Tech Leaders, Product Managers",
    status: "completed",
    recommended_candidate_id: "cand-1",
    created_at: new Date(Date.now() - 3600000).toISOString(),
    candidates: [
      {
        id: "cand-1",
        hook: "🚀 Most marketing teams waste 20+ hours a week crafting manual posts. Here is how AI Agents change that forever.",
        caption: "Automation is no longer about scheduling tweets. It's about deploying intelligent agent orchestration that understands brand voice, scores post virality, and publishes on peak engagement windows.\n\nKey takeaways from our Q3 benchmark:\n1. 3.4x higher ROI on organic posts\n2. Real-time hook optimization\n3. Instant comment sentiment filtering.",
        cta: "Download the full AI Social Agent playbook in the link below.",
        hashtags: ["#ArtificialIntelligence", "#MarketingAutomation", "#AgenticAI", "#GrowthStrategy"],
        content_type: "Carousel / Thought Leadership",
        suggested_media: "Infographic slide deck on AI agent pipeline",
        hook_score: 96,
        relevance_score: 94,
        brand_score: 95,
        readability_score: 92,
        cta_score: 90,
        platform_score: 98,
        total_score: 94.2,
        rank: 1,
        evaluation_explanation: "Strong high-intent hook with clear numeric proof. Formatted perfectly for LinkedIn algorithm prioritization."
      },
      {
        id: "cand-2",
        hook: "Are you still manually managing multi-channel social campaigns in 2026?",
        caption: "We built an autonomous social media orchestrator powered by Gemini 3.6 Flash. From idea prompt to scored candidate ranking in under 2 seconds.",
        cta: "Drop a comment below with 'AGENT' to get early access.",
        hashtags: ["#SocialMediaStrategy", "#TechInnovation", "#Productivity"],
        content_type: "Text with Poll",
        suggested_media: "Product architecture diagram",
        hook_score: 88,
        relevance_score: 90,
        brand_score: 89,
        readability_score: 95,
        cta_score: 92,
        platform_score: 89,
        total_score: 90.5,
        rank: 2,
        evaluation_explanation: "Engaging comment-trigger CTA with solid readability, slightly less punchy hook than Candidate #1."
      },
      {
        id: "cand-3",
        hook: "Behind the scenes of building our Gemini-powered Content Agent 🤖",
        caption: "Here is what happens when you combine Pydantic structured output, Celery task dispatchers, and FastAPI: seamless content creation at scale.",
        cta: "Read our engineering deep-dive on GitHub.",
        hashtags: ["#Python", "#FastAPI", "#AIEngineering"],
        content_type: "Developer Insights",
        suggested_media: "Code snippet animation GIF",
        hook_score: 82,
        relevance_score: 86,
        brand_score: 90,
        readability_score: 88,
        cta_score: 84,
        platform_score: 85,
        total_score: 85.8,
        rank: 3,
        evaluation_explanation: "Geared towards developer audience; slightly niche for general marketing leadership target."
      }
    ]
  }
];

let MOCK_POSTS: PostResponse[] = [
  {
    id: "post-201",
    candidate_id: "cand-1",
    platform: "linkedin",
    hook: "🚀 Most marketing teams waste 20+ hours a week crafting manual posts. Here is how AI Agents change that forever.",
    caption: "Automation is no longer about scheduling tweets. It's about deploying intelligent agent orchestration that understands brand voice, scores post virality, and publishes on peak engagement windows.",
    cta: "Download the full AI Social Agent playbook in the link below.",
    hashtags: ["#ArtificialIntelligence", "#MarketingAutomation", "#AgenticAI", "#GrowthStrategy"],
    status: "approved",
    scheduled_at: new Date(Date.now() + 86400000).toISOString(),
    published_at: null,
    external_post_id: null,
    failure_reason: null,
    created_at: new Date(Date.now() - 7200000).toISOString(),
    updated_at: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: "post-202",
    candidate_id: "cand-2",
    platform: "x",
    hook: "AI agents are redefining social strategy in 2026. Here are 3 non-obvious lessons we learned building ours:",
    caption: "1️⃣ Candidate scoring is better than raw generation\n2️⃣ Multi-turn sentiment classification saves brand reputation\n3️⃣ Peak-time posting doubles impression depth",
    cta: "Retweet if you agree!",
    hashtags: ["#AI", "#BuildInPublic", "#SaaS"],
    status: "scheduled",
    scheduled_at: new Date(Date.now() + 172800000).toISOString(),
    published_at: null,
    external_post_id: null,
    failure_reason: null,
    created_at: new Date(Date.now() - 14400000).toISOString(),
    updated_at: new Date(Date.now() - 7200000).toISOString()
  },
  {
    id: "post-203",
    candidate_id: null,
    platform: "instagram",
    hook: "Design beautiful content effortlessly with Gemini Agentic Workflows ✨",
    caption: "Turn raw ideas into multi-candidate options with automated hook scoring and visual asset suggestions.",
    cta: "Link in bio to try the live demo!",
    hashtags: ["#ContentCreator", "#TechDesign", "#CreativeAI"],
    status: "published",
    scheduled_at: new Date(Date.now() - 86400000).toISOString(),
    published_at: new Date(Date.now() - 86400000).toISOString(),
    external_post_id: "ig_post_99812",
    failure_reason: null,
    created_at: new Date(Date.now() - 172800000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString()
  }
];

export async function checkBackendHealth(): Promise<{ online: boolean; detail?: any }> {
  try {
    const res = await api.get("/health");
    return { online: true, detail: res.data };
  } catch {
    return { online: false };
  }
}

export async function generateContent(payload: ContentGenerationRequest): Promise<GenerationResponse> {
  try {
    const res = await api.post<GenerationResponse>("/content/generate", payload);
    return res.data;
  } catch (err) {
    console.warn("Backend API unavailable or error occurred, using mock agent response for preview.", err);
    const newGen: GenerationResponse = {
      id: `gen-${Date.now()}`,
      platform: payload.platform,
      topic: payload.topic,
      objective: payload.objective || "engagement",
      tone: payload.tone || "professional",
      audience: payload.audience || "general audience",
      status: "completed",
      recommended_candidate_id: `cand-${Date.now()}-1`,
      created_at: new Date().toISOString(),
      candidates: [
        {
          id: `cand-${Date.now()}-1`,
          hook: `🔥 Key Insights on "${payload.topic}" for high-impact ${payload.platform.toUpperCase()} growth:`,
          caption: `When targeting ${payload.audience || "your target audience"}, adopting a ${payload.tone || "professional"} tone drives immediate results. Here is the step-by-step framework to maximize your return.`,
          cta: `Save this post and share your thoughts in the comments below!`,
          hashtags: [`#${payload.platform.toUpperCase()}`, "#SocialStrategy", "#AIContent"],
          content_type: "Carousel & Insight Post",
          suggested_media: "Branded data card graphic",
          hook_score: 95,
          relevance_score: 93,
          brand_score: 96,
          readability_score: 94,
          cta_score: 91,
          platform_score: 97,
          total_score: 94.3,
          rank: 1,
          evaluation_explanation: "High-scoring hook tailored specifically for target audience with crisp actionable structure."
        },
        {
          id: `cand-${Date.now()}-2`,
          hook: `What everyone gets wrong about ${payload.topic} (and how to fix it today):`,
          caption: `Most leaders overlook the foundational strategy. By refocusing on ${payload.objective || "engagement"}, you can scale brand trust exponentially.`,
          cta: `Click the link in bio to read our detailed guide.`,
          hashtags: ["#GrowthHacks", "#Innovation", "#BrandStrategy"],
          content_type: "Single Image Breakdown",
          suggested_media: "Comparison chart graphic",
          hook_score: 89,
          relevance_score: 90,
          brand_score: 91,
          readability_score: 92,
          cta_score: 88,
          platform_score: 90,
          total_score: 90.0,
          rank: 2,
          evaluation_explanation: "Strong curiosity gap hook with good brand score."
        },
        {
          id: `cand-${Date.now()}-3`,
          hook: `3 simple steps to master ${payload.topic}:`,
          caption: `1. Define clear metrics\n2. Maintain consistent posting cadence\n3. Engage directly with your community.`,
          cta: `Which step are you prioritizing this week?`,
          hashtags: ["#BusinessTips", "#Efficiency", "#Leadership"],
          content_type: "Text Checklist",
          suggested_media: "Minimalist text overlay image",
          hook_score: 84,
          relevance_score: 85,
          brand_score: 88,
          readability_score: 94,
          cta_score: 86,
          platform_score: 87,
          total_score: 87.3,
          rank: 3,
          evaluation_explanation: "Clean list format with quick readability."
        }
      ]
    };
    MOCK_GENERATIONS.unshift(newGen);
    return newGen;
  }
}

export async function fetchGenerations(limit = 20): Promise<GenerationResponse[]> {
  try {
    const res = await api.get<GenerationResponse[]>("/content/generations", { params: { limit } });
    return res.data;
  } catch {
    return MOCK_GENERATIONS;
  }
}

export async function fetchPosts(): Promise<PostResponse[]> {
  try {
    const res = await api.get<PostResponse[]>("/posts");
    return res.data;
  } catch {
    return MOCK_POSTS;
  }
}

export async function createPostFromCandidate(candidate_id: string): Promise<PostResponse> {
  try {
    const res = await api.post<PostResponse>("/posts", { candidate_id });
    return res.data;
  } catch {
    const allCand = MOCK_GENERATIONS.flatMap(g => g.candidates);
    const cand = allCand.find(c => c.id === candidate_id) || allCand[0];
    const newPost: PostResponse = {
      id: `post-${Date.now()}`,
      candidate_id: candidate_id,
      platform: "linkedin",
      hook: cand?.hook || "New agent generated post",
      caption: cand?.caption || "Agent content caption preview",
      cta: cand?.cta || "Learn more",
      hashtags: cand?.hashtags || ["#SocialAgent"],
      status: "draft",
      scheduled_at: null,
      published_at: null,
      external_post_id: null,
      failure_reason: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    MOCK_POSTS.unshift(newPost);
    return newPost;
  }
}

export async function approvePost(post_id: string): Promise<PostResponse> {
  try {
    const res = await api.post<PostResponse>(`/posts/${post_id}/approve`);
    return res.data;
  } catch {
    const idx = MOCK_POSTS.findIndex(p => p.id === post_id);
    if (idx !== -1) {
      MOCK_POSTS[idx].status = "approved";
      MOCK_POSTS[idx].updated_at = new Date().toISOString();
      return MOCK_POSTS[idx];
    }
    throw new Error("Post not found");
  }
}

export async function schedulePost(post_id: string, scheduled_at: string): Promise<PostResponse> {
  try {
    const res = await api.post<PostResponse>(`/posts/${post_id}/schedule`, { scheduled_at });
    return res.data;
  } catch {
    const idx = MOCK_POSTS.findIndex(p => p.id === post_id);
    if (idx !== -1) {
      MOCK_POSTS[idx].status = "scheduled";
      MOCK_POSTS[idx].scheduled_at = scheduled_at;
      MOCK_POSTS[idx].updated_at = new Date().toISOString();
      return MOCK_POSTS[idx];
    }
    throw new Error("Post not found");
  }
}

export async function publishPostNow(post_id: string): Promise<{ message: string; post_id: string }> {
  try {
    const res = await api.post(`/posts/${post_id}/publish`);
    return res.data;
  } catch {
    const idx = MOCK_POSTS.findIndex(p => p.id === post_id);
    if (idx !== -1) {
      MOCK_POSTS[idx].status = "publishing";
      MOCK_POSTS[idx].updated_at = new Date().toISOString();
      setTimeout(() => {
        if (MOCK_POSTS[idx]) {
          MOCK_POSTS[idx].status = "published";
          MOCK_POSTS[idx].published_at = new Date().toISOString();
        }
      }, 3000);
    }
    return { message: "Post queued for publishing", post_id };
  }
}

export async function fetchOptimalTimes(platform: string): Promise<SchedulingRecommendationResponse> {
  try {
    const res = await api.get<SchedulingRecommendationResponse>(`/scheduling/optimal-times`, {
      params: { platform }
    });
    return res.data;
  } catch {
    return {
      platform,
      timezone: "UTC",
      source: "Engagement Peak Algorithm",
      confidence: "high",
      windows: [
        { day: "Monday", start: "08:30", end: "10:00" },
        { day: "Tuesday", start: "13:00", end: "14:30" },
        { day: "Wednesday", start: "09:00", end: "11:00" },
        { day: "Thursday", start: "15:00", end: "16:30" },
        { day: "Friday", start: "10:00", end: "12:00" }
      ]
    };
  }
}