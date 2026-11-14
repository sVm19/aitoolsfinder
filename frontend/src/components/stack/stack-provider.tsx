"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { ToolCardData } from "@/components/tool/tool-card";

interface StackContextValue {
  savedTools: ToolCardData[];
  saveCount: number;
  isSaved: (slug: string) => boolean;
  toggleSave: (tool: ToolCardData) => void;
  removeSave: (slug: string) => void;
  clearStack: () => void;
  isDrawerOpen: boolean;
  setIsDrawerOpen: (open: boolean) => void;
  openDrawer: () => void;
  closeDrawer: () => void;

  // Upvote management
  isUpvoted: (slug: string) => boolean;
  toggleUpvote: (slug: string, toolName?: string) => void;
  getUpvoteCount: (slug: string, defaultVotes?: number) => number;

  // Auth modal management
  isAuthModalOpen: boolean;
  authReason: string;
  openAuthModal: (reason?: string) => void;
  closeAuthModal: () => void;
}

const StackContext = createContext<StackContextValue | null>(null);

const STORAGE_KEY_STACK = "aitoolsfinder_my_stack";
const STORAGE_KEY_UPVOTES = "aitoolsfinder_upvotes";
const STORAGE_KEY_VOTE_COUNTS = "aitoolsfinder_vote_counts";

export function useStack(): StackContextValue {
  const context = useContext(StackContext);
  if (!context) {
    throw new Error("useStack must be used inside StackProvider");
  }
  return context;
}

export function StackProvider({ children }: { children: ReactNode }) {
  const [savedTools, setSavedTools] = useState<ToolCardData[]>([]);
  const [upvotedSlugs, setUpvotedSlugs] = useState<string[]>([]);
  const [voteCountOffsets, setVoteCountOffsets] = useState<Record<string, number>>({});
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authReason, setAuthReason] = useState<string>("");
  const [isHydrated, setIsHydrated] = useState(false);

  // Initialize from localStorage after client hydration
  useEffect(() => {
    try {
      const storedStack = localStorage.getItem(STORAGE_KEY_STACK);
      if (storedStack) {
        setSavedTools(JSON.parse(storedStack));
      }

      const storedUpvotes = localStorage.getItem(STORAGE_KEY_UPVOTES);
      if (storedUpvotes) {
        setUpvotedSlugs(JSON.parse(storedUpvotes));
      }

      const storedOffsets = localStorage.getItem(STORAGE_KEY_VOTE_COUNTS);
      if (storedOffsets) {
        setVoteCountOffsets(JSON.parse(storedOffsets));
      }
    } catch {
      // Ignore localStorage parse errors
    }
    setIsHydrated(true);
  }, []);

  // Sync saved tools to localStorage
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY_STACK, JSON.stringify(savedTools));
    } catch {
      // Ignore storage quota errors
    }
  }, [savedTools, isHydrated]);

  // Sync upvotes to localStorage
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY_UPVOTES, JSON.stringify(upvotedSlugs));
      localStorage.setItem(STORAGE_KEY_VOTE_COUNTS, JSON.stringify(voteCountOffsets));
    } catch {
      // Ignore storage quota errors
    }
  }, [upvotedSlugs, voteCountOffsets, isHydrated]);

  const isSaved = useCallback(
    (slug: string) => savedTools.some((t) => t.slug === slug),
    [savedTools]
  );

  const toggleSave = useCallback((tool: ToolCardData) => {
    setSavedTools((current) => {
      const exists = current.some((t) => t.slug === tool.slug);
      if (exists) {
        return current.filter((t) => t.slug !== tool.slug);
      }
      return [...current, tool];
    });
  }, []);

  const removeSave = useCallback((slug: string) => {
    setSavedTools((current) => current.filter((t) => t.slug !== slug));
  }, []);

  const clearStack = useCallback(() => {
    setSavedTools([]);
  }, []);

  const openDrawer = useCallback(() => setIsDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);

  const openAuthModal = useCallback((reason?: string) => {
    setAuthReason(reason || "Join 12,000+ builders tracking and evaluating verified AI tools.");
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
  }, []);

  const isUpvoted = useCallback(
    (slug: string) => upvotedSlugs.includes(slug),
    [upvotedSlugs]
  );

  const toggleUpvote = useCallback(
    (slug: string, toolName?: string) => {
      setUpvotedSlugs((current) => {
        const alreadyUpvoted = current.includes(slug);
        if (alreadyUpvoted) {
          // Remove upvote
          setVoteCountOffsets((offsets) => ({
            ...offsets,
            [slug]: (offsets[slug] || 0) - 1,
          }));
          return current.filter((s) => s !== slug);
        } else {
          // Add upvote
          setVoteCountOffsets((offsets) => ({
            ...offsets,
            [slug]: (offsets[slug] || 0) + 1,
          }));

          // Non-blocking prompt to verify vote
          const promptSeen = sessionStorage.getItem(`vote_prompt_${slug}`);
          if (!promptSeen) {
            sessionStorage.setItem(`vote_prompt_${slug}`, "1");
            openAuthModal(
              toolName
                ? `Sign in to verify your vote for ${toolName} and support indie AI builders.`
                : "Sign in to verify your vote and support indie AI builders."
            );
          }

          return [...current, slug];
        }
      });
    },
    [openAuthModal]
  );

  // Seed baseline vote count dynamically with persistent offset
  const getUpvoteCount = useCallback(
    (slug: string, defaultVotes?: number) => {
      // Deterministic pseudo-base count based on slug length / score if default not supplied
      let base = defaultVotes;
      if (typeof base !== "number") {
        let hash = 0;
        for (let i = 0; i < slug.length; i++) {
          hash = (hash << 5) - hash + slug.charCodeAt(i);
          hash |= 0;
        }
        base = Math.abs(hash % 90) + 45;
      }
      return base + (voteCountOffsets[slug] || 0);
    },
    [voteCountOffsets]
  );

  const value = useMemo(
    () => ({
      savedTools,
      saveCount: savedTools.length,
      isSaved,
      toggleSave,
      removeSave,
      clearStack,
      isDrawerOpen,
      setIsDrawerOpen,
      openDrawer,
      closeDrawer,
      isUpvoted,
      toggleUpvote,
      getUpvoteCount,
      isAuthModalOpen,
      authReason,
      openAuthModal,
      closeAuthModal,
    }),
    [
      savedTools,
      isSaved,
      toggleSave,
      removeSave,
      clearStack,
      isDrawerOpen,
      openDrawer,
      closeDrawer,
      isUpvoted,
      toggleUpvote,
      getUpvoteCount,
      isAuthModalOpen,
      authReason,
      openAuthModal,
      closeAuthModal,
    ]
  );

  return <StackContext.Provider value={value}>{children}</StackContext.Provider>;
}
