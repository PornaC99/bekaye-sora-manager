import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Banknote, Coins, Package, Printer, Receipt, TrendingUp, Wallet } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page";
import { Button } from "@/components/ui/button";
import { AssistantPanel } from "@/components/finance/assistant-panel";
import { ExpensesChart, ProfitChart, RevenueChart } from "@/components/finance/charts";
import { ExpensesPie } from "@/components/finance/expenses-pie";
import { GoalsPanel } from "@/components/finance/goals-panel";
import { FinanceKpiCards, type CarteFinance } from "@/components/finance/kpi-cards";
import { serieFinanciere, type PlageFinance } from "@/lib/finance/analytics";
import { imprimerRapportFinancier } from "@/lib/finance/print";
import { useFinances } from "@/lib/finance/use-finance";
import { formatFCFA } from "@/lib/products/types";

export const Route = createFileRoute("/_authenticated/depenses/")({
  component: VueGenerale,
});

function VueGenerale() {
  const finances = useFinances();
  const [plage, setPlage] = useState<PlageFinance>("30j");

  const serie = useMemo(
    () =>
      serieFinanciere({
        ventes: finances.ventes,
        produits: finances.produits,
        depenses: finances.toutesDepenses,
        plage,
      }),
    [finances.ventes, finances.produits, finances.toutesDepenses, plage],
  );

  const { kpis } = finances;

  const cartes: CarteFinance[] = [
    {
      label: "CA du mois",
      value: formatFCFA(kpis.caMois),
      hint: `Aujourd'hui : ${formatFCFA(kpis.caJour)}`,
      icon: TrendingUp,
      tone: "primary",
    },
    {
      label: "Bénéfice du mois",
      value: formatFCFA(kpis.beneficeMois),
      hint: `Marge nette ${kpis.margeNette} %`,
      icon: Coins,
      tone: kpis.beneficeMois >= 0 ? "success" : "danger",
    },
    {
      label: "Dépenses du mois",
      value: formatFCFA(kpis.depensesMois),
      hint: "Salaires, achats et frais inclus",
      icon: Receipt,
      tone: "warning",
    },
    {
      label: "Caisse & trésorerie",
      value: formatFCFA(kpis.montantCaisse),
      hint: `Trésorerie cumulée ${formatFCFA(kpis.tresorerie)}`,
      icon: Wallet,
      tone: "muted",
    },
    {
      label: "Valeur du stock",
      value: formatFCFA(kpis.valeurStock),
      hint: `Créances ${formatFCFA(kpis.creances)} · Dettes ${formatFCFA(kpis.dettes)}`,
      icon: Package,
      tone: "muted",
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        eyebrow="Finances"
        title="Comptabilité & tableau financier"
        description="Toutes les données proviennent automatiquement des ventes, achats, salaires et stocks. Aucune saisie en double."
        actions={
          <Button
            variant="outline"
            onClick={() => {
              imprimerRapportFinancier({
                kpis,
                repartition: finances.repartition,
                depenses: finances.depensesDuMois,
                creances: finances.creances,
                dettes: finances.dettes,
                progression: finances.progression,
                previsions: finances.previsions,
              });
              toast.success("Rapport financier prêt à imprimer.");
            }}
          >
            <Printer className="mr-2 h-4 w-4" />
            Rapport financier
          </Button>
        }
      />

      <FinanceKpiCards cartes={cartes} />

      <RevenueChart data={serie} plage={plage} onPlageChange={setPlage} />

      <div className="grid gap-4 xl:grid-cols-2">
        <ExpensesChart data={serie} />
        <ProfitChart data={serie} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_1fr]">
        <ExpensesPie repartition={finances.repartition} />
        <GoalsPanel progression={finances.progression} objectifs={finances.objectifs} />
      </div>

      <AssistantPanel conseils={finances.conseils} />

      <div className="rounded-2xl border border-border bg-card px-5 py-4 text-sm text-muted-foreground shadow-[var(--shadow-card)]">
        <span className="inline-flex items-center gap-2 font-medium text-foreground">
          <Banknote className="h-4 w-4 text-primary" />
          Lecture rapide
        </span>
        <p className="mt-1.5">
          Ce mois-ci, l'entreprise a vendu pour {formatFCFA(kpis.caMois)}, dépensé{" "}
          {formatFCFA(kpis.depensesMois)} et dégagé {formatFCFA(kpis.beneficeMois)} de bénéfice,
          soit une marge nette de {kpis.margeNette} %.
        </p>
      </div>
    </div>
  );
}
