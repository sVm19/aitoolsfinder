"use client";

import { useRef } from "react";
import {
  gsap,
  SplitText as GsapSplitText,
  prefersReducedMotion,
  useGSAP,
} from "@/lib/gsap";
import { cn } from "@/lib/utils";

export function SplitText({
  text,
  className,
  as: Tag = "span",
  accent,
  id,
}: {
  text: string;
  className?: string;
  as?: "span" | "h1" | "h2" | "p";
  accent?: string;
  id?: string;
}) {
  const rootRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root || prefersReducedMotion()) return;

      const split = new GsapSplitText(root, {
        type: "words",
        wordsClass: "split-word inline-block",
      });

      gsap.from(split.words, {
        y: 24,
        autoAlpha: 0,
        stagger: 0.035,
        duration: 0.7,
        ease: "earlyst-out",
        clearProps: "transform,opacity,visibility",
      });

      return () => {
        split.revert();
      };
    },
    { scope: rootRef, dependencies: [text] }
  );

  if (!accent) {
    return (
      <Tag id={id} ref={rootRef as never} className={cn(className)}>
        {text}
      </Tag>
    );
  }

  const parts = text.split(new RegExp(`(${accent})`, "gi"));
  return (
    <Tag id={id} ref={rootRef as never} className={cn(className)}>
      {parts.map((part, idx) =>
        part.toLowerCase() === accent.toLowerCase() ? (
          <span key={idx} className="text-primary-content">
            {part}
          </span>
        ) : (
          <span key={idx}>{part}</span>
        )
      )}
    </Tag>
  );
}
