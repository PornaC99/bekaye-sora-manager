import { Target } from "lucide-react";

import { formatFCFA, monthlyGoal } from "@/lib/dashboard-data";
import { SectionCard } from "./section-card";

export function MonthlyGoal() {
  const { objectif, realise } = monthlyGoal;
  const pourcentage = Math.min(100, Math.round((realise / objectif) * 100));
  const restant = Math.max(0, objectif - realise);

  return (
    <SectionCard title="Objectif du mois" description="Juillet 2026">
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
            <Target className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="font-display text-2xl font-semibold text-foreground">{pourcentage} %</p>
            <p className="text-xs text-muted-foreground">de l'objectif mensuel atteint</p>
          </div>
        </div>

        <div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-700"
              style={{ width: `${pourcentage}%` }}
            />
          </div>
        </div>

        <dl className="grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-xs text-muted-foreground">Objectif mensuel</dt>
            <dd className="mt-1 text-sm font-semibold text-foreground">{formatFCFA(objectif)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Montant réalisé</dt>
            <dd className="mt-1 text-sm font-semibold text-foreground">{formatFCFA(realise)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Montant restant</dt>
            <dd className="mt-1 text-sm font-semibold text-primary">{formatFCFA(restant)}</dd>
          </div>
        </dl>
      </div>
    </SectionCard>
  );
}
