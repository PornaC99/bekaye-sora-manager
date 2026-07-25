import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:flex-wrap sm:items-center sm:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
            {eyebrow}
          </p>
        )}
        <h1 className="mt-1 truncate text-2xl font-semibold text-foreground sm:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </header>
  );
}

export function PagePlaceholder({
  eyebrow,
  title,
  description,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto flex w-full max-w-6xl flex-col gap-6", className)}>
      <PageHeader eyebrow={eyebrow} title={title} description={description} />

      <section className="rounded-2xl border border-border bg-card p-8 shadow-[var(--shadow-card)] sm:p-12">
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary-soft">
            <Sparkles className="h-5 w-5 text-primary" />
          </span>
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Espace prêt pour le développement
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Cette page est volontairement vide. Les fonctionnalités de « {title} » seront
              ajoutées à cet emplacement.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
