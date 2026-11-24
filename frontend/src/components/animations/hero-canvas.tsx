"use client";

import React from "react";

export function HeroCanvas() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <div className="aurora-blob aurora-blob-a" />
      <div className="aurora-blob aurora-blob-b" />
      <div className="absolute right-[8%] top-1/2 -translate-y-1/2 hidden lg:block h-96 w-96">
        <div className="h-full w-full rounded-full bg-gradient-to-tr from-primary/20 via-accent/15 to-transparent blur-3xl opacity-75" />
      </div>
    </div>
  );
}
