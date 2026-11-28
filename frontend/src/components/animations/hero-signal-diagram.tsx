"use client";

import React, { useRef } from "react";
import {
  DrawSVGPlugin,
  MotionPathPlugin,
  ScrambleTextPlugin,
  TextPlugin,
  gsap,
  prefersReducedMotion,
  useGSAP,
} from "@/lib/gsap";

interface HeroSignalDiagramProps {
  totalTools: number;
}

export function HeroSignalDiagram({ totalTools }: HeroSignalDiagramProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const pathTopRef = useRef<SVGPathElement>(null);
  const pathMidRef = useRef<SVGPathElement>(null);
  const pathBotRef = useRef<SVGPathElement>(null);
  const pulseTopRef = useRef<SVGCircleElement>(null);
  const pulseMidRef = useRef<SVGCircleElement>(null);
  const pulseBotRef = useRef<SVGCircleElement>(null);
  const promptRef = useRef<HTMLSpanElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;

      const paths = [pathTopRef.current, pathMidRef.current, pathBotRef.current].filter(
        Boolean
      );

      if (paths.length > 0) {
        gsap.fromTo(
          paths,
          { drawSVG: "0%" },
          {
            drawSVG: "100%",
            duration: 1.1,
            stagger: 0.14,
            ease: "earlyst-out",
          }
        );
      }

      const bindPulse = (
        pulse: SVGCircleElement | null,
        path: SVGPathElement | null,
        delay: number
      ) => {
        if (!pulse || !path) return;
        gsap.to(pulse, {
          motionPath: {
            path,
            align: path,
            alignOrigin: [0.5, 0.5],
          },
          duration: 2.6,
          repeat: -1,
          delay,
          ease: "power1.inOut",
        });
      };

      bindPulse(pulseTopRef.current, pathTopRef.current, 0);
      bindPulse(pulseMidRef.current, pathMidRef.current, 0.7);
      bindPulse(pulseBotRef.current, pathBotRef.current, 1.4);

      if (countRef.current) {
        gsap.to(countRef.current, {
          duration: 1.1,
          scrambleText: {
            text: `${totalTools.toLocaleString()}`,
            chars: "0123456789",
            speed: 0.45,
          },
        });
      }

      if (promptRef.current) {
        const prompts = [
          "Compare AI coding copilots under $20/mo",
          "Find open-source vector DBs with SOC2",
          "Benchmark autonomous workflow agents",
        ];
        const tl = gsap.timeline({ repeat: -1, repeatDelay: 1.2 });
        prompts.forEach((p) => {
          tl.to(promptRef.current, {
            duration: 1.3,
            text: p,
            ease: "none",
          }).to({}, { duration: 1.8 });
        });
      }

      void DrawSVGPlugin;
      void MotionPathPlugin;
      void ScrambleTextPlugin;
      void TextPlugin;
    },
    { scope: rootRef, dependencies: [totalTools] }
  );

  return (
    <div
      ref={rootRef}
      className="hidden lg:flex flex-col justify-between rounded-2xl border border-border bg-surface-1/90 p-5 backdrop-blur-md shadow-xl w-full max-w-md"
    >
      <div className="flex items-center justify-between gap-3 border-b border-border/80 pb-3">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-primary" />
          <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
            Signal Pipeline
          </span>
        </div>
        <span className="rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-mono text-primary-content">
          <span ref={countRef}>{totalTools.toLocaleString()}</span> indexed
        </span>
      </div>

      {/* DrawSVG + MotionPath architecture diagram */}
      <div className="relative my-4">
        <svg
          viewBox="0 0 360 120"
          className="w-full h-28 overflow-visible"
          aria-hidden="true"
        >
          {/* Animated SVG Paths (rendered behind nodes so labels stay crisp) */}
          <path
            ref={pathTopRef}
            d="M 72 60 C 110 60, 118 60, 148 60 C 232 60, 240 22, 284 22"
            fill="none"
            stroke="#0ea5e9"
            strokeOpacity="0.55"
            strokeWidth="1.5"
          />
          <path
            ref={pathMidRef}
            d="M 72 60 L 284 60"
            fill="none"
            stroke="#38bdf8"
            strokeOpacity="0.65"
            strokeWidth="1.5"
          />
          <path
            ref={pathBotRef}
            d="M 72 60 C 110 60, 118 60, 148 60 C 232 60, 240 98, 284 98"
            fill="none"
            stroke="#ff5e1e"
            strokeOpacity="0.55"
            strokeWidth="1.5"
          />

          {/* MotionPath Pulses */}
          <circle ref={pulseTopRef} r="3.5" fill="#38bdf8" />
          <circle ref={pulseMidRef} r="3.5" fill="#bae6fd" />
          <circle ref={pulseBotRef} r="3.5" fill="#ff5e1e" />

          {/* Source & Target Nodes (rendered on top of paths) */}
          <rect
            x="8"
            y="44"
            width="64"
            height="32"
            rx="8"
            fill="#111824"
            stroke="#1f2a3c"
          />
          <text
            x="40"
            y="64"
            textAnchor="middle"
            fill="#bae6fd"
            fontSize="10"
            fontFamily="monospace"
          >
            Query
          </text>

          <rect
            x="148"
            y="40"
            width="68"
            height="40"
            rx="10"
            fill="#182233"
            stroke="#0ea5e9"
            strokeOpacity="0.7"
          />
          <text
            x="182"
            y="64"
            textAnchor="middle"
            fill="#f4f7fb"
            fontSize="10"
            fontFamily="monospace"
          >
            Audit
          </text>

          <rect
            x="284"
            y="10"
            width="68"
            height="24"
            rx="6"
            fill="#111824"
            stroke="#1f2a3c"
          />
          <text
            x="318"
            y="25"
            textAnchor="middle"
            fill="#b0bccf"
            fontSize="9"
            fontFamily="monospace"
          >
            Pricing
          </text>

          <rect
            x="284"
            y="48"
            width="68"
            height="24"
            rx="6"
            fill="#111824"
            stroke="#1f2a3c"
          />
          <text
            x="318"
            y="63"
            textAnchor="middle"
            fill="#b0bccf"
            fontSize="9"
            fontFamily="monospace"
          >
            Specs
          </text>

          <rect
            x="284"
            y="86"
            width="68"
            height="24"
            rx="6"
            fill="#111824"
            stroke="#1f2a3c"
          />
          <text
            x="318"
            y="101"
            textAnchor="middle"
            fill="#b0bccf"
            fontSize="9"
            fontFamily="monospace"
          >
            Stack
          </text>
        </svg>
      </div>

      {/* TextPlugin cycling task prompt */}
      <div className="rounded-lg border border-border bg-surface-2/80 px-3 py-2 text-xs font-mono text-muted-foreground">
        <span className="text-accent mr-1.5">&gt;</span>
        <span ref={promptRef}>Compare AI coding copilots under $20/mo</span>
      </div>
    </div>
  );
}
