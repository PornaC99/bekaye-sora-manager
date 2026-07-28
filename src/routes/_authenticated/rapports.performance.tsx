import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

import { SectionCard } from "@/components/dashboard/section-card";
import { PageHeader } from "@/components/layout/page";
import { Gauge, MiniTable, PeriodFilters } from "@/components/reports/pieces";
import { formatFCFA } from "@/lib/products/types";
import { construirePeriode, type ClePeriode } from "@/lib/reports/types";
import { useReports } from "@/lib/reports/use-reports";

export const Route = createFileRoute("/_authenticated/rapports/performance")({
  component: PerformancePage,
});

const aujourdhuiISO = new Date().toISOString().slice(0, 10);

function PerformancePage() {
  const [cle, setCle] = useState<ClePeriode>("mois");
  const [personnalisee, setPersonnalisee] = useState({ debut: aujourdhuiISO, fin: aujourdhuiISO });
  const periode = useMemo(() => construirePeriode(cle, personnalisee), [cle, personnalisee]);
  const d = useReports(periode);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        eyebrow="Analyse"
        title="Centre de performance"
        description="Une note sur 100 pour chaque domaine clé de l'entreprise."
      />

      <PeriodFilters
        cle={cle}
        personnalisee={personnalisee}
        onChange={setCle}
        onPersonnalisee={setPersonnalisee}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {d.scores.map((score) => (
          <Gauge key={score.cle} score={score} />
        ))}
      </div>

      <SectionCard title="Détail par vendeur" description="Objectifs et présence">
        <MiniTable
          entetes={["Employé", "Ventes", "Chiffre d'affaires", "Objectif", "Présence"]}
          lignes={d.vendeurs.map((v) => [
            v.employe.nom,
            v.nombreVentes,
            formatFCFA(v.chiffreAffaires),
            `${v.progression} %`,
            `${v.tauxPresence} %`,
          ])}
        />
      </SectionCard>
    </div>
  );
}
