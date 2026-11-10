export interface CatalogCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  seo_title: string | null;
  seo_description: string | null;
  is_active: boolean;
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

async function getApiJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Catalog API returned ${response.status}`);
  }
  return (await response.json()) as T;
}

export async function getExploreTools(
  params: URLSearchParams,
): Promise<PaginatedResponse<CatalogTool>> {
  return getApiJson(`/tools?${params.toString()}`);
}

export async function getActiveCategories(): Promise<CatalogCategory[]> {
  const response = await getApiJson<PaginatedResponse<CatalogCategory>>(
    "/categories?page=1&page_size=100&only_active=true",
  );
  return response.items;
}
