import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type CarteClient = {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  tone?: "primary" | "success" | "warning" | "muted";
};

const TONS: Record<NonNullable<CarteClient["tone"]>, string> = {
  primary: "bg-primary-soft text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-amber-500/10 text-amber-600",
  muted: "bg-muted text-muted-foreground",
};

export function ClientsKpiCards({ cartes }: { cartes: CarteClient[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {cartes.map((carte) => (
        <div
          key={carte.label}
          className="rounded-2xl border border-border bg-card px-4 py-3 shadow-[var(--shadow-card)]"
        >
          <div className="flex items-start justify-between gap-2">
            <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              {carte.label}
            </p>
            <span
              className={cn(
                "grid h-8 w-8 shrink-0 place-items-center rounded-lg",
                TONS[carte.tone ?? "muted"],
              )}
            >
              <carte.icon className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-1 font-display text-xl font-semibold text-foreground">{carte.value}</p>
          {carte.hint && <p className="mt-0.5 text-xs text-muted-foreground">{carte.hint}</p>}
        </div>
      ))}
    </div>
  );
}
