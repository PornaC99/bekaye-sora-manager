import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/layout/page";
import { PayablesTable, ReceivablesTable } from "@/components/finance/receivables-payables";
import { FinanceKpiCards, type CarteFinance } from "@/components/finance/kpi-cards";
import { useFinances } from "@/lib/finance/use-finance";
import { formatFCFA } from "@/lib/products/types";
import { statutEcheance } from "@/lib/finance/types";
import { HandCoins, Landmark, Scale, TriangleAlert } from "lucide-react";

export const Route = createFileRoute("/depenses/creances")({
  component: CreancesPage,
});

function CreancesPage() {
  const { creances, dettes, kpis } = useFinances();

  const retards = [
    ...creances.filter((c) => statutEcheance(c) === "en_retard"),
    ...dettes.filter((d) => statutEcheance(d) === "en_retard"),
  ];
  const montantRetard = retards.reduce((total, ligne) => total + ligne.montant, 0);

  const cartes: CarteFinance[] = [
    {
      label: "Créances clients",
      value: formatFCFA(kpis.creances),
      hint: "Argent que l'on vous doit",
      icon: HandCoins,
      tone: "primary",
    },
    {
      label: "Dettes fournisseurs",
      value: formatFCFA(kpis.dettes),
      hint: "Argent que vous devez",
      icon: Landmark,
      tone: "warning",
    },
    {
      label: "Position nette",
      value: formatFCFA(kpis.creances - kpis.dettes),
      hint: "Créances moins dettes",
      icon: Scale,
      tone: kpis.creances - kpis.dettes >= 0 ? "success" : "danger",
    },
    {
      label: "En retard",
      value: formatFCFA(montantRetard),
      hint: `${retards.length} échéance(s) dépassée(s)`,
      icon: TriangleAlert,
      tone: retards.length > 0 ? "danger" : "muted",
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        eyebrow="Finances"
        title="Créances & dettes"
        description="Suivez qui vous doit de l'argent et ce que vous devez à vos fournisseurs."
      />

      <FinanceKpiCards cartes={cartes} />
      <ReceivablesTable creances={creances} />
      <PayablesTable dettes={dettes} />
    </div>
  );
}
