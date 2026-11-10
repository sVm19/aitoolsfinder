import * as React from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ErrorStateProps extends React.HTMLAttributes<HTMLElement> {
  title?: string;
  description: string;
  action?: React.ReactNode;
}

export function ErrorState({
  title = "Something went wrong",
  description,
  action,
  className,
  ...props
}: ErrorStateProps) {
  const titleId = React.useId();

  return (
    <section
      role="alert"
      aria-labelledby={titleId}
      className={cn(
        "flex flex-col items-center rounded-xl border border-red-500/30 bg-red-950/20 px-6 py-10 text-center",
        className,
      )}
      {...props}
    >
      <AlertCircle aria-hidden="true" className="mb-3 h-5 w-5 text-red-400" />
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
