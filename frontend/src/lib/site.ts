export const SITE_URL = "https://aitoolsfinder.cloud";
const SITE_ORIGIN = new URL(SITE_URL).origin;

export function canonicalUrl(path: `/${string}`): string {
  const url = new URL(path, SITE_URL);
  if (url.origin !== SITE_ORIGIN) {
    throw new Error("canonicalUrl only accepts URLs from the site origin");
  }
  url.hash = "";
  if (url.pathname !== "/") {
    url.pathname = url.pathname.replace(/\/+$/, "");
  }
  return url.toString();
}
