"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

function parseRgb(colorStr: string): [number, number, number] | null {
  const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (!match) return null;
  return [parseInt(match[1], 10), parseInt(match[2], 10), parseInt(match[3], 10)];
}

function getLuminance(r: number, g: number, b: number): number {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

export function CustomCursor() {
  const cursorDotRef = useRef<HTMLDivElement>(null);
  const cursorRingRef = useRef<HTMLDivElement>(null);
  const cursorContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only enable on desktop pointer devices
    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    const isReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (isTouch || isReduced) return;

    const container = cursorContainerRef.current;
    const dot = cursorDotRef.current;
    const ring = cursorRingRef.current;
    if (!container || !dot || !ring) return;

    // Show container once we know we are on desktop
    container.style.display = "block";

    // Fast GSAP quickTo setters for 60fps tracking
    const dotX = gsap.quickTo(dot, "x", { duration: 0.08, ease: "power3.out" });
    const dotY = gsap.quickTo(dot, "y", { duration: 0.08, ease: "power3.out" });
    const ringX = gsap.quickTo(ring, "x", { duration: 0.24, ease: "power3.out" });
    const ringY = gsap.quickTo(ring, "y", { duration: 0.24, ease: "power3.out" });

    let isVisible = false;
    let isHoveringInteractive = false;
    let lastSampleTime = 0;

    const onPointerMove = (e: PointerEvent) => {
      if (!isVisible) {
        isVisible = true;
        gsap.to(dot, { opacity: 1, duration: 0.2 });
        gsap.to(ring, { opacity: 0.75, duration: 0.2 });
      }

      dotX(e.clientX);
      dotY(e.clientY);
      ringX(e.clientX);
      ringY(e.clientY);

      // Throttled background color sampling (every ~150ms)
      const now = performance.now();
      if (now - lastSampleTime > 150) {
        lastSampleTime = now;

        // Container is pointer-events-none so elementFromPoint naturally samples underneath
        const elementUnder = document.elementFromPoint(e.clientX, e.clientY);

        if (elementUnder) {
          // Check if interactive
          const interactive = !!elementUnder.closest(
            'a, button, input, select, textarea, [role="button"], label, kbd, .tilt-card, .category-card'
          );
          if (interactive !== isHoveringInteractive) {
            isHoveringInteractive = interactive;
            gsap.to(ring, {
              scale: interactive ? 1.8 : 1,
              opacity: interactive ? 1 : 0.75,
              duration: 0.22,
              ease: "power2.out",
            });
            gsap.to(dot, {
              scale: interactive ? 1.4 : 1,
              duration: 0.2,
            });
          }

          // Compute color adaptation
          let targetColor = "#C4A3FD"; // Default: vibrant lavender
          let targetRingBorder = "rgba(196, 163, 253, 0.55)";
          let targetGlow = "rgba(112, 34, 252, 0.6)";

          // Walk up to find background color
          let currentEl: HTMLElement | null = elementUnder as HTMLElement;
          let foundBg: string | null = null;

          while (currentEl && currentEl !== document.body && currentEl !== document.documentElement) {
            const style = window.getComputedStyle(currentEl);
            const bg = style.backgroundColor;
            if (bg && bg !== "transparent" && bg !== "rgba(0, 0, 0, 0)") {
              foundBg = bg;
              break;
            }
            currentEl = currentEl.parentElement;
          }

          if (foundBg) {
            const rgb = parseRgb(foundBg);
            if (rgb) {
              const [r, g, b] = rgb;
              const lum = getLuminance(r, g, b);

              // Light surface -> contrast with dark purple
              if (lum > 0.45) {
                targetColor = "#0B0A0F";
                targetRingBorder = "rgba(11, 10, 15, 0.8)";
                targetGlow = "rgba(11, 10, 15, 0.4)";
              }
              // Purple/primary surface -> contrast with bright Sunrise Orange
              else if (r > 60 && b > 130 && g < 120) {
                targetColor = "#FD8F32";
                targetRingBorder = "rgba(253, 143, 50, 0.8)";
                targetGlow = "rgba(253, 143, 50, 0.6)";
              }
              // Orange surface -> contrast with bright pure white
              else if (r > 180 && g > 90 && b < 100) {
                targetColor = "#FFFFFF";
                targetRingBorder = "rgba(255, 255, 255, 0.9)";
                targetGlow = "rgba(196, 163, 253, 0.7)";
              }
              // Dark background -> signature glowing lavender
              else {
                targetColor = "#C4A3FD";
                targetRingBorder = "rgba(196, 163, 253, 0.6)";
                targetGlow = "rgba(112, 34, 252, 0.55)";
              }
            }
          }

          // Smoothly tween cursor colors
          gsap.to(dot, {
            backgroundColor: targetColor,
            boxShadow: `0 0 14px ${targetGlow}`,
            duration: 0.25,
          });
          gsap.to(ring, {
            borderColor: targetRingBorder,
            boxShadow: `0 0 20px ${targetGlow}`,
            duration: 0.25,
          });
        }
      }
    };

    const onPointerLeave = () => {
      isVisible = false;
      gsap.to([dot, ring], { opacity: 0, duration: 0.25 });
    };

    const onPointerEnter = () => {
      isVisible = true;
      gsap.to(dot, { opacity: 1, duration: 0.25 });
      gsap.to(ring, { opacity: 0.75, duration: 0.25 });
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("mouseleave", onPointerLeave);
    document.addEventListener("mouseenter", onPointerEnter);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("mouseleave", onPointerLeave);
      document.removeEventListener("mouseenter", onPointerEnter);
    };
  }, []);

  return (
    <div
      ref={cursorContainerRef}
      className="pointer-events-none fixed inset-0 z-[999999] overflow-hidden select-none"
      style={{ display: "none" }}
      aria-hidden="true"
    >
      {/* Outer following ring with glow */}
      <div
        ref={cursorRingRef}
        className="absolute -left-4 -top-4 h-8 w-8 rounded-full border-2 border-primary-content/60 opacity-0 pointer-events-none will-change-transform"
        style={{
          boxShadow: "0 0 16px rgba(112, 34, 252, 0.4)",
          transform: "translate3d(-100px, -100px, 0)",
        }}
      />
      {/* Inner sharp glowing dot */}
      <div
        ref={cursorDotRef}
        className="absolute -left-1.5 -top-1.5 h-3 w-3 rounded-full bg-primary-content opacity-0 pointer-events-none will-change-transform"
        style={{
          boxShadow: "0 0 12px rgba(196, 163, 253, 0.8)",
          transform: "translate3d(-100px, -100px, 0)",
        }}
      />
    </div>
  );
}
