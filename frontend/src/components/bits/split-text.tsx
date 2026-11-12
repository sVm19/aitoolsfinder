"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
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

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const words = root.querySelectorAll<HTMLElement>("[data-word]");
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const context = gsap.context(() => {
      gsap.from(words, {
        y: 28,
        autoAlpha: 0,
        stagger: 0.045,
        duration: 0.75,
        ease: "power3.out",
        clearProps: "transform,opacity,visibility",
      });
    }, root);

    return () => context.revert();
  }, [text]);

  const words = text.split(" ");

  return (
    <Tag id={id} ref={rootRef as never} className={cn(className)}>
      {words.map((word, index) => {
        const isAccent = accent && word.replace(/[.,]/g, "") === accent;
        return (
          <span key={`${word}-${index}`} className="inline-block whitespace-pre">
            <span
              data-word
              className={cn("inline-block", isAccent && "text-primary-content")}
            >
              {word}
              {index < words.length - 1 ? "\u00A0" : ""}
            </span>
          </span>
        );
      })}
    </Tag>
  );
}
