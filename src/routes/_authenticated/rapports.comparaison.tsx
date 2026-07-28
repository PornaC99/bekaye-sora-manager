import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

import { SectionCard } from "@/components/dashboard/section-card";
import { PageHeader } from "@/components/layout/page";
import { MiniTable } from "@/components/reports/pieces";
import { depensesConsolidees } from "@/lib/finance/analytics";
import { useFinanceStore } from "@/lib/finance/store";
import { useHrStore } from "@/lib/hr/store";
import { formatFCFA } from "@/lib/products/types";
import { useProductsStore } from "@/lib/products/store";
import { useSalesStore } from "@/lib/sales/store";
import { useSuppliersStore } from "@/lib/suppliers/store";
import { useClientsStore } from "@/lib/clients/store";
import {
  analyseEmployes,
  analyseVentes,
  comparerKpis,
  kpisRapport,
  ventesPeriode,
} from "@/lib/reports/analytics";
import { anneePeriode, moisPeriode, type Periode } from "@/lib/reports/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/rapports/comparaison")({
  component: ComparaisonPage,
});

const MOIS = Array.from({ length: 12 }, (_, i) =>
  new Date(2026, i, 1).toLocaleDateString("fr-FR", { month: "long" }),
);

function ComparaisonPage() {
  const annee = new Date().getFullYear();
  const moisActuel = new Date().getMonth();
  const [type, setType] = useState<"mois" | "annees">("mois");
  const [moisA, setMoisA] = useState(Math.max(0, moisActuel - 1));
  const [moisB, setMoisB] = useState(moisActuel);

  const { produits } = useProductsStore();
  const { ventes } = useSalesStore();
  const { clients } = useClientsStore();
  const { employes, presences, bulletins } = useHrStore();
  const { fournisseurs, commandes } = useSuppliersStore();
  const { depenses } = useFinanceStore();

  const donnees = useMemo(() => {
    const toutesDepenses = depensesConsolidees({
      depenses,
      bulletins,
      employes,
      commandes,
      nomFournisseur: (id) => fournisseurs.find((f) => f.id === id)?.nom ?? "Fournisseur",
    });

    const periodeA: Periode = type === "mois" ? moisPeriode(annee, moisA) : anneePeriode(annee - 1);
    const periodeB: Periode = type === "mois" ? moisPeriode(annee, moisB) : anneePeriode(annee);

    const base = { ventes, produits, depenses: toutesDepenses, clients, fournisseurs, employes };
    const kpisA = kpisRapport({ ...base, periode: periodeA });
    const kpisB = kpisRapport({ ...base, periode: periodeB });

    const ventesA = ventesPeriode(ventes, periodeA);
    const ventesB = ventesPeriode(ventes, periodeB);

    return {
      periodeA,
      periodeB,
      comparaison: comparerKpis(kpisA, kpisB),
      categoriesA: analyseVentes(ventesA, produits).categories,
      categoriesB: analyseVentes(ventesB, produits).categories,
      produitsA: analyseVentes(ventesA, produits).lignes,
      produitsB: analyseVentes(ventesB, produits).lignes,
      vendeursA: analyseEmployes(employes, ventesA, presences, periodeA),
      vendeursB: analyseEmployes(employes, ventesB, presences, periodeB),
    };
  }, [
    annee,
    bulletins,
    clients,
    commandes,
    depenses,
    employes,
    fournisseurs,
    moisA,
    moisB,
    presences,
    produits,
    type,
    ventes,
  ]);

  const select = "rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground";

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        eyebrow="Analyse"
        title="Comparaison"
        description="Comparez deux périodes, deux catégories, deux produits ou deux vendeurs."
      />

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-3 shadow-[var(--shadow-card)]">
        {(["mois", "annees"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-medium transition",
              type === t
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            {t === "mois" ? "Deux mois" : "Deux années"}
          </button>
        ))}
        {type === "mois" && (
          <div className="flex items-center gap-2">
            <select
              className={select}
              value={moisA}
              onChange={(e) => setMoisA(Number(e.target.value))}
            >
              {MOIS.map((m, i) => (
                <option key={m} value={i}>
                  {m}
                </option>
              ))}
            </select>
            <span className="text-xs text-muted-foreground">contre</span>
            <select
              className={select}
              value={moisB}
              onChange={(e) => setMoisB(Number(e.target.value))}
            >
              {MOIS.map((m, i) => (
                <option key={m} value={i}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <SectionCard
        title="Comparaison des indicateurs"
        description={`${donnees.periodeA.label} contre ${donnees.periodeB.label}`}
      >
        <MiniTable
          entetes={["Indicateur", donnees.periodeA.label, donnees.periodeB.label, "Écart"]}
          lignes={donnees.comparaison.map((l) => [
            l.label,
            l.monnaie ? formatFCFA(l.a) : l.a,
            l.monnaie ? formatFCFA(l.b) : l.b,
            `${l.ecart > 0 ? "+" : ""}${l.ecart} %`,
          ])}
        />
      </SectionCard>

      <div className="grid gap-4 xl:grid-cols-2">
        <SectionCard title="Catégories comparées" description="Chiffre d'affaires par catégorie">
          <MiniTable
            entetes={["Catégorie", donnees.periodeA.label, donnees.periodeB.label]}
            lignes={donnees.categoriesB.map((c) => [
              c.nom,
              formatFCFA(donnees.categoriesA.find((x) => x.nom === c.nom)?.chiffreAffaires ?? 0),
              formatFCFA(c.chiffreAffaires),
            ])}
          />
        </SectionCard>

        <SectionCard title="Produits comparés" description="Quantités vendues">
          <MiniTable
            entetes={["Produit", donnees.periodeA.label, donnees.periodeB.label]}
            lignes={donnees.produitsB
              .slice(0, 10)
              .map((p) => [
                p.nom,
                donnees.produitsA.find((x) => x.produitId === p.produitId)?.quantite ?? 0,
                p.quantite,
              ])}
          />
        </SectionCard>

        <SectionCard title="Vendeurs comparés" description="Chiffre d'affaires réalisé">
          <MiniTable
            entetes={["Employé", donnees.periodeA.label, donnees.periodeB.label]}
            lignes={donnees.vendeursB.map((v) => [
              v.employe.nom,
              formatFCFA(
                donnees.vendeursA.find((x) => x.employe.id === v.employe.id)?.chiffreAffaires ?? 0,
              ),
              formatFCFA(v.chiffreAffaires),
            ])}
          />
        </SectionCard>
      </div>
    </div>
  );
}
