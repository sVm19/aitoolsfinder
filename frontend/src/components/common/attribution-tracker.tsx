"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export function AttributionTracker() {
  const searchParams = useSearchParams();

  useEffect(() => {
    // Suppress non-Error unhandled rejections (e.g. aborted script tags, browser DOM events)
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (
        event.reason instanceof Event ||
        (typeof event.reason === "object" &&
          event.reason !== null &&
          !("message" in event.reason) &&
          !("stack" in event.reason))
      ) {
        event.preventDefault();
      }
    };

    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    return () => {
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);

  useEffect(() => {
    try {
      const keys = [
        "utm_source",
        "utm_medium",
        "utm_campaign",
        "utm_content",
        "utm_term",
        "gclid",
        "fbclid",
        "ttclid",
        "msclkid",
      ];
      const params: Record<string, string> = {};
      let hasData = false;

      for (const key of keys) {
        const val = searchParams.get(key);
        if (val) {
          params[key] = val;
          hasData = true;
        }
      }

      if (hasData) {
        sessionStorage.setItem(
          "aitools_attribution",
          JSON.stringify({
            ...params,
            landing_path: window.location.pathname,
            captured_at: new Date().toISOString(),
          }),
        );
      }
    } catch {
      // storage disabled / private mode
    }
  }, [searchParams]);

  return null;
}
