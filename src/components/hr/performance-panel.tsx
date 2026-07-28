import { AlertTriangle, TrendingUp, Trophy } from "lucide-react";

import { formatFCFA } from "@/lib/products/types";
import type { AlerteRh, PerformanceEmploye } from "@/lib/hr/analytics";
import { cn } from "@/lib/utils";
import { EmployeeAvatar } from "./employee-avatar";

export function PerformancePanel({ performances }: { performances: PerformanceEmploye[] }) {
  const classees = performances.filter((p) => p.employe.objectifMensuel > 0 || p.nombreVentes > 0);

  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary-soft text-primary">
          <Trophy className="h-4 w-4" />
        </span>
        <div>
          <h2 className="text-sm font-semibold text-foreground">Performances de l'équipe</h2>
          <p className="text-xs text-muted-foreground">
            Ventes du mois rattachées automatiquement à chaque vendeur.
          </p>
        </div>
      </div>

      <ul className="mt-4 flex flex-col gap-3">
        {classees.length === 0 && (
          <li className="py-6 text-center text-sm text-muted-foreground">
            Aucune vente enregistrée ce mois-ci.
          </li>
        )}
        {classees.map((perf, index) => (
          <li key={perf.employe.id} className="rounded-xl border border-border p-3">
            <div className="flex items-center gap-3">
              <span className="w-5 text-sm font-semibold text-muted-foreground">{index + 1}</span>
              <EmployeeAvatar employe={perf.employe} taille="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{perf.employe.nom}</p>
                <p className="text-xs text-muted-foreground">
                  {perf.nombreVentes} ventes · panier moyen {formatFCFA(perf.panierMoyen)}
                </p>
              </div>
              <span className="shrink-0 text-sm font-semibold text-foreground">
                {formatFCFA(perf.chiffreAffaires)}
              </span>
            </div>
            {perf.objectif > 0 && (
              <div className="mt-2">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      perf.progression >= 100
                        ? "bg-success"
                        : perf.progression >= 50
                          ? "bg-primary"
                          : "bg-amber-500",
                    )}
                    style={{ width: `${Math.min(100, perf.progression)}%` }}
                  />
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {perf.progression} % de l'objectif ({formatFCFA(perf.objectif)}) · présence{" "}
                  {perf.tauxPresence} % · {perf.retards} retard(s)
                </p>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function HrAlertsPanel({ alertes }: { alertes: AlerteRh[] }) {
  const tons = {
    haute: "bg-destructive/10 text-destructive",
    moyenne: "bg-amber-500/10 text-amber-600",
    basse: "bg-muted text-muted-foreground",
  } as const;

  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-destructive/10 text-destructive">
          <AlertTriangle className="h-4 w-4" />
        </span>
        <div>
          <h2 className="text-sm font-semibold text-foreground">Alertes RH intelligentes</h2>
          <p className="text-xs text-muted-foreground">
            Absences, retards, congés en attente et salaires non payés.
          </p>
        </div>
      </div>

      <ul className="mt-4 flex flex-col gap-2">
        {alertes.length === 0 && (
          <li className="py-6 text-center text-sm text-muted-foreground">
            Aucune alerte : tout est en ordre.
          </li>
        )}
        {alertes.slice(0, 10).map((alerte) => (
          <li key={alerte.id} className="rounded-xl border border-border p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-foreground">{alerte.titre}</p>
              <span
                className={cn(
                  "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold",
                  tons[alerte.niveau],
                )}
              >
                {alerte.niveau === "haute"
                  ? "Priorité haute"
                  : alerte.niveau === "moyenne"
                    ? "Priorité moyenne"
                    : "Information"}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{alerte.message}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function MasseSalarialeChartCard({
  serie,
}: {
  serie: { mois: string; montant: number }[];
}) {
  const max = Math.max(1, ...serie.map((s) => s.montant));
  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary-soft text-primary">
          <TrendingUp className="h-4 w-4" />
        </span>
        <div>
          <h2 className="text-sm font-semibold text-foreground">Évolution de la masse salariale</h2>
          <p className="text-xs text-muted-foreground">Net à payer cumulé par mois.</p>
        </div>
      </div>
      <div className="mt-5 flex h-40 items-end gap-3">
        {serie.map((point) => (
          <div key={point.mois} className="flex flex-1 flex-col items-center gap-2">
            <div
              className="w-full rounded-t-lg bg-primary/80"
              style={{ height: `${Math.max(6, (point.montant / max) * 100)}%` }}
              title={formatFCFA(point.montant)}
            />
            <span className="text-[11px] text-muted-foreground">{point.mois.slice(5)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
