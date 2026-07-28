import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/layout/page";
import {
  LeastProfitableProducts,
  MarginCards,
  ProfitableCategories,
  TopProfitableProducts,
} from "@/components/finance/profitability";
import { useFinances } from "@/lib/finance/use-finance";

export const Route = createFileRoute("/_authenticated/depenses/analyse")({
  component: AnalysePage,
});

function AnalysePage() {
  const { rentabilites, categoriesRentables, kpis } = useFinances();

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        eyebrow="Finances"
        title="Analyse de rentabilité"
        description="Comprenez quels produits et quelles catégories font réellement gagner de l'argent."
      />

      <MarginCards brute={kpis.margeBrute} nette={kpis.margeNette} />

      <div className="grid gap-4 xl:grid-cols-2">
        <TopProfitableProducts produits={rentabilites} />
        <LeastProfitableProducts produits={rentabilites} />
      </div>

      <ProfitableCategories categories={categoriesRentables} />
    </div>
  );
}
