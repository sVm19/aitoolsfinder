"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { BrandLogo } from "@/components/common/brand-logo";
import {
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ExternalLink,
  BookOpen,
  Github,
  Linkedin,
  Twitter,
  Instagram,
  User,
  Check,
  AlertCircle,
} from "lucide-react";

// Platform Regex Validators
const VALIDATORS = {
  substack: /^https?:\/\/([A-Za-z0-9_-]+\.)?substack\.com(\/.*)?$/,
  x: /^https?:\/\/(www\.)?(twitter|x)\.com\/[A-Za-z0-9_]{1,15}\/?$/,
  linkedin: /^https?:\/\/(www\.)?linkedin\.com\/in\/[A-Za-z0-9_-]+\/?$/,
  github: /^https?:\/\/(www\.)?github\.com\/[A-Za-z0-9_-]+\/?$/,
  reddit: /^https?:\/\/(www\.)?reddit\.com\/user\/[A-Za-z0-9_-]+\/?$/,
  instagram: /^https?:\/\/(www\.)?instagram\.com\/[A-Za-z0-9_.-]+\/?$/,
};

export function FounderOnboarding() {
  const router = useRouter();
  const { user, token } = useAuth();

  const [founderName, setFounderName] = useState(user?.name || "");
  const [handle, setHandle] = useState(
    user?.name ? user.name.toLowerCase().replace(/[^a-z0-9_]/g, "") : ""
  );
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");

  // Links
  const [substackUrl, setSubstackUrl] = useState("");
  const [xUrl, setXUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [redditUrl, setRedditUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // Link Validity Checks
  const linkValidations = useMemo(() => {
    return {
      substack: substackUrl ? VALIDATORS.substack.test(substackUrl.trim()) : null,
      x: xUrl ? VALIDATORS.x.test(xUrl.trim()) : null,
      linkedin: linkedinUrl ? VALIDATORS.linkedin.test(linkedinUrl.trim()) : null,
      github: githubUrl ? VALIDATORS.github.test(githubUrl.trim()) : null,
      reddit: redditUrl ? VALIDATORS.reddit.test(redditUrl.trim()) : null,
      instagram: instagramUrl ? VALIDATORS.instagram.test(instagramUrl.trim()) : null,
    };
  }, [substackUrl, xUrl, linkedinUrl, githubUrl, redditUrl, instagramUrl]);

  // Count valid links
  const validLinkCount = useMemo(() => {
    return Object.values(linkValidations).filter((v) => v === true).length;
  }, [linkValidations]);

  // Overall Verification Readiness
  const isEligibleForVerification = useMemo(() => {
    const hasBasics =
      founderName.trim().length >= 2 &&
      handle.trim().length >= 3 &&
      headline.trim().length >= 3 &&
      bio.trim().length >= 10;
    return hasBasics && validLinkCount >= 1;
  }, [founderName, handle, headline, bio, validLinkCount]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFounderName(val);
    if (!handle || handle === founderName.toLowerCase().replace(/[^a-z0-9_]/g, "")) {
      setHandle(val.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 24));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const profileData = {
        founder_name: founderName.trim(),
        handle: handle.trim(),
        headline: headline.trim(),
        bio: bio.trim(),
        substack_url: substackUrl.trim() || null,
        x_url: xUrl.trim() || null,
        linkedin_url: linkedinUrl.trim() || null,
        github_url: githubUrl.trim() || null,
        reddit_url: redditUrl.trim() || null,
        instagram_url: instagramUrl.trim() || null,
        is_verified: isEligibleForVerification,
        verified_at: isEligibleForVerification ? new Date().toISOString() : null,
      };

      // Store in localStorage for instant local session persistence
      localStorage.setItem("aitoolsfinder_founder_profile", JSON.stringify(profileData));

      // Simulate network save
      await new Promise((r) => setTimeout(r, 600));
      setIsCompleted(true);
    } catch {
      // ignore
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCompleted) {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 mb-6 border border-emerald-500/30 shadow-[0_0_24px_rgba(16,185,129,0.3)]">
          <ShieldCheck className="h-8 w-8" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">
          Founder Profile Published!
        </h1>
        <p className="text-base text-neutral-400 max-w-md mx-auto mb-6">
          Your profile is live. Your products will now display the official{" "}
          <span className="text-[#10B981] font-semibold">Verified Founder</span> badge.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#E8FF54] text-neutral-950 font-bold text-sm hover:bg-[#d8ef45] transition-colors"
          >
            Go to Founder Dashboard
          </Link>
          <Link
            href="/"
            className="w-full sm:w-auto px-6 py-3 rounded-full border border-neutral-700 bg-neutral-900 text-white font-medium text-sm hover:bg-neutral-800 transition-colors"
          >
            Explore Directory
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-10 font-sans">
      {/* Top Breadcrumb & Brand */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-neutral-800">
        <BrandLogo size="md" />
        <Link
          href="/"
          className="text-xs text-neutral-400 hover:text-white transition-colors"
        >
          Exit to Home
        </Link>
      </div>

      {/* Progress Flow Banner */}
      <div className="mb-8 rounded-2xl border border-neutral-800 bg-[#0F0F12] p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 font-bold">
              <Check className="h-3.5 w-3.5 stroke-[3]" />
            </span>
            <span className="text-white font-medium">1. Product Submitted</span>
          </div>
          <div className="hidden sm:block text-neutral-600">→</div>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 font-bold">
              <Check className="h-3.5 w-3.5 stroke-[3]" />
            </span>
            <span className="text-white font-medium">2. Email Verified</span>
          </div>
          <div className="hidden sm:block text-neutral-600">→</div>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#E8FF54] text-neutral-950 font-bold">
              3
            </span>
            <span className="text-[#E8FF54] font-semibold">
              3. Complete Founder Profile
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Form, Right Live Preview Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Input Form (7 cols) */}
        <div className="lg:col-span-7 bg-[#0F0F12] border border-neutral-800/80 rounded-2xl p-6 sm:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Create Your Founder Profile
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-neutral-400">
              Provide your details and verified links to claim the official Founder Badge.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Founder Full Name */}
            <div>
              <label
                htmlFor="founder-name"
                className="block text-sm font-medium text-white mb-1.5"
              >
                Founder Name <span className="text-rose-400">*</span>
              </label>
              <input
                id="founder-name"
                type="text"
                required
                value={founderName}
                onChange={handleNameChange}
                placeholder="e.g. Alex Rivera"
                className="h-11 w-full rounded-lg border border-neutral-800 bg-[#16161A] px-3.5 text-sm text-white placeholder:text-neutral-600 focus:border-neutral-500 focus:outline-none"
              />
            </div>

            {/* Handle / Username */}
            <div>
              <label
                htmlFor="founder-handle"
                className="block text-sm font-medium text-white mb-1.5"
              >
                Founder Handle <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-neutral-500 text-sm">
                  @
                </span>
                <input
                  id="founder-handle"
                  type="text"
                  required
                  value={handle}
                  onChange={(e) =>
                    setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))
                  }
                  placeholder="alexrivera"
                  className="h-11 w-full rounded-lg border border-neutral-800 bg-[#16161A] pl-8 pr-3.5 text-sm text-white placeholder:text-neutral-600 focus:border-neutral-500 focus:outline-none"
                />
              </div>
              <p className="mt-1 text-[11px] text-neutral-500">
                Your public URL: aitoolsfinder.cloud/founder/@{handle || "username"}
              </p>
            </div>

            {/* Qualification / Headline */}
            <div>
              <label
                htmlFor="founder-headline"
                className="block text-sm font-medium text-white mb-1.5"
              >
                Qualification / Role <span className="text-rose-400">*</span>
              </label>
              <input
                id="founder-headline"
                type="text"
                required
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="e.g. AI Engineer & Founder @ ToolAI | Ex-Google"
                className="h-11 w-full rounded-lg border border-neutral-800 bg-[#16161A] px-3.5 text-sm text-white placeholder:text-neutral-600 focus:border-neutral-500 focus:outline-none"
              />
            </div>

            {/* Bio */}
            <div>
              <label
                htmlFor="founder-bio"
                className="block text-sm font-medium text-white mb-1.5"
              >
                Founder Bio <span className="text-rose-400">*</span>
              </label>
              <textarea
                id="founder-bio"
                rows={3}
                required
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell builders what you are working on, your technical background, or your mission..."
                className="w-full rounded-lg border border-neutral-800 bg-[#16161A] p-3 text-sm text-white placeholder:text-neutral-600 focus:border-neutral-500 focus:outline-none resize-none"
              />
            </div>

            {/* Verified Links Section */}
            <div className="pt-2">
              <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-1">
                Verified Social & Publication Links
              </h2>
              <p className="text-xs text-neutral-400 mb-4">
                Add your links. Each link is verified for proper domain format.
              </p>

              <div className="space-y-3">
                {/* Substack URL */}
                <div>
                  <div className="flex items-center justify-between text-xs text-neutral-300 mb-1">
                    <span className="flex items-center gap-1.5 font-medium">
                      <BookOpen className="h-3.5 w-3.5 text-[#FF6719]" />
                      Substack Newsletter
                    </span>
                    {linkValidations.substack === true && (
                      <span className="text-[#10B981] flex items-center gap-1">
                        <Check className="h-3 w-3" /> Valid
                      </span>
                    )}
                    {linkValidations.substack === false && (
                      <span className="text-rose-400 flex items-center gap-1">
                        Invalid (use https://name.substack.com)
                      </span>
                    )}
                  </div>
                  <input
                    type="url"
                    value={substackUrl}
                    onChange={(e) => setSubstackUrl(e.target.value)}
                    placeholder="https://yourname.substack.com"
                    className="h-10 w-full rounded-lg border border-neutral-800 bg-[#16161A] px-3.5 text-xs text-white placeholder:text-neutral-600 focus:border-neutral-500 focus:outline-none"
                  />
                </div>

                {/* X / Twitter URL */}
                <div>
                  <div className="flex items-center justify-between text-xs text-neutral-300 mb-1">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Twitter className="h-3.5 w-3.5 text-sky-400" />
                      X (Twitter) Profile
                    </span>
                    {linkValidations.x === true && (
                      <span className="text-[#10B981] flex items-center gap-1">
                        <Check className="h-3 w-3" /> Valid
                      </span>
                    )}
                    {linkValidations.x === false && (
                      <span className="text-rose-400 flex items-center gap-1">
                        Invalid (use https://x.com/username)
                      </span>
                    )}
                  </div>
                  <input
                    type="url"
                    value={xUrl}
                    onChange={(e) => setXUrl(e.target.value)}
                    placeholder="https://x.com/username"
                    className="h-10 w-full rounded-lg border border-neutral-800 bg-[#16161A] px-3.5 text-xs text-white placeholder:text-neutral-600 focus:border-neutral-500 focus:outline-none"
                  />
                </div>

                {/* LinkedIn URL */}
                <div>
                  <div className="flex items-center justify-between text-xs text-neutral-300 mb-1">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Linkedin className="h-3.5 w-3.5 text-blue-400" />
                      LinkedIn Profile
                    </span>
                    {linkValidations.linkedin === true && (
                      <span className="text-[#10B981] flex items-center gap-1">
                        <Check className="h-3 w-3" /> Valid
                      </span>
                    )}
                    {linkValidations.linkedin === false && (
                      <span className="text-rose-400 flex items-center gap-1">
                        Invalid (use https://linkedin.com/in/username)
                      </span>
                    )}
                  </div>
                  <input
                    type="url"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    placeholder="https://linkedin.com/in/username"
                    className="h-10 w-full rounded-lg border border-neutral-800 bg-[#16161A] px-3.5 text-xs text-white placeholder:text-neutral-600 focus:border-neutral-500 focus:outline-none"
                  />
                </div>

                {/* GitHub URL */}
                <div>
                  <div className="flex items-center justify-between text-xs text-neutral-300 mb-1">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Github className="h-3.5 w-3.5 text-neutral-300" />
                      GitHub Profile
                    </span>
                    {linkValidations.github === true && (
                      <span className="text-[#10B981] flex items-center gap-1">
                        <Check className="h-3 w-3" /> Valid
                      </span>
                    )}
                    {linkValidations.github === false && (
                      <span className="text-rose-400 flex items-center gap-1">
                        Invalid (use https://github.com/username)
                      </span>
                    )}
                  </div>
                  <input
                    type="url"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/username"
                    className="h-10 w-full rounded-lg border border-neutral-800 bg-[#16161A] px-3.5 text-xs text-white placeholder:text-neutral-600 focus:border-neutral-500 focus:outline-none"
                  />
                </div>

                {/* Reddit URL */}
                <div>
                  <div className="flex items-center justify-between text-xs text-neutral-300 mb-1">
                    <span className="flex items-center gap-1.5 font-medium">
                      <ExternalLink className="h-3.5 w-3.5 text-orange-500" />
                      Reddit Profile
                    </span>
                    {linkValidations.reddit === true && (
                      <span className="text-[#10B981] flex items-center gap-1">
                        <Check className="h-3 w-3" /> Valid
                      </span>
                    )}
                    {linkValidations.reddit === false && (
                      <span className="text-rose-400 flex items-center gap-1">
                        Invalid (use https://reddit.com/user/username)
                      </span>
                    )}
                  </div>
                  <input
                    type="url"
                    value={redditUrl}
                    onChange={(e) => setRedditUrl(e.target.value)}
                    placeholder="https://reddit.com/user/username"
                    className="h-10 w-full rounded-lg border border-neutral-800 bg-[#16161A] px-3.5 text-xs text-white placeholder:text-neutral-600 focus:border-neutral-500 focus:outline-none"
                  />
                </div>

                {/* Instagram URL */}
                <div>
                  <div className="flex items-center justify-between text-xs text-neutral-300 mb-1">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Instagram className="h-3.5 w-3.5 text-pink-400" />
                      Instagram Profile
                    </span>
                    {linkValidations.instagram === true && (
                      <span className="text-[#10B981] flex items-center gap-1">
                        <Check className="h-3 w-3" /> Valid
                      </span>
                    )}
                    {linkValidations.instagram === false && (
                      <span className="text-rose-400 flex items-center gap-1">
                        Invalid (use https://instagram.com/username)
                      </span>
                    )}
                  </div>
                  <input
                    type="url"
                    value={instagramUrl}
                    onChange={(e) => setInstagramUrl(e.target.value)}
                    placeholder="https://instagram.com/username"
                    className="h-10 w-full rounded-lg border border-neutral-800 bg-[#16161A] px-3.5 text-xs text-white placeholder:text-neutral-600 focus:border-neutral-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex h-12 w-full items-center justify-center rounded-full bg-[#E8FF54] text-neutral-950 font-bold text-sm tracking-wide hover:bg-[#d8ef45] active:scale-[0.99] transition-all disabled:opacity-60 cursor-pointer shadow-md"
              >
                <span>
                  {isSubmitting
                    ? "Publishing Profile..."
                    : isEligibleForVerification
                    ? "Publish & Claim Verified Founder Badge"
                    : "Save Founder Profile"}
                </span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Live Interactive Card Preview (5 cols) */}
        <div className="lg:col-span-5 sticky top-8">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Live Founder Card Preview
            </span>
            {isEligibleForVerification ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <Check className="h-3 w-3" /> Verified Badge Ready
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-500/15 text-amber-400 border border-amber-500/30">
                <AlertCircle className="h-3 w-3" /> Incomplete
              </span>
            )}
          </div>

          {/* Live Card */}
          <div className="rounded-2xl border border-neutral-800 bg-[#121215] p-6 shadow-xl relative overflow-hidden">
            {/* Top Accent Line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-[#E8FF54] to-emerald-400" />

            {/* Founder Avatar & Name Header */}
            <div className="flex items-start gap-3.5 mb-4">
              <div className="h-14 w-14 rounded-full bg-gradient-to-tr from-neutral-800 to-neutral-700 border border-white/10 flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-inner">
                {founderName ? founderName.charAt(0).toUpperCase() : "F"}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h3 className="text-base font-bold text-white truncate">
                    {founderName || "Your Full Name"}
                  </h3>
                  {isEligibleForVerification && (
                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40 shadow-[0_0_12px_rgba(16,185,129,0.25)]">
                      <ShieldCheck className="h-3 w-3" /> Verified Founder
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-400 font-mono">
                  @{handle || "handle"}
                </p>
                <p className="text-xs font-medium text-neutral-300 mt-1 line-clamp-1">
                  {headline || "Your Qualification / Role"}
                </p>
              </div>
            </div>

            {/* Bio */}
            <p className="text-xs text-neutral-400 leading-relaxed mb-5 line-clamp-3">
              {bio ||
                "Your founder bio will render here. Tell users about your engineering background, products, and vision."}
            </p>

            {/* Verified Links Chips */}
            <div className="flex items-center gap-2 flex-wrap mb-5 pt-3 border-t border-neutral-800/80">
              {linkValidations.substack && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-[#FF6719]/10 text-[#FF6719] border border-[#FF6719]/30">
                  <BookOpen className="h-3 w-3" /> Substack
                </span>
              )}
              {linkValidations.x && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-sky-500/10 text-sky-400 border border-sky-500/30">
                  <Twitter className="h-3 w-3" /> X
                </span>
              )}
              {linkValidations.linkedin && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/30">
                  <Linkedin className="h-3 w-3" /> LinkedIn
                </span>
              )}
              {linkValidations.github && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-neutral-700/40 text-neutral-300 border border-neutral-600/40">
                  <Github className="h-3 w-3" /> GitHub
                </span>
              )}
              {linkValidations.reddit && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-orange-500/10 text-orange-400 border border-orange-500/30">
                  Reddit
                </span>
              )}
              {linkValidations.instagram && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-pink-500/10 text-pink-400 border border-pink-500/30">
                  Instagram
                </span>
              )}
              {validLinkCount === 0 && (
                <span className="text-[11px] text-neutral-500 italic">
                  No verified links added yet
                </span>
              )}
            </div>

            {/* Footer Stats */}
            <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-2 border-t border-neutral-800/80">
              <span>🚀 1 Product Uploaded</span>
              <span>Member since Nov 2026</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
