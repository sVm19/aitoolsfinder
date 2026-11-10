"use client";

import * as React from "react";
import gsap from "gsap";
import { cn } from "@/lib/utils";

export interface MotionFadeInProps
  extends React.HTMLAttributes<HTMLDivElement> {
  delay?: number;
  duration?: number;
}

export function MotionFadeIn({
  delay = 0,
  duration = 0.45,
  className,
  children,
  ...props
}: MotionFadeInProps) {
  const elementRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const element = elementRef.current;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (!element || reduceMotion) return;

    const context = gsap.context(() => {
      gsap.from(element, {
        autoAlpha: 0,
        y: 12,
        duration,
        delay,
        ease: "power2.out",
        clearProps: "transform,opacity,visibility",
      });
    }, element);

    return () => context.revert();
  }, [delay, duration]);

  return (
    <div ref={elementRef} className={cn(className)} {...props}>
      {children}
    </div>
  );
}
