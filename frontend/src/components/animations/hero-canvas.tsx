"use client";

import React, { useEffect, useRef } from "react";
import type * as PIXIType from "pixi.js";
import {
  gsap,
  Observer,
  PixiPlugin,
  ScrollTrigger,
  prefersReducedMotion,
} from "@/lib/gsap";

export function HeroCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || prefersReducedMotion()) return;
    if (window.innerWidth < 1024) return;

    let destroyed = false;
    let app: PIXIType.Application | null = null;
    let obs: Observer | null = null;
    let visibilityTrigger: ScrollTrigger | null = null;
    let idleHandle: number | null = null;
    let timerHandle: ReturnType<typeof setTimeout> | null = null;
    const tweens: gsap.core.Tween[] = [];

    const initPixi = async () => {
      try {
        const PIXI = await import("pixi.js");
        if (destroyed) return;
        PixiPlugin.registerPIXI(PIXI);
        const instance = new PIXI.Application();
        await instance.init({
          resizeTo: container,
          backgroundAlpha: 0,
          antialias: false,
          powerPreference: "low-power",
          resolution: 1,
        });

        if (destroyed) {
          instance.destroy(true, { children: true });
          return;
        }

        app = instance;
        instance.canvas.style.width = "100%";
        instance.canvas.style.height = "100%";
        instance.canvas.style.display = "block";
        container.appendChild(instance.canvas);

        const layer = new PIXI.Container();
        instance.stage.addChild(layer);

        const width = container.clientWidth || 1200;
        const height = container.clientHeight || 420;
        const nodeCount = 12;

        const colors = [0x0ea5e9, 0x38bdf8, 0xff5e1e, 0xbae6fd];

        for (let i = 0; i < nodeCount; i++) {
          const g = new PIXI.Graphics();
          const radius = 1.6 + (i % 3) * 0.8;
          const color = colors[i % colors.length];
          g.circle(0, 0, radius).fill({ color, alpha: 0.5 });

          g.x = (width * ((i * 73 + 11) % 100)) / 100;
          g.y = (height * ((i * 41 + 17) % 100)) / 100;
          layer.addChild(g);

          const driftX = g.x + ((i % 2 === 0 ? 1 : -1) * (14 + (i % 4) * 6));
          const driftY = g.y + ((i % 3 === 0 ? -1 : 1) * (10 + (i % 3) * 6));

          const t = gsap.to(g, {
            pixi: {
              x: driftX,
              y: driftY,
              alpha: 0.25 + (i % 3) * 0.2,
            },
            duration: 3.8 + (i % 4) * 0.9,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
            delay: (i % 5) * 0.2,
          });
          tweens.push(t);
        }

        obs = Observer.create({
          target: container.parentElement || window,
          type: "pointer",
          onMove: (self) => {
            if (!app || destroyed) return;
            const nx = ((self.x ?? width / 2) / Math.max(width, 1) - 0.5) * 14;
            const ny = ((self.y ?? height / 2) / Math.max(height, 1) - 0.5) * 10;
            gsap.to(layer, {
              pixi: { x: nx, y: ny },
              duration: 0.6,
              ease: "earlyst-out",
              overwrite: "auto",
            });
          },
        });

        visibilityTrigger = ScrollTrigger.create({
          trigger: container,
          start: "top bottom",
          end: "bottom top",
          onLeave: () => {
            instance.ticker.stop();
            tweens.forEach((t) => t.pause());
          },
          onEnterBack: () => {
            instance.ticker.start();
            tweens.forEach((t) => t.resume());
          },
        });
      } catch {
        // Fallback to static CSS gradient when WebGL is unavailable
      }
    };

    if (typeof window.requestIdleCallback === "function") {
      idleHandle = window.requestIdleCallback(() => {
        if (!destroyed) initPixi();
      }, { timeout: 2000 });
    } else {
      timerHandle = setTimeout(() => {
        if (!destroyed) initPixi();
      }, 1200);
    }

    return () => {
      destroyed = true;
      if (idleHandle !== null && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleHandle);
      }
      if (timerHandle !== null) {
        clearTimeout(timerHandle);
      }
      tweens.forEach((t) => t.kill());
      obs?.kill();
      visibilityTrigger?.kill();
      if (app) {
        app.destroy(true, { children: true });
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{
        maskImage: "linear-gradient(to bottom, black 55%, transparent 100%)",
        WebkitMaskImage: "linear-gradient(to bottom, black 55%, transparent 100%)",
      }}
    />
  );
}
