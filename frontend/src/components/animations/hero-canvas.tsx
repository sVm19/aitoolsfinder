"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const HeroScene = dynamic(() => import("./hero-scene"), { ssr: false });

function StaticFallback() {
  return (
    <div className="absolute inset-0 overflow-hidden rounded-[inherit]" aria-hidden="true">
      <div className="absolute left-1/2 top-1/2 h-[85%] aspect-square -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/20" />
      <div className="absolute left-1/2 top-1/2 h-[62%] aspect-square -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-full border border-accent/20" />
      <div className="absolute left-[22%] top-[36%] h-2 w-2 rounded-full bg-primary-content shadow-lavender-glow" />
      <div className="absolute right-[24%] top-[28%] h-1.5 w-1.5 rounded-full bg-accent" />
      <div className="absolute bottom-[27%] right-[28%] h-2 w-2 rounded-full bg-primary-content/80" />
    </div>
  );
}

export function HeroCanvas({ className }: { className?: string }) {
  const [loadScene, setLoadScene] = useState(false);

  useEffect(() => {
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const smallViewport = window.matchMedia("(max-width: 767px)").matches;
    if (reducedMotion || smallViewport) return;

    const timer = window.setTimeout(() => setLoadScene(true), 350);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit] ${className ?? ""}`}
    >
      <StaticFallback />
      {loadScene && (
        <div className="absolute inset-0 opacity-90">
          <HeroScene />
        </div>
      )}
    </div>
  );
}
