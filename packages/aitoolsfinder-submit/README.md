# aitoolsfinder-submit

> 1-Line Zero-Install CLI to inspect your project and submit it to [AIToolsFinder.cloud](https://aitoolsfinder.cloud) for a guaranteed permanent free dofollow backlink & 50,000+ SaaS buyers.

Designed specifically for **vibe coders, founders, and AI coding agents** (Cursor, Claude Code, Windsurf, Antigravity).

---

## ⚡ Quick Start

Run this directly inside any project or git repository:

```bash
npx aitoolsfinder-submit
```

### For AI Coding Agents (Headless / Non-Interactive):
```bash
npx aitoolsfinder-submit -y --email=founder@yourdomain.com
```

### Dry-Run Preview (Test without sending):
```bash
npx aitoolsfinder-submit --dry-run
```

---

## 🛠️ What It Does

1. **Auto-Inspects Your Codebase:**
   - Reads `package.json` for tool name, description, homepage, author email, and repository.
   - Reads `README.md` to extract clean positioning taglines and descriptions.
   - Inspects git remotes (`git config remote.origin.url`) to determine the canonical project URL.
   - Automatically infers the correct software taxonomy category (e.g. *Developer Tools*, *Writing & SEO*, *AI & Models*, etc.).
2. **Interactive Confirmation:**
   - Previews the exact details before submitting.
   - Allows quick 1-key overrides.
3. **Instant API Submission:**
   - Dispatches payload to the live AIToolsFinder catalog API (`/api/v1/submissions`).
4. **Auto-Injects Backlink Trust Badge:**
   - Prompts to automatically inject the AIToolsFinder Verified Trust Badge into your `README.md`:
     ```markdown
     [![Verified on AIToolsFinder](https://aitoolsfinder.cloud/badges/verified-dark.svg)](https://aitoolsfinder.cloud/tools/your-slug)
     ```

---

## 📦 Publishing to npm

To make `npx aitoolsfinder-submit` available globally to all developers:

```bash
cd packages/aitoolsfinder-submit
npm publish --access public
```

---

## 📄 License
MIT © [AIToolsFinder.cloud](https://aitoolsfinder.cloud)
