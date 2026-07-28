import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CalendarClock, Users, Wallet } from "lucide-react";

import { HrKpiCards } from "@/components/hr/kpi-cards";
import { PayrollTable } from "@/components/hr/payroll-table";
import { MasseSalarialeChartCard } from "@/components/hr/performance-panel";
import { PageHeader } from "@/components/layout/page";
import { moisCourant, serieMasseSalariale } from "@/lib/hr/analytics";
import { useHrStore } from "@/lib/hr/store";
import { salaireNet } from "@/lib/hr/types";
import { formatFCFA } from "@/lib/products/types";

const TITLE = "Salaires";
const DESCRIPTION =
  "Préparation, validation, paiement et bulletins de paie des employés de Bekaye Sora.";

export const Route = createFileRoute("/_authenticated/salaires")({
  head: () => ({
    meta: [
      { title: `${TITLE} — Bekaye Sora Business Manager` },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: `${TITLE} — Bekaye Sora Business Manager` },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: SalairesPage,
});

function SalairesPage() {
  const { employes, bulletins } = useHrStore();
  const [mois, setMois] = useState(moisCourant());

  const moisDisponibles = useMemo(() => {
    const set = new Set(bulletins.map((b) => b.mois));
    set.add(moisCourant());
    return [...set].sort((a, b) => b.localeCompare(a));
  }, [bulletins]);

  const duMois = bulletins.filter((b) => b.mois === mois);
  const total = duMois.reduce((acc, b) => acc + salaireNet(b), 0);
  const payes = duMois.filter((b) => b.statut === "paye");

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-5">
      <PageHeader eyebrow="Ressources humaines" title={TITLE} description={DESCRIPTION} />

      <HrKpiCards
        cartes={[
          {
            label: "Masse salariale",
            value: formatFCFA(total),
            hint: `${duMois.length} bulletin(s)`,
            icon: Wallet,
            tone: "primary",
          },
          {
            label: "Salaires payés",
            value: formatFCFA(payes.reduce((a, b) => a + salaireNet(b), 0)),
            hint: `${payes.length} employé(s) payé(s)`,
            icon: Users,
            tone: "success",
          },
          {
            label: "Reste à payer",
            value: formatFCFA(
              duMois.filter((b) => b.statut !== "paye").reduce((a, b) => a + salaireNet(b), 0),
            ),
            hint: `${duMois.length - payes.length} en attente`,
            icon: CalendarClock,
            tone: "warning",
          },
        ]}
      />

      <PayrollTable
        employes={employes}
        bulletins={bulletins}
        mois={mois}
        onMoisChange={setMois}
        moisDisponibles={moisDisponibles}
      />

      <MasseSalarialeChartCard serie={serieMasseSalariale(bulletins)} />
    </div>
  );
}
