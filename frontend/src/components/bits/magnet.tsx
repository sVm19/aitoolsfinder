"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { cn } from "@/lib/utils";

export function Magnet({
  children,
  className,
  strength = 0.32,
}: {
  children: React.ReactNode;
  className?: string;
  strength?: number;
}) {
  const zoneRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const zone = zoneRef.current;
    const target = targetRef.current;
    if (!zone || !target) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const xTo = gsap.quickTo(target, "x", { duration: 0.45, ease: "power3.out" });
    const yTo = gsap.quickTo(target, "y", { duration: 0.45, ease: "power3.out" });

    const onMove = (event: MouseEvent) => {
      const rect = zone.getBoundingClientRect();
      const dx = event.clientX - (rect.left + rect.width / 2);
      const dy = event.clientY - (rect.top + rect.height / 2);
      xTo(dx * strength);
      yTo(dy * strength);
    };

    const onLeave = () => {
      xTo(0);
      yTo(0);
    };

    zone.addEventListener("mousemove", onMove);
    zone.addEventListener("mouseleave", onLeave);
    return () => {
      zone.removeEventListener("mousemove", onMove);
      zone.removeEventListener("mouseleave", onLeave);
    };
  }, [strength]);

  return (
    <div ref={zoneRef} className={cn("inline-flex", className)}>
      <div ref={targetRef} className="inline-flex">
        {children}
      </div>
    </div>
  );
}
