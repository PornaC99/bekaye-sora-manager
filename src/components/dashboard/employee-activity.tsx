import { Link } from "@tanstack/react-router";

import { EmployeeAvatar } from "@/components/hr/employee-avatar";
import { calculerPerformances } from "@/lib/hr/analytics";
import { useHrStore } from "@/lib/hr/store";
import { formatFCFA } from "@/lib/products/types";
import { useSalesStore } from "@/lib/sales/store";
import { SectionCard } from "./section-card";

export function EmployeeActivityList() {
  const { employes, presences } = useHrStore();
  const { ventes } = useSalesStore();

  const performances = calculerPerformances(employes, ventes, presences)
    .filter((p) => p.employe.statut !== "inactif")
    .slice(0, 5);

  return (
    <SectionCard
      title="Meilleurs vendeurs du mois"
      description="Performances de l'équipe rattachées automatiquement aux ventes"
      action={
        <Link
          to="/employes/performance"
          className="text-xs font-semibold text-primary transition-opacity hover:opacity-70"
        >
          Équipe
        </Link>
      }
    >
      <ul className="flex flex-col gap-3">
        {performances.length === 0 && (
          <li className="py-6 text-center text-sm text-muted-foreground">
            Aucune vente enregistrée ce mois-ci.
          </li>
        )}
        {performances.map((perf) => (
          <li key={perf.employe.id}>
            <Link
              to="/employes/$employeId"
              params={{ employeId: perf.employe.id }}
              className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border p-3 transition-colors hover:border-primary/25 hover:bg-muted/40"
            >
              <EmployeeAvatar employe={perf.employe} taille="md" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{perf.employe.nom}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {perf.nombreVentes} ventes · présence {perf.tauxPresence} %
                </p>
              </div>
              <span className="shrink-0 text-sm font-semibold text-foreground">
                {formatFCFA(perf.chiffreAffaires)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}
