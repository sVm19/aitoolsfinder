"use client";

import { useStack } from "@/components/stack/stack-provider";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ToolCardData } from "@/components/tool/tool-card";

interface ToolSaveButtonProps {
  tool: ToolCardData;
  className?: string;
}

export function ToolSaveButton({ tool, className }: ToolSaveButtonProps) {
  const { isSaved, toggleSave } = useStack();
  const saved = isSaved(tool.id);

  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => toggleSave(tool)}
      className={cn(
        "min-h-12 rounded-xl px-4 text-sm font-medium transition-all duration-200",
        saved
          ? "border-rose-500/50 bg-rose-500/15 text-rose-300 shadow-[0_0_16px_rgba(244,63,94,0.2)]"
          : "border-border bg-surface-1 text-muted-foreground hover:border-rose-500/30 hover:text-foreground",
        className
      )}
      title={saved ? "Remove from My AI Stack" : "Save to My AI Stack"}
    >
      <Heart
        className={cn(
          "mr-2 h-4 w-4 transition-transform duration-200",
          saved ? "fill-rose-500 text-rose-500 scale-110" : "opacity-70 group-hover:scale-105"
        )}
      />
      <span>{saved ? "Saved to Stack" : "Save to Stack"}</span>
    </Button>
  );
}
