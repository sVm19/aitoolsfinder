import * as React from "react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps extends React.HTMLAttributes<HTMLElement> {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
  ...props
}: EmptyStateProps) {
  const titleId = React.useId();

  return (
    <section
      aria-labelledby={titleId}
      className={cn(
        "flex flex-col items-center rounded-xl border border-dashed border-border bg-surface-1/60 px-6 py-12 text-center",
        className,
      )}
      {...props}
    >
      {icon && (
        <span aria-hidden="true" className="mb-4 text-muted-foreground">
          {icon}
        </span>
      )}
      <h2 id={titleId} className="text-base font-semibold text-foreground">
        {title}
      </h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </section>
  );
}
