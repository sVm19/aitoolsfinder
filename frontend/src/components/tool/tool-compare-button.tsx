"use client";

import { useCompare } from "@/components/comparison/compare-provider";
import { Button } from "@/components/ui/button";
import { Check, GitCompare } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToolCompareButtonProps {
  id: string;
  name: string;
  slug: string;
  className?: string;
}

export function ToolCompareButton({ id, name, slug, className }: ToolCompareButtonProps) {
  const { tools, addTool, removeTool, isFull } = useCompare();
  const isSelected = tools.some((t) => t.slug === slug);

  const handleToggle = () => {
    if (isSelected) {
      removeTool(slug);
    } else {
      addTool({ id, name, slug });
    }
  };

  return (
    <Button
      type="button"
      variant={isSelected ? "secondary" : "outline"}
      onClick={handleToggle}
      disabled={!isSelected && isFull}
      className={cn("min-h-12 rounded-lg px-4 text-sm font-medium", className)}
    >
      {isSelected ? (
        <>
          <Check aria-hidden="true" className="mr-1.5 h-4 w-4 text-primary-content" />
          In compare ({tools.length})
        </>
      ) : (
        <>
          <GitCompare aria-hidden="true" className="mr-1.5 h-4 w-4" />
          Add to compare
        </>
      )}
    </Button>
  );
}
