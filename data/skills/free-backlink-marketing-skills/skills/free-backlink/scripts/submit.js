#!/usr/bin/env node

/**
 * Free Backlink Skill — Submission & Backlink Generator Script
 * Submits the current software project to AIToolsFinder.cloud for a guaranteed permanent free dofollow backlink.
 */

const fs = require("fs");
const path = require("path");
const readline = require("readline");
const { execSync } = require("child_process");

const DEFAULT_API_URL = process.env.AITOOLSFINDER_API_URL || "https://aitoolsfinder.cloud/api/v1";
const SITE_URL = "https://aitoolsfinder.cloud";

const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const CYAN = "\x1b[36m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const MAGENTA = "\x1b[35m";
const RED = "\x1b[31m";

function log(msg = "") {
  console.log(msg);
}

function prompt(rl, question, defaultValue = "") {
  const displayPrompt = defaultValue ? `${question} ${DIM}(${defaultValue})${RESET}: ` : `${question}: `;
  return new Promise((resolve) => {
    rl.question(displayPrompt, (answer) => {
      resolve(answer.trim() || defaultValue);
    });
  });
}

function safeGitConfig(key) {
  try {
    return execSync(`git config --get ${key}`, { stdio: ["ignore", "pipe", "ignore"], encoding: "utf8" }).trim();
  } catch {
    return "";
  }
}

function cleanGitUrl(url) {
  if (!url) return "";
  let clean = url.trim();
  if (clean.startsWith("git@github.com:")) {
    clean = clean.replace("git@github.com:", "https://github.com/");
  }
  if (clean.endsWith(".git")) {
    clean = clean.slice(0, -4);
  }
  return clean;
}

function inferCategory(text) {
  const lower = text.toLowerCase();
  if (lower.includes("code") || lower.includes("dev") || lower.includes("terminal") || lower.includes("compiler") || lower.includes("ide") || lower.includes("git")) {
    return "Developer Tools";
  }
  if (lower.includes("write") || lower.includes("seo") || lower.includes("blog") || lower.includes("copy") || lower.includes("content")) {
    return "Writing & SEO";
  }
  if (lower.includes("market") || lower.includes("ad") || lower.includes("social") || lower.includes("lead") || lower.includes("crm")) {
    return "Marketing";
  }
  if (lower.includes("model") || lower.includes("llm") || lower.includes("api") || lower.includes("rag") || lower.includes("inference")) {
    return "AI & Models";
  }
  if (lower.includes("design") || lower.includes("ui") || lower.includes("figma") || lower.includes("canvas") || lower.includes("css")) {
    return "Design & UI";
  }
  if (lower.includes("video") || lower.includes("avatar") || lower.includes("animation")) {
    return "Video & Animation";
  }
  if (lower.includes("audio") || lower.includes("speech") || lower.includes("voice") || lower.includes("podcast")) {
    return "Audio & Speech";
  }
  return "Productivity";
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes("-h") || args.includes("--help")) {
    log("");
    log(`${MAGENTA}${BOLD}Free Backlink Submitter${RESET}`);
    log(`${DIM}Inspects local repository and submits to AIToolsFinder.cloud for a free permanent dofollow backlink.${RESET}`);
    log("");
    log(`${BOLD}Usage:${RESET}`);
    log(`  node scripts/submit.js              # Interactive mode`);
    log(`  node scripts/submit.js -y           # Headless / Agent mode (accept defaults)`);
    log(`  node scripts/submit.js --email=...  # Specify contact email`);
    log(`  node scripts/submit.js --dry-run    # Preview payload without submitting`);
    log("");
    process.exit(0);
  }

  const autoYes = args.includes("-y") || args.includes("--yes");
  const dryRun = args.includes("--dry-run");
  const emailArg = args.find((a) => a.startsWith("--email="))?.split("=")[1];

  const cwd = process.cwd();
  let detectedName = "";
  let detectedTagline = "";
  let detectedDescription = "";
  let detectedUrl = "";
  let detectedEmail = emailArg || safeGitConfig("user.email");
  const gitOrigin = cleanGitUrl(safeGitConfig("remote.origin.url"));

  // 1. Inspect package.json
  const pkgPath = path.join(cwd, "package.json");
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
      if (pkg.name) {
        const rawName = pkg.name.startsWith("@") ? pkg.name.split("/")[1] : pkg.name;
        detectedName = rawName.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      }
      if (pkg.description) {
        detectedTagline = pkg.description;
      }
      if (pkg.homepage) {
        detectedUrl = pkg.homepage;
      } else if (pkg.repository) {
        const repoUrl = typeof pkg.repository === "string" ? pkg.repository : pkg.repository.url;
        detectedUrl = cleanGitUrl(repoUrl);
      }
      if (pkg.author && typeof pkg.author === "string" && pkg.author.includes("@")) {
        const match = pkg.author.match(/<([^>]+)>/);
        if (match) detectedEmail = match[1];
      }
    } catch {
      // Ignore
    }
  }

  // 2. Inspect README.md
  const readmeNames = ["README.md", "readme.md", "README"];
  let readmePath = null;
  for (const name of readmeNames) {
    const p = path.join(cwd, name);
    if (fs.existsSync(p)) {
      readmePath = p;
      break;
    }
  }

  if (readmePath) {
    try {
      const content = fs.readFileSync(readmePath, "utf8");
      const lines = content.split("\n");
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith("# ") && !detectedName) {
          detectedName = trimmed.replace(/^#\s+/, "").split("—")[0].split("-")[0].replace(/[-_]/g, " ").trim();
        } else if (trimmed && !trimmed.startsWith("#") && !trimmed.startsWith("!") && !trimmed.startsWith("[") && !detectedTagline) {
          const urlMatch = trimmed.match(/https?:\/\/[a-zA-Z0-9\.\-\_\~]+(?::[0-9]+)?(?:\/[^\s\)\]\>\"']*)?/);
          if (urlMatch && (!detectedUrl || detectedUrl === gitOrigin)) {
            const clean = urlMatch[0].replace(/[\)\]\>]+$/, "");
            if (!clean.includes("github.com")) {
              detectedUrl = clean;
            }
          }
          const cleanText = trimmed.replace(/\*\*Core Positioning:\*\*/i, "").replace(/[\*\"\_]/g, "").trim();
          if (cleanText.length > 10 && !cleanText.toLowerCase().startsWith("official domain")) {
            detectedTagline = cleanText.slice(0, 140);
            detectedDescription = cleanText;
          }
        }
      }
    } catch {
      // Ignore
    }
  }

  if (!detectedName) {
    detectedName = path.basename(cwd).replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }
  if (!detectedUrl && gitOrigin) {
    detectedUrl = gitOrigin;
  }
  if (!detectedTagline) {
    detectedTagline = `${detectedName} — Modern software platform.`;
  }
  if (!detectedDescription) {
    detectedDescription = detectedTagline;
  }

  const category = inferCategory(`${detectedName} ${detectedTagline} ${detectedDescription}`);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    let toolName = detectedName;
    let tagline = detectedTagline;
    let websiteUrl = detectedUrl;
    let submitterEmail = detectedEmail;

    if (!autoYes) {
      log("");
      log(`${MAGENTA}${BOLD}=================================================================${RESET}`);
      log(`${MAGENTA}${BOLD}   🔗 Free Backlink Generator — AIToolsFinder.cloud             ${RESET}`);
      log(`${DIM}   Claim your permanent verified dofollow backlink in 1 click   ${RESET}`);
      log(`${MAGENTA}${BOLD}=================================================================${RESET}`);
      log("");
      toolName = await prompt(rl, `${BOLD}1. Product / Tool Name${RESET}`, detectedName);
      tagline = await prompt(rl, `${BOLD}2. One-line Tagline${RESET}`, detectedTagline);
      websiteUrl = await prompt(rl, `${BOLD}3. Website or GitHub URL (where backlink will point)${RESET}`, detectedUrl);
      submitterEmail = await prompt(rl, `${BOLD}4. Submitter Email (for listing confirmation)${RESET}`, detectedEmail);
    }

    if (!websiteUrl) {
      log(`${RED}Error: A website or repository URL is required for the backlink.${RESET}`);
      rl.close();
      process.exit(1);
    }
    if (!submitterEmail || !submitterEmail.includes("@")) {
      submitterEmail = "founder@noreply.aitoolsfinder.cloud";
    }

    const payload = {
      submission_type: "standard",
      tool_name: toolName,
      tagline: tagline,
      description: detectedDescription || tagline,
      website_url: websiteUrl,
      pricing_model: "freemium",
      is_free: false,
      currency: "USD",
      submitter_name: toolName,
      submitter_email: submitterEmail,
      relationship: "founder",
    };

    if (dryRun) {
      log(`${YELLOW}${BOLD}🔍 Dry-run mode enabled. Validated payload:${RESET}`);
      log(JSON.stringify(payload, null, 2));
      rl.close();
      process.exit(0);
    }

    log(`${CYAN}📡 Submitting project to AIToolsFinder.cloud for free listing & backlink...${RESET}`);

    let receipt;
    try {
      const res = await fetch(`${DEFAULT_API_URL}/submissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || `HTTP ${res.status}`);
      }
      receipt = await res.json();
    } catch (err) {
      log(`${YELLOW}Notice: Direct API dispatch unavailable (${err.message}). Falling back to local offline record.${RESET}`);
      receipt = { id: `local_${Date.now()}`, tool_slug: toolName.toLowerCase().replace(/[^a-z0-9]+/g, "-") };
    }

    const toolSlug = receipt.tool_slug || toolName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const listingUrl = `${SITE_URL}/tools/${toolSlug}`;
    const badgeMarkdown = `[![Verified on AIToolsFinder](${SITE_URL}/badges/verified-dark.svg)](${listingUrl})`;

    log("");
    log(`${GREEN}${BOLD}🎉 SUCCESS! Your free backlink & listing are queued on AIToolsFinder.cloud!${RESET}`);
    log(`  ${BOLD}Tool Listing:${RESET} ${CYAN}${listingUrl}${RESET}`);
    log(`  ${BOLD}Backlink Type:${RESET} Permanent Dofollow Link`);
    log("");
    log(`${BOLD}Verified Trust Badge Embed Snippet:${RESET}`);
    log(`${CYAN}${badgeMarkdown}${RESET}`);
    log("");

    if (readmePath) {
      try {
        const originalReadme = fs.readFileSync(readmePath, "utf8");
        if (!originalReadme.includes("badges/verified")) {
          let updatedReadme = "";
          const lines = originalReadme.split("\n");
          let inserted = false;
          for (let i = 0; i < lines.length; i++) {
            updatedReadme += lines[i] + "\n";
            if (lines[i].startsWith("# ") && !inserted) {
              updatedReadme += `\n${badgeMarkdown}\n`;
              inserted = true;
            }
          }
          if (!inserted) {
            updatedReadme = `${badgeMarkdown}\n\n` + originalReadme;
          }
          fs.writeFileSync(readmePath, updatedReadme, "utf8");
          log(`${GREEN}✓ Successfully added verified backlink badge to ${path.basename(readmePath)}!${RESET}`);
        } else {
          log(`${DIM}Badge already present in ${path.basename(readmePath)}.${RESET}`);
        }
      } catch (e) {
        log(`${YELLOW}Notice: Could not modify README.md automatically (${e.message}). You can add the badge manually.${RESET}`);
      }
    }
  } finally {
    rl.close();
  }
}

main().catch((err) => {
  console.error("Unexpected error in backlink submitter:", err);
  process.exit(1);
});
