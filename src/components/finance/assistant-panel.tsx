import { Lightbulb, Sparkles, TrendingUp, TriangleAlert, ShieldAlert } from "lucide-react";

import { SectionCard } from "@/components/dashboard/section-card";
import type { ConseilFinancier } from "@/lib/finance/analytics";
import { cn } from "@/lib/utils";

const TONS: Record<
  ConseilFinancier["ton"],
  { carte: string; pastille: string; icone: typeof Sparkles }
> = {
  succes: {
    carte: "border-success/25 bg-success/5",
    pastille: "bg-success/12 text-success",
    icone: TrendingUp,
  },
  info: {
    carte: "border-primary/20 bg-primary-soft/50",
    pastille: "bg-primary-soft text-primary",
    icone: Lightbulb,
  },
  alerte: {
    carte: "border-amber-500/25 bg-amber-500/5",
    pastille: "bg-amber-500/10 text-amber-600",
    icone: TriangleAlert,
  },
  danger: {
    carte: "border-destructive/25 bg-destructive/5",
    pastille: "bg-destructive/10 text-destructive",
    icone: ShieldAlert,
  },
};

export function AssistantPanel({ conseils }: { conseils: ConseilFinancier[] }) {
  return (
    <SectionCard
      title="Assistant financier intelligent"
      description="Analyse automatique des ventes, dépenses, stocks, créances et dettes"
      action={
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-2.5 py-1 text-[11px] font-semibold text-primary">
          <Sparkles className="h-3.5 w-3.5" />
          Automatique
        </span>
      }
    >
      {conseils.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          Aucune recommandation pour le moment. Tout est sous contrôle.
        </p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {conseils.map((conseil) => {
            const ton = TONS[conseil.ton];
            return (
              <article
                key={conseil.id}
                className={cn("rounded-xl border p-4 transition-colors", ton.carte)}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-lg", ton.pastille)}
                  >
                    <ton.icone className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-foreground">{conseil.titre}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {conseil.message}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}
