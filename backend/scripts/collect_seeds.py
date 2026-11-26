"""Part 1: Collect and deduplicate AI/SaaS tool seed URLs into JSONL.

Sources:
- GitHub Search API (public repos with product homepages)
- YC OSS API (open MIT JSON of Y Combinator companies)
- Product Hunt GraphQL API (requires PRODUCTHUNT_TOKEN)

Usage:
    python backend/scripts/collect_seeds.py --sources yc github --limit 100
"""

from __future__ import annotations

import argparse
import json
import logging
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Iterable

backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger("collect_seeds")

USER_AGENT = "AIToolsFinderBot/1.0 (+https://aitoolsfinder.cloud)"

# Skip code-host / social / placeholder URLs that are not product homepages
_BLOCKED_DOMAINS = {
    "github.com",
    "gitlab.com",
    "bitbucket.org",
    "huggingface.co",
    "x.com",
    "twitter.com",
    "youtube.com",
    "youtu.be",
    "linkedin.com",
    "discord.gg",
    "discord.com",
    "t.me",
    "medium.com",
    "substack.com",
    "localhost",
    "127.0.0.1",
}

_MULTIPART_SLDS = {"co", "com", "org", "net", "edu", "gov", "ac"}
_YC_ALL_URL = "https://yc-oss.github.io/api/companies/all.json"
_YC_AI_TAGS = {"ai", "artificial intelligence", "generative ai", "machine learning", "saas", "developer tools", "b2b"}
_GITHUB_TOPICS = ("ai-tools", "llm", "ai-agent", "generative-ai", "saas")


def _root_domain(host: str) -> str:
    """Collapse subdomains to a registrable root domain without extra dependencies."""
    parts = [p for p in host.split(".") if p]
    if len(parts) <= 2:
        return ".".join(parts)
    if len(parts[-1]) == 2 and parts[-2] in _MULTIPART_SLDS and len(parts) >= 3:
        return ".".join(parts[-3:])
    return ".".join(parts[-2:])


def _load_env_file() -> None:
    """Populate os.environ from .env / backend/.env if not already set."""
    for candidate in (Path.cwd() / ".env", backend_dir / ".env"):
        if not candidate.exists():
            continue
        for raw in candidate.read_text(encoding="utf-8").splitlines():
            line = raw.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip().strip("\"'"))


def _http_json(
    url: str,
    *,
    headers: dict[str, str] | None = None,
    method: str = "GET",
    body: dict | None = None,
) -> dict | list:
    req_headers = {"User-Agent": USER_AGENT, "Accept": "application/json"}
    if headers:
        req_headers.update(headers)
    data = json.dumps(body).encode("utf-8") if body is not None else None
    if data is not None:
        req_headers.setdefault("Content-Type", "application/json")
    req = urllib.request.Request(url, data=data, headers=req_headers, method=method)
    with urllib.request.urlopen(req, timeout=20) as resp:
        return json.loads(resp.read().decode("utf-8"))


def _http_json_with_backoff(
    url: str,
    *,
    headers: dict[str, str] | None = None,
    method: str = "GET",
    body: dict | None = None,
    max_retries: int = 3,
) -> dict | list:
    for attempt in range(max_retries + 1):
        try:
            return _http_json(url, headers=headers, method=method, body=body)
        except urllib.error.HTTPError as exc:
            if exc.code in (429, 500, 502, 503, 504) and attempt < max_retries:
                retry_after = exc.headers.get("Retry-After") if exc.headers else None
                delay = float(retry_after) if retry_after and retry_after.isdigit() else float(2**attempt)
                logger.warning("HTTP %s on %s; backing off %.1fs", exc.code, url, delay)
                time.sleep(delay)
                continue
            raise


def normalize_url(raw_url: str) -> tuple[str, str] | None:
    """Return (clean_url, root_domain) or None if URL is unsafe or non-product."""
    url = (raw_url or "").strip()
    if not url or any(ch.isspace() for ch in url):
        return None
    if not url.startswith(("http://", "https://")):
        url = f"https://{url}"
    try:
        parsed = urllib.parse.urlparse(url)
    except ValueError:
        return None
    host = (parsed.hostname or "").lower().removeprefix("www.")
    if (
        parsed.scheme not in {"http", "https"}
        or not host
        or "." not in host
        or parsed.username
        or parsed.password
    ):
        return None
    root = _root_domain(host)
    if host in _BLOCKED_DOMAINS or root in _BLOCKED_DOMAINS:
        return None
    clean = f"{parsed.scheme}://{parsed.netloc}{parsed.path}".rstrip("/")
    return clean, root


def collect_yc(limit: int) -> Iterable[dict]:
    """Fetch AI/SaaS companies from the open MIT-licensed YC OSS JSON."""
    logger.info("Fetching YC companies from %s", _YC_ALL_URL)
    companies = _http_json(_YC_ALL_URL)
    count = 0
    for item in companies:
        if count >= limit:
            break
        if item.get("status") not in (None, "Active", "Public"):
            continue
        tags = {str(t).lower() for t in (item.get("tags") or [])}
        industry = str(item.get("industry") or "").lower()
        if not (tags & _YC_AI_TAGS or "ai" in industry or "saas" in industry):
            continue
        norm = normalize_url(item.get("website") or "")
        if not norm:
            continue
        clean_url, domain = norm
        count += 1
        yield {
            "name": str(item.get("name") or "").strip(),
            "website_url": clean_url,
            "domain": domain,
            "source": "yc",
            "hint": str(item.get("one_liner") or "").strip()[:300],
        }


def collect_github(limit: int) -> Iterable[dict]:
    """Query GitHub Search API for public AI/SaaS repos with product homepages."""
    headers = {}
    token = os.environ.get("GITHUB_TOKEN")
    if token:
        headers["Authorization"] = f"Bearer {token}"

    count = 0
    per_topic = max(20, (limit // len(_GITHUB_TOPICS)) + 10)
    for topic in _GITHUB_TOPICS:
        if count >= limit:
            break
        page = 1
        while count < limit and (page - 1) * 100 < per_topic:
            q = urllib.parse.quote(f"topic:{topic} stars:>50")
            url = f"https://api.github.com/search/repositories?q={q}&sort=stars&order=desc&per_page=100&page={page}"
            try:
                data = _http_json_with_backoff(url, headers=headers)
            except urllib.error.HTTPError as exc:
                logger.warning("GitHub API HTTP %s on topic=%s", exc.code, topic)
                break
            items = data.get("items") or []
            if not items:
                break
            for repo in items:
                if count >= limit:
                    break
                norm = normalize_url(repo.get("homepage") or "")
                if not norm:
                    continue
                clean_url, domain = norm
                count += 1
                yield {
                    "name": str(repo.get("name") or "").replace("-", " ").title(),
                    "website_url": clean_url,
                    "domain": domain,
                    "source": "github",
                    "hint": str(repo.get("description") or "").strip()[:300],
                }
            page += 1
            time.sleep(0.5 if token else 2.0)


class _NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


_NO_REDIRECT_OPENER = urllib.request.build_opener(_NoRedirect)


def _resolve_redirect(url: str) -> str:
    """Resolve Product Hunt /r/... 302 Location header without loading target pages."""
    if "producthunt.com/r/" not in url:
        return url
    req = urllib.request.Request(url, headers={"User-Agent": "curl/8.0"}, method="HEAD")
    try:
        _NO_REDIRECT_OPENER.open(req, timeout=5)
    except urllib.error.HTTPError as exc:
        loc = exc.headers.get("Location") if exc.headers else None
        if loc:
            return loc
    except Exception:
        pass
    return url


def collect_producthunt(limit: int) -> Iterable[dict]:
    """Query Product Hunt GraphQL API (requires PRODUCTHUNT_TOKEN)."""
    token = os.environ.get("PRODUCTHUNT_TOKEN")
    if not token:
        logger.warning("Skipping Product Hunt: PRODUCTHUNT_TOKEN is not set.")
        return

    query = """
    query($cursor: String) {
      posts(topic: "artificial-intelligence", first: 50, after: $cursor) {
        pageInfo { hasNextPage endCursor }
        edges { node { name tagline website } }
      }
    }
    """
    headers = {"Authorization": f"Bearer {token}"}
    cursor = None
    count = 0
    while count < limit:
        data = _http_json_with_backoff(
            "https://api.producthunt.com/v2/api/graphql",
            headers=headers,
            method="POST",
            body={"query": query, "variables": {"cursor": cursor}},
        )
        posts = (data.get("data") or {}).get("posts") or {}
        for edge in posts.get("edges") or []:
            if count >= limit:
                break
            node = edge.get("node") or {}
            raw_website = _resolve_redirect(str(node.get("website") or ""))
            norm = normalize_url(raw_website)
            if not norm:
                continue
            clean_url, domain = norm
            if domain == "producthunt.com":
                continue
            count += 1
            yield {
                "name": str(node.get("name") or "").strip(),
                "website_url": clean_url,
                "domain": domain,
                "source": "producthunt",
                "hint": str(node.get("tagline") or "").strip()[:300],
            }
        page_info = posts.get("pageInfo") or {}
        if not page_info.get("hasNextPage"):
            break
        cursor = page_info.get("endCursor")
        time.sleep(0.5)


_COLLECTORS = {
    "yc": collect_yc,
    "github": collect_github,
    "producthunt": collect_producthunt,
}


def run_collection(sources: list[str], limit: int, out_path: Path) -> tuple[int, int]:
    """Collect, deduplicate by root domain, and write seeds JSONL."""
    seen_domains: set[str] = set()
    records: list[dict] = []

    if out_path.exists():
        for line in out_path.read_text(encoding="utf-8").splitlines():
            if not line.strip():
                continue
            row = json.loads(line)
            if row.get("domain"):
                seen_domains.add(row["domain"])
                records.append(row)

    added = 0
    for src in sources:
        for item in _COLLECTORS[src](limit):
            if not item["name"] or item["domain"] in seen_domains:
                continue
            seen_domains.add(item["domain"])
            records.append(item)
            added += 1

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(
        "\n".join(json.dumps(r, ensure_ascii=False) for r in records) + ("\n" if records else ""),
        encoding="utf-8",
    )
    logger.info("Done: %d newly added, %d total unique seeds in %s", added, len(records), out_path)
    return added, len(records)


def main() -> None:
    _load_env_file()
    parser = argparse.ArgumentParser(description="Collect deduplicated tool seeds.")
    parser.add_argument(
        "--sources",
        nargs="+",
        choices=list(_COLLECTORS.keys()),
        default=["yc", "github"],
        help="Sources to query (default: yc github)",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=500,
        help="Max raw records per source (default: 500)",
    )
    parser.add_argument(
        "--out",
        type=Path,
        default=backend_dir.parent / "data" / "seeds.jsonl",
        help="Output JSONL path",
    )
    args = parser.parse_args()
    run_collection(sources=args.sources, limit=args.limit, out_path=args.out)


if __name__ == "__main__":
    main()
