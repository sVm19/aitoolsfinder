"""TDD tests for Part 2: backend/scripts/enrich_tools.py."""

import io
import json
import sys
import urllib.error
from pathlib import Path
from unittest.mock import patch

import pytest

SCRIPTS_DIR = Path(__file__).resolve().parent.parent / "scripts"
if str(SCRIPTS_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPTS_DIR))

import enrich_tools  # noqa: E402


class TestHtmlExtraction:
    def test_extracts_title_meta_and_strips_boilerplate(self):
        html = """
        <html>
          <head>
            <title>Cursor - The AI Code Editor</title>
            <meta name="description" content="Build software faster with AI.">
            <style>.hidden { display: none; }</style>
            <script>console.log("ignore me");</script>
          </head>
          <body>
            <nav>Home Pricing Docs Login</nav>
            <main><h1>Code faster</h1><p>Autocomplete and multi-file edits.</p></main>
            <footer>Copyright 2026</footer>
          </body>
        </html>
        """
        text = enrich_tools.extract_page_text(html, max_chars=500)
        assert "Cursor - The AI Code Editor" in text
        assert "Build software faster with AI." in text
        assert "Code faster" in text
        assert "Autocomplete and multi-file edits." in text
        assert "ignore me" not in text
        assert "display: none" not in text
        assert "Copyright 2026" not in text

    @pytest.mark.parametrize(
        "text,expected",
        [
            ("Too short", True),
            ("This domain is for sale on GoDaddy. Buy this domain now! " * 3, True),
            (
                "Cursor is an AI-powered code editor built for multi-file editing and chat.",
                False,
            ),
        ],
    )
    def test_detects_parked_or_empty(self, text: str, expected: bool):
        assert enrich_tools.is_parked_or_empty(text) is expected


class TestTaxonomyValidation:
    def test_validates_and_normalizes_groq_output(self):
        valid_cats = {"ai", "developer-tools", "productivity"}
        valid_tags = {"ai", "code-assistant", "automation"}

        raw = {
            "tagline": "  AI code editor for fast shipping.  ",
            "description": "Cursor helps developers write and refactor code.",
            "primary_category_slug": "developer-tools",
            "tag_slugs": ["ai", "nonexistent-tag", "code-assistant"],
            "pricing_model": "FREEMIUM",
            "pricing_plans": [
                {
                    "name": "Hobby",
                    "is_free": True,
                    "amount_minor": 0,
                    "billing_interval": "monthly",
                },
                {
                    "name": "Pro",
                    "is_free": False,
                    "amount_minor": 2000,
                    "billing_interval": "monthly",
                },
            ],
            "features": [
                "Tab autocomplete",
                "Codebase chat",
                "Multi-file edit",
                "",
                "CLI",
            ],
        }
        cleaned = enrich_tools.validate_enrichment(raw, valid_cats, valid_tags)
        assert cleaned["tagline"] == "AI code editor for fast shipping."
        assert cleaned["primary_category_slug"] == "developer-tools"
        assert cleaned["tag_slugs"] == ["ai", "code-assistant"]
        assert cleaned["pricing_model"] == "freemium"
        assert len(cleaned["pricing_plans"]) == 2
        assert cleaned["features"] == [
            "Tab autocomplete",
            "Codebase chat",
            "Multi-file edit",
            "CLI",
        ]

    def test_falls_back_for_unknown_category_and_pricing_model(self):
        cleaned = enrich_tools.validate_enrichment(
            {
                "tagline": "Test tool",
                "description": "Test description.",
                "primary_category_slug": "made-up-category",
                "tag_slugs": [],
                "pricing_model": "enterprise-only",
                "pricing_plans": [],
                "features": [],
            },
            valid_categories={"ai", "productivity"},
            valid_tags={"ai"},
        )
        assert cleaned["primary_category_slug"] == "ai"
        assert cleaned["pricing_model"] == "unknown"


class TestGroqAndResume:
    def test_call_groq_json_retries_on_429(self):
        err_429 = urllib.error.HTTPError(
            url="https://api.groq.com/openai/v1/chat/completions",
            code=429,
            msg="Too Many Requests",
            hdrs={"Retry-After": "0"},
            fp=io.BytesIO(b"{}"),
        )
        ok_body = {
            "choices": [
                {
                    "message": {
                        "content": json.dumps(
                            {
                                "tagline": "AI editor",
                                "description": "Writes code.",
                                "primary_category_slug": "ai",
                                "tag_slugs": ["ai"],
                                "pricing_model": "freemium",
                                "pricing_plans": [],
                                "features": ["Autocomplete"],
                            }
                        )
                    }
                }
            ]
        }
        calls = {"n": 0}

        def fake_post(url, payload, headers, timeout):
            calls["n"] += 1
            if calls["n"] == 1:
                raise err_429
            return ok_body

        with (
            patch.object(enrich_tools, "_http_post_json", side_effect=fake_post),
            patch.object(enrich_tools.time, "sleep"),
        ):
            res = enrich_tools.call_groq_json(
                messages=[{"role": "user", "content": "hi"}],
                api_key="test-key",
                model="openai/gpt-oss-120b",
            )
        assert calls["n"] == 2
        assert res["tagline"] == "AI editor"

    def test_run_enrichment_resumes_and_skips_existing(self, tmp_path: Path):
        seeds_path = tmp_path / "seeds.jsonl"
        out_path = tmp_path / "enriched.jsonl"
        seeds_path.write_text(
            "\n".join(
                [
                    json.dumps(
                        {
                            "name": "AlreadyDone",
                            "website_url": "https://done.com",
                            "domain": "done.com",
                            "source": "yc",
                            "hint": "",
                        }
                    ),
                    json.dumps(
                        {
                            "name": "NewTool",
                            "website_url": "https://newtool.ai",
                            "domain": "newtool.ai",
                            "source": "yc",
                            "hint": "AI tool",
                        }
                    ),
                ]
            )
            + "\n",
            encoding="utf-8",
        )
        out_path.write_text(
            json.dumps(
                {
                    "name": "AlreadyDone",
                    "domain": "done.com",
                    "website_url": "https://done.com",
                }
            )
            + "\n",
            encoding="utf-8",
        )

        with (
            patch.object(
                enrich_tools,
                "fetch_page_text",
                return_value="NewTool is an AI workflow automation platform for teams.",
            ),
            patch.object(
                enrich_tools,
                "call_groq_json",
                return_value={
                    "tagline": "AI workflow automation.",
                    "description": "NewTool automates team workflows.",
                    "primary_category_slug": "ai",
                    "tag_slugs": ["ai"],
                    "pricing_model": "paid",
                    "pricing_plans": [],
                    "features": ["Workflow builder"],
                },
            ),
        ):
            processed, skipped = enrich_tools.run_enrichment(
                seeds_path=seeds_path,
                out_path=out_path,
                limit=10,
                api_key="test-key",
                model="openai/gpt-oss-120b",
            )

        assert processed == 1
        assert skipped == 1
        rows = [
            json.loads(line)
            for line in out_path.read_text(encoding="utf-8").splitlines()
        ]
        assert [r["domain"] for r in rows] == ["done.com", "newtool.ai"]
        assert rows[1]["slug"] == "newtool"


class TestLocalEnrichment:
    def test_enrich_locally_maps_category_tags_and_pricing(self):
        valid_cats = {"ai", "developer-tools", "analytics", "marketing"}
        valid_tags = {"ai", "code-assistant", "analytics", "api", "automation"}

        seed = {
            "name": "CodePulse",
            "website_url": "https://codepulse.dev",
            "domain": "codepulse.dev",
            "source": "github",
            "hint": "AI code assistant and developer CLI for faster pull requests.",
        }
        page_text = (
            "Title: CodePulse - AI Developer Tool\n"
            "Meta: CodePulse helps developers review PRs with an API and CLI. Free plan and Pro $20/mo."
        )
        res = enrich_tools.enrich_locally(seed, page_text, valid_cats, valid_tags)
        assert res["primary_category_slug"] == "developer-tools"
        assert "ai" in res["tag_slugs"]
        assert res["pricing_model"] == "freemium"
        assert "CodePulse" in res["description"]

    def test_run_enrichment_no_llm_processes_concurrently(self, tmp_path: Path):
        seeds_path = tmp_path / "seeds.jsonl"
        out_path = tmp_path / "enriched.jsonl"
        seeds_path.write_text(
            json.dumps(
                {
                    "name": "FastMetric",
                    "website_url": "https://fastmetric.io",
                    "domain": "fastmetric.io",
                    "source": "yc",
                    "hint": "Product analytics and cohort metrics.",
                }
            )
            + "\n",
            encoding="utf-8",
        )
        with patch.object(
            enrich_tools,
            "fetch_page_text",
            return_value="Title: FastMetric\nMeta: Real-time product analytics dashboard. Start free trial.",
        ):
            processed, skipped = enrich_tools.run_enrichment(
                seeds_path=seeds_path,
                out_path=out_path,
                limit=5,
                api_key="",
                model="",
                use_llm=False,
                workers=4,
            )
        assert processed == 1
        assert skipped == 0
        row = json.loads(out_path.read_text(encoding="utf-8").splitlines()[0])
        assert row["slug"] == "fastmetric"
        assert row["primary_category_slug"] in {"analytics", "ai"}
