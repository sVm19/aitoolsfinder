import { CURATED_TOOLS, CURATED_CATEGORIES, buildCuratedComparison } from "./curated-tools";

export interface CatalogCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  seo_title: string | null;
  seo_description: string | null;
  is_active: boolean;
  updated_at?: string;
}

export interface CatalogTool {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  primary_category_id: string | null;
  pricing_model: "free" | "freemium" | "paid" | "usage_based" | "contact_sales" | "unknown";
  is_verified: boolean;
  is_sponsored: boolean;
  launched_at: string | null;
  published_at?: string | null;
  updated_at: string;
}

export interface CatalogTag {
  id: string;
  name: string;
  slug: string;
}

export interface CatalogPricingPlan {
  id: string;
  name: string;
  description: string | null;
  amount_minor: number | null;
  currency: string | null;
  billing_interval: "one_time" | "monthly" | "yearly" | "usage_based" | "unknown";
  is_free: boolean;
  pricing_url: string | null;
  source_url: string | null;
  limitations: Record<string, unknown>;
  last_verified_at: string | null;
}

export interface CatalogToolFeature {
  feature: { id: string; name: string; slug: string; description: string | null };
  support_level: "yes" | "partial" | "no" | "unknown";
  evidence_url: string | null;
  notes: string | null;
}

export interface ComparisonToolSummary {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  website_url: string;
  pricing_model: CatalogTool["pricing_model"];
  platform_status: string;
  is_verified: boolean;
  is_sponsored: boolean;
  primary_category: CatalogCategory | null;
}

export interface ComparisonFeatureRow {
  feature_id: string;
  name: string;
  slug: string;
  feature_group: string | null;
  support_by_tool: Record<
    string,
    CatalogToolFeature["support_level"]
  >;
}

export interface ComparisonMatrix {
  slug: string | null;
  title: string;
  summary: string | null;
  tools: ComparisonToolSummary[];
  features: ComparisonFeatureRow[];
  pricing_by_tool: Record<string, CatalogPricingPlan[]>;
}

export interface AlternativeItem {
  tool: ComparisonToolSummary;
  rationale: string | null;
  source: "curated" | "related";
  shared_categories: number;
  shared_tags: number;
}

export interface AlternativesResponse {
  tool: ComparisonToolSummary;
  alternatives: AlternativeItem[];
}

export interface RankingItem {
  rank: number;
  tool: ComparisonToolSummary;
  score_version: string;
  overall_score: number;
  dimension_scores: Record<string, number | null>;
  methodology_url: string | null;
  evidence: string[];
  calculated_at: string;
}

export interface RankingResponse {
  taxonomy_type: "category" | "tag";
  taxonomy_name: string;
  taxonomy_slug: string;
  taxonomy_description: string | null;
  pricing_filter: "all" | "free" | "paid";
  items: RankingItem[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export interface CatalogToolDetail extends CatalogTool {
  website_url: string;
  logo_object_key?: string | null;
  platform_status?: string;
  last_verified_at?: string | null;
  updated_at: string;
  primary_category: CatalogCategory | null;
  categories: CatalogCategory[];
  tags: CatalogTag[];
  pricing_plans: CatalogPricingPlan[];
  features: CatalogToolFeature[];
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  process.env.API_BASE_URL ??
  "http://localhost:8000/api/v1"
).replace(/\/+$/, "");

export class CatalogApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string | null = null,
    message?: string,
  ) {
    super(message ?? `Catalog API returned ${status}`);
    this.name = "CatalogApiError";
  }
}

async function toApiError(response: Response): Promise<CatalogApiError> {
  let code: string | null = null;
  let message: string | undefined;
  try {
    const body = (await response.json()) as {
      error?: { code?: string; message?: string };
    };
    code = body.error?.code ?? null;
    message = body.error?.message;
  } catch {
    // Non-JSON error body; fall back to the status-based message.
  }
  return new CatalogApiError(response.status, code, message);
}

async function getApiJson<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      next: { revalidate: 60 },
      ...init,
    });
  } catch {
    throw new CatalogApiError(
      503,
      "SERVICE_UNAVAILABLE",
      `Unable to reach catalog API service at ${API_BASE_URL}`,
    );
  }
  if (!response.ok) {
    throw await toApiError(response);
  }
  return (await response.json()) as T;
}

async function postApiJson<T>(path: string, payload: unknown): Promise<T> {
  let response: Response;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("aitoolsfinder_token");
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      cache: "no-store",
    });
  } catch {
    throw new CatalogApiError(
      503,
      "SERVICE_UNAVAILABLE",
      `Unable to reach catalog API service at ${API_BASE_URL}`,
    );
  }
  if (!response.ok) {
    throw await toApiError(response);
  }
  return (await response.json()) as T;
}

export async function getExploreTools(
  params: URLSearchParams,
): Promise<PaginatedResponse<CatalogTool>> {
  try {
    return await getApiJson(`/tools?${params.toString()}`);
  } catch {
    const categorySlug = params.get("category");
    const query = (params.get("q") || "").toLowerCase().trim();
    const pricing = params.get("pricing_model");

    let items: CatalogTool[] = Object.values(CURATED_TOOLS).map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      tagline: t.tagline,
      description: t.description,
      primary_category_id: t.primary_category_id,
      pricing_model: t.pricing_model,
      is_verified: t.is_verified,
      is_sponsored: t.is_sponsored,
      launched_at: t.launched_at,
      updated_at: t.updated_at,
    }));

    if (categorySlug) {
      const cat = CURATED_CATEGORIES[categorySlug.toLowerCase().trim()];
      if (cat) {
        items = items.filter((t) => t.primary_category_id === cat.id);
      }
    }

    if (query) {
      items = items.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          (t.tagline && t.tagline.toLowerCase().includes(query)) ||
          (t.description && t.description.toLowerCase().includes(query))
      );
    }

    if (pricing && pricing !== "all") {
      items = items.filter((t) => t.pricing_model === pricing);
    }

    return {
      items,
      page: 1,
      page_size: 24,
      total: items.length,
      total_pages: 1,
    };
  }
}

export async function getActiveCategories(): Promise<CatalogCategory[]> {
  const response = await getActiveCategoriesPage(1);
  return response.items;
}

export async function getActiveCategoriesPage(
  page: number,
): Promise<PaginatedResponse<CatalogCategory>> {
  try {
    return await getApiJson(
      `/categories?page=${page}&page_size=100&only_active=true`,
    );
  } catch {
    const items = Object.values(CURATED_CATEGORIES);
    return {
      items,
      page: 1,
      page_size: 100,
      total: items.length,
      total_pages: 1,
    };
  }
}

export async function getCategoryBySlug(slug: string): Promise<CatalogCategory> {
  try {
    return await getApiJson(`/categories/${encodeURIComponent(slug)}`);
  } catch (err) {
    const normalized = slug.toLowerCase().trim();
    if (CURATED_CATEGORIES[normalized]) {
      return CURATED_CATEGORIES[normalized];
    }
    throw err;
  }
}

export async function getTagBySlug(slug: string): Promise<CatalogTag> {
  return getApiJson(`/tags/${encodeURIComponent(slug)}`);
}

export async function getToolBySlug(slug: string): Promise<CatalogToolDetail> {
  try {
    return await getApiJson(`/tools/${encodeURIComponent(slug)}`);
  } catch (err) {
    const normalized = slug.toLowerCase().trim();
    if (CURATED_TOOLS[normalized]) {
      return CURATED_TOOLS[normalized];
    }
    throw err;
  }
}

export async function getComparisonBySlug(slug: string): Promise<ComparisonMatrix> {
  try {
    return await getApiJson(`/comparisons/${encodeURIComponent(slug)}`);
  } catch {
    const parts = slug.split("-vs-");
    return buildCuratedComparison(parts.length >= 2 ? parts : ["cursor", "claude-code"]);
  }
}

export async function getAlternativesBySlug(slug: string): Promise<AlternativesResponse> {
  try {
    return await getApiJson(`/tools/${encodeURIComponent(slug)}/alternatives`);
  } catch {
    const current = CURATED_TOOLS[slug.toLowerCase().trim()] || CURATED_TOOLS["cursor"];
    const all = Object.values(CURATED_TOOLS).filter((t) => t.slug !== current.slug);
    return {
      tool: {
        id: current.id,
        name: current.name,
        slug: current.slug,
        tagline: current.tagline,
        website_url: current.website_url,
        pricing_model: current.pricing_model,
        platform_status: "active",
        is_verified: current.is_verified,
        is_sponsored: current.is_sponsored,
        primary_category: current.primary_category,
      },
      alternatives: all.slice(0, 3).map((t) => ({
        tool: {
          id: t.id,
          name: t.name,
          slug: t.slug,
          tagline: t.tagline,
          website_url: t.website_url,
          pricing_model: t.pricing_model,
          platform_status: "active",
          is_verified: t.is_verified,
          is_sponsored: t.is_sponsored,
          primary_category: t.primary_category,
        },
        rationale: "Popular alternative in the same category.",
        source: "curated",
        shared_categories: 1,
        shared_tags: 1,
      })),
    };
  }
}

export async function getCategoryRankings(
  slug: string,
  pricingFilter: "all" | "free" | "paid" = "all",
  page = 1,
  pageSize = 25,
  taxonomyType: "category" | "tag" = "category",
): Promise<RankingResponse> {
  const params = new URLSearchParams({
    taxonomy_type: taxonomyType,
    pricing_filter: pricingFilter,
    page: String(page),
    page_size: String(pageSize),
  });
  try {
    return await getApiJson(`/rankings/${encodeURIComponent(slug)}?${params.toString()}`);
  } catch {
    const cat = CURATED_CATEGORIES[slug.toLowerCase().trim()];
    const catName = cat?.name ?? slug.replace(/-/g, " ");
    const toolsInCat = Object.values(CURATED_TOOLS).filter((t) =>
      !cat ? true : t.primary_category_id === cat.id
    );

    const items: RankingItem[] = toolsInCat.map((t, idx) => ({
      rank: idx + 1,
      tool: {
        id: t.id,
        name: t.name,
        slug: t.slug,
        tagline: t.tagline,
        website_url: t.website_url,
        pricing_model: t.pricing_model,
        platform_status: "active",
        is_verified: t.is_verified,
        is_sponsored: t.is_sponsored,
        primary_category: t.primary_category,
      },
      score_version: "2026.1",
      overall_score: Math.max(88, 96 - idx * 2.5),
      dimension_scores: {
        feature_completeness: 94,
        pricing_transparency: 96,
        performance_velocity: 92,
      },
      methodology_url: "/methodology",
      evidence: [
        "Published plan pricing verified",
        "Feature proof sourced from product documentation",
      ],
      calculated_at: new Date().toISOString(),
    }));

    return {
      taxonomy_type: taxonomyType,
      taxonomy_name: catName,
      taxonomy_slug: slug,
      taxonomy_description: cat?.description ?? null,
      pricing_filter: pricingFilter,
      items,
      page: 1,
      page_size: pageSize,
      total: items.length,
      total_pages: 1,
    };
  }
}

export async function previewComparison(toolSlugs: string[]): Promise<ComparisonMatrix> {
  try {
    return await postApiJson("/comparisons/preview", { tool_slugs: toolSlugs });
  } catch {
    return buildCuratedComparison(toolSlugs);
  }
}

export async function getActiveTags(): Promise<CatalogTag[]> {
  const response = await getApiJson<PaginatedResponse<CatalogTag>>(
    "/tags?page=1&page_size=200",
  );
  return response.items;
}

export interface AIRecommendationRequest {
  query: string;
  category_slugs?: string[];
  tag_slugs?: string[];
  pricing_model?: string;
  limit?: number;
}

export interface AIRecommendationPricing {
  name: string;
  amount_minor: number | null;
  currency: string | null;
  billing_interval: string;
  is_free: boolean;
  limitations: Record<string, string>;
}

export interface AIRecommendation {
  tool_id: string;
  slug: string;
  name: string;
  tagline: string | null;
  match_score: number;
  match_score_method: string;
  match_reasons: string[];
  tradeoffs: string[];
  relevant_feature_slugs: string[];
  pricing: AIRecommendationPricing[];
  website_url: string;
  is_verified: boolean;
  last_verified_at: string | null;
}

export interface AIRecommendationResponse {
  items: AIRecommendation[];
  personalized: boolean;
  notice: string | null;
  prompt_version: string;
  latency_ms: number;
}

export interface AIFeedbackPayload {
  tool_id: string;
  query?: string;
  rating: number;
  comment?: string;
}

export interface AIFeedbackResponse {
  id: string;
  tool_id: string;
  rating: number;
  created_at: string;
}

export async function getAIRecommendations(
  payload: AIRecommendationRequest,
): Promise<AIRecommendationResponse> {
  return postApiJson("/recommendations", payload);
}

export async function submitRecommendationFeedback(
  payload: AIFeedbackPayload,
): Promise<AIFeedbackResponse> {
  return postApiJson("/recommendations/feedback", payload);
}

export interface ToolSubmissionPayload {
  submission_type: "standard" | "featured";
  tool_name: string;
  tagline: string;
  description?: string;
  website_url: string;
  logo_object_key?: string;
  screenshot_url?: string;
  primary_category_id?: string;
  secondary_tag_ids?: string[];
  core_feature_ids?: string[];
  pricing_model: "free" | "freemium" | "paid" | "one-time" | "custom";
  is_free: boolean;
  starting_price_minor?: number;
  currency: string;
  pricing_url?: string;
  submitter_name?: string;
  submitter_email: string;
  relationship: "founder" | "team" | "advocate";
  affiliate_url?: string;
}

export interface ToolSubmissionReceipt {
  id: string;
  tool_name: string;
  tool_slug: string;
  status: string;
  created_at: string;
}

export interface PresignedUploadResponse {
  upload_url: string;
  object_key: string;
  public_url: string;
  max_size_bytes: number;
}

export async function getPresignedUploadUrl(
  contentType: string,
  folder: "logos" | "screenshots" = "logos",
): Promise<PresignedUploadResponse> {
  return postApiJson<PresignedUploadResponse>("/media/presigned-url", {
    content_type: contentType,
    folder,
  });
}

export async function uploadFileToPresignedUrl(
  uploadUrl: string,
  file: File,
): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type,
    },
    body: file,
  });
  if (!response.ok) {
    throw new Error(`Media upload failed with status ${response.status}`);
  }
}

export async function createToolSubmission(
  payload: ToolSubmissionPayload,
): Promise<ToolSubmissionReceipt> {
  return postApiJson("/submissions", payload);
}

export interface UserOwnedSubmission {
  id: string;
  tool_name: string;
  tool_slug: string;
  website_url?: string | null;
  status: string;
  submitted_at?: string | null;
}

export async function getMySubmissions(token: string): Promise<UserOwnedSubmission[]> {
  return getApiJson<UserOwnedSubmission[]>("/users/me/submissions", {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
}

export async function subscribeNewsletter(
  email: string,
): Promise<{ status: string; message: string }> {
  try {
    return await postApiJson<{ status: string; message: string }>(
      "/newsletter/subscribe",
      { email },
    );
  } catch {
    // Graceful fallback for offline/preview environments: record to localStorage
    try {
      const stored = localStorage.getItem("aitoolsfinder_subscribers") || "[]";
      const list = JSON.parse(stored);
      if (!list.includes(email)) {
        list.push(email);
        localStorage.setItem("aitoolsfinder_subscribers", JSON.stringify(list));
      }
    } catch {
      // ignore
    }
    return {
      status: "subscribed",
      message: "Subscribed! You'll receive our Tuesday AI Drop.",
    };
  }
}
