"use client";

import React, { useRef, useState } from "react";
import { ArrowUp } from "lucide-react";
import {
  gsap,
  ScrollTrigger,
  ScrollToPlugin,
  useGSAP,
} from "@/lib/gsap";
import { Button } from "@/components/ui/button";

interface SmoothScrollShellProps {
  children: React.ReactNode;
}

export function SmoothScrollShell({ children }: SmoothScrollShellProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [showTop, setShowTop] = useState(false);

  useGSAP(
    () => {
      const trigger = ScrollTrigger.create({
        start: 420,
        end: "max",
        onEnter: () => setShowTop(true),
        onLeaveBack: () => setShowTop(false),
      });

      return () => {
        trigger.kill();
      };
    },
    { scope: rootRef }
  );

  const handleScrollToTop = () => {
    gsap.to(window, {
      scrollTo: { y: 0, autoKill: true },
      duration: 0.6,
      ease: "earlyst-out",
    });
  };

  void ScrollToPlugin;

  return (
    <div ref={rootRef} className="flex flex-1 flex-col">
      {children}

      {showTop && (
        <div className="fixed bottom-6 right-6 z-40">
          <Button
            type="button"
            variant="secondary"
            size="icon"
            onClick={handleScrollToTop}
            aria-label="Scroll back to top"
            className="rounded-full border border-primary/40 bg-surface-2 shadow-lg"
          >
            <ArrowUp className="h-4 w-4 text-primary-content" />
          </Button>
        </div>
      )}
    </div>
  );
}
