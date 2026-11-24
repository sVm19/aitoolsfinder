# Free Backlink Skill (`free-backlink-skill`)

> **The 1-Click SEO Engine & Free Backlink Generator for AI Coding Agents.**  
> Automatically audits and auto-fixes all technical SEO mistakes in your Next.js/React codebase, optimizes for AI search engines (AEO/GEO), and submits your project to [AIToolsFinder.cloud](https://aitoolsfinder.cloud) for a **guaranteed, permanent free dofollow backlink**.

Designed specifically for **vibe coders, SaaS founders, and AI agents** (Cursor, Claude Code, Windsurf, Codex, Antigravity).

---

## ⚡ Quick Install

Add this skill directly to your AI agent environment in 1 command:

```bash
npx skills add <your-github-username>/free-backlink-skill
```

---

## 🚀 How to Use It

Open **Cursor Composer**, **Claude Code**, or **Antigravity** in any project and simply prompt:

```text
"Audit and fix SEO for my project and get my free backlink"
```
*or*
```text
"Run free-backlink-skill"
```

The AI agent will take over, inspect your project, write the missing SEO code, submit your app for a free backlink, and embed your verified badge!

---

## 🛠️ What the Skill Auto-Fixes in Your Project

| Category | Vulnerability Detected | Automated Code Fix Applied |
| :--- | :--- | :--- |
| **Crawlability** | Missing or broken sitemap | Generates dynamic `app/sitemap.ts` (or `sitemap.xml`) indexing all public routes |
| **Indexing** | Missing or misconfigured `robots.txt` | Generates modern `app/robots.ts` protecting private APIs while whitelisting AI search crawlers (`GPTBot`, `PerplexityBot`, `ClaudeBot`) |
| **Social Graph** | Missing/broken OpenGraph & Twitter Cards | Injects dynamic `openGraph` tags and `twitter: { card: 'summary_large_image' }` into root layout |
| **Canonicals** | Missing `metadataBase` & canonical URLs | Adds `metadataBase` and `alternates: { canonical: '/' }` to prevent duplicate-content indexing |
| **Rich Snippets** | Missing Schema.org JSON-LD | Injects valid `SoftwareApplication` or `WebSite` JSON-LD schema for Google Rich Results |
| **AI Search (AEO)**| Invisible to LLM answer engines | Generates clean `public/llms.txt` so your app gets cited by ChatGPT Search, Perplexity, and Claude |
| **Backlink** | Need authority & domain rating boost | Submits to [AIToolsFinder.cloud](https://aitoolsfinder.cloud) for a permanent dofollow link + auto-injects verified badge |

---

## 🔗 The Backlink Exchange & Verified Badge

Once your project is audited and optimized, the skill submits your tool to **AIToolsFinder.cloud**'s catalog API and injects the official Verified Trust Badge into your `README.md`:

```markdown
[![Verified on AIToolsFinder](https://aitoolsfinder.cloud/badges/verified-dark.svg)](https://aitoolsfinder.cloud/tools/your-slug)
```

### Preview:
![Verified on AIToolsFinder](https://aitoolsfinder.cloud/badges/verified-dark.svg)

---

## 📂 Repository Structure

```text
free-backlink-skill/
├── SKILL.md                 # Master instructions executed by AI coding agents
├── README.md                # Open-source guide & documentation
├── package.json             # Package configuration & metadata
├── scripts/
│   └── submit.js            # Node submission script for AIToolsFinder API
└── references/
    ├── seo-checklist.md     # 5-Pillar technical SEO standard checklist
    └── schema-templates.md  # Production-ready Next.js & Schema.org code templates
```

---

## 🤝 Contributing

Pull requests are welcome! If you have additional framework templates (Astro, SvelteKit, Remix, Django) or SEO optimizations, feel free to open an issue or PR.

---

## 📄 License

MIT © [AIToolsFinder.cloud](https://aitoolsfinder.cloud)
