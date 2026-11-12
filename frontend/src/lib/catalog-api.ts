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
  logo_object_key: string | null;
  platform_status: string;
  last_verified_at: string | null;
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

async function getApiJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, { cache: "no-store" });
  if (!response.ok) {
    throw await toApiError(response);
  }
  return (await response.json()) as T;
}

async function postApiJson<T>(path: string, payload: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  if (!response.ok) {
    throw await toApiError(response);
  }
  return (await response.json()) as T;
}

export async function getExploreTools(
  params: URLSearchParams,
): Promise<PaginatedResponse<CatalogTool>> {
  return getApiJson(`/tools?${params.toString()}`);
}

export async function getActiveCategories(): Promise<CatalogCategory[]> {
  const response = await getActiveCategoriesPage(1);
  return response.items;
}

export async function getActiveCategoriesPage(
  page: number,
): Promise<PaginatedResponse<CatalogCategory>> {
  return getApiJson(
    `/categories?page=${page}&page_size=100&only_active=true`,
  );
}

export async function getCategoryBySlug(slug: string): Promise<CatalogCategory> {
  return getApiJson(`/categories/${encodeURIComponent(slug)}`);
}

export async function getTagBySlug(slug: string): Promise<CatalogTag> {
  return getApiJson(`/tags/${encodeURIComponent(slug)}`);
}

export async function getToolBySlug(slug: string): Promise<CatalogToolDetail> {
  return getApiJson(`/tools/${encodeURIComponent(slug)}`);
}

export async function getComparisonBySlug(slug: string): Promise<ComparisonMatrix> {
  return getApiJson(`/comparisons/${encodeURIComponent(slug)}`);
}

export async function getAlternativesBySlug(slug: string): Promise<AlternativesResponse> {
  return getApiJson(`/tools/${encodeURIComponent(slug)}/alternatives`);
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
  return getApiJson(`/rankings/${encodeURIComponent(slug)}?${params.toString()}`);
}

export async function previewComparison(toolSlugs: string[]): Promise<ComparisonMatrix> {
  return postApiJson("/comparisons/preview", { tool_slugs: toolSlugs });
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
