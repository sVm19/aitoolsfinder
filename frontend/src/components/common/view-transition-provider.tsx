"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

type ViewTransitionLike = {
  finished: Promise<void>;
  ready?: Promise<void>;
  updateCallbackDone?: Promise<void>;
  skipTransition: () => void;
};

type DocumentWithViewTransition = Document & {
  startViewTransition?: (callback: () => void | Promise<void>) => ViewTransitionLike;
};

const MAX_WAIT_FOR_COMMIT_MS = 450;

export function ViewTransitionProvider() {
  const router = useRouter();
  const pathname = usePathname();

  const pathnameRef = useRef(pathname);
  const activeTransitionRef = useRef<ViewTransitionLike | null>(null);
  const resolveCommitRef = useRef<(() => void) | null>(null);
  const safetyTimerRef = useRef<number | null>(null);

  const flushPendingCommit = () => {
    if (safetyTimerRef.current !== null) {
      window.clearTimeout(safetyTimerRef.current);
      safetyTimerRef.current = null;
    }
    if (resolveCommitRef.current) {
      const resolve = resolveCommitRef.current;
      resolveCommitRef.current = null;
      resolve();
    }
  };

  useEffect(() => {
    pathnameRef.current = pathname;
    flushPendingCommit();
  }, [pathname]);

  useEffect(() => {
    const doc = document as DocumentWithViewTransition;
    if (typeof doc.startViewTransition !== "function") return;

    const prefersReduced = () =>
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const startRouteTransition = (navigate?: () => void) => {
      if (prefersReduced() || typeof doc.startViewTransition !== "function") {
        navigate?.();
        return;
      }

      // Cancel any in-flight transition cleanly on rapid repeated clicks
      flushPendingCommit();
      if (activeTransitionRef.current) {
        try {
          activeTransitionRef.current.skipTransition();
        } catch {
          // Ignore if already finished
        }
        activeTransitionRef.current = null;
      }

      const transition = doc.startViewTransition(() => {
        return new Promise<void>((resolve) => {
          resolveCommitRef.current = resolve;
          navigate?.();
          safetyTimerRef.current = window.setTimeout(
            flushPendingCommit,
            MAX_WAIT_FOR_COMMIT_MS
          );
        });
      });

      activeTransitionRef.current = transition;
      transition.updateCallbackDone?.catch(() => {});
      transition.ready?.catch(() => {});
      transition.finished
        .catch(() => {
          // Ignore AbortError when skipTransition() cancels an in-flight transition
        })
        .finally(() => {
          if (activeTransitionRef.current === transition) {
            activeTransitionRef.current = null;
          }
        });
    };

    const handleDocumentClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest("a");
      if (!anchor) return;
      if (
        anchor.hasAttribute("download") ||
        (anchor.target && anchor.target !== "_self") ||
        anchor.dataset.noViewTransition === "true"
      ) {
        return;
      }

      const hrefAttr = anchor.getAttribute("href");
      if (!hrefAttr || hrefAttr.startsWith("#")) return;

      let url: URL;
      try {
        url = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }

      if (url.origin !== window.location.origin) return;
      // Only animate route-level page navigation, not same-path filter/query/hash updates
      if (url.pathname === pathnameRef.current) return;

      event.preventDefault();
      const destination = `${url.pathname}${url.search}${url.hash}`;
      startRouteTransition(() => {
        router.push(destination);
      });
    };

    const handlePopState = () => {
      if (window.location.pathname === pathnameRef.current) return;
      startRouteTransition();
    };

    document.addEventListener("click", handleDocumentClick, { capture: true });
    window.addEventListener("popstate", handlePopState, { capture: true });

    return () => {
      document.removeEventListener("click", handleDocumentClick, { capture: true });
      window.removeEventListener("popstate", handlePopState, { capture: true });
      flushPendingCommit();
    };
  }, [router]);

  return null;
}
