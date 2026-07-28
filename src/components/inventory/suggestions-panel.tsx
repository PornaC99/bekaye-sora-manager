import {
  Flame,
  Gem,
  Hourglass,
  ShieldAlert,
  TrendingDown,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

import type { Suggestion } from "@/lib/inventory/insights";
import { cn } from "@/lib/utils";

const ICONES: Record<Suggestion["categorie"], LucideIcon> = {
  commander: TrendingUp,
  reduire: TrendingDown,
  peremption: Hourglass,
  anomalie: ShieldAlert,
  rentabilite: Gem,
  rupture_prevue: Flame,
};

const TONS: Record<Suggestion["ton"], string> = {
  success: "bg-success/10 text-success",
  warning: "bg-amber-500/10 text-amber-600",
  danger: "bg-primary-soft text-primary",
  neutral: "bg-muted text-muted-foreground",
};

export function SuggestionsPanel({ suggestions }: { suggestions: Suggestion[] }) {
  if (suggestions.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-10 text-center text-sm text-muted-foreground">
        Aucune suggestion pour l'instant.
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {suggestions.map((s) => {
        const Icon = ICONES[s.categorie];
        return (
          <article
            key={s.id}
            className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:border-primary/25"
          >
            <div className="flex items-start justify-between gap-3">
              <span className={cn("grid h-10 w-10 place-items-center rounded-xl", TONS[s.ton])}>
                <Icon className="h-5 w-5" strokeWidth={1.9} />
              </span>
              <span
                className={cn(
                  "rounded-md px-2 py-1 text-[11px] font-semibold",
                  TONS[s.ton],
                )}
              >
                {s.indicateur}
              </span>
            </div>
            <h3 className="mt-4 font-display text-base font-semibold text-foreground">{s.titre}</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">{s.message}</p>
          </article>
        );
      })}
    </div>
  );
}
