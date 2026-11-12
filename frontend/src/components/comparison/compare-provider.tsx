"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { GitCompare, X } from "lucide-react";

export interface CompareTool {
  id: string;
  name: string;
  slug: string;
}

interface CompareContextValue {
  tools: CompareTool[];
  addTool: (tool: CompareTool) => void;
  removeTool: (slug: string) => void;
  clearTools: () => void;
  isFull: boolean;
}

const CompareContext = createContext<CompareContextValue | null>(null);

export function useCompare(): CompareContextValue {
  const context = useContext(CompareContext);
  if (!context) {
    throw new Error("useCompare must be used inside CompareProvider");
  }
  return context;
}

export function CompareProvider({ children }: { children: ReactNode }) {
  const [tools, setTools] = useState<CompareTool[]>([]);
  const addTool = useCallback((tool: CompareTool) => {
    setTools((current) => {
      if (current.some((item) => item.slug === tool.slug) || current.length >= 4) {
        return current;
      }
      return [...current, tool];
    });
  }, []);
  const removeTool = useCallback((slug: string) => {
    setTools((current) => current.filter((tool) => tool.slug !== slug));
  }, []);
  const clearTools = useCallback(() => setTools([]), []);
  const value = useMemo(
    () => ({ tools, addTool, removeTool, clearTools, isFull: tools.length >= 4 }),
    [tools, addTool, removeTool, clearTools],
  );

  return (
    <CompareContext.Provider value={value}>
      {children}
      {tools.length > 0 && <CompareTray />}
    </CompareContext.Provider>
  );
}

function CompareTray() {
  const { tools, removeTool, clearTools } = useCompare();
  const router = useRouter();

  function compareSelected() {
    const params = new URLSearchParams();
    for (const tool of tools) params.append("tool", tool.slug);
    router.push(`/compare/preview?${params.toString()}`);
  }

  return (
    <aside
      aria-label="Compare tray"
      className="fixed inset-x-3 bottom-3 z-[60] mx-auto w-fit max-w-[calc(100vw-1.5rem)] rounded-2xl border border-primary/40 bg-surface-2/95 p-3 shadow-2xl shadow-black/40 backdrop-blur sm:inset-x-6 sm:bottom-5 sm:max-w-4xl sm:p-4"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary-content">
            <GitCompare aria-hidden="true" className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground" aria-live="polite">
              Compare tools <span className="text-muted-foreground">({tools.length}/4)</span>
            </p>
            {tools.length === 1 && (
              <p className="mt-0.5 text-xs text-muted-foreground">Add one more tool to compare.</p>
            )}
            <ul className="mt-1 flex max-w-full flex-wrap gap-1.5">
              {tools.map((tool) => (
                <li
                  key={tool.id}
                  className="inline-flex max-w-44 items-center gap-1 rounded-full border border-border bg-surface-1 py-1 pl-2.5 pr-1 text-xs text-foreground"
                >
                  <span className="truncate">{tool.name}</span>
                  <button
                    type="button"
                    onClick={() => removeTool(tool.slug)}
                    aria-label={`Remove ${tool.name} from comparison`}
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-surface-3 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <X aria-hidden="true" className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 sm:shrink-0">
          <button
            type="button"
            onClick={clearTools}
            className="min-h-10 rounded-lg px-3 text-sm text-muted-foreground transition-colors hover:bg-surface-3 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={compareSelected}
            disabled={tools.length < 2}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-primary/50 bg-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:border-border disabled:bg-surface-3 disabled:text-muted-foreground"
          >
            <GitCompare aria-hidden="true" className="h-4 w-4" />
            Compare now
          </button>
        </div>
      </div>
    </aside>
  );
}
