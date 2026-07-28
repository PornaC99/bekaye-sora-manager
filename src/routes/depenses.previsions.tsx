import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/layout/page";
import { AssistantPanel } from "@/components/finance/assistant-panel";
import { ForecastPanel } from "@/components/finance/forecast-panel";
import { useFinances } from "@/lib/finance/use-finance";

export const Route = createFileRoute("/depenses/previsions")({
  component: PrevisionsPage,
});

function PrevisionsPage() {
  const { previsions, objectifs, conseils } = useFinances();

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        eyebrow="Finances"
        title="Prévisions financières"
        description="Projection de fin de mois calculée à partir du rythme réel des ventes et des dépenses."
      />

      <ForecastPanel previsions={previsions} objectifCa={objectifs.chiffreAffaires} />
      <AssistantPanel conseils={conseils} />
    </div>
  );
}
