"use client";

import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { CustomEase } from "gsap/CustomEase";
import { Draggable } from "gsap/Draggable";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { Flip } from "gsap/Flip";
import { InertiaPlugin } from "gsap/InertiaPlugin";
import { MorphSVGPlugin } from "gsap/MorphSVGPlugin";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { Observer } from "gsap/Observer";
import { PixiPlugin } from "gsap/PixiPlugin";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { TextPlugin } from "gsap/TextPlugin";

let isRegistered = false;

export function registerGsapPlugins() {
  if (typeof window === "undefined" || isRegistered) return;

  gsap.registerPlugin(
    useGSAP,
    ScrollTrigger,
    Observer,
    MorphSVGPlugin,
    DrawSVGPlugin,
    MotionPathPlugin,
    Draggable,
    Flip,
    SplitText,
    TextPlugin,
    ScrambleTextPlugin,
    InertiaPlugin,
    CustomEase,
    PixiPlugin,
    ScrollToPlugin
  );

  // Brand-tuned custom eases
  CustomEase.create("earlyst-out", "M0,0 C0.16,1 0.3,1 1,1");
  CustomEase.create("earlyst-snap", "M0,0 C0.2,0.9 0.25,1 1,1");
  CustomEase.create("earlyst-spring", "M0,0 C0.175,0.885 0.32,1.15 1,1");

  isRegistered = true;
}

if (typeof window !== "undefined") {
  registerGsapPlugins();
}

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export {
  gsap,
  useGSAP,
  ScrollTrigger,
  Observer,
  MorphSVGPlugin,
  DrawSVGPlugin,
  MotionPathPlugin,
  Draggable,
  Flip,
  SplitText,
  TextPlugin,
  ScrambleTextPlugin,
  InertiaPlugin,
  CustomEase,
  PixiPlugin,
  ScrollToPlugin,
};
