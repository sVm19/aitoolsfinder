"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const HeroScene = dynamic(() => import("./hero-scene"), { ssr: false });

function StaticFallback() {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="aurora-blob aurora-blob-a" />
      <div className="aurora-blob aurora-blob-b" />
      <div className="absolute right-[8%] top-1/2 hidden h-64 w-64 -translate-y-1/2 md:block">
        <div className="orbit-ring" />
        <div className="orbit-ring orbit-ring-alt" />
        <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent" />
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
