"use client";

import { useEffect } from "react";

export function ButtonRipple() {
  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: no-preference)");

    const handlePointerDown = (event: PointerEvent) => {
      if (!motionQuery.matches || event.button !== 0) return;
      const target = event.target as HTMLElement | null;
      const button = target?.closest("button:not(:disabled)") as HTMLButtonElement | null;
      if (!button || button.dataset.noRipple === "true") return;

      const rect = button.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const style = window.getComputedStyle(button);
      if (style.position === "static") button.style.position = "relative";
      if (style.overflow !== "hidden") button.style.overflow = "hidden";

      const size = Math.max(rect.width, rect.height);
      const x = event.clientX ? event.clientX - rect.left - size / 2 : (rect.width - size) / 2;
      const y = event.clientY ? event.clientY - rect.top - size / 2 : (rect.height - size) / 2;

      const wave = document.createElement("span");
      wave.className = "btn-ripple-wave";
      wave.setAttribute("aria-hidden", "true");
      wave.style.width = `${size}px`;
      wave.style.height = `${size}px`;
      wave.style.left = `${x}px`;
      wave.style.top = `${y}px`;

      const cleanup = () => wave.remove();
      wave.addEventListener("animationend", cleanup, { once: true });
      window.setTimeout(cleanup, 650);
      button.appendChild(wave);
    };

    document.addEventListener("pointerdown", handlePointerDown, { passive: true });
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  return null;
}
