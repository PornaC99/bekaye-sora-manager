import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function SectionCard({
  title,
  description,
  action,
  children,
  className,
  bodyClassName,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section
      className={cn(
        "flex flex-col rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]",
        className,
      )}
    >
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 border-b border-border px-5 py-4 sm:items-center">
        <div className="min-w-0">
          <h2 className="truncate font-display text-sm font-semibold text-foreground sm:text-base">
            {title}
          </h2>
          {description && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </header>
      <div className={cn("flex-1 px-5 py-5", bodyClassName)}>{children}</div>
    </section>
  );
}
