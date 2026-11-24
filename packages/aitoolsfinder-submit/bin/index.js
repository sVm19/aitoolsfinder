#!/usr/bin/env node

/**
 * AIToolsFinder.cloud — 1-Line Zero-Install Project Submission CLI
 * Inspects the current git / software project and submits it for a free listing and permanent dofollow backlink.
 */

const fs = require("fs");
const path = require("path");
const readline = require("readline");
const { execSync } = require("child_process");

const DEFAULT_API_URL = process.env.AITOOLSFINDER_API_URL || "https://aitoolsfinder.cloud/api/v1";
const SITE_URL = "https://aitoolsfinder.cloud";

// ANSI Terminal Colors
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
  if (lower.includes("code") || lower.includes("dev") || lower.includes("terminal") || lower.includes("compiler") || lower.includes("ide")) {
    return "Developer Tools";
  }
  if (lower.includes("write") || lower.includes("seo") || lower.includes("blog") || lower.includes("copy")) {
    return "Writing & SEO";
  }
  if (lower.includes("market") || lower.includes("ad") || lower.includes("social") || lower.includes("lead")) {
    return "Marketing";
  }
  if (lower.includes("model") || lower.includes("llm") || lower.includes("api") || lower.includes("rag")) {
    return "AI & Models";
  }
  if (lower.includes("design") || lower.includes("ui") || lower.includes("figma") || lower.includes("canvas")) {
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
    log(`${MAGENTA}${BOLD}AIToolsFinder Project Submission CLI${RESET}`);
    log(`${DIM}Inspects local repository and submits to AIToolsFinder.cloud for a free dofollow backlink.${RESET}`);
    log("");
    log(`${BOLD}Usage:${RESET}`);
    log(`  npx aitoolsfinder-submit              # Interactive inspection & submission`);
    log(`  npx aitoolsfinder-submit -y           # Non-interactive / Agent mode (accept defaults)`);
    log(`  npx aitoolsfinder-submit --email=...  # Specify contact email`);
    log(`  npx aitoolsfinder-submit --dry-run    # Inspect & preview payload without sending`);
    log("");
    process.exit(0);
  }

  const autoYes = args.includes("-y") || args.includes("--yes");
  const dryRun = args.includes("--dry-run");
  const emailArg = args.find((a) => a.startsWith("--email="))?.split("=")[1];

  log("");
  log(`${MAGENTA}${BOLD}=================================================================${RESET}`);
  log(`${MAGENTA}${BOLD}   🚀 AIToolsFinder.cloud — Zero-Install Project Submission CLI   ${RESET}`);
  log(`${DIM}   Submit your SaaS in 1-click & get a permanent free dofollow backlink${RESET}`);
  log(`${MAGENTA}${BOLD}=================================================================${RESET}`);
  log("");

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
        // Strip scope if present: @org/app -> app
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
      // Ignore parse failure
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
            let clean = urlMatch[0].replace(/[\)\]\>]+$/, "");
            if (clean.includes("github.com") && gitOrigin) {
              // keep as repo url
            } else if (!clean.includes("github.com")) {
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
      // Ignore parse error
    }
  }

  // Fallbacks
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
    log(`${CYAN}🔍 Inspecting local project details...${RESET}`);
    log("");

    let toolName = detectedName;
    let tagline = detectedTagline;
    let websiteUrl = detectedUrl;
    let submitterEmail = detectedEmail;

    if (!autoYes) {
      toolName = await prompt(rl, `${BOLD}1. Product / Tool Name${RESET}`, detectedName);
      tagline = await prompt(rl, `${BOLD}2. One-line Tagline${RESET}`, detectedTagline);
      websiteUrl = await prompt(rl, `${BOLD}3. Website or GitHub URL (where backlink will point)${RESET}`, detectedUrl);
      submitterEmail = await prompt(rl, `${BOLD}4. Submitter Email (for submission receipt)${RESET}`, detectedEmail);
    }

    if (!websiteUrl) {
      log(`${RED}Error: A website URL or GitHub repository URL is required for the backlink.${RESET}`);
      rl.close();
      process.exit(1);
    }
    if (!submitterEmail || !submitterEmail.includes("@")) {
      log(`${RED}Error: A valid email address is required to receive your verified listing receipt.${RESET}`);
      rl.close();
      process.exit(1);
    }

    log("");
    log(`${GREEN}${BOLD}📋 Submission Preview:${RESET}`);
    log(`  ${BOLD}Tool Name:${RESET}  ${toolName}`);
    log(`  ${BOLD}Tagline:${RESET}    ${tagline}`);
    log(`  ${BOLD}URL:${RESET}        ${websiteUrl}`);
    log(`  ${BOLD}Category:${RESET}   ${category}`);
    log(`  ${BOLD}Pricing:${RESET}    freemium`);
    log(`  ${BOLD}Email:${RESET}      ${submitterEmail}`);
    log("");

    if (!autoYes) {
      const confirm = await prompt(rl, `${YELLOW}${BOLD}Submit to AIToolsFinder.cloud for free listing & backlink? [Y/n]${RESET}`, "y");
      if (confirm.toLowerCase() !== "y" && confirm.toLowerCase() !== "yes") {
        log(`${YELLOW}Submission cancelled.${RESET}`);
        rl.close();
        process.exit(0);
      }
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
      log(`${YELLOW}${BOLD}🔍 Dry-run mode enabled. Payload validated without sending:${RESET}`);
      log(JSON.stringify(payload, null, 2));
      log("");
      rl.close();
      process.exit(0);
    }

    log("");
    log(`${CYAN}📡 Submitting to AIToolsFinder catalog API...${RESET}`);

    let receipt;
    try {
      const res = await fetch(`${DEFAULT_API_URL}/submissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || `API returned HTTP ${res.status}`);
      }

      receipt = await res.json();
    } catch (err) {
      log(`${RED}Submission failed: ${err.message}${RESET}`);
      log(`${DIM}Tip: You can also submit directly on web at ${SITE_URL}/submit${RESET}`);
      rl.close();
      process.exit(1);
    }

    const toolSlug = receipt.tool_slug || toolName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const listingUrl = `${SITE_URL}/tools/${toolSlug}`;
    const badgeMarkdown = `[![Verified on AIToolsFinder](${SITE_URL}/badges/verified-dark.svg)](${listingUrl})`;

    log("");
    log(`${GREEN}${BOLD}🎉 SUCCESS! Your tool has been submitted to AIToolsFinder.cloud!${RESET}`);
    log(`  ${BOLD}Receipt ID:${RESET}   ${receipt.id || "sub_queued"}`);
    log(`  ${BOLD}Listing URL:${RESET}  ${CYAN}${listingUrl}${RESET}`);
    log(`  ${BOLD}Status:${RESET}       Pending verification (Fast 24h editorial review)`);
    log("");
    log(`${BOLD}Here is your Verified Trust Badge for your README / Website:${RESET}`);
    log(`${CYAN}${badgeMarkdown}${RESET}`);
    log("");

    if (readmePath) {
      let addBadge = autoYes;
      if (!autoYes) {
        const askBadge = await prompt(rl, `${YELLOW}${BOLD}Would you like me to automatically add this badge to your ${path.basename(readmePath)}? [Y/n]${RESET}`, "y");
        addBadge = askBadge.toLowerCase() === "y" || askBadge.toLowerCase() === "yes";
      }

      if (addBadge) {
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
            log(`${GREEN}✓ Added verified backlink badge to ${path.basename(readmePath)}!${RESET}`);
          } else {
            log(`${DIM}Badge already present in ${path.basename(readmePath)}.${RESET}`);
          }
        } catch (e) {
          log(`${YELLOW}Notice: Could not modify ${path.basename(readmePath)} automatically (${e.message}). You can add it manually.${RESET}`);
        }
      }
    }

    log("");
    log(`${GREEN}${BOLD}All done! Check your inbox (${submitterEmail}) for status updates.${RESET}`);
    log("");
  } finally {
    rl.close();
  }
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
