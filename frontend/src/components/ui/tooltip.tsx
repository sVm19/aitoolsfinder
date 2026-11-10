import * as React from "react";

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement<{ "aria-describedby"?: string }>;
}

export function Tooltip({ content, children }: TooltipProps) {
  const tooltipId = React.useId();
  const existingDescription = children.props["aria-describedby"];
  const describedBy = [existingDescription, tooltipId].filter(Boolean).join(" ");

  return (
    <span className="group relative inline-flex">
      {React.cloneElement(children, { "aria-describedby": describedBy })}
      <span
        id={tooltipId}
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-max max-w-60 -translate-x-1/2 rounded-md border border-border bg-surface-3 px-2.5 py-1.5 text-xs leading-relaxed text-foreground opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100 motion-reduce:transition-none"
      >
        {content}
      </span>
    </span>
  );
}
