"""Part 2: Live homepage verification & Groq structured enrichment into JSONL.

Usage:
    python backend/scripts/enrich_tools.py --seeds data/seeds.jsonl --out data/enriched.jsonl --limit 20
"""

from __future__ import annotations

import argparse
import concurrent.futures
import html.parser
import json
import logging
import os
import re
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any

backend_dir = Path(__file__).resolve().parent.parent
repo_root = backend_dir.parent

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger("enrich_tools")

USER_AGENT = "AIToolsFinderBot/1.0 (+https://aitoolsfinder.cloud)"
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

VALID_PRICING_MODELS = {
    "free",
    "freemium",
    "paid",
    "usage_based",
    "contact_sales",
    "unknown",
}
VALID_INTERVALS = {"one_time", "monthly", "yearly", "usage_based", "unknown"}
_PARKED_PHRASES = (
    "domain is for sale",
    "buy this domain",
    "this domain may be for sale",
    "godaddy",
    "sedo",
    "hugedomains",
    "domain parked",
)


def _slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    return text.strip("-")


def _load_env_file() -> None:
    for candidate in (Path.cwd() / ".env", backend_dir / ".env"):
        if not candidate.exists():
            continue
        for raw in candidate.read_text(encoding="utf-8").splitlines():
            line = raw.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip().strip("\"'"))


def load_taxonomy_slugs() -> tuple[set[str], set[str]]:
    """Load valid category and tag slugs from data/taxonomy/*.txt."""
    tax_dir = repo_root / "data" / "taxonomy"
    categories: set[str] = set()
    for line in (tax_dir / "source-taxonomy-categories.txt").read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line and line != "|":
            slug = _slugify(line)
            if slug:
                categories.add(slug)

    tags: set[str] = set()
    for line in (tax_dir / "source-taxonomy-tags.txt").read_text(encoding="utf-8").splitlines():
        line = line.strip().lstrip("#").strip()
        if line:
            slug = _slugify(line)
            if slug:
                tags.add(slug)

    return categories, tags


class _PageTextParser(html.parser.HTMLParser):
    _SKIP_TAGS = {"script", "style", "noscript", "svg", "nav", "footer"}

    def __init__(self) -> None:
        super().__init__()
        self._skip_depth = 0
        self._in_title = False
        self.title_parts: list[str] = []
        self.meta_desc: str = ""
        self.body_parts: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        tag = tag.lower()
        if tag in self._SKIP_TAGS:
            self._skip_depth += 1
        elif tag == "title":
            self._in_title = True
        elif tag == "meta":
            attr_map = {k.lower(): (v or "") for k, v in attrs}
            if attr_map.get("name", "").lower() == "description" and attr_map.get("content"):
                self.meta_desc = attr_map["content"].strip()

    def handle_endtag(self, tag: str) -> None:
        tag = tag.lower()
        if tag in self._SKIP_TAGS and self._skip_depth > 0:
            self._skip_depth -= 1
        elif tag == "title":
            self._in_title = False

    def handle_data(self, data: str) -> None:
        cleaned = " ".join(data.split())
        if not cleaned:
            return
        if self._in_title:
            self.title_parts.append(cleaned)
        elif self._skip_depth == 0:
            self.body_parts.append(cleaned)


def extract_page_text(html_content: str, max_chars: int = 4000) -> str:
    """Extract title, meta description, and visible body text from HTML."""
    parser = _PageTextParser()
    parser.feed(html_content)
    sections = []
    if parser.title_parts:
        sections.append(f"Title: {' '.join(parser.title_parts)}")
    if parser.meta_desc:
        sections.append(f"Meta: {parser.meta_desc}")
    if parser.body_parts:
        sections.append(" ".join(parser.body_parts))
    return "\n".join(sections)[:max_chars]


def is_parked_or_empty(text: str) -> bool:
    """Return True if fetched text is too short or looks like a parked domain."""
    normalized = (text or "").strip().lower()
    if len(normalized) < 40:
        return True
    return any(phrase in normalized for phrase in _PARKED_PHRASES)


def fetch_page_text(url: str, timeout: float = 10.0) -> str | None:
    """Fetch a live URL and return cleaned text, or None on error/non-HTML."""
    req = urllib.request.Request(
        url,
        headers={"User-Agent": USER_AGENT, "Accept": "text/html,application/xhtml+xml"},
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            ctype = (resp.headers.get("Content-Type") or "").lower()
            if "html" not in ctype and "text" not in ctype:
                return None
            raw = resp.read(512_000).decode("utf-8", errors="ignore")
            return extract_page_text(raw)
    except Exception as exc:
        logger.debug("Fetch failed for %s: %s", url, exc)
        return None


def _http_post_json(
    url: str, payload: dict[str, Any], headers: dict[str, str], timeout: float
) -> dict[str, Any]:
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers=headers,
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


def call_groq_json(
    messages: list[dict[str, str]],
    *,
    api_key: str,
    model: str,
    max_retries: int = 3,
) -> dict[str, Any]:
    """Call Groq chat completions with JSON mode and 429/5xx backoff."""
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "User-Agent": USER_AGENT,
    }
    payload = {
        "model": model,
        "messages": messages,
        "max_completion_tokens": 900,
        "temperature": 0.2,
        "response_format": {"type": "json_object"},
    }
    for attempt in range(max_retries + 1):
        try:
            body = _http_post_json(GROQ_URL, payload, headers, timeout=25.0)
            content = body["choices"][0]["message"]["content"]
            return json.loads(content)
        except urllib.error.HTTPError as exc:
            if exc.code in (429, 500, 502, 503, 504) and attempt < max_retries:
                retry_after = exc.headers.get("Retry-After") if exc.headers else None
                delay = float(retry_after) if retry_after and retry_after.isdigit() else float(2**attempt)
                logger.warning("Groq HTTP %s; backing off %.1fs", exc.code, delay)
                time.sleep(delay)
                continue
            raise


def build_enrichment_messages(
    seed: dict[str, Any],
    page_text: str,
    categories: set[str],
    tags: set[str],
) -> list[dict[str, str]]:
    system = (
        "You extract factual software directory metadata strictly from the provided website text. "
        "Return valid JSON only with keys: tagline (string, <=140 chars), description (2-3 factual sentences), "
        "primary_category_slug (must be one of the allowed categories), tag_slugs (up to 5 from allowed tags), "
        "pricing_model (one of: free, freemium, paid, usage_based, contact_sales, unknown), "
        "pricing_plans (list of {name, is_free, amount_minor, billing_interval}), "
        "features (list of 3-5 concise feature names)."
    )
    user = (
        f"Tool Name: {seed['name']}\n"
        f"Website: {seed['website_url']}\n"
        f"Hint: {seed.get('hint', '')}\n"
        f"Allowed Categories: {sorted(categories)}\n"
        f"Allowed Tags: {sorted(tags)}\n\n"
        f"Website Text:\n{page_text}"
    )
    return [{"role": "system", "content": system}, {"role": "user", "content": user}]


def validate_enrichment(
    raw: dict[str, Any],
    valid_categories: set[str],
    valid_tags: set[str],
) -> dict[str, Any]:
    """Normalize and validate Groq output against catalog constraints."""
    cat = str(raw.get("primary_category_slug") or "").strip().lower()
    if cat not in valid_categories:
        cat = "ai" if "ai" in valid_categories else sorted(valid_categories)[0]

    tag_slugs = [
        str(t).strip().lower()
        for t in (raw.get("tag_slugs") or [])
        if str(t).strip().lower() in valid_tags
    ][:5]

    pricing_model = str(raw.get("pricing_model") or "unknown").strip().lower()
    if pricing_model not in VALID_PRICING_MODELS:
        pricing_model = "unknown"

    plans: list[dict[str, Any]] = []
    for p in (raw.get("pricing_plans") or [])[:5]:
        if not isinstance(p, dict) or not p.get("name"):
            continue
        interval = str(p.get("billing_interval") or "unknown").strip().lower()
        if interval not in VALID_INTERVALS:
            interval = "unknown"
        amount = p.get("amount_minor")
        plans.append(
            {
                "name": str(p["name"]).strip()[:100],
                "is_free": bool(p.get("is_free", False)),
                "amount_minor": int(amount) if isinstance(amount, (int, float)) else None,
                "billing_interval": interval,
            }
        )

    features = [
        str(f).strip()[:120]
        for f in (raw.get("features") or [])
        if str(f).strip()
    ][:5]

    return {
        "tagline": str(raw.get("tagline") or "").strip()[:500],
        "description": str(raw.get("description") or "").strip(),
        "primary_category_slug": cat,
        "tag_slugs": tag_slugs,
        "pricing_model": pricing_model,
        "pricing_plans": plans,
        "features": features,
    }


_CATEGORY_KEYWORDS: list[tuple[str, tuple[str, ...]]] = [
    ("developer-tools", ("developer", "code", "sdk", "cli", "ide", "github", "pull request", "devops", "programming")),
    ("analytics", ("analytics", "metrics", "cohort", "dashboard", "telemetry", "tracking", "bi")),
    ("marketing", ("marketing", "seo", "campaign", "ads", "email", "newsletter", "growth", "conversion")),
    ("sales", ("sales", "crm", "outbound", "lead", "pipeline", "prospect")),
    ("customer-support", ("support", "helpdesk", "ticket", "customer service", "live chat")),
    ("design", ("design", "figma", "ui", "ux", "vector", "prototype")),
    ("video", ("video", "animation", "avatar", "editing")),
    ("audio", ("audio", "voice", "speech", "podcast", "music")),
    ("image", ("image", "photo", "diffusion", "upscale")),
    ("writing", ("writing", "copywriting", "grammar", "blog", "content")),
    ("automation", ("automation", "workflow", "zapier", "agent", "webhook")),
    ("security", ("security", "auth", "compliance", "soc2", "fraud", "encryption")),
    ("finance", ("finance", "billing", "payment", "invoice", "accounting", "fintech")),
    ("hr", ("hr", "hiring", "recruit", "payroll", "onboarding")),
    ("education", ("education", "learning", "course", "student", "tutor")),
    ("e-commerce", ("ecommerce", "e-commerce", "shopify", "storefront", "checkout")),
    ("research", ("research", "paper", "academic", "citation", "science")),
    ("productivity", ("productivity", "notes", "calendar", "task", "workspace")),
]


def enrich_locally(
    seed: dict[str, Any],
    page_text: str,
    valid_categories: set[str],
    valid_tags: set[str],
) -> dict[str, Any]:
    """Deterministic keyword/metadata enrichment without LLM API calls."""
    meta = ""
    title = ""
    body_lines: list[str] = []
    for line in page_text.splitlines():
        if line.startswith("Meta: "):
            meta = line[6:].strip()
        elif line.startswith("Title: "):
            title = line[7:].strip()
        else:
            body_lines.append(line.strip())

    hint = str(seed.get("hint") or "").strip()
    tagline = (hint or meta or title or f"{seed['name']} software platform.")[:140]
    body_excerpt = " ".join(body_lines)[:320].strip()
    description = " ".join(part for part in (meta, hint, body_excerpt) if part)[:600]

    haystack = f"{seed['name']} {hint} {title} {meta} {body_excerpt[:400]}".lower()

    cat = "ai" if "ai" in valid_categories else sorted(valid_categories)[0]
    for candidate_cat, keywords in _CATEGORY_KEYWORDS:
        if candidate_cat in valid_categories and any(kw in haystack for kw in keywords):
            cat = candidate_cat
            break

    matched_tags = [
        t for t in sorted(valid_tags)
        if t.replace("-", " ") in haystack or t in haystack
    ][:5]
    if "ai" in valid_tags and "ai" not in matched_tags and ("ai" in haystack or "llm" in haystack):
        matched_tags = ["ai", *matched_tags][:5]

    has_free = any(w in haystack for w in ("free", "open source", "open-source", "mit license"))
    has_paid = any(w in haystack for w in ("pricing", "pro", "$", "/mo", "enterprise", "subscription", "trial"))
    if has_free and has_paid:
        pricing_model = "freemium"
    elif has_free:
        pricing_model = "free"
    elif has_paid:
        pricing_model = "paid"
    else:
        pricing_model = "unknown"

    return validate_enrichment(
        {
            "tagline": tagline,
            "description": description or tagline,
            "primary_category_slug": cat,
            "tag_slugs": matched_tags,
            "pricing_model": pricing_model,
            "pricing_plans": [],
            "features": [],
        },
        valid_categories,
        valid_tags,
    )


def run_enrichment(
    *,
    seeds_path: Path,
    out_path: Path,
    limit: int,
    api_key: str,
    model: str,
    use_llm: bool = True,
    workers: int = 16,
) -> tuple[int, int]:
    """Fetch, enrich (via Groq or locally), and checkpoint incrementally to out_path."""
    valid_categories, valid_tags = load_taxonomy_slugs()

    done_domains: set[str] = set()
    if out_path.exists():
        for line in out_path.read_text(encoding="utf-8").splitlines():
            if not line.strip():
                continue
            row = json.loads(line)
            if row.get("domain"):
                done_domains.add(row["domain"])

    seeds = [
        json.loads(line)
        for line in seeds_path.read_text(encoding="utf-8").splitlines()
        if line.strip()
    ]

    out_path.parent.mkdir(parents=True, exist_ok=True)
    processed = 0
    skipped = 0

    pending: list[dict[str, Any]] = []
    for seed in seeds:
        domain = seed.get("domain", "")
        if not domain or domain in done_domains:
            skipped += 1
            continue
        pending.append(seed)

    if not use_llm:
        def _process_local(seed: dict[str, Any]) -> dict[str, Any] | None:
            page_text = fetch_page_text(seed["website_url"], timeout=6.0)
            if not page_text or is_parked_or_empty(page_text):
                return None
            enriched = enrich_locally(seed, page_text, valid_categories, valid_tags)
            domain = seed["domain"]
            return {
                "name": seed["name"],
                "slug": _slugify(seed["name"]) or _slugify(domain.split(".")[0]),
                "website_url": seed["website_url"],
                "domain": domain,
                "source": seed.get("source", "seed"),
                **enriched,
            }

        with (
            out_path.open("a", encoding="utf-8") as fh,
            concurrent.futures.ThreadPoolExecutor(max_workers=max(1, workers)) as pool,
        ):
            batch = pending[: max(limit * 2, limit)]
            for record in pool.map(_process_local, batch):
                if processed >= limit:
                    break
                if record is None:
                    skipped += 1
                    continue
                fh.write(json.dumps(record, ensure_ascii=False) + "\n")
                done_domains.add(record["domain"])
                processed += 1
                if processed % 100 == 0:
                    fh.flush()
                    logger.info("Enriched [%d/%d] locally...", processed, limit)
        return processed, skipped

    with out_path.open("a", encoding="utf-8") as fh:
        for seed in pending:
            if processed >= limit:
                break
            domain = seed["domain"]
            page_text = fetch_page_text(seed["website_url"])
            if not page_text or is_parked_or_empty(page_text):
                logger.info("Skipping dead/parked site: %s", seed["website_url"])
                skipped += 1
                continue

            messages = build_enrichment_messages(seed, page_text, valid_categories, valid_tags)
            try:
                raw = call_groq_json(messages, api_key=api_key, model=model)
                enriched = validate_enrichment(raw, valid_categories, valid_tags)
            except Exception as exc:
                logger.warning("Enrichment failed for %s: %s", seed["website_url"], exc)
                skipped += 1
                continue

            record = {
                "name": seed["name"],
                "slug": _slugify(seed["name"]) or _slugify(domain.split(".")[0]),
                "website_url": seed["website_url"],
                "domain": domain,
                "source": seed.get("source", "seed"),
                **enriched,
            }
            fh.write(json.dumps(record, ensure_ascii=False) + "\n")
            fh.flush()
            done_domains.add(domain)
            processed += 1
            logger.info("Enriched [%d/%d]: %s (%s)", processed, limit, record["name"], record["primary_category_slug"])

    return processed, skipped


def main() -> None:
    _load_env_file()
    parser = argparse.ArgumentParser(description="Enrich seed URLs using Groq or local metadata.")
    parser.add_argument("--seeds", type=Path, default=repo_root / "data" / "seeds.jsonl")
    parser.add_argument("--out", type=Path, default=repo_root / "data" / "enriched.jsonl")
    parser.add_argument("--limit", type=int, default=20)
    parser.add_argument("--no-llm", action="store_true", help="Use fast concurrent local enrichment (no Groq calls)")
    parser.add_argument("--workers", type=int, default=20, help="Concurrent fetch workers for --no-llm mode")
    args = parser.parse_args()

    api_key = os.environ.get("GROQ_API_KEY", "")
    model = os.environ.get("GROQ_MODEL", "openai/gpt-oss-120b")
    if not args.no_llm and not api_key:
        raise SystemExit("GROQ_API_KEY is required in environment or backend/.env (or pass --no-llm)")

    processed, skipped = run_enrichment(
        seeds_path=args.seeds,
        out_path=args.out,
        limit=args.limit,
        api_key=api_key,
        model=model,
        use_llm=not args.no_llm,
        workers=args.workers,
    )
    logger.info("Finished enrichment: %d processed, %d skipped", processed, skipped)


if __name__ == "__main__":
    main()
