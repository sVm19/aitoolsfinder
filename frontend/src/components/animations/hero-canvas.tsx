"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const HeroScene = dynamic(() => import("./hero-scene"), { ssr: false });

function StaticFallback() {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="aurora-blob aurora-blob-a" />
      <div className="aurora-blob aurora-blob-b" />
      <div className="absolute right-[12%] top-1/2 hidden h-56 w-56 -translate-y-1/2 md:block">
        <div className="h-full w-full rounded-full bg-gradient-to-tr from-primary/30 via-accent/20 to-transparent blur-3xl" />
      </div>
    </div>
  );
}

export function HeroCanvas() {
  const [loadScene, setLoadScene] = useState(false);

  useEffect(() => {
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const smallViewport = window.matchMedia("(max-width: 767px)").matches;
    if (reducedMotion || smallViewport) return;

    const timer = window.setTimeout(() => setLoadScene(true), 180);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <StaticFallback />
      {loadScene && (
        <div className="scene-in absolute inset-0">
          <HeroScene />
        </div>
      )}
    </div>
  );
}
