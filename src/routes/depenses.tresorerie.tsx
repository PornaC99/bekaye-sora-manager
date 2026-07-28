import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/layout/page";
import { FluxTimeline, TreasuryPanel } from "@/components/finance/treasury";
import { useFinances } from "@/lib/finance/use-finance";

export const Route = createFileRoute("/depenses/tresorerie")({
  component: TresoreriePage,
});

function TresoreriePage() {
  const { tresorerie, flux } = useFinances();

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        eyebrow="Finances"
        title="Trésorerie"
        description="Chaque vente, achat, salaire et dépense alimente automatiquement ce suivi de caisse."
      />

      <div className="grid gap-4 xl:grid-cols-[1fr_1.2fr]">
        <TreasuryPanel
          entrees={tresorerie.entrees}
          sorties={tresorerie.sorties}
          solde={tresorerie.solde}
          mouvements={flux}
        />
        <FluxTimeline flux={flux.slice(0, 30)} />
      </div>
    </div>
  );
}
