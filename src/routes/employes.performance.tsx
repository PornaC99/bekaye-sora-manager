import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";

import {
  HrAlertsPanel,
  MasseSalarialeChartCard,
  PerformancePanel,
} from "@/components/hr/performance-panel";
import { PageHeader } from "@/components/layout/page";
import {
  calculerPerformances,
  genererAlertesRh,
  serieMasseSalariale,
} from "@/lib/hr/analytics";
import { useHrStore } from "@/lib/hr/store";
import { useSalesStore } from "@/lib/sales/store";

export const Route = createFileRoute("/employes/performance")({
  component: PerformancePage,
});

function PerformancePage() {
  const { employes, presences, conges, bulletins } = useHrStore();
  const { ventes } = useSalesStore();

  const performances = useMemo(
    () => calculerPerformances(employes, ventes, presences),
    [employes, ventes, presences],
  );
  const alertes = useMemo(
    () => genererAlertesRh({ employes, presences, conges, bulletins, performances }),
    [employes, presences, conges, bulletins, performances],
  );

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        eyebrow="Ressources humaines"
        title="Performances de l'équipe"
        description="Ventes, objectifs, assiduité et alertes intelligentes du mois en cours."
      />
      <div className="grid gap-4 xl:grid-cols-2">
        <PerformancePanel performances={performances} />
        <div className="flex flex-col gap-4">
          <HrAlertsPanel alertes={alertes} />
          <MasseSalarialeChartCard serie={serieMasseSalariale(bulletins)} />
        </div>
      </div>
    </div>
  );
}
